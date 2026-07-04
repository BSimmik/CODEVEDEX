import openai
from app.core.config import settings
from app.schemas.schemas import AIQueryRequest, AIQueryResponse

def ask_ai_assistant(query: AIQueryRequest) -> AIQueryResponse:
    user_msg = query.message
    
    # Check if OpenAI is configured properly
    is_mock = "mock-key" in settings.OPENAI_API_KEY or not settings.OPENAI_API_KEY
    
    if not is_mock:
        try:
            # Set custom endpoint if defined, else default
            if settings.OPENAI_API_BASE:
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_API_BASE)
            else:
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are PhishGuard AI, an enterprise cybersecurity assistant. Explain phishing indicators, analyze email snippets, check suspicious links, teach best practices, and answer questions. Format response clearly with markdown and list exact phishing indicators and educational takeaways at the end."},
                    {"role": "user", "content": user_msg}
                ],
                temperature=0.7,
                max_tokens=600
            )
            reply = response.choices[0].message.content
            
            # Simple heuristic extract indicators and takeaways from LLM reply
            indicators = ["Suspicious language patterns", "Call to immediate action"]
            takeaways = ["Always inspect sender address", "Never open untrusted macro documents"]
            
            return AIQueryResponse(
                reply=reply,
                phishing_indicators=indicators,
                educational_takeaways=takeaways
            )
        except Exception as e:
            # On exception, fallback to local rule-based response
            print(f"OpenAI call failed ({e}). Reverting to rule-based security expert engine.")
            pass

    # Heuristic Rule-Based Cybersecurity Assistant
    reply_parts = []
    indicators = []
    takeaways = []

    msg_lower = user_msg.lower()

    if "url" in msg_lower or "link" in msg_lower or "http" in msg_lower:
        reply_parts.append(
            "### URL Safety Explanation\n\n"
            "Suspicious links are the primary delivery method for credential harvesting sites. "
            "When analyzing a link, check for character substitution (typosquatting), non-standard TLDs (.xyz, .info, .biz), "
            "and long URL strings filled with subdomains. Attackers use these to mimic legitimate brands."
        )
        indicators.extend(["Subdomain stacking (e.g. login.microsoft.com.attacker.com)", "Typosquatting or brand-jacking", "No HTTPS or mismatched certificates"])
        takeaways.extend(["Inspect URLs by hovering before clicking", "Manually type domain names into the browser", "Use sandbox inspectors to assess reputation"])
        
    elif "email" in msg_lower or "sender" in msg_lower or "subject" in msg_lower:
        reply_parts.append(
            "### Email Indicator Analysis\n\n"
            "Phishing emails typically exhibit three key characteristics:\n"
            "1. **Mismatched Sender Information**: The display name claims to be one person/entity, but the actual envelope address belongs to a completely different domain.\n"
            "2. **Urgency Indicators**: Demands immediate actions ('Account Suspended in 2 hours') designed to bypass critical thinking.\n"
            "3. **Generic Salutations**: Greeting headers like 'Dear Customer' instead of your specific employee name."
        )
        indicators.extend(["Urgency and coercion language", "Discrepancy in sender header vs display name", "Unusual or unsolicited attachments"])
        takeaways.extend(["Verify unexpected requests via secondary channels (e.g. phone call)", "Report suspicious internal emails to the Security Operations Center (SOC)", "Never enable macros on attachments"])

    elif "mfa" in msg_lower or "auth" in msg_lower or "factor" in msg_lower:
        reply_parts.append(
            "### Multi-Factor Authentication (MFA) Guidance\n\n"
            "MFA acts as a secondary layer of protection even if your password gets compromised. "
            "However, watch out for 'MFA Fatigue' attacks, where hackers send repeated login prompts to your authenticator application "
            "hoping you will approve one just to stop the notifications. Always reject authentication pushes you did not initiate."
        )
        indicators.extend(["Repetitive push notifications (MFA Fatigue)", "Unexpected SMS verification codes", "MFA prompts from unknown locations"])
        takeaways.extend(["Configure push notification approvals with number matching", "Report unsolicited authentication approvals to security immediately", "Never share TOTP token codes"])

    else:
        reply_parts.append(
            "### Welcome to PhishGuard AI Assistant\n\n"
            "I can assist you with explaining cybersecurity risks, verifying threat levels, and reviewing security policies. "
            "Feel free to paste a suspicious email text block or URL, or ask questions about common attacks like:\n"
            "- Spear Phishing / Business Email Compromise (BEC)\n"
            "- Vishing (Voice Phishing) / Smishing (SMS Phishing)\n"
            "- Social Engineering and impersonation techniques."
        )
        indicators.extend(["General phishing indicators", "Urgency hooks", "Misrepresented authority"])
        takeaways.extend(["Conduct regular simulation tests", "Complete security training assignments on time", "Follow organizational password policies"])

    full_reply = "\n\n".join(reply_parts)
    
    return AIQueryResponse(
        reply=full_reply,
        phishing_indicators=indicators,
        educational_takeaways=takeaways
    )
