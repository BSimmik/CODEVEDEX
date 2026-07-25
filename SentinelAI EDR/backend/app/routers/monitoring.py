from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..database import get_db
from ..repositories.repositories import EndpointRepository, ProcessRepository, AlertRepository
from ..services.rules_engine import RulesEngine
from ..services.behavioral import BehavioralEngine
from .websocket import ws_manager
import logging

logger = logging.getLogger("monitoring_router")

router = APIRouter(prefix="/monitoring", tags=["Monitoring Gateway"])

@router.post("/heartbeat")
async def receive_heartbeat(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Ingest real-time EDR logs from system agents.
    Triggers rule matches and behavioral anomaly calculations.
    """
    endpoint_data = payload.get("endpoint", {})
    endpoint_id = endpoint_data.get("id")
    if not endpoint_id:
        return {"status": "error", "message": "Missing endpoint id"}

    # 1. Upsert Endpoint State
    endpoint = EndpointRepository.upsert(db, endpoint_id, {
        "hostname": endpoint_data.get("hostname"),
        "ip_address": endpoint_data.get("ip_address"),
        "mac_address": endpoint_data.get("mac_address"),
        "os_name": endpoint_data.get("os_name"),
        "os_version": endpoint_data.get("os_version"),
        "status": "Online"
    })

    # 2. Extract telemetry lists
    processes = payload.get("processes", [])
    connections = payload.get("connections", [])
    file_changes = payload.get("file_changes", [])
    keylogger_audit = payload.get("keylogger_audit", {})
    services = payload.get("services", [])
    scheduled_tasks = payload.get("scheduled_tasks", [])
    startup_programs = payload.get("startup_programs", [])

    # 3. Bulk insert latest processes
    ProcessRepository.bulk_insert(db, endpoint_id, processes)

    # 4. Evaluate Rules Engine on incoming telemetry
    triggered_alerts = []
    
    # Process checks
    proc_alerts = RulesEngine.evaluate_telemetry(db, endpoint_id, "Process", processes)
    triggered_alerts.extend(proc_alerts)

    # Network checks
    net_alerts = RulesEngine.evaluate_telemetry(db, endpoint_id, "Network", connections)
    triggered_alerts.extend(net_alerts)

    # File integrity checks
    if file_changes:
        file_alerts = RulesEngine.evaluate_telemetry(db, endpoint_id, "File", file_changes)
        triggered_alerts.extend(file_alerts)
        
        # Generates basic alert if any drop happens in monitored folder but no custom rule matches
        for fc in file_changes:
            if not file_alerts and fc.get("action") != "Deleted":
                # Create raw file drop alert
                alert_data = {
                    "endpoint_id": endpoint_id,
                    "alert_type": "File",
                    "title": f"File Modified in Sandbox: {fc.get('file_name')}",
                    "description": f"File drop detected in monitored sandbox folder. Action: {fc.get('action')} | Location: {fc.get('path')}",
                    "threat_score": 45,
                    "severity": "Medium",
                    "status": "New",
                    "risk_explanation": "File changes in sensitive systems paths require immediate configuration review. Verify binary authority."
                }
                raw_alert = AlertRepository.create(db, alert_data)
                triggered_alerts.append(raw_alert)

    # 5. Evaluate Behavioral Signals (Keyloggers, Hook Auditing)
    behavior_results = BehavioralEngine.evaluate_behavioral_signals(db, endpoint_id, {
        "keyboard_hook_count": keylogger_audit.get("keyboard_hook_count", 0),
        "hidden_processes": keylogger_audit.get("hidden_processes", []),
        "accessibility_abuse": keylogger_audit.get("accessibility_abuse", False)
    })

    # If behavioral evaluation added alerts, they get committed inside behavioral
    # 6. Recalculate Posture Score & Health
    updated_endpoint = BehavioralEngine.calculate_posture(db, endpoint_id)

    # 7. Broadcast real-time message via WebSockets
    ws_event = {
        "type": "TELEMETRY_HEARTBEAT",
        "endpoint_id": endpoint_id,
        "hostname": updated_endpoint.hostname,
        "health_status": updated_endpoint.health_status,
        "posture_score": updated_endpoint.posture_score,
        "new_alerts_count": len(triggered_alerts),
        "keylogger_indicators": keylogger_audit
    }
    await ws_manager.broadcast(ws_event)

    # If any alert was triggered, broadcast alert notification
    for alert in triggered_alerts:
        await ws_manager.broadcast({
            "type": "NEW_ALERT",
            "alert": {
                "id": alert.id,
                "endpoint_id": alert.endpoint_id,
                "hostname": updated_endpoint.hostname,
                "alert_type": alert.alert_type,
                "title": alert.title,
                "severity": alert.severity,
                "threat_score": alert.threat_score,
                "created_at": alert.created_at.isoformat()
            }
        })

    return {
        "status": "success",
        "alerts_triggered": len(triggered_alerts),
        "posture_score": updated_endpoint.posture_score,
        "health": updated_endpoint.health_status
    }
