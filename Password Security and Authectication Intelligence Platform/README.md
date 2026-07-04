# Password Security & Authentication Intelligence Platform

An enterprise-grade full-stack cybersecurity application designed for password strength analysis, authentication security evaluation, policy audits, breach exposure checking, and cryptographic hashing benchmarks using ethical simulations.

## 🚀 Key Features

1. **User Management & RBAC**: Advanced user registration and login endpoints utilizing JWT authentication and Role-Based Access Control (RBAC) supporting standard roles (`Administrator`, `Security Analyst`, `Compliance Officer`, `Standard User`).
2. **Multi-Factor Authentication (MFA)**: App-based TOTP MFA generation (Google Authenticator / Authy compatible QR Codes) and validation.
3. **Password Strength Analyzer**: Analyzes length, entropy bits, character diversity, repeated elements, and keyboard pattern walks.
4. **Policy Auditor Engine**: Evaluates password configurations against industry compliance guidelines (NIST SP 800-63B, OWASP Top 10, and CIS Controls).
5. **Cryptographic Hashing Lab**: Educational dashboard demonstrating salting mechanics and performance metrics for MD5, SHA-1, SHA-256, SHA-512, bcrypt, scrypt, and Argon2id.
6. **Attack Simulation Lab**: Mathematical cracking simulation engine for educational training (Brute Force, Dictionary, Hybrid, Credential Stuffing, Password Spraying, and Rainbow Tables).
7. **Breached Checker (K-Anonymity)**: Securely checks password hashes against public leaks database using HaveIBeenPwned API via privacy-preserving prefix queries.
8. **Passkey & WebAuthn Demonstration**: Interactive FIDO2 client-authenticator-server protocol visual state-machine.
9. **Authentication Posture Scorer**: Ranks security index configurations from simple passwords up to enterprise-level hardware keys.
10. **AI Security Advisor**: LLM guidance chat client explaining cryptanalysis questions, with rule-based fail-safes.
11. **Reporting Suite**: Generates and downloads PDF, Excel, CSV, and JSON security audits.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons, Framer Motion, Recharts
- **Backend**: Python FastAPI, SQLAlchemy, PostgreSQL, Redis cache
- **Deployment**: Docker, Docker Compose, Kubernetes manifests
- **Testing**: pytest

---

## 🏃 Getting Started (Docker Compose)

To build and spin up the complete platform (Postgres, Redis, FastAPI, NextJS) in one command:

```bash
docker-compose up --build
```

### Gateway Endpoints:
- **Frontend Client**: `http://localhost:3000`
- **FastAPI Backend Server**: `http://localhost:8000`
- **Interactive REST API Docs**: `http://localhost:8000/api/v1/docs`

---

## 📁 Repository Layout
- `backend/`: FastAPI source codes, routers, services, database models, and test suites.
- `frontend/`: Next.js frontend pages, tailwind classes, dashboard, and labs.
- `kubernetes/`: Manifest configs (`manifests.yaml`) for deployments.
- `docker-compose.yml`: Global container setup maps.
