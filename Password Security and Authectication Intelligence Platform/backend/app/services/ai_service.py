import requests
import json
import logging
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback Responses for Offline / Unconfigured AI Mode
FALLBACK_ADVICE = {
    "password_weakness": """### Password Weakness Assessment
Your password analysis reveals typical vulnerabilities found in corporate credentials:
1. **Low Entropy**: The mathematical search space is small, meaning automated cracking systems can exhaust the options in hours.
2. **Keyboard Paths**: Sequences like `qwerty` or `123456` contain low randomness and are hard-coded in all cracker dictionary indices.
3. **Dictionary Context**: Standard words (even with numbers appended) are processed in seconds using hybrid attack methods.

**Remediation recommendation**: Utilize passphrases constructed of 4-5 randomly chosen words (e.g., `correct-horse-battery-staple`) to maximize length and entropy without making it impossible to memorize.""",

    "policy": """### Policy Compliance Guidance
The enterprise policy check assesses compliance with NIST SP 800-63B, OWASP Top 10, and CIS controls:
1. **NIST SP 800-63B**: Focuses on length (minimum 8, preferably 14+) rather than complex character rules. It discourages forced periodic expiration unless there is evidence of compromise.
2. **OWASP Auth Guidelines**: Recommends checking passwords against a list of known compromised credentials (K-anonymity) and enforcing Multi-Factor Authentication.
3. **CIS Controls**: Mandates central credential management, MFA across all external systems, and continuous monitoring of brute-force indicators.""",

    "simulation": """### Password Attack Simulations Explained
Modern password cracking is rarely done by brute-forcing character combinations from scratch:
1. **Dictionary Attacks**: Attackers check lists of millions of real-world leaked passwords first.
2. **Hybrid Attacks**: Standard dictionaries are combined with rule sets (e.g. converting 'e' to '3', appending years or symbols).
3. **Password Spraying**: Instead of locking out a single account, attackers try one common password (e.g., `Welcome2026!`) against thousands of usernames, bypassing lockout thresholds.
4. **Rainbow Tables**: Precomputed lookup maps that swap computation time for storage size. Effective against fast, unsalted hashes (MD5, SHA-256). Salted algorithms (bcrypt, Argon2) completely neutralize them.""",

    "entropy": """### Understanding Password Entropy
Entropy measures the unpredictability of a password. It is calculated in bits:
$$E = L \times \\log_2(R)$$
Where:
- $L$ is password length.
- $R$ is the size of the character pool (lowercase=26, uppercase=26, digits=10, symbols=32).

**Interpretations**:
- **< 40 bits**: Very Weak. Cracked instantly.
- **40-59 bits**: Moderate. Vulnerable to fast offline GPU cracking.
- **60-79 bits**: Strong. Safe for general users.
- **80+ bits**: Excellent. Resistant to advanced targeted attacks.""",

    "executive_summary": """### Executive Summary: Corporate Authentication Status
An assessment of current credentials and authentication policies indicates:
1. **Authentication Level**: Password-only access represents a critical corporate vector. MFA compliance is currently a top priority.
2. **Hashing Architecture**: Legacy systems utilizing MD5 or plain SHA-256 must be migrated to Argon2id or bcrypt to block GPU cracking rigs.
3. **Action Items**:
   - Enforce WebAuthn/Passkey infrastructure for core administrative systems.
   - Establish password policy matching minimum 12-char lengths with breach-checking verification on user signup.""",
   
    "general": """### CyberSecurity Best Practices
1. **Multi-Factor Authentication (MFA)**: Enforce TOTP, Biometrics, or Passkeys.
2. **Password Managers**: Encourage users to store unique, random credentials in an enterprise vault.
3. **Zero Trust Architecture**: Never trust authentication status indefinitely; implement session expiry and step-up auth for critical actions."""
}

def get_ai_advice(prompt: str, context_type: str = "general") -> str:
    context_type = (context_type or "general").lower()
    
    # 1. If OpenAI key is configured, call OpenAI-compatible API
    if settings.OPENAI_API_KEY:
        url = f"{settings.OPENAI_BASE_URL}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}"
        }
        
        system_prompt = (
            "You are an enterprise cybersecurity platform virtual assistant. "
            "You provide highly expert, educational, defensive-focused recommendations on passwords, "
            "authentication security, compliance, cryptographic hashing, and attack simulation details. "
            "Always follow ethical boundaries: never generate cracking scripts, never help perform unauthorized attacks. "
            "Format your response in neat, professional Markdown."
        )
        
        payload = {
            "model": settings.AI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context: {context_type}. Prompt: {prompt}"}
            ],
            "temperature": 0.3
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=6)
            if response.status_code == 200:
                result_json = response.json()
                return result_json["choices"][0]["message"]["content"]
            else:
                logger.warning(f"AI Model API returned status {response.status_code}. Using rules fallback.")
        except Exception as e:
            logger.warning(f"Failed to fetch response from AI Model API: {e}. Using rules fallback.")
            
    # 2. Return fallback cybersecurity advisory if no LLM configured or calls fail
    return FALLBACK_ADVICE.get(context_type, FALLBACK_ADVICE["general"])
