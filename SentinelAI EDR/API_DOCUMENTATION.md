# API Documentation - SentinelAI EDR Gateway

The SentinelAI EDR REST and WebSocket APIs run on port `8000`. Interactive documentation is available out-of-the-box at `http://localhost:8000/docs` via Swagger UI.

---

## Authentication Endpoints

### 1. User Registration
* **Endpoint**: `POST /api/v1/auth/register`
* **Request Body**:
  ```json
  {
    "email": "analyst@sentinelai.local",
    "password": "SecurePassword123!",
    "role_name": "Security Analyst"
  }
  ```
* **Response**: `200 OK` (User details without password hashes).

### 2. User Authentication
* **Endpoint**: `POST /api/v1/auth/login`
* **Request Body**:
  ```json
  {
    "email": "analyst@sentinelai.local",
    "password": "SecurePassword123!"
  }
  ```
* **Response**:
  ```json
  {
    "access_token": "eyJhbG...",
    "token_type": "Bearer",
    "mfa_required": false
  }
  ```

### 3. MFA Enrollment
* **Endpoint**: `POST /api/v1/auth/mfa/setup`
* **Headers**: `Authorization: Bearer <token>`
* **Response**: Generates a standard base32 MFA secret and otpauth URI.

---

## EDR Monitoring & Telemetry

### 1. Agent Heartbeat Gateway
* **Endpoint**: `POST /api/v1/monitoring/heartbeat`
* **Request Body**: Holds endpoint context metadata, running processes lists, network connections, file status changes, and keylogger audit metrics.
* **Response**: Recalculates threat levels and broadcasts updates over WebSockets.

### 2. WebSocket Terminal Broadcasts
* **Endpoint**: `WS /ws/soc`
* **Protocol**: WebSockets
* **Data Streams**: Streams dynamic events: `TELEMETRY_HEARTBEAT`, `NEW_ALERT`.

---

## Threat & Incident Management

### 1. Fetch Alert Log
* **Endpoint**: `GET /api/v1/alerts/`
* **Query Parameters**: `status_filter` (New, In-Progress, Resolved)
* **Headers**: `Authorization: Bearer <token>`

### 2. Trigger AI Diagnostics
* **Endpoint**: `POST /api/v1/ai/analyze/{alert_id}`
* **Response**:
  ```json
  {
    "technical_explanation": "Mimikatz dumping process activity...",
    "business_impact": "Loss of corporate keys...",
    "risk_assessment": "Critical severity...",
    "remediation_guidance": "Isolate the network endpoint..."
  }
  ```
