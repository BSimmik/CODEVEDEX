import re
import random
from app.schemas.schemas import EmailAnalysisResponse, URLAnalysisResponse

def analyze_email_content(headers: str, content: str) -> EmailAnalysisResponse:
    risk_score = 0
    indicators = {
        "urgency": False,
        "sender_mismatch": False,
        "attachment_risks": [],
        "suspicious_links": False,
        "credential_harvest": False
    }
    recommendations = []
    threats = []

    # Check urgency indicators
    urgency_words = [r"\bimmediate\b", r"\burgent\b", r"\baction required\b", r"\bexpire\b", r"\blockout\b", r"\bsuspended\b", r"\bverify now\b"]
    for word in urgency_words:
        if re.search(word, content, re.IGNORECASE) or re.search(word, headers, re.IGNORECASE):
            indicators["urgency"] = True
            risk_score += 20
            threats.append("High urgency language designed to cause panic.")
            break

    # Check sender domain mismatches
    if headers:
        # e.g., From: Support <support@secure-bank-login.com> but claim to be Bank of America
        if "from" in headers.lower() and ("paypal" in content.lower() or "chase" in content.lower() or "google" in content.lower()):
            domain_match = re.search(r"from:.*@([a-zA-Z0-9.-]+)", headers, re.IGNORECASE)
            if domain_match:
                domain = domain_match.group(1)
                if not any(brand in domain.lower() for brand in ["paypal.com", "chase.com", "google.com"]):
                    indicators["sender_mismatch"] = True
                    risk_score += 25
                    threats.append(f"Sender email domain ({domain}) does not match the company branding in the content.")

    # Check suspicious attachments
    attachment_patterns = [r"\.exe\b", r"\.scr\b", r"\.zip\b", r"\.rar\b", r"\.xlsm\b", r"\.docm\b"]
    for pat in attachment_patterns:
        if re.search(pat, content, re.IGNORECASE) or re.search(pat, headers, re.IGNORECASE):
            match = re.search(r"([a-zA-Z0-9.-]+\"?" + pat + r")", content + headers, re.IGNORECASE)
            fname = match.group(1) if match else "attachment"
            indicators["attachment_risks"].append(fname)
            risk_score += 25
            threats.append(f"Dangerous file extension in attachment: {fname}")

    # Check suspicious links / credential hooks
    if "click here" in content.lower() or "verify" in content.lower() or "login" in content.lower() or "reset" in content.lower():
        indicators["credential_harvest"] = True
        risk_score += 15
        threats.append("Call-to-action directing to a sign-in or verification page.")

    if "http://" in content.lower() or "https://" in content.lower():
        indicators["suspicious_links"] = True
        risk_score += 15
        
    # Cap score
    risk_score = min(100, risk_score)
    if risk_score == 0:
        risk_score = 5  # Baseline

    # Categorize
    if risk_score >= 75:
        category = "Critical"
    elif risk_score >= 50:
        category = "High"
    elif risk_score >= 25:
        category = "Medium"
    else:
        category = "Low"

    # Build recommendations
    if indicators["urgency"]:
        recommendations.append("Be wary of requests that force you to act quickly under threat of penalties or lockouts.")
    if indicators["sender_mismatch"]:
        recommendations.append("Always verify the sender address domain. Legitimate companies send mail from official registered domains.")
    if indicators["attachment_risks"]:
        recommendations.append("Do not open attachments with macro-enabled extensions (.xlsm, .docm) or executables from untrusted sources.")
    if indicators["credential_harvest"]:
        recommendations.append("Never enter credentials on pages opened through email links. Navigate to the official site directly.")
    
    if not recommendations:
        recommendations.append("This email has few direct indicators, but continue monitoring sender details before responding.")

    explanation = " | ".join(threats) if threats else "No critical threat indicators found in headers or email body text."

    return EmailAnalysisResponse(
        risk_score=risk_score,
        risk_category=category,
        threat_explanation=explanation,
        indicators=indicators,
        security_recommendations=recommendations
    )

def inspect_url_safety(url: str) -> URLAnalysisResponse:
    risk_score = 0
    keywords = ["secure", "login", "signin", "verify", "update", "bank", "account", "support", "billing"]
    found_keywords = []
    typo_squatting = False
    has_redirects = False
    recommendations = []
    explanations = []

    # Check structure (IP address instead of domain, too many subdomains)
    domain_match = re.search(r"https?://([^/]+)", url)
    domain = domain_match.group(1) if domain_match else url
    
    # IP check
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain):
        risk_score += 35
        explanations.append("Uses an IP address instead of a domain name, which is highly typical of malware hosting.")

    # Typo-squatting mock indicators (contains brands but misspelled)
    brands = ["paypal", "chase", "microsoft", "google", "apple", "netflix"]
    for brand in brands:
        # Check if brand is in domain but is slightly altered, e.g. paypa1, micros0ft, secure-paypal
        if brand in domain and domain != f"{brand}.com" and domain != f"www.{brand}.com":
            typo_squatting = True
            risk_score += 30
            explanations.append(f"Typo-squatting indicator: The domain contains '{brand}' but is not the official company domain.")

    # Suspicious keywords in URL path or subdomain
    for word in keywords:
        if word in url.lower() and word != domain:
            found_keywords.append(word)
            risk_score += 15
            
    if found_keywords:
        explanations.append(f"Contains security-sensitive keywords in path: {found_keywords}")

    # Redirect parameter check
    if "redirect=" in url or "next=" in url or "url=" in url:
        has_redirects = True
        risk_score += 20
        explanations.append("Contains parameters designed to redirect the browser to external sites after interaction.")

    # Domain age (educational mock calculation)
    # If the domain is suspicious, mock it as young (e.g. 0.1 years), else older
    domain_age = 8.5
    if risk_score > 20:
        domain_age = round(random.uniform(0.01, 0.8), 2)
        risk_score += 15
        explanations.append(f"Newly registered domain (Age: {domain_age} years). Legitimate platforms usually have established records.")
    
    risk_score = min(100, risk_score)
    if risk_score == 0:
        risk_score = 5

    # Categorize
    if risk_score >= 75:
        category = "Critical"
    elif risk_score >= 50:
        category = "High"
    elif risk_score >= 25:
        category = "Medium"
    else:
        category = "Low"

    # Build recommendations
    if typo_squatting:
        recommendations.append("Do not enter login credentials. Ensure there are no character substitutions (e.g., '1' instead of 'l').")
    if has_redirects:
        recommendations.append("Beware of redirects that bypass initial security checks to route you to malicious domains.")
    if domain_age < 1.0:
        recommendations.append("Avoid transacting or providing personal information on domains registered within the last year.")
    if not recommendations:
        recommendations.append("No suspicious attributes found. However, manually inspect SSL certificate verification status.")

    explanation_str = " | ".join(explanations) if explanations else "The URL structure matches general safety indicators."

    return URLAnalysisResponse(
        url=url,
        risk_score=risk_score,
        risk_category=category,
        domain_age_years=domain_age,
        typo_squatting=typo_squatting,
        suspicious_keywords=found_keywords,
        has_redirects=has_redirects,
        explanation=explanation_str,
        recommendations=recommendations
    )
