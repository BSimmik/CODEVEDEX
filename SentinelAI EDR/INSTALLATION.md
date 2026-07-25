# Installation Guide - SentinelAI EDR

This document outlines the detailed steps required to compile, install, and run SentinelAI EDR backend, frontend, database, and client monitoring agents.

---

## Prerequisites

1. **Docker & Docker Compose**: Ensure Docker Desktop is installed.
2. **Python 3.11+**: Needed for running the agent locally.
3. **Node.js 20+ & npm**: Needed if you plan to compile the Next.js app locally outside Docker.

---

## Method 1: Docker Compose (Recommended)

To run the entire platform including database schema migrations:

1. Clone the codebase and navigate to the project directory.
2. Build and start all services:
   ```bash
   docker-compose up --build
   ```
3. Once running:
   * Frontend: `http://localhost:3000`
   * Backend APIs: `http://localhost:8000`
   * Swagger Docs: `http://localhost:8000/docs`

---

## Method 2: Automated Local Offline Run (No Docker, Zero Configuration)

This is the easiest way to run the entire platform completely locally and offline. It automatically sets up Python virtual environments, installs requirements for both backend and agent, runs `npm install` for the Next.js frontend, creates/seeds a local SQLite database (`backend/sentinel_edr.db`), and boots up all services in parallel.

1. Clone the codebase and navigate to the project directory.
2. Execute the local orchestrator:
   ```bash
   python run_local.py
   ```
3. Once running:
   * **SOC Console**: `http://localhost:3000` (Default Credentials: `admin@sentinelai.local` | `SentinelAdmin2026!`)
   * **API Swagger Docs**: `http://localhost:8000/docs`
   * **Agent Simulator**: Runs automatically in the background, feeding telemetry to the console dashboard.

---

## Method 3: Local Manual Setup

### 1. Database (PostgreSQL)
Ensure you have PostgreSQL running:
* Port: `5432`
* Database: `sentinel_edr`
* Username: `sentinel_admin`
* Password: `sentinel_password_2026`

### 2. Backend (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database initialization and seeder:
   ```bash
   python app/db_init.py
   ```
5. Launch FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Frontend (Next.js)
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run development web server:
   ```bash
   npm run dev
   ```

---

## EDR Agent Installation

To register an endpoint node:

1. Copy the `agent/` folder to the target endpoint system.
2. Run standard pip requirements installations:
   ```bash
   cd agent
   pip install -r requirements.txt
   ```
3. Run the monitoring agent daemon pointing to the backend host:
   ```bash
   python sentinel_agent.py --backend http://<backend_ip>:8000 --interval 10
   ```
   *(On Windows, run this in an administrative PowerShell terminal to query full service logs).*
