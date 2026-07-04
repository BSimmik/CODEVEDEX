from fastapi import APIRouter
from backend.app.schemas.schemas import BreachCheckRequest, BreachCheckResponse
from backend.app.services.breach_service import check_password_breach

router = APIRouter(prefix="/breach", tags=["Breached Password Checker"])

@router.post("/check", response_model=BreachCheckResponse)
def check_breach(req: BreachCheckRequest):
    return check_password_breach(req.password)
