from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import HashBenchmark
from backend.app.schemas.schemas import HashRequest, HashResponse, BenchmarkResponse
from backend.app.services.hashing_service import generate_hash_demo, run_cryptographic_benchmarks

router = APIRouter(prefix="/hashing", tags=["Hashing Lab"])

@router.post("/generate", response_model=HashResponse)
def generate_hash_endpoint(req: HashRequest):
    return generate_hash_demo(
        plain_text=req.plain_text,
        algorithm=req.algorithm,
        salt=req.salt,
        work_factor=req.work_factor
    )

@router.get("/benchmark", response_model=BenchmarkResponse)
def run_benchmark_endpoint(db: Session = Depends(get_db)):
    results = run_cryptographic_benchmarks()
    
    # Store benchmark statistics into Database for analytics
    for res in results:
        db_bench = HashBenchmark(
            algorithm=res.algorithm,
            iterations=res.iterations,
            execution_time_ms=res.execution_time_ms,
            memory_used_kb=res.memory_used_kb,
            security_level=res.security_level
        )
        db.add(db_bench)
    db.commit()
    
    return BenchmarkResponse(benchmarks=results)
