from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime
from ..models.models import User, Role, Endpoint, Process, Alert, Incident, Rule, ThreatScore, AuditLog, Report, Configuration

class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_data: Dict[str, Any]) -> User:
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def update(db: Session, user: User, updates: Dict[str, Any]) -> User:
        for key, value in updates.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user

class EndpointRepository:
    @staticmethod
    def get_by_id(db: Session, endpoint_id: str) -> Optional[Endpoint]:
        return db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()

    @staticmethod
    def list(db: Session, skip: int = 0, limit: int = 100) -> List[Endpoint]:
        return db.query(Endpoint).order_by(desc(Endpoint.last_seen)).offset(skip).limit(limit).all()

    @staticmethod
    def upsert(db: Session, endpoint_id: str, data: Dict[str, Any]) -> Endpoint:
        endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
        if endpoint:
            for key, value in data.items():
                setattr(endpoint, key, value)
            endpoint.last_seen = datetime.utcnow()
        else:
            endpoint = Endpoint(id=endpoint_id, **data)
            db.add(endpoint)
        db.commit()
        db.refresh(endpoint)
        return endpoint

    @staticmethod
    def update_posture(db: Session, endpoint_id: str, posture_score: int, health_status: str) -> Optional[Endpoint]:
        endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
        if endpoint:
            endpoint.posture_score = posture_score
            endpoint.health_status = health_status
            db.commit()
            db.refresh(endpoint)
        return endpoint

class ProcessRepository:
    @staticmethod
    def get_by_endpoint(db: Session, endpoint_id: str, limit: int = 200) -> List[Process]:
        return db.query(Process).filter(Process.endpoint_id == endpoint_id).order_by(desc(Process.tracking_time)).limit(limit).all()

    @staticmethod
    def bulk_insert(db: Session, endpoint_id: str, processes_data: List[Dict[str, Any]]):
        # Clear older processes for this endpoint to keep it light
        db.query(Process).filter(Process.endpoint_id == endpoint_id).delete()
        
        db_processes = []
        for p in processes_data:
            tt = p.get("tracking_time")
            if tt is not None:
                if isinstance(tt, (int, float)):
                    p["tracking_time"] = datetime.fromtimestamp(tt)
                elif isinstance(tt, str):
                    try:
                        p["tracking_time"] = datetime.fromisoformat(tt.replace("Z", "+00:00"))
                    except Exception:
                        p["tracking_time"] = datetime.utcnow()
            else:
                p["tracking_time"] = datetime.utcnow()
            db_processes.append(Process(endpoint_id=endpoint_id, **p))
        db.bulk_save_objects(db_processes)
        db.commit()

class AlertRepository:
    @staticmethod
    def get_by_id(db: Session, alert_id: int) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.id == alert_id).first()

    @staticmethod
    def list(db: Session, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Alert]:
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.status == status)
        return query.order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, alert_data: Dict[str, Any]) -> Alert:
        alert = Alert(**alert_data)
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return alert

    @staticmethod
    def update_status(db: Session, alert_id: int, status: str) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = status
            if status == "Resolved":
                alert.resolved_at = datetime.utcnow()
            db.commit()
            db.refresh(alert)
        return alert

class IncidentRepository:
    @staticmethod
    def get_by_id(db: Session, incident_id: int) -> Optional[Incident]:
        return db.query(Incident).filter(Incident.id == incident_id).first()

    @staticmethod
    def list(db: Session, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Incident]:
        query = db.query(Incident)
        if status:
            query = query.filter(Incident.status == status)
        return query.order_by(desc(Incident.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, incident_data: Dict[str, Any]) -> Incident:
        incident = Incident(**incident_data)
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def update(db: Session, incident_id: int, updates: Dict[str, Any]) -> Optional[Incident]:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if incident:
            for key, value in updates.items():
                setattr(incident, key, value)
            db.commit()
            db.refresh(incident)
        return incident

class RuleRepository:
    @staticmethod
    def get_by_id(db: Session, rule_id: int) -> Optional[Rule]:
        return db.query(Rule).filter(Rule.id == rule_id).first()

    @staticmethod
    def list_active(db: Session) -> List[Rule]:
        return db.query(Rule).filter(Rule.is_active == True).all()

    @staticmethod
    def list_all(db: Session) -> List[Rule]:
        return db.query(Rule).all()

    @staticmethod
    def create(db: Session, rule_data: Dict[str, Any]) -> Rule:
        rule = Rule(**rule_data)
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def update(db: Session, rule_id: int, updates: Dict[str, Any]) -> Optional[Rule]:
        rule = db.query(Rule).filter(Rule.id == rule_id).first()
        if rule:
            for key, value in updates.items():
                setattr(rule, key, value)
            db.commit()
            db.refresh(rule)
        return rule

class AuditLogRepository:
    @staticmethod
    def log(db: Session, user_email: str, action: str, target: Optional[str] = None, details: Optional[str] = None):
        log_entry = AuditLog(
            user_email=user_email,
            action=action,
            target=target,
            details=details
        )
        db.add(log_entry)
        db.commit()

    @staticmethod
    def list(db: Session, limit: int = 150) -> List[AuditLog]:
        return db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()

class ReportRepository:
    @staticmethod
    def create(db: Session, report_data: Dict[str, Any]) -> Report:
        report = Report(**report_data)
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def list(db: Session, limit: int = 50) -> List[Report]:
        return db.query(Report).order_by(desc(Report.created_at)).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, report_id: int) -> Optional[Report]:
        return db.query(Report).filter(Report.id == report_id).first()
