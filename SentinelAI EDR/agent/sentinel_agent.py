import os
import sys
import time
import argparse
import httpx
import logging
from collector import EDRCollector
from keylogger_detector import KeyloggerDetector

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("sentinel_agent")

class SentinelAgent:
    def __init__(self, backend_url: str, interval: int = 10):
        self.backend_url = backend_url
        self.interval = interval
        self.keylogger_auditor = KeyloggerDetector()
        self.metadata = EDRCollector.get_system_metadata()
        self.endpoint_id = self.metadata["id"]
        
        # Monitored directory configuration
        self.monitored_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "monitored_sandbox")
        if not os.path.exists(self.monitored_dir):
            os.makedirs(self.monitored_dir)
            logger.info(f"Created sandbox folder for file integrity monitoring: {self.monitored_dir}")

        self.last_files_snapshot = self.get_files_snapshot()

    def get_files_snapshot(self) -> dict:
        """Scan sandbox and compile modified times."""
        snapshot = {}
        for root, dirs, files in os.walk(self.monitored_dir):
            for file in files:
                path = os.path.join(root, file)
                try:
                    snapshot[path] = os.path.getmtime(path)
                except Exception:
                    pass
        return snapshot

    def check_file_changes(self) -> list:
        """Detect file modifications, creations, and deletions in the sandbox."""
        current_snapshot = self.get_files_snapshot()
        changes = []

        # Check creations and modifications
        for path, mtime in current_snapshot.items():
            if path not in self.last_files_snapshot:
                changes.append({
                    "path": path,
                    "action": "Created",
                    "file_name": os.path.basename(path),
                    "timestamp": time.time()
                })
            elif mtime > self.last_files_snapshot[path]:
                changes.append({
                    "path": path,
                    "action": "Modified",
                    "file_name": os.path.basename(path),
                    "timestamp": time.time()
                })

        # Check deletions
        for path in self.last_files_snapshot:
            if path not in current_snapshot:
                changes.append({
                    "path": path,
                    "action": "Deleted",
                    "file_name": os.path.basename(path),
                    "timestamp": time.time()
                })

        self.last_files_snapshot = current_snapshot
        return changes

    def generate_heartbeat_payload(self, simulations: dict) -> dict:
        """
        Assembles all telemetry fields, combining collected system details
        and active simulation adjustments.
        """
        processes = EDRCollector.get_processes()
        connections = EDRCollector.get_network_connections()
        file_changes = self.check_file_changes()
        
        # Audit Keylogger
        keylogger_audit = self.keylogger_auditor.run_security_audit()

        # Inject simulations if active
        if simulations.get("keylogger"):
            self.keylogger_auditor.trigger_simulated_hook_anomaly()
            keylogger_audit = self.keylogger_auditor.run_security_audit()

        if simulations.get("malware"):
            processes.append({
                "pid": 7777,
                "ppid": 1000,
                "name": "mimikatz.exe",
                "path": "C:\\Users\\Public\\Downloads\\mimikatz.exe",
                "username": "SYSTEM",
                "cmdline": "mimikatz.exe privilege::debug sekurlsa::logonpasswords exit",
                "cpu_percent": 15.0,
                "memory_percent": 2.5,
                "status": "running",
                "tracking_time": time.time()
            })
            processes.append({
                "pid": 8888,
                "ppid": 1001,
                "name": "nc.exe",
                "path": "C:\\Windows\\Temp\\nc.exe",
                "username": "Administrator",
                "cmdline": "nc.exe -lvp 4444 -e cmd.exe",
                "cpu_percent": 1.0,
                "memory_percent": 0.5,
                "status": "running",
                "tracking_time": time.time()
            })

        if simulations.get("network"):
            connections.append({
                "fd": 99,
                "family": 2,
                "type": 1,
                "local_address": "127.0.0.1:51234",
                "remote_address": "185.190.140.23:4444",
                "remote_ip": "185.190.140.23",
                "remote_port": 4444,
                "status": "ESTABLISHED",
                "pid": 8888,
                "process_name": "nc.exe"
            })

        if simulations.get("file"):
            # Create a mock file inside the sandbox folder to trigger alerts
            test_file_path = os.path.join(self.monitored_dir, "malicious_script.bat")
            try:
                with open(test_file_path, "w") as f:
                    f.write("@echo off\necho Triggering SentinelAI EDR File Test\npowershell.exe -EncodedCommand XYZ...\n")
                logger.info(f"Injected simulation file: {test_file_path}")
            except Exception as e:
                logger.error(f"Failed to write simulation file: {e}")

        # Assemble general system state metadata
        self.metadata["last_seen"] = time.strftime("%Y-%m-%d %H:%M:%S")
        
        return {
            "endpoint": self.metadata,
            "processes": processes,
            "connections": connections,
            "services": EDRCollector.get_services(),
            "startup_programs": EDRCollector.get_startup_programs(),
            "scheduled_tasks": EDRCollector.get_scheduled_tasks(),
            "file_changes": file_changes,
            "keylogger_audit": keylogger_audit
        }

    def transmit_payload(self, payload: dict) -> bool:
        url = f"{self.backend_url}/api/v1/monitoring/heartbeat"
        try:
            response = httpx.post(url, json=payload, timeout=5.0)
            if response.status_code == 200:
                logger.info(f"Heartbeat telemetry pushed successfully. Endpoint IP: {self.metadata['ip_address']}")
                return True
            else:
                logger.error(f"Telemetry transmit failed. Status Code: {response.status_code} | Details: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error connecting to backend gateway at {url}: {e}")
            return False

    def run(self, simulations: dict):
        logger.info(f"Starting EDR agent. Endpoint ID: {self.endpoint_id}")
        logger.info(f"Pushing to gateway: {self.backend_url}")
        
        # Reset any simulators
        self.keylogger_auditor.reset_simulation()

        try:
            while True:
                payload = self.generate_heartbeat_payload(simulations)
                self.transmit_payload(payload)
                
                # Turn off single-trigger simulations after the first burst
                if simulations.get("file"):
                    simulations["file"] = False
                
                logger.info(f"Sleeping for {self.interval} seconds...")
                time.sleep(self.interval)
        except KeyboardInterrupt:
            logger.info("Agent stopped by user signal.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SentinelAI EDR Endpoint Agent & Simulator")
    parser.add_argument("--backend", default="http://localhost:8000", help="FastAPI backend URL root")
    parser.add_argument("--interval", type=int, default=10, help="Reporting interval in seconds")
    parser.add_argument("--simulate-keylogger", action="store_true", help="Simulate input hooks & keylogger behaviors")
    parser.add_argument("--simulate-malware", action="store_true", help="Simulate execution of suspect processes (mimikatz.exe, nc.exe)")
    parser.add_argument("--simulate-network", action="store_true", help="Simulate connection to port 4444")
    parser.add_argument("--simulate-file", action="store_true", help="Inject batch file inside sandbox monitoring path")
    parser.add_argument("--run-once", action="store_true", help="Run a single heartbeat telemetry dispatch and exit")

    args = parser.parse_args()

    sims = {
        "keylogger": args.simulate_keylogger,
        "malware": args.simulate_malware,
        "network": args.simulate_network,
        "file": args.simulate_file
    }

    agent = SentinelAgent(backend_url=args.backend, interval=args.interval)

    if args.run_once:
        payload = agent.generate_heartbeat_payload(sims)
        success = agent.transmit_payload(payload)
        sys.exit(0 if success else 1)
    else:
        agent.run(sims)
