from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from ..auth.rbac import allow_all_authenticated
from ..models.models import User

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence"])

MITRE_MATRIX = {
    "T1056.001": {
        "id": "T1056.001",
        "technique": "Input Capture: Keylogging",
        "tactics": ["Collection"],
        "description": "Adversaries may log user keystrokes to collect data as the user types, including credentials, tokens, or messaging contents.",
        "detection_guidance": "Monitor system APIs (SetWindowsHookEx, GetKeyboardState) and excessive message pump hooks. SentinelAI EDR continuously audits process hook volumes.",
        "malware_families": ["Agent Tesla", "LokiBot", "KeyBase"]
    },
    "T1003.001": {
        "id": "T1003.001",
        "technique": "OS Credential Dumping: LSASS Memory",
        "tactics": ["Credential Access"],
        "description": "Adversaries may attempt to access credential material in the Local Security Authority Subsystem Service (LSASS) process memory.",
        "detection_guidance": "Audit access requests to the LSASS process (e.g. process handles querying PROCESS_VM_READ permissions). Flag binaries accessing security database directories.",
        "malware_families": ["Mimikatz", "Cobalt Strike", "Carbanak"]
    },
    "T1547.001": {
        "id": "T1547.001",
        "technique": "Boot or Logon Autostart Execution: Registry Run Keys / Startup Folder",
        "tactics": ["Persistence", "Privilege Escalation"],
        "description": "Adversaries may add programs to startup folders or edit Registry keys to achieve persistence across system reboots.",
        "detection_guidance": "Monitor file creations in user Startup folders and registry write operations on HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.",
        "malware_families": ["Emotet", "TrickBot", "WannaCry"]
    },
    "T1571": {
        "id": "T1571",
        "technique": "Non-Standard Port Connection",
        "tactics": ["Command and Control"],
        "description": "Adversaries may communicate over ports that are different from common defaults to evade firewall filters.",
        "detection_guidance": "Verify outbound connection destinations. Flag processes maintaining persistent sockets to atypical target ports (like 4444).",
        "malware_families": ["Metasploit Shell", "NjRAT", "Gh0st RAT"]
    }
}

@router.get("/mitre", response_model=Dict[str, Any])
def get_mitre_mapping(current_user: User = Depends(allow_all_authenticated)):
    """
    Returns complete MITRE ATT&CK alignment techniques.
    """
    return MITRE_MATRIX

@router.get("/mitre/{technique_id}", response_model=Dict[str, Any])
def get_mitre_technique(technique_id: str, current_user: User = Depends(allow_all_authenticated)):
    """
    Resolve specific technique details.
    """
    mapping = MITRE_MATRIX.get(technique_id)
    if not mapping:
        return {
            "id": technique_id,
            "technique": "Unknown Technique",
            "tactics": ["Initial Access"],
            "description": "No local reference details. Please consult the MITRE database online.",
            "detection_guidance": "Monitor telemetry logs for unusual process command lines or connection ports.",
            "malware_families": []
        }
    return mapping
