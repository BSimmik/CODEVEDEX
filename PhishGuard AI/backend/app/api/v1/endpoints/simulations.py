from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import SimulationCreate, SimulationResponse, SimulationUpdate
from app.services import simulation as simulation_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/scenarios")
def list_scenarios(current_user: User = Depends(get_current_user)):
    # Output scenario definitions for frontend to list
    return [
        {"name": name, **info}
        for name, info in simulation_service.SCENARIOS.items()
    ]

@router.post("/start")
def start_simulation(
    sim_in: SimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure students can only trigger for themselves or trainers can trigger campaigns
    if current_user.role not in ["Super Admin", "Security Trainer"] and current_user.id != sim_in.user_id:
        raise HTTPException(status_code=403, detail="Forbidden to trigger simulations for other users")
    return simulation_service.create_simulation_run(db, sim_in)

@router.put("/{sim_id}/interact", response_model=SimulationResponse)
def interact_simulation(
    sim_id: int,
    interaction: SimulationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return simulation_service.record_interaction(db, sim_id, interaction)

@router.get("/me", response_model=list[SimulationResponse])
def get_my_simulations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return simulation_service.get_user_simulations(db, current_user.id)
