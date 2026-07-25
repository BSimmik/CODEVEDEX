import httpx
import logging
from ..config import settings

logger = logging.getLogger("ai_analysis")

class AIAnalysisEngine:
    @staticmethod
    def generate_mock_analysis(title: str, severity: str, description: str) -> dict:
        """
        Failsafe offline generator producing structured enterprise reports.
        """
        # Formulate contextual content based on standard security fields
        if "mimikatz" in title.lower() or "credential" in title.lower():
            tech_explanation = (
                "SentinelAI EDR detected patterns resembling Local Security Authority Subsystem Service (LSASS) "
                "memory access or registry extraction. Tools like Mimikatz or scripts querying SAM registry files "
                "bypass default credential vaults to capture NTLM hashes or plaintext passwords."
            )
            business_impact = (
                "Compromise of primary system credentials. If access is privileged, this allows complete "
                "lateral movement across internal networks, domain dominance, and data exfiltration. Business operations "
                "may suffer catastrophic downtime and regulatory compliance failures (HIPAA/PCI-DSS)."
            )
            risk_assessment = "Critical severity threat. High confidence of malicious actor activity aiming to secure administrative control."
            remediation = (
                "1. Immediately isolate the affected endpoint from the network.\n"
                "2. Kill the offending process tree and dump memory for forensics.\n"
                "3. Revoke all user sessions associated with credentials active on this machine.\n"
                "4. Perform a full system security scan and enable Windows Defender Credential Guard."
            )
        elif "hook" in title.lower() or "keylogger" in title.lower():
            tech_explanation = (
                "The endpoint monitoring module registered a process installing global low-level keyboard hooks "
                "(WH_KEYBOARD_LL) or polling keystate arrays (GetAsyncKeyState). While sometimes used by legitimate overlay "
                "or utility applications, this mechanism is standard for spywares capturing user typing sequences."
            )
            business_impact = (
                "Loss of confidentiality for inputs typed on the endpoint. Credentials, private communications, "
                "and proprietary operational procedures could be recorded and prepared for off-site transmission."
            )
            risk_assessment = "High severity threat. Medium confidence. Requires analyst review to verify if the process is a trusted accessibility or input tool."
            remediation = (
                "1. Identify the parent and child process hierarchy installing the keyboard hook.\n"
                "2. Check the signature of the executing binary to determine if it is trusted code.\n"
                "3. Terminate the process if it is unsanctioned.\n"
                "4. Verify that accessibility features or automation tools have not been hijacked."
            )
        elif "netcat" in title.lower() or "reverse" in title.lower() or "port" in title.lower():
            tech_explanation = (
                "Outbound network socket request mapped to high-risk listening ports (e.g. 4444 or 6667) or execution of "
                "utilities with command lines referencing redirectors (e.g., cmd.exe redirecting streams). This is indicative "
                "of active command and control (C2) session creation."
            )
            business_impact = (
                "External adversaries gain remote command shell access. This bypasses border firewalls, granting "
                "unauthorized agents an active portal to execute arbitrary code inside the enterprise environment."
            )
            risk_assessment = "High severity threat. High confidence. Standard security rules do not execute raw outbound shells."
            remediation = (
                "1. Implement network firewall rules to block the target external IP.\n"
                "2. Kill the process maintaining the socket connection.\n"
                "3. Scan system services and startup registry keys for persistence markers.\n"
                "4. Audit active local accounts for unauthorized privilege escalations."
            )
        else:
            tech_explanation = (
                f"Anomalous event: {description}. System rules matched telemetry against rule configuration thresholds."
            )
            business_impact = (
                "May lead to unauthorized resource utilization, persistence, or configuration modification on the endpoint."
            )
            risk_assessment = f"{severity} severity threat. Medium confidence anomaly detection."
            remediation = (
                "1. Review the specific process details, directory path, and network connections.\n"
                "2. If unauthorized, terminate process and review related user logs.\n"
                "3. Adjust ruleset configurations if this is a known business tool."
            )

        return {
            "title": title,
            "severity": severity,
            "technical_explanation": tech_explanation,
            "business_impact": business_impact,
            "risk_assessment": risk_assessment,
            "remediation_guidance": remediation,
            "model_used": "SentinelAI-Local-Expert (Failsafe Mode)"
        }

    @classmethod
    async def analyze_threat(cls, title: str, severity: str, description: str) -> dict:
        # Check if mock key is configured
        if settings.OPENAI_API_KEY == "mock-key" or not settings.OPENAI_API_KEY:
            return cls.generate_mock_analysis(title, severity, description)

        # Real HTTP request to OpenAI/Ollama target
        prompt = (
            f"You are a Senior Incident Response Specialist. Analyze the following endpoint alert:\n"
            f"Alert Title: {title}\n"
            f"Severity: {severity}\n"
            f"Details: {description}\n\n"
            f"Please respond ONLY with a JSON object containing the keys:\n"
            f"- 'technical_explanation' (markdown text explaining the attacker technique/behaviors)\n"
            f"- 'business_impact' (markdown text explaining operational and enterprise risks)\n"
            f"- 'risk_assessment' (markdown assessment of confidence and severity)\n"
            f"- 'remediation_guidance' (markdown list of steps for containment and removal)\n"
        )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
                payload = {
                    "model": settings.AI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"}
                }
                
                response = await client.post(
                    settings.OPENAI_API_BASE + "/chat/completions",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    import json
                    content = result["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    parsed["model_used"] = settings.AI_MODEL
                    return parsed
                else:
                    logger.warning(f"AI API failed with status {response.status_code}. Using fallback.")
                    return cls.generate_mock_analysis(title, severity, description)
        except Exception as e:
            logger.warning(f"Error communicating with AI endpoint: {e}. Using fallback.")
            return cls.generate_mock_analysis(title, severity, description)
