import hashlib
import requests
import logging
from backend.app.schemas.schemas import BreachCheckResponse

logger = logging.getLogger(__name__)

# Fallback offline simulation dictionary for testing without internet access
OFFLINE_PWNED_DATABASE = {
    # SHA-1 of common passwords (full SHA-1 uppercase for comparison)
    # password -> 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
    "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8": 9832812,
    # 123456 -> 7C4A8D09CA3762AF61E59520943DC26494F8941B
    "7C4A8D09CA3762AF61E59520943DC26494F8941B": 28312014,
    # admin -> D033E22AE348AEB5660FC2140AEC35850C4DA997
    "D033E22AE348AEB5660FC2140AEC35850C4DA997": 412093,
    # qwerty -> B1B3773A05C0ED0176787A4F2956F5007AEF4D12
    "B1B3773A05C0ED0176787A4F2956F5007AEF4D12": 3901923
}

def check_password_breach(password: str) -> BreachCheckResponse:
    if not password:
        return BreachCheckResponse(
            is_breached=False,
            exposure_count=0,
            risk_score=0,
            recommendation="Password cannot be empty."
        )

    # 1. Generate SHA-1 hash of the password
    sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]
    
    exposure_count = 0
    is_breached = False
    
    # 2. Query HaveIBeenPwned API with first 5 characters
    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    try:
        response = requests.get(url, timeout=4)
        if response.status_code == 200:
            # Parse responses: suffix:count\r\n
            lines = response.text.splitlines()
            for line in lines:
                parts = line.split(":")
                if len(parts) == 2:
                    curr_suffix, count_str = parts
                    if curr_suffix.upper() == suffix:
                        exposure_count = int(count_str)
                        is_breached = True
                        break
        else:
            logger.warning(f"HaveIBeenPwned API returned error status: {response.status_code}. Falling back to offline check.")
            raise requests.RequestException()
            
    except (requests.RequestException, ValueError) as e:
        # Fallback to local check
        logger.warning(f"Could not connect to HaveIBeenPwned API. Using local offline cache.")
        if sha1_hash in OFFLINE_PWNED_DATABASE:
            exposure_count = OFFLINE_PWNED_DATABASE[sha1_hash]
            is_breached = True

    # Compute risk score (0 to 100) based on exposure count
    if not is_breached:
        risk_score = 0
        recommendation = "No known breach matches found. This password is safe to use."
    else:
        # Scale logarithmic risk score: count > 1,000,000 is 100 risk, smaller counts scaled
        risk_score = min(100, int(10 + (20 * (len(str(exposure_count)) - 1))))
        if exposure_count > 1000000:
            recommendation = "CRITICAL: This password has been exposed over 1 million times in public leaks. DO NOT use this password under any circumstances!"
        else:
            recommendation = f"WARNING: This password was found in public data breaches {exposure_count:,} times. Change this password immediately."

    return BreachCheckResponse(
        is_breached=is_breached,
        exposure_count=exposure_count,
        risk_score=risk_score,
        recommendation=recommendation
    )
