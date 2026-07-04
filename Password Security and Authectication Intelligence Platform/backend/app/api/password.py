from fastapi import APIRouter, Depends, Optional
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, PasswordAnalysis
from backend.app.schemas.schemas import PasswordRequest, PasswordAnalysisResponse
from backend.app.services.password_service import analyze_password_strength

router = APIRouter(prefix="/password", tags=["Password Analysis"])

@router.post("/analyze", response_model=PasswordAnalysisResponse)
def analyze_password(
    req: PasswordRequest, 
    db: Session = Depends(get_db),
    # Support optional authentication so anyone can test passwords
    current_user: Optional[User] = Depends(lambda: None)
):
    analysis = analyze_password_strength(req.password)
    
    # Save to history if logged in
    if current_user:
        db_analysis = PasswordAnalysis(
            user_id=current_user.id,
            length=analysis.length,
            entropy=analysis.entropy,
            score=analysis.score,
            classification=analysis.classification,
            repeated_chars=analysis.repeated_chars,
            has_dictionary_words=analysis.has_dictionary_words,
            keyboard_patterns=analysis.keyboard_patterns
        )
        db.add(db_analysis)
        db.commit()
        
    return analysis
