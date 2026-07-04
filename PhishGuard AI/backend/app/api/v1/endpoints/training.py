from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import CourseCreate, CourseResponse, LessonResponse
from app.services import training as training_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=CourseResponse)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Admin", "Security Trainer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins or Trainers can create courses"
        )
    return training_service.create_course_with_lessons(db, course_in, current_user.id)

@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return training_service.get_courses(db)

@router.get("/{course_id}", response_model=CourseResponse)
def get_course_details(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return training_service.get_course(db, course_id)
