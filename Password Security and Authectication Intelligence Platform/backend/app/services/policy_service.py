import re
from typing import List
from backend.app.schemas.schemas import PolicyConfig, ComplianceResponse, ComplianceDetail

def audit_password_policy(password: str, policy: PolicyConfig) -> ComplianceResponse:
    details: List[ComplianceDetail] = []
    passed_count = 0
    total_checks = 0

    # 1. Length Check
    total_checks += 1
    length_ok = len(password) >= policy.min_length
    if length_ok:
        passed_count += 1
        details.append(ComplianceDetail(
            check_name="Minimum Length",
            passed=True,
            message=f"Password meets the minimum length requirement of {policy.min_length} characters (Actual: {len(password)})."
        ))
    else:
        details.append(ComplianceDetail(
            check_name="Minimum Length",
            passed=False,
            message=f"Password is too short. Must be at least {policy.min_length} characters (Actual: {len(password)})."
        ))

    # 2. Uppercase Check
    if policy.require_uppercase:
        total_checks += 1
        has_upper = bool(re.search(r"[A-Z]", password))
        if has_upper:
            passed_count += 1
            details.append(ComplianceDetail(
                check_name="Uppercase Character",
                passed=True,
                message="Password contains at least one uppercase letter."
            ))
        else:
            details.append(ComplianceDetail(
                check_name="Uppercase Character",
                passed=False,
                message="Password does not contain an uppercase letter."
            ))

    # 3. Lowercase Check
    if policy.require_lowercase:
        total_checks += 1
        has_lower = bool(re.search(r"[a-z]", password))
        if has_lower:
            passed_count += 1
            details.append(ComplianceDetail(
                check_name="Lowercase Character",
                passed=True,
                message="Password contains at least one lowercase letter."
            ))
        else:
            details.append(ComplianceDetail(
                check_name="Lowercase Character",
                passed=False,
                message="Password does not contain a lowercase letter."
            ))

    # 4. Numbers Check
    if policy.require_numbers:
        total_checks += 1
        has_digit = bool(re.search(r"[0-9]", password))
        if has_digit:
            passed_count += 1
            details.append(ComplianceDetail(
                check_name="Numeric Character",
                passed=True,
                message="Password contains at least one number."
            ))
        else:
            details.append(ComplianceDetail(
                check_name="Numeric Character",
                passed=False,
                message="Password does not contain a number."
            ))

    # 5. Special Character Check
    if policy.require_special:
        total_checks += 1
        has_special = bool(re.search(r"[^a-zA-Z0-9]", password))
        if has_special:
            passed_count += 1
            details.append(ComplianceDetail(
                check_name="Special Character",
                passed=True,
                message="Password contains at least one special character."
            ))
        else:
            details.append(ComplianceDetail(
                check_name="Special Character",
                passed=False,
                message="Password does not contain a special character."
            ))

    # Calculate compliance score
    if total_checks > 0:
        compliance_score = int((passed_count / total_checks) * 100)
    else:
        compliance_score = 100
        
    status = "Compliant" if compliance_score == 100 else "Non-Compliant"

    return ComplianceResponse(
        compliance_score=compliance_score,
        status=status,
        details=details
    )
