import math
from typing import List
from backend.app.schemas.schemas import SimulationRequest, SimulationResponse, SimulationStep

# Attack speed mappings (hashes per second for a high-end cracking rig, e.g. 8x RTX 4090)
ATTACK_SPEEDS = {
    # fast hashes
    "md5": 2.5 * 10**11,      # 250 GH/s
    "sha1": 8.0 * 10**10,     # 80 GH/s
    "sha256": 4.5 * 10**10,   # 45 GH/s
    "sha512": 1.2 * 10**10,   # 12 GH/s
    # slow hashes (KDFs)
    "bcrypt": 5.0 * 10**4,     # 50,000 H/s
    "scrypt": 1.0 * 10**4,     # 10,000 H/s
    "argon2": 2.5 * 10**3      # 2,500 H/s
}

def run_simulated_attack(req: SimulationRequest) -> SimulationResponse:
    algo = req.hash_algorithm.lower()
    speed = ATTACK_SPEEDS.get(algo, 1.0 * 10**5) # Fallback speed
    
    # Calculate charset size R
    r = 0
    charset_desc = []
    if req.use_lowercase:
        r += 26
        charset_desc.append("lowercase (a-z)")
    if req.use_uppercase:
        r += 26
        charset_desc.append("uppercase (A-Z)")
    if req.use_digits:
        r += 10
        charset_desc.append("digits (0-9)")
    if req.use_special:
        r += 32
        charset_desc.append("special symbols")
        
    if r == 0:
        r = 1
        
    length = req.password_length
    
    steps: List[SimulationStep] = []
    
    if req.attack_type == "brute_force":
        # Search space = R^L
        space_val = r ** length
        search_space_str = f"{space_val:.2e} combinations" if space_val > 10**6 else f"{space_val} combinations"
        
        # Time = Space / Speed
        est_time_seconds = space_val / speed
        
        steps.append(SimulationStep(
            step_num=1,
            description=f"Map character space. Using: {', '.join(charset_desc)}. Size = {r} chars.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=2,
            description=f"Calculate permutation combinations: {r}^{length} = {search_space_str}.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=3,
            description=f"Configure simulated hashing rig cracking throughput for {req.hash_algorithm.upper()}: {speed:.2e} hashes/sec.",
            elapsed_time_seconds=0.1,
            success=False
        ))
        
        if est_time_seconds < 86400: # Less than 1 day
            steps.append(SimulationStep(
                step_num=4,
                description=f"High cracking rate matches search space within short timeline.",
                elapsed_time_seconds=est_time_seconds * 0.5,
                success=True
            ))
            success_prob = 1.0
        else:
            steps.append(SimulationStep(
                step_num=4,
                description=f"Search space is too large for simulated hardware. Cracking aborted after exhaust limit.",
                elapsed_time_seconds=86400.0,
                success=False
            ))
            # Probability of cracking within 1 year
            success_prob = min(1.0, (86400 * 365) / est_time_seconds)
            
    elif req.attack_type == "dictionary":
        # Dictionary size (e.g. RockYou.txt = 14 million words)
        dict_size = 14344392
        search_space_str = f"14.3 Million words (Standard RockYou list)"
        
        # Time to run through list = dict_size / speed
        est_time_seconds = dict_size / speed
        
        steps.append(SimulationStep(
            step_num=1,
            description="Load dictionary word list into cache.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=2,
            description="Generate hash representation for each word in background dictionary.",
            elapsed_time_seconds=est_time_seconds * 0.1,
            success=False
        ))
        
        # If password is weak (length < 8 or lowercase only) it is likely in dictionary
        is_weak = length < 8 or (req.use_lowercase and not req.use_uppercase and not req.use_digits and not req.use_special)
        if is_weak:
            steps.append(SimulationStep(
                step_num=3,
                description="Target match found within standard credential dictionary.",
                elapsed_time_seconds=est_time_seconds * 0.4,
                success=True
            ))
            success_prob = 0.95
        else:
            steps.append(SimulationStep(
                step_num=3,
                description="Entire dictionary processed. No exact keyword match found.",
                elapsed_time_seconds=est_time_seconds,
                success=False
            ))
            success_prob = 0.05
            
    elif req.attack_type == "hybrid":
        # Dictionary word + prefix/suffix digits or special characters
        dict_size = 1000000 # 1M core words
        rules_multiplier = (10 ** min(2, length - 5)) if req.use_digits else 1
        if req.use_special:
            rules_multiplier *= 10
            
        space_val = dict_size * rules_multiplier
        search_space_str = f"{space_val:.2e} hybrid permutations"
        est_time_seconds = space_val / speed
        
        steps.append(SimulationStep(
            step_num=1,
            description="Initialize 1 Million word dictionary.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=2,
            description=f"Apply suffix rules (appending numbers/symbols). Combinations: {rules_multiplier} per word.",
            elapsed_time_seconds=0.01,
            success=False
        ))
        
        if length <= 9:
            steps.append(SimulationStep(
                step_num=3,
                description="Target hash matched with hybrid rule 'DictionaryWord + Number + Symbol'.",
                elapsed_time_seconds=est_time_seconds * 0.6,
                success=True
            ))
            success_prob = 0.85
        else:
            steps.append(SimulationStep(
                step_num=3,
                description="Hybrid rules exhausted without match.",
                elapsed_time_seconds=est_time_seconds,
                success=False
            ))
            success_prob = 0.15
            
    elif req.attack_type == "credential_stuffing":
        # Stuffing leaked databases of emails+passwords
        leak_size = 500000000 # 500M combinations
        search_space_str = f"500 Million leaked credentials"
        # Network/Request overhead throttles credential stuffing (assume 100 req/sec parallelized)
        throttled_speed = 100
        est_time_seconds = 10000 / throttled_speed # Test first 10,000 accounts
        
        steps.append(SimulationStep(
            step_num=1,
            description="Parse database leaks containing matching corporate usernames.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=2,
            description="Initiate parallel login request suite against target authentication gateway.",
            elapsed_time_seconds=est_time_seconds * 0.5,
            success=False
        ))
        
        # Real-world credential stuffing success rate is ~0.1% to 1%
        success_prob = 0.02
        steps.append(SimulationStep(
            step_num=3,
            description="Completed 10,000 credential validation attempts. Success rate: 1.2% (Accounts compromised via reused passwords).",
            elapsed_time_seconds=est_time_seconds,
            success=True
        ))
        
    elif req.attack_type == "password_spraying":
        # Testing a small set of extremely common passwords against many accounts
        sprayed_passwords = ["Winter2026!", "Summer2026!", "Password123!", "Welcome123!"]
        num_accounts = 5000
        search_space_str = f"{len(sprayed_passwords)} passwords x {num_accounts} active usernames"
        # Throttled by AD lockout policies (must wait e.g., 30 mins between sprays)
        est_time_seconds = 1800.0 # 30 mins
        
        steps.append(SimulationStep(
            step_num=1,
            description="Compile target Active Directory account index list.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=2,
            description=f"Attempt spray cycle with candidate password '{sprayed_passwords[0]}' across all accounts.",
            elapsed_time_seconds=10.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=3,
            description="Wait for account lockout reset duration window to bypass firewall blocking policies.",
            elapsed_time_seconds=1790.0,
            success=False
        ))
        
        success_prob = 0.15 # 15% probability of spraying success in typical Active Directory environments
        steps.append(SimulationStep(
            step_num=4,
            description="Spraying cycle successful. Found 4 accounts using default/seasonal credentials.",
            elapsed_time_seconds=1800.0,
            success=True
        ))
        
    elif req.attack_type == "rainbow_table":
        # Offline precomputed hashes
        search_space_str = "Precomputed lookup tables (e.g. 500 GB indexing MD5/SHA256)"
        est_time_seconds = 2.5 # Almost instant lookup
        
        steps.append(SimulationStep(
            step_num=1,
            description="Load index blocks from SSD-backed Rainbow Table databases.",
            elapsed_time_seconds=0.0,
            success=False
        ))
        steps.append(SimulationStep(
            step_num=2,
            description="Perform query key lookup matching targeted hash signatures.",
            elapsed_time_seconds=1.2,
            success=False
        ))
        
        # If salted, rainbow tables fail completely!
        is_salted = algo in ["bcrypt", "scrypt", "argon2"]
        if is_salted:
            steps.append(SimulationStep(
                step_num=3,
                description=f"Attack FAILS. Target algorithm uses randomized salts. Precomputed rainbow tables are useless.",
                elapsed_time_seconds=est_time_seconds,
                success=False
            ))
            success_prob = 0.0
        else:
            steps.append(SimulationStep(
                step_num=3,
                description=f"Success! Hash resolved to original string in precomputed dictionary table.",
                elapsed_time_seconds=est_time_seconds,
                success=True
            ))
            success_prob = 0.90
            
    else:
        raise ValueError(f"Unknown attack type: {req.attack_type}")
        
    return SimulationResponse(
        attack_type=req.attack_type.replace("_", " ").title(),
        search_space=search_space_str,
        success_probability=round(success_prob, 3),
        estimated_time_seconds=round(est_time_seconds, 3),
        steps_logged=steps
    )
