import random
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import Simulation, BehaviorMetrics, User, AuditLog
from app.schemas.schemas import SimulationCreate, SimulationUpdate

SCENARIOS = {
    "Fake Delivery Notice": {
        "subject": "Pending Delivery Notice - Immediate Action Required",
        "sender": "delivery-update@package-tracking-post.com",
        "content": "Your package could not be delivered due to an incorrect address. Please click the link to confirm your billing details within 24 hours.",
        "indicators": ["Urgent threat language", "Generic greeting", "Misspelled tracking domain"]
    },
    "Fake HR Notification": {
        "subject": "Urgent Update: Annual Policy Acknowledgement & Salary Adjustment",
        "sender": "human-resources@internal-hr-portal.com",
        "content": "Please review the updated employee guidelines and sign the acknowledgment form to ensure your upcoming compensation adjustment goes through.",
        "indicators": ["Financial incentive hook", "Fake internal domain", "High urgency requirement"]
    },
    "Fake Password Reset": {
        "subject": "Security Alert: Microsoft Account Password Expiry",
        "sender": "no-reply@microsoft-security-verify.com",
        "content": "Your password is set to expire today. Please click below to keep your current credentials and avoid account lockout.",
        "indicators": ["Fake logo use", "Threat of service disruption", "Non-official domain name"]
    },
    "Fake IT Support Request": {
        "subject": "System Upgrade - Direct Action Required from IT Team",
        "sender": "helpdesk@corporate-support-desk.com",
        "content": "Our security operations center is upgrading client certificates. Please download the attached patch and click run to configure your system.",
        "indicators": ["Spoofed authority", "Suspicious attachment link", "Requires direct system modification"]
    },
    "Fake Banking Alert": {
        "subject": "Fraud Prevention: Suspicious Transaction Flagged",
        "sender": "security@chase-secure-alerts.net",
        "content": "We noticed a login request from an unrecognized device in another state. If this was not you, log in immediately to reverse the transfer of $840.",
        "indicators": ["Large charge scare tactic", "Link pointing to .net domain", "Request for prompt action"]
    },
    "Fake Prize Winner Message": {
        "subject": "Congratulations! You won the Quarterly Corporate sweepstakes",
        "sender": "rewards@corporate-prizes-program.com",
        "content": "You have been selected as the winner of a $500 Amazon Gift card. Click here to claim your reward instantly. Code: AMZ-9391.",
        "indicators": ["Too good to be true", "Immediate reward deadline", "Requests authentication verification"]
    }
}

def create_simulation_run(db: Session, sim_in: SimulationCreate) -> dict:
    if sim_in.scenario_name not in SCENARIOS:
        raise HTTPException(status_code=400, detail="Invalid scenario name")
        
    db_sim = Simulation(
        scenario_name=sim_in.scenario_name,
        user_id=sim_in.user_id,
        status="Sent",
        sent_at=datetime.utcnow()
    )
    db.add(db_sim)
    db.commit()
    db.refresh(db_sim)
    
    scenario_info = SCENARIOS[sim_in.scenario_name]
    
    return {
        "simulation_id": db_sim.id,
        "subject": scenario_info["subject"],
        "sender": scenario_info["sender"],
        "content": scenario_info["content"],
        "indicators": scenario_info["indicators"],
        "status": db_sim.status
    }

def record_interaction(db: Session, sim_id: int, interaction: SimulationUpdate) -> Simulation:
    sim = db.query(Simulation).filter(Simulation.id == sim_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    sim.status = interaction.status
    if interaction.clicked_at:
        sim.clicked_at = interaction.clicked_at
    if interaction.replied_at:
        sim.replied_at = interaction.replied_at
    if interaction.response_time:
        sim.response_time = interaction.response_time
    if interaction.mistakes_made:
        sim.mistakes_made = interaction.mistakes_made
        
    # Update Behavior Metrics based on mistakes
    metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.user_id == sim.user_id).first()
    if metrics:
        if interaction.status == "Clicked":
            metrics.clicks_count += 1
            # Decrease security score
            metrics.score = max(10, metrics.score - 15)
        elif interaction.status == "Replied":
            metrics.replies_count += 1
            # Severe decrease
            metrics.score = max(10, metrics.score - 25)
            
        if interaction.mistakes_made:
            current_mistakes = metrics.common_mistakes or {}
            for mistake in interaction.mistakes_made:
                current_mistakes[mistake] = current_mistakes.get(mistake, 0) + 1
            metrics.common_mistakes = current_mistakes
            
    # Audit log
    audit = AuditLog(
        user_id=sim.user_id,
        action="Simulation Interaction",
        details=f"User interacted with scenario '{sim.scenario_name}'. Status updated to {sim.status}. Mistakes: {interaction.mistakes_made}"
    )
    db.add(audit)
    db.commit()
    db.refresh(sim)
    return sim

def get_user_simulations(db: Session, user_id: int) -> list:
    return db.query(Simulation).filter(Simulation.user_id == user_id).all()
