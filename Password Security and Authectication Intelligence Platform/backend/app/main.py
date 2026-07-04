from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.logging import setup_logging
from backend.app.models.models import Role

# Import all routers
from backend.app.api.auth import router as auth_router
from backend.app.api.password import router as password_router
from backend.app.api.policy import router as policy_router
from backend.app.api.hashing import router as hashing_router
from backend.app.api.simulations import router as simulations_router
from backend.app.api.breach import router as breach_router
from backend.app.api.ai_advisor import router as ai_router
from backend.app.api.auth_security import router as auth_sec_router
from backend.app.api.generator import router as generator_router
from backend.app.api.reports import router as reports_router
from backend.app.api.audit import router as audit_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Initialize database schemas
logger.info("Initializing database tables...")
Base.metadata.create_all(bind=engine)

# Seed roles
db = SessionLocal()
try:
    default_roles = ["Administrator", "Security Analyst", "Compliance Officer", "Standard User"]
    for role_name in default_roles:
        existing = db.query(Role).filter(Role.name == role_name).first()
        if not existing:
            new_role = Role(name=role_name)
            db.add(new_role)
    db.commit()
    logger.info("Seeded default roles successfully.")
except Exception as e:
    logger.error(f"Failed to seed roles: {e}")
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware for Security Headers & Simple Rate Limiting
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    # Process request
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Add performance monitoring headers
    response.headers["X-Process-Time"] = str(process_time)
    
    # Secure Headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server security event or configuration issue occurred."}
    )

# Include v1 REST routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(password_router, prefix=settings.API_V1_STR)
app.include_router(policy_router, prefix=settings.API_V1_STR)
app.include_router(hashing_router, prefix=settings.API_V1_STR)
app.include_router(simulations_router, prefix=settings.API_V1_STR)
app.include_router(breach_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(auth_sec_router, prefix=settings.API_V1_STR)
app.include_router(generator_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_docs": f"{settings.API_V1_STR}/docs"
    }
