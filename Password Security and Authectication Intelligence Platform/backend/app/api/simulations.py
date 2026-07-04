from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import SimulationResult
from backend.app.schemas.schemas import SimulationRequest, SimulationResponse
from backend.app.services.simulation_service import run_simulated_attack

router = APIRouter(prefix="/simulations", tags=["Attack Simulation Lab"])

@router.post("/run", response_model=SimulationResponse)
def run_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    result = run_simulated_attack(req)
    
    # Store history for dashboard trend plotting
    db_sim = SimulationResult(
        attack_type=result.attack_type,
        search_space=result.search_space,
        success_probability=result.success_probability,
        estimated_time_seconds=result.estimated_time_seconds,
        steps_logged=[s.dict() for s in result.steps_logged]
    )
    db.add(db_sim)
    db.commit()
    
    return result
