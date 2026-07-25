from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.schemas import EndpointResponse, ProcessResponse
from ..repositories.repositories import EndpointRepository, ProcessRepository, AuditLogRepository
from ..auth.rbac import allow_all_authenticated, allow_admin
from ..models.models import User, Process

router = APIRouter(prefix="/endpoints", tags=["Endpoints"])

@router.get("/", response_model=List[EndpointResponse])
def get_endpoints(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    endpoints = EndpointRepository.list(db)
    if status_filter:
        endpoints = [e for e in endpoints if e.status.lower() == status_filter.lower()]
    return endpoints

@router.get("/{endpoint_id}", response_model=EndpointResponse)
def get_endpoint_details(
    endpoint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    endpoint = EndpointRepository.get_by_id(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return endpoint

@router.get("/{endpoint_id}/processes", response_model=List[ProcessResponse])
def get_endpoint_processes(
    endpoint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    # Verify endpoint exists
    endpoint = EndpointRepository.get_by_id(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
        
    return ProcessRepository.get_by_endpoint(db, endpoint_id)

@router.delete("/{endpoint_id}")
def delete_endpoint(
    endpoint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    endpoint = EndpointRepository.get_by_id(db, endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    hostname = endpoint.hostname
    db.delete(endpoint)
    db.commit()

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="ENDPOINT_DELETED",
        target=endpoint_id,
        details=f"Decommissioned endpoint assets for host '{hostname}'"
    )
    return {"status": "success", "message": f"Endpoint {hostname} deleted successfully"}
