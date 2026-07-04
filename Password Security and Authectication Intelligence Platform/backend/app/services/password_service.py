import math
import re
from typing import List, Dict, Any
from backend.app.schemas.schemas import PasswordAnalysisResponse, SecurityRecommendation, ResistanceLevels

# A common list of dictionary/weak words for password checking
COMMON_WEAK_WORDS = {
    "password", "123456", "123456789", "qwerty", "admin", "welcome", "letmein", 
    "secret", "security", "hunter2", "dragon", "monkey", "shadow", "cyber",
    "winter", "spring", "summer", "autumn", "password123", "admin123"
}

# Keyboard patterns to match sequential characters
KEYBOARD_PATHS = [
    "qwertyuiop", "asdfghjkl", "zxcvbnm",
    "1234567890",
]

def calculate_entropy(password: str) -> tuple[float, int]:
    length = len(password)
    if length == 0:
        return 0.0, 0
    
    # Determine charset size R
    r = 0
    has_lower = False
    has_upper = False
    has_digit = False
    has_special = False
    
    if re.search(r"[a-z]", password):
        r += 26
        has_lower = True
    if re.search(r"[A-Z]", password):
        r += 26
        has_upper = True
    if re.search(r"[0-9]", password):
        r += 10
        has_digit = True
    # Match symbols
    if re.search(r"[^a-zA-Z0-9]", password):
        r += 32
        has_special = True
        
    if r == 0:
        r = 1
        
    entropy = length * math.log2(r)
    return round(entropy, 2), r

def check_keyboard_patterns(password: str) -> int:
    lower_pwd = password.lower()
    matches = 0
    # Search for horizontal sequences of length 3 or more
    for path in KEYBOARD_PATHS:
        for i in range(len(path) - 2):
            seq = path[i:i+3]
            rev_seq = seq[::-1]
            if seq in lower_pwd or rev_seq in lower_pwd:
                matches += 1
    return matches

def check_dictionary_words(password: str) -> bool:
    lower_pwd = password.lower()
    # Direct match or containing common words
    for word in COMMON_WEAK_WORDS:
        if word in lower_pwd:
            return True
    return False

def count_repeated_characters(password: str) -> int:
    # Match consecutive identical chars
    repeats = 0
    for i in range(len(password) - 1):
        if password[i] == password[i+1]:
            repeats += 1
    return repeats

def analyze_password_strength(password: str) -> PasswordAnalysisResponse:
    length = len(password)
    entropy, charset_size = calculate_entropy(password)
    keyboard_patterns = check_keyboard_patterns(password)
    has_dict_words = check_dictionary_words(password)
    repeated_chars = count_repeated_characters(password)
    
    # Calculate Base Score (0 to 100)
    # 35 points for entropy (excellent is > 80 bits)
    # 25 points for length (excellent is >= 12 chars)
    # 20 points for character diversity (5 points per group)
    # Deductions: -15 for dictionary words, -10 for keyboard patterns, -10 for repeats
    
    score = 0
    
    # 1. Entropy component (up to 35)
    score += min(35, int((entropy / 80.0) * 35))
    
    # 2. Length component (up to 25)
    score += min(25, int((length / 14.0) * 25))
    
    # 3. Diversity component (up to 20)
    diversity_count = 0
    if re.search(r"[a-z]", password): diversity_count += 5
    if re.search(r"[A-Z]", password): diversity_count += 5
    if re.search(r"[0-9]", password): diversity_count += 5
    if re.search(r"[^a-zA-Z0-9]", password): diversity_count += 5
    score += diversity_count
    
    # 4. Extra rules (up to 20)
    # Reward longer passwords and penalize patterns
    pattern_penalty = 0
    if has_dict_words:
        pattern_penalty += 15
    if keyboard_patterns > 0:
        pattern_penalty += min(10, keyboard_patterns * 5)
    if repeated_chars > 0:
        pattern_penalty += min(10, repeated_chars * 3)
        
    score = max(0, score - pattern_penalty)
    
    # Adjust score if password is extremely short
    if length < 6:
        score = min(15, score)
        
    # Map score to classification
    if score < 25:
        classification = "Critical"
    elif score < 45:
        classification = "Weak"
    elif score < 70:
        classification = "Moderate"
    elif score < 85:
        classification = "Strong"
    else:
        classification = "Excellent"
        
    # Generate recommendations
    recommendations: List[SecurityRecommendation] = []
    if length < 12:
        recommendations.append(SecurityRecommendation(
            type="length",
            message="Increase password length to at least 12-16 characters. Length is the single most effective defense against cracking."
        ))
    if diversity_count < 20:
        missing = []
        if not re.search(r"[a-z]", password): missing.append("lowercase letters")
        if not re.search(r"[A-Z]", password): missing.append("uppercase letters")
        if not re.search(r"[0-9]", password): missing.append("numbers")
        if not re.search(r"[^a-zA-Z0-9]", password): missing.append("special characters")
        recommendations.append(SecurityRecommendation(
            type="diversity",
            message=f"Add missing character categories: {', '.join(missing)}."
        ))
    if has_dict_words:
        recommendations.append(SecurityRecommendation(
            type="dictionary",
            message="Avoid using dictionary words, names, or common default phrases like 'password', seasons, or years."
        ))
    if keyboard_patterns > 0:
        recommendations.append(SecurityRecommendation(
            type="pattern",
            message="Avoid keyboard walk patterns (consecutive keys like 'qwerty' or 'asdf')."
        ))
    if repeated_chars > 0:
        recommendations.append(SecurityRecommendation(
            type="repeated",
            message="Avoid repeating characters consecutively (e.g., 'aaa' or '888')."
        ))
        
    # Estimated cracking resistance
    # Based on search space and typical hardware bandwidths
    if score < 25:
        online_throttled = "Seconds"
        online_unthrottled = "Instantly"
        offline_fast = "Instantly"
    elif score < 45:
        online_throttled = "Minutes"
        online_unthrottled = "Seconds"
        offline_fast = "Seconds"
    elif score < 70:
        online_throttled = "Days"
        online_unthrottled = "Hours"
        offline_fast = "Minutes"
    elif score < 85:
        online_throttled = "Years"
        online_unthrottled = "Days"
        offline_fast = "Days"
    else:
        online_throttled = "Centuries"
        online_unthrottled = "Decades"
        offline_fast = "Years"

    resistance = ResistanceLevels(
        online_throttled=online_throttled,
        online_unthrottled=online_unthrottled,
        offline_fast_hashing=offline_fast
    )
    
    return PasswordAnalysisResponse(
        length=length,
        entropy=entropy,
        score=score,
        classification=classification,
        repeated_chars=repeated_chars,
        has_dictionary_words=has_dict_words,
        keyboard_patterns=keyboard_patterns,
        recommendations=recommendations,
        resistance_levels=resistance
    )
