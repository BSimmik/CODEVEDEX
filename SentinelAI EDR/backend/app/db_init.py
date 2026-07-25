import logging
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models.models import Role, User, Rule, Configuration
from .auth.security import get_password_hash
from .auth.mfa import generate_mfa_secret

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_init")

def init_db(db: Session):
    # 1. Create all tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # 2. Seed Roles
    logger.info("Seeding roles...")
    roles = [
        {"name": "Administrator", "description": "Full access to platform administration, rules, and logs"},
        {"name": "Security Analyst", "description": "Can manage alerts, rules, and run threat analysis"},
        {"name": "SOC Analyst", "description": "Triage alerts, create and resolve incidents"},
        {"name": "Auditor", "description": "Read-only access to audit logs, configuration, and reports"},
        {"name": "Viewer", "description": "Read-only access to dashboards, alerts, and endpoints"}
    ]

    for role_data in roles:
        role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not role:
            role = Role(**role_data)
            db.add(role)
    db.commit()

    # 3. Seed Admin User
    logger.info("Seeding admin user...")
    admin_role = db.query(Role).filter(Role.name == "Administrator").first()
    if not admin_role:
        logger.error("Administrator role not found. Cannot seed admin user.")
        return

    admin_user = db.query(User).filter(User.email == "admin@sentinelai.local").first()
    if not admin_user:
        mfa_sec = generate_mfa_secret()
        admin_user = User(
            email="admin@sentinelai.local",
            hashed_password=get_password_hash("SentinelAdmin2026!"),
            role_id=admin_role.id,
            is_active=True,
            mfa_secret=mfa_sec,
            mfa_enabled=False # User can enable it on first login or keep it optional
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Admin user created. Email: admin@sentinelai.local | MFA Secret: {mfa_sec}")
    else:
        logger.info("Admin user already exists.")

    # 4. Seed EDR Rules
    logger.info("Seeding threat detection rules...")
    default_rules = [
        {
            "name": "Credential Dumping Activity",
            "description": "Detects execution of mimikatz.exe or similar credential harvesting processes",
            "rule_type": "Process",
            "severity": "Critical",
            "rule_group": "Credential Access",
            "is_active": True,
            "details": {"field": "name", "operator": "equals", "value": "mimikatz.exe"}
        },
        {
            "name": "Netcat Backdoor / Reverse Shell",
            "description": "Detects common netcat binary run configurations",
            "rule_type": "Process",
            "severity": "High",
            "rule_group": "Execution",
            "is_active": True,
            "details": {"field": "name", "operator": "contains", "value": "nc.exe"}
        },
        {
            "name": "Suspicious PowerShell Scripting",
            "description": "Detects obfuscated or high-risk PowerShell arguments",
            "rule_type": "Process",
            "severity": "Medium",
            "rule_group": "Execution",
            "is_active": True,
            "details": {"field": "cmdline", "operator": "contains", "value": "-EncodedCommand"}
        },
        {
            "name": "Reverse Shell Network Port",
            "description": "Detects active network connections outbound to typical reverse shell port 4444",
            "rule_type": "Network",
            "severity": "High",
            "rule_group": "Command and Control",
            "is_active": True,
            "details": {"field": "remote_port", "operator": "equals", "value": 4444}
        },
        {
            "name": "Botnet IRC Port Active",
            "description": "Detects active listening or connecting to common IRC ports",
            "rule_type": "Network",
            "severity": "Medium",
            "rule_group": "Command and Control",
            "is_active": True,
            "details": {"field": "remote_port", "operator": "equals", "value": 6667}
        },
        {
            "name": "Startup Folder Executable Drop",
            "description": "Detects modifications or creations of files in the startup directory",
            "rule_type": "File",
            "severity": "Critical",
            "rule_group": "Persistence",
            "is_active": True,
            "details": {"field": "path", "operator": "contains", "value": "Startup"}
        },
        {
            "name": "Sensitive System Config Edit",
            "description": "Detects alterations of sensitive files such as hosts or system registries",
            "rule_type": "File",
            "severity": "High",
            "rule_group": "Defense Evasion",
            "is_active": True,
            "details": {"field": "path", "operator": "contains", "value": "etc/hosts"}
        },
        {
            "name": "High CPU Process Anomaly",
            "description": "Detects process consuming excessive CPU, suggesting cryptomining or resource exhaustion",
            "rule_type": "Resource",
            "severity": "Medium",
            "rule_group": "Impact",
            "is_active": True,
            "details": {"field": "cpu_percent", "operator": "greater_than", "value": 90}
        }
    ]

    for rule_data in default_rules:
        rule = db.query(Rule).filter(Rule.name == rule_data["name"]).first()
        if not rule:
            rule = Rule(**rule_data)
            db.add(rule)
    db.commit()

    # 5. Seed Configurations
    logger.info("Seeding configurations...")
    configs = [
        {"key": "retention_days", "value": "30", "description": "Number of days to keep raw processes and alert logs"},
        {"key": "ai_threat_analysis_enabled", "value": "true", "description": "Enable automatic LLM analysis for critical alerts"},
        {"key": "rate_limiting_requests", "value": "100", "description": "Number of requests per minute per IP"}
    ]
    for cfg_data in configs:
        cfg = db.query(Configuration).filter(Configuration.key == cfg_data["key"]).first()
        if not cfg:
            cfg = Configuration(**cfg_data)
            db.add(cfg)
    db.commit()
    logger.info("Database initialized and seeded successfully.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
