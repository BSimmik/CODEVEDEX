import pytest
from backend.app.services.password_service import calculate_entropy, analyze_password_strength
from backend.app.services.policy_service import audit_password_policy
from backend.app.schemas.schemas import PolicyConfig
from backend.app.services.breach_service import check_password_breach

def test_calculate_entropy():
    # Length 8, lowercase only (charset = 26)
    # 8 * log2(26) = 8 * 4.7 = 37.6 bits
    entropy, charset = calculate_entropy("abcdefgh")
    assert charset == 26
    assert entropy > 30
    assert entropy < 40

    # Length 8, lower + digit (charset = 36)
    entropy2, charset2 = calculate_entropy("abcde123")
    assert charset2 == 36
    assert entropy2 > entropy

def test_analyze_password_strength_grades():
    # Extremely weak
    res_weak = analyze_password_strength("123")
    assert res_weak.score < 25
    assert res_weak.classification == "Critical"

    # Very strong
    res_strong = analyze_password_strength("Sup3r_S3cur3_P@ssw0rd_2026!")
    assert res_strong.score >= 75
    assert res_strong.classification in ["Strong", "Excellent"]


def test_audit_password_policy():
    policy = PolicyConfig(
        name="Custom Policy",
        min_length=10,
        require_uppercase=True,
        require_lowercase=True,
        require_numbers=True,
        require_special=True
    )
    
    # Non compliant (missing special, too short)
    res1 = audit_password_policy("Ab1", policy)
    assert res1.status == "Non-Compliant"
    assert res1.compliance_score < 100

    # Compliant
    res2 = audit_password_policy("Abcd1234!@#$", policy)
    assert res2.status == "Compliant"
    assert res2.compliance_score == 100

def test_breach_service_offline():
    # Common password should match offline breach db
    res = check_password_breach("password")
    assert res.is_breached is True
    assert res.exposure_count > 0
    assert res.risk_score > 80

    # Strong random password should not match offline mock pwned lists
    res2 = check_password_breach("Xy9#qpLm2@!9sZ")
    assert res2.is_breached is False
    assert res2.exposure_count == 0
    assert res2.risk_score == 0
