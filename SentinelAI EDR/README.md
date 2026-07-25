# SentinelAI EDR – Endpoint Security Monitoring & Threat Detection Platform

SentinelAI EDR is a defensive, full-stack enterprise endpoint detection and response platform. It monitors systems for suspicious activities, runs behavioral rule comparisons, aggregates endpoint health status, audits keylogger hooks safely without keylogging, and coordinates automated AI analysis.

---

## Technical Stack Overview

* **Frontend Console**: Next.js 15, React 19, TypeScript, TailwindCSS, Recharts, Framer Motion
* **Backend Gateway**: FastAPI, SQLAlchemy (PostgreSQL engine), Redis (WebSocket manager, cache)
* **EDR Endpoint Agent**: Cross-platform Python Daemon (supports Windows & Linux)
* **AI Analysis Layer**: OpenAI-compatible API interface with offline fallback expertise

---

## Platform Layout

```
.
├── backend/                  # FastAPI service gateway
│   ├── app/                  # Application source
│   │   ├── auth/             # JWT & MFA TOTP security routines
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── repositories/     # Database CRUD Repositories
│   │   ├── services/         # Rule check, posture, AI & reporting engines
│   │   ├── schemas/          # Pydantic typing validators
│   │   └── routers/          # REST & WebSocket API Routers
│   ├── tests/                # Pytest suites
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # SOC Administration Console
│   ├── app/                  # Next.js App Router (Layouts & Pages)
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   └── package.json
├── agent/                    # Endpoint monitoring Python daemon
│   ├── sentinel_agent.py     # Heartbeat scheduler & watcher
│   ├── collector.py          # Process, services, networking collector
│   └── keylogger_detector.py # Hook & accessibility auditor
├── kubernetes/               # Orchestration manifests
│   └── manifests.yaml
├── docker-compose.yml        # Docker composition file
└── README.md                 # Project README
```

---

## Quickstart

### Option A: Docker Compose

Start the PostgreSQL, Redis, backend service, and Next.js frontend console containers:

```bash
docker-compose up --build
```

### Option B: Automated Local Run (Offline, No Docker)

To run the entire platform completely locally and offline without Docker (automatically provisions a virtual environment, installs backend/agent dependencies, builds Node dependencies, sets up a local SQLite database, and runs the frontend console, backend gateway, and agent simulator concurrently):

```bash
python run_local.py
```

### Accessing the Platform

Once the chosen service option is running:
* **SOC Console**: `http://localhost:3000` (Default Credentials: `admin@sentinelai.local` | `SentinelAdmin2026!`)
* **API Documentation Swagger**: `http://localhost:8000/docs`
* **Agent Simulation sandbox**: If you started via Docker, run a local agent manually:
  ```bash
  cd agent
  pip install -r requirements.txt
  python sentinel_agent.py --simulate-malware --simulate-network
  ```
  *(If you started via Option B, the agent is already running and simulating alerts automatically!)*
