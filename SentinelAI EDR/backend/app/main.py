import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .db_init import init_db
from .routers import auth, endpoints, monitoring, alerts, incidents, reports, threat_intel, ai_analysis, rules, audit, config, websocket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("sentinel_main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Endpoint Security Monitoring & Threat Detection Gateway",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock down to dashboard domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(endpoints.router, prefix=settings.API_V1_STR)
app.include_router(monitoring.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(threat_intel.router, prefix=settings.API_V1_STR)
app.include_router(ai_analysis.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(config.router, prefix=settings.API_V1_STR)
app.include_router(websocket.router) # Websocket router mounted directly

@app.on_event("startup")
def on_startup():
    logger.info("Initializing database tables and defaults...")
    db = SessionLocal()
    try:
        init_db(db)
    except Exception as e:
        logger.error(f"Error during startup DB initialization: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SentinelAI EDR Gateway",
        "version": "1.0.0",
        "health": "healthy"
    }
