from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import User, BehaviorMetrics, Simulation, QuizResult, RiskScore
from datetime import datetime

def calculate_and_save_risk_scores(db: Session) -> dict:
    users = db.query(User).all()
    if not users:
        return {"users": [], "departments": {}, "organization": 50.0}

    # 1. User level risk calculation
    user_scores = []
    department_groups = {}
    
    for user in users:
        metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.user_id == user.id).first()
        
        # Calculate risk based on behavior:
        # High clicks = high risk. High quizzes passed = low risk.
        clicks = metrics.clicks_count if metrics else 0
        replies = metrics.replies_count if metrics else 0
        passed = metrics.quizzes_passed if metrics else 0
        
        # Risk score calculation: 0 (safe) to 100 (danger)
        # Base risk is 50. Click adds 15, reply adds 25, passed quiz subtracts 8.
        score = 50.0 + (clicks * 15.0) + (replies * 25.0) - (passed * 8.0)
        score = max(5.0, min(100.0, score))
        
        # Determine risk level
        if score >= 75:
            level = "Critical"
        elif score >= 50:
            level = "High"
        elif score >= 25:
            level = "Medium"
        else:
            level = "Low"
            
        # Update behavior metrics score too (Security Awareness Score = 100 - Risk Score)
        if metrics:
            metrics.score = int(100.0 - score)
            
        # Log/Save risk score history
        db_score = RiskScore(
            scope="User",
            scope_id=str(user.id),
            score=score,
            risk_level=level
        )
        db.add(db_score)
        
        user_scores.append({"id": user.id, "username": user.username, "score": score, "level": level, "dept": user.department})
        
        # Department mapping
        dept = user.department or "General"
        if dept not in department_groups:
            department_groups[dept] = []
        department_groups[dept].append(score)

    # 2. Department level calculation
    dept_scores = {}
    for dept, scores in department_groups.items():
        avg_score = sum(scores) / len(scores)
        if avg_score >= 75:
            dept_level = "Critical"
        elif avg_score >= 50:
            dept_level = "High"
        elif avg_score >= 25:
            dept_level = "Medium"
        else:
            dept_level = "Low"
            
        db_dept_score = RiskScore(
            scope="Department",
            scope_id=dept,
            score=avg_score,
            risk_level=dept_level
        )
        db.add(db_dept_score)
        dept_scores[dept] = {"score": avg_score, "level": dept_level}

    # 3. Organization level calculation
    all_user_scores = [u["score"] for u in user_scores]
    org_score = sum(all_user_scores) / len(all_user_scores) if all_user_scores else 50.0
    if org_score >= 75:
        org_level = "Critical"
    elif org_score >= 50:
        org_level = "High"
    elif org_score >= 25:
        org_level = "Medium"
    else:
        org_level = "Low"
        
    db_org_score = RiskScore(
        scope="Organization",
        scope_id="CompanyWide",
        score=org_score,
        risk_level=org_level
    )
    db.add(db_org_score)
    db.commit()

    return {
        "users": user_scores,
        "departments": dept_scores,
        "organization": {"score": org_score, "level": org_level}
    }

def get_latest_risk_dashboard(db: Session) -> dict:
    # Fetch latest scores for dashboard rendering
    org_score = db.query(RiskScore).filter(RiskScore.scope == "Organization").order_by(RiskScore.calculated_at.desc()).first()
    dept_scores = db.query(RiskScore).filter(RiskScore.scope == "Department").group_by(RiskScore.scope_id).order_by(RiskScore.calculated_at.desc()).all()
    
    # Take unique departments latest scores
    unique_depts = {}
    for ds in dept_scores:
        if ds.scope_id not in unique_depts:
            unique_depts[ds.scope_id] = {
                "score": ds.score,
                "level": ds.risk_level,
                "timestamp": ds.calculated_at
            }
            
    # Trend counts: fetch past 5 org risk scores
    trends = db.query(RiskScore).filter(RiskScore.scope == "Organization").order_by(RiskScore.calculated_at.asc()).limit(10).all()
    trend_data = [{"date": t.calculated_at.strftime("%Y-%m-%d"), "score": round(t.score, 1)} for t in trends]

    # Quick analytics metrics
    total_users = db.query(User).count()
    total_simulations = db.query(Simulation).count()
    clicks_count = db.query(func.sum(BehaviorMetrics.clicks_count)).scalar() or 0
    quizzes_taken = db.query(func.sum(BehaviorMetrics.quizzes_taken)).scalar() or 0
    quizzes_passed = db.query(func.sum(BehaviorMetrics.quizzes_passed)).scalar() or 0

    return {
        "organization_risk": org_score.score if org_score else 45.0,
        "organization_level": org_score.risk_level if org_score else "Medium",
        "departments": unique_depts,
        "trends": trend_data,
        "total_users": total_users,
        "total_simulations": total_simulations,
        "clicks_count": clicks_count,
        "quizzes_taken": quizzes_taken,
        "quizzes_passed": quizzes_passed
    }
