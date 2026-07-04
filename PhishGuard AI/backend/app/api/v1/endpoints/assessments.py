from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Certificate
from app.schemas.schemas import AssessmentCreate, AssessmentResponse, QuizSubmit, QuizResultResponse, CertificateResponse
from app.services import training as training_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=AssessmentResponse)
def create_assessment(
    assessment_in: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Admin", "Security Trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Trainers or Admins can configure assessments"
        )
    return training_service.create_assessment(db, assessment_in)

@router.get("/course/{course_id}", response_model=list[AssessmentResponse])
def get_course_assessments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return training_service.get_assessments_by_course(db, course_id)

@router.post("/{assessment_id}/submit", response_model=QuizResultResponse)
def submit_quiz(
    assessment_id: int,
    submission: QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return training_service.submit_assessment_answers(db, assessment_id, current_user.id, submission)

@router.get("/certificates/me", response_model=list[CertificateResponse])
def get_my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    certs = db.query(Certificate).filter(Certificate.user_id == current_user.id).all()
    # Populate the course_title dynamically
    results = []
    for c in certs:
        results.append(CertificateResponse(
            id=c.id,
            course_id=c.course_id,
            course_title=c.course.title if c.course else "Unknown Course",
            issue_date=c.issue_date,
            certificate_code=c.certificate_code
        ))
    return results
