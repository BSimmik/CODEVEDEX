# EDR SOC Operator User Manual - SentinelAI

This manual walks through the daily workflow of a Security Operations Center (SOC) analyst utilizing SentinelAI EDR.

---

## 1. Initial Login & MFA Configuration

1. Open the SOC Administration Console at `http://localhost:3000`.
2. Input credentials:
   * **Email**: `admin@sentinelai.local`
   * **Password**: `SentinelAdmin2026!`
3. To secure your account:
   * Navigate to the **System Controls** tab on the left sidebar.
   * Locate the **MFA Setup** block.
   * Scan the displayed QR Code with Google Authenticator or Microsoft Authenticator.
   * Input the generated token code to confirm.
   * On subsequent logins, the console will require your MFA code.

---

## 2. Reviewing Endpoint Assets

* **System Health Dashboard**: Displays the average cyber posture score across the domain. Perfect score is 100, which reduces based on unresolved critical and high-severity threat logs.
* **Endpoints Inventory**: Click any active host to:
  * View IP and MAC addresses.
  * Audit active system services and startup schedules.
  * Query the live parent-child process tree (which highlights malicious shells running as child tasks).

---

## 3. Investigating Alerts & Requesting AI Diagnosis

1. When a process violates a rule or displays suspicious behavior, a new alert is generated.
2. Navigate to **Threat Alerts** tab.
3. Click the target alert to view details.
4. Press the **Request AI Incident Diagnosis** button.
5. The AI Threat Engine returns a structured security summary outlining:
   * Technical Explanation
   * Business Impact
   * Risk Assessment
   * Step-by-step Remediation Actions
6. Click **Create Incident** to open a formal SOC case or click **Resolve** once containment is complete.

---

## 4. Writing Detection Rules

1. Navigate to the **Detection Rules** tab.
2. Complete the **Add Behavioral Rule** form:
   * **Rule Category**: Select Process, Network, File, or Resource.
   * **Field**: e.g., choose `name` for process name checks, `remote_port` for connection port checks.
   * **Operator**: equals, contains, greater_than, less_than.
   * **Target Value**: e.g., `mimikatz.exe` or `4444`.
3. Save the rule. The backend engine begins monitoring incoming heartbeat telemetry matching these parameters.
