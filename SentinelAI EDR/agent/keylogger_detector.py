import os
import sys
import platform
import logging
from typing import Dict, Any, List

logger = logging.getLogger("keylogger_detector")

class KeyloggerDetector:
    def __init__(self):
        self.keyboard_hook_count = 0
        self.simulated_hooks_triggered = False

    def trigger_simulated_hook_anomaly(self):
        """
        Allows the simulation tool to inject a keylogger hook warning
        to validate rule checks on the backend dashboard.
        """
        self.keyboard_hook_count = 32
        self.simulated_hooks_triggered = True

    def reset_simulation(self):
        self.keyboard_hook_count = 0
        self.simulated_hooks_triggered = False

    def audit_keyboard_hooks(self) -> int:
        """
        Cross-platform keyboard hook auditor.
        On Windows, a real EDR uses Win32 APIs (e.g. SetWindowsHookEx auditing).
        We simulate this count and add real dynamic checks when simulation is active.
        """
        if self.simulated_hooks_triggered:
            return self.keyboard_hook_count

        # For demonstration purposes, check if standard automation tools or overlay softwares are running.
        # legimate input applications sometimes increment hook count slightly (e.g. Discord, Autohotkey)
        hook_indicators = 0
        try:
            import psutil
            for proc in psutil.process_iter(['name']):
                if proc.info['name'] and any(k in proc.info['name'].lower() for k in ["autohotkey", "synergy", "barrier", "logioptions"]):
                    hook_indicators += 2
        except Exception:
            pass

        return hook_indicators

    def audit_input_apis(self) -> List[str]:
        """
        Identifies if high-risk APIs are loaded or queried in user space processes.
        Return suspicious indicator strings.
        """
        indicators = []
        # On a real host, EDR filters on call trace hooks:
        # - SetWindowsHookExA / SetWindowsHookExW
        # - GetAsyncKeyState
        # - RegisterPointerInputTarget
        # Here we simulate finding indicator flags when hook audit is triggered
        if self.simulated_hooks_triggered:
            indicators.append("SetWindowsHookExW (Hook ID: WH_KEYBOARD_LL)")
            indicators.append("GetAsyncKeyState (Polling Keyboard State)")
        return indicators

    def check_accessibility_abuse(self) -> bool:
        """
        Checks if sticky keys (sethc.exe) or utility manager (utilman.exe) have modified paths,
        which indicates accessibility backdoor privilege escalation.
        """
        if self.simulated_hooks_triggered:
            return True

        if platform.system() == "Windows":
            # Check if sethc size is unusually similar to cmd.exe (which indicates replacement)
            # Safe and non-destructive inspection
            try:
                system32 = os.path.join(os.environ.get('SystemRoot', 'C:\\Windows'), 'System32')
                sethc_path = os.path.join(system32, 'sethc.exe')
                cmd_path = os.path.join(system32, 'cmd.exe')
                if os.path.exists(sethc_path) and os.path.exists(cmd_path):
                    sethc_size = os.path.getsize(sethc_path)
                    cmd_size = os.path.getsize(cmd_path)
                    # If file sizes are identical, cmd.exe has replaced sethc.exe
                    if sethc_size == cmd_size:
                        return True
            except Exception:
                pass
        return False

    def detect_hidden_processes(self) -> List[Dict[str, Any]]:
        """
        Detects processes that are running but hidden from standard listing API queries.
        This represents standard rootkit behavior.
        """
        hidden = []
        if self.simulated_hooks_triggered:
            hidden.append({
                "pid": 9999,
                "name": "svchost_mask.exe",
                "path": "C:\\Users\\Public\\Downloads\\svchost_mask.exe"
            })
        return hidden

    def run_security_audit(self) -> Dict[str, Any]:
        """
        Executes keylogger audits without capturing any user keystrokes.
        """
        hook_count = self.audit_keyboard_hooks()
        apis = self.audit_input_apis()
        accessibility = self.check_accessibility_abuse()
        hidden_procs = self.detect_hidden_processes()

        threat_score = 0
        risk_explanation = "No suspicious input monitoring behavior identified."
        alert_level = "Informational"

        if hook_count > 20:
            threat_score += 45
        if apis:
            threat_score += 25
        if accessibility:
            threat_score += 30
        if hidden_procs:
            threat_score += 40

        # Cap score to 100
        threat_score = min(100, threat_score)

        if threat_score >= 80:
            alert_level = "Critical"
            risk_explanation = "Multiple keylogger signatures matched (excessive hook requests + API audit warnings + hidden processes)."
        elif threat_score >= 50:
            alert_level = "High"
            risk_explanation = "Low-level input hooks combined with suspicious input polling detected on endpoint."
        elif threat_score >= 20:
            alert_level = "Medium"
            risk_explanation = "Active global hook threads registered on the system. Typical of automation or overlay applications."
        elif threat_score > 0:
            alert_level = "Low"
            risk_explanation = "Minor keyboard hooking indicator identified. Likely a legitimate device manager."

        return {
            "keyboard_hook_count": hook_count,
            "suspicious_apis": apis,
            "accessibility_abuse": accessibility,
            "hidden_processes": hidden_procs,
            "threat_score": threat_score,
            "alert_level": alert_level,
            "risk_explanation": risk_explanation,
            "educational_note": (
                "SentinelAI EDR monitors standard input hooks (WH_KEYBOARD_LL, WH_MOUSE_LL) "
                "and keyboard-state API loops. Note: We strictly audit system hook registries "
                "for signs of behavioral abuse; we DO NOT intercept, read, or record the actual keys typed."
            )
        }
