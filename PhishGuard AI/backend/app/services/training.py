import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import TrainingCourse, Lesson, Assessment, QuizResult, User, Certificate, BehaviorMetrics, AuditLog
from app.schemas.schemas import CourseCreate, LessonCreate, AssessmentCreate, QuizSubmit

def create_course_with_lessons(db: Session, course_in: CourseCreate, user_id: int) -> TrainingCourse:
    db_course = TrainingCourse(
        title=course_in.title,
        description=course_in.description,
        difficulty=course_in.difficulty,
        created_by=user_id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)

    for idx, lesson_in in enumerate(course_in.lessons):
        db_lesson = Lesson(
            course_id=db_course.id,
            title=lesson_in.title,
            content=lesson_in.content,
            order_number=lesson_in.order_number or (idx + 1)
        )
        db.add(db_lesson)
    
    # Audit log
    audit = AuditLog(
        user_id=user_id,
        action="Create Course",
        details=f"Trainer created course '{db_course.title}' with {len(course_in.lessons)} lessons"
    )
    db.add(audit)
    db.commit()
    db.refresh(db_course)
    return db_course

def get_courses(db: Session) -> list:
    return db.query(TrainingCourse).all()

def get_course(db: Session, course_id: int) -> TrainingCourse:
    course = db.query(TrainingCourse).filter(TrainingCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

def create_assessment(db: Session, assessment_in: AssessmentCreate) -> Assessment:
    # Ensure course exists
    get_course(db, assessment_in.course_id)
    
    db_assessment = Assessment(
        course_id=assessment_in.course_id,
        title=assessment_in.title,
        description=assessment_in.description,
        passing_score=assessment_in.passing_score,
        questions=assessment_in.questions
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

def get_assessments_by_course(db: Session, course_id: int) -> list:
    return db.query(Assessment).filter(Assessment.course_id == course_id).all()

def submit_assessment_answers(db: Session, assessment_id: int, user_id: int, submission: QuizSubmit) -> dict:
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    questions = assessment.questions
    answers = submission.answers
    
    if len(answers) != len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid answers length. Expected {len(questions)}, got {len(answers)}"
        )
        
    correct_count = 0
    for idx, question in enumerate(questions):
        expected = question.get("answer")
        # Handle case insensitive/whitespace matching
        if idx < len(answers) and str(answers[idx]).strip().lower() == str(expected).strip().lower():
            correct_count += 1
            
    total_questions = len(questions)
    score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    passed = score >= assessment.passing_score
    
    # Save Quiz Result
    quiz_result = QuizResult(
        assessment_id=assessment_id,
        user_id=user_id,
        score=score,
        passed=passed
    )
    db.add(quiz_result)
    
    # Update Behavior Metrics
    metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.user_id == user_id).first()
    if metrics:
        metrics.quizzes_taken += 1
        if passed:
            metrics.quizzes_passed += 1
            # Recalculate security awareness score upwards slightly
            metrics.score = min(100, metrics.score + 5)
            
    # Reward gamification points
    user = db.query(User).filter(User.id == user_id).first()
    cert_code = None
    if passed and user:
        # Give points
        points_earned = 100 if score == 100 else 50
        user.points += points_earned
        
        # Check if already has certificate for this course, else issue one
        has_cert = db.query(Certificate).filter(
            Certificate.course_id == assessment.course_id,
            Certificate.user_id == user_id
        ).first()
        
        if not has_cert:
            cert_code = f"CERT-{uuid.uuid4().hex[:8].upper()}-{assessment.course_id}"
            cert = Certificate(
                course_id=assessment.course_id,
                user_id=user_id,
                certificate_code=cert_code
            )
            db.add(cert)
            # Extra points for completion
            user.points += 200
            
    # Audit logging
    audit = AuditLog(
        user_id=user_id,
        action="Submit Quiz",
        details=f"User took quiz for assessment '{assessment.title}'. Score: {score}%, Passed: {passed}"
    )
    db.add(audit)
    db.commit()
    
    return {
        "score": score,
        "passed": passed,
        "completed_at": datetime.utcnow(),
        "certificate_code": cert_code
    }
