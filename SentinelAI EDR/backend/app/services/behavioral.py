from sqlalchemy.orm import Session
from ..models.models import Endpoint, Alert, ThreatScore
from ..repositories.repositories import EndpointRepository
import logging

logger = logging.getLogger("behavioral_engine")

class BehavioralEngine:
    @staticmethod
    def calculate_posture(db: Session, endpoint_id: str) -> Endpoint:
        endpoint = EndpointRepository.get_by_id(db, endpoint_id)
        if not endpoint:
            return None

        # Fetch active (unresolved) alerts for this endpoint
        active_alerts = db.query(Alert).filter(
            Alert.endpoint_id == endpoint_id,
            Alert.status != "Resolved"
        ).all()

        # Calculate penalty points
        penalty = 0
        critical_count = 0
        high_count = 0
        medium_count = 0
        low_count = 0
        
        for alert in active_alerts:
            if alert.severity == "Critical":
                penalty += 30
                critical_count += 1
            elif alert.severity == "High":
                penalty += 20
                high_count += 1
            elif alert.severity == "Medium":
                penalty += 10
                medium_count += 1
            elif alert.severity == "Low":
                penalty += 5
                low_count += 1

        # Posture score starts at 100 and drops based on penalties (bounded to 0)
        posture_score = max(0, 100 - penalty)
        
        # Determine overall Health status
        if posture_score >= 85:
            health_status = "Healthy"
        elif posture_score >= 60:
            health_status = "Warning"
        else:
            health_status = "Critical"

        endpoint.posture_score = posture_score
        endpoint.health_status = health_status
        db.commit()

        # Log a record of this Threat Score calculation
        ts_entry = ThreatScore(
            endpoint_id=endpoint_id,
            score=100 - posture_score, # Threat level is inverse of posture
            status="Active",
            description=f"Recalculated threat score: Active Alerts: Critical={critical_count}, High={high_count}, Medium={medium_count}, Low={low_count}."
        )
        db.add(ts_entry)
        db.commit()

        logger.info(f"Endpoint {endpoint.hostname} posture recalculated: Score={posture_score}, Health={health_status}")
        return endpoint

    @staticmethod
    def evaluate_behavioral_signals(db: Session, endpoint_id: str, signals: dict) -> dict:
        """
        Evaluate behavioral signals sent by the agent (e.g. keyboard hooks, accessibility abuse).
        Returns risk scores and generates alerts if thresholds are exceeded.
        """
        alerts_generated = []
        
        # 1. Keyboard Hooks (Potential keylogger behavior)
        hook_count = signals.get("keyboard_hook_count", 0)
        if hook_count > 10:
            severity = "High" if hook_count > 25 else "Medium"
            title = "Excessive Keyboard Hooking Detected"
            description = (
                f"Process monitoring APIs detected {hook_count} keyboard hook requests. "
                "This behavior resembles active keylogging attempting to capture user input."
            )
            risk_explanation = (
                "Keyloggers often install low-level global hooks (such as WH_KEYBOARD_LL) via Win32 APIs "
                "to intercept keystrokes before they reach target windows. SentinelAI tracks excessive API "
                "hook callbacks to isolate input monitoring. NO KEYSTROKES WERE CAPTURED."
            )
            # Create Alert
            alert = Alert(
                endpoint_id=endpoint_id,
                alert_type="Keylogger",
                title=title,
                description=description,
                threat_score=80 if severity == "High" else 55,
                severity=severity,
                risk_explanation=risk_explanation,
                status="New"
            )
            db.add(alert)
            alerts_generated.append(alert)

        # 2. Hidden Process Detection
        hidden_processes = signals.get("hidden_processes", [])
        if hidden_processes:
            for hp in hidden_processes:
                alert = Alert(
                    endpoint_id=endpoint_id,
                    alert_type="Process",
                    title="Hidden Process Detected",
                    description=f"Process '{hp.get('name')}' (PID {hp.get('pid')}) is hidden from standard system queries.",
                    threat_score=90,
                    severity="High",
                    risk_explanation="Malware often unlinks processes from active process lists or intercepts API calls to hide itself. This represents a persistence or defense evasion threat.",
                    status="New",
                    process_name=hp.get('name'),
                    process_pid=hp.get('pid')
                )
                db.add(alert)
                alerts_generated.append(alert)

        # 3. Accessibility Tool Abuse
        accessibility_abuse = signals.get("accessibility_abuse", False)
        if accessibility_abuse:
            alert = Alert(
                endpoint_id=endpoint_id,
                alert_type="Process",
                title="Accessibility abuse pattern detected",
                description="Potential hijacking of OS accessibility binaries (e.g. sethc.exe, utilman.exe) for privilege escalation.",
                threat_score=95,
                severity="Critical",
                risk_explanation="Attackers replace standard accessibility utilities to execute shells at system level before login. SentinelAI detected unauthorized binary launch signatures.",
                status="New"
            )
            db.add(alert)
            alerts_generated.append(alert)

        if alerts_generated:
            db.commit()
            # Recalculate endpoint posture due to new alerts
            BehavioralEngine.calculate_posture(db, endpoint_id)

        # Summarize analysis
        threat_score = 0
        if alerts_generated:
            threat_score = max(a.threat_score for a in alerts_generated)

        classification = "Informational"
        if threat_score >= 85:
            classification = "Critical"
        elif threat_score >= 70:
            classification = "High"
        elif threat_score >= 40:
            classification = "Medium"
        elif threat_score >= 15:
            classification = "Low"

        return {
            "threat_score": threat_score,
            "risk_classification": classification,
            "confidence_level": 85 if threat_score > 0 else 100,
            "alerts_created": len(alerts_generated)
        }
