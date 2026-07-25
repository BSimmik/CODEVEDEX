"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, AlertTriangle, Cpu, Network, FileText, Settings, Users, 
  Search, CheckCircle, Clock, Server, Play, Plus, Trash2, Download, 
  UserCheck, Lock, Check, RefreshCw, Info, HelpCircle, HardDrive, Terminal
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

// Interfaces
interface Alert {
  id: number;
  endpoint_id: string;
  hostname: string;
  alert_type: string;
  title: string;
  description: string;
  threat_score: number;
  severity: string;
  risk_explanation: string;
  status: string;
  process_name?: string;
  process_pid?: number;
  created_at: string;
}

interface Endpoint {
  id: string;
  hostname: string;
  ip_address: string;
  mac_address: string;
  os_name: string;
  os_version: string;
  status: string;
  health_status: string;
  posture_score: number;
  last_seen: string;
}

interface Incident {
  id: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  assigned_to_id?: number;
  resolution_notes?: string;
  created_at: string;
  alerts: number[];
}

interface DetectionRule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  severity: string;
  rule_group: string;
  is_active: boolean;
  details: {
    field: string;
    operator: string;
    value: string | number;
  };
}

export default function MainConsole() {
  // Authentication & Session States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState<"login" | "mfa" | "register">("login");
  const [email, setEmail] = useState("admin@sentinelai.local");
  const [password, setPassword] = useState("SentinelAdmin2026!");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaSecret, setMfaSecret] = useState("KNEVGR2EOR3HK2LM");
  const [userRole, setUserRole] = useState<"Administrator" | "Security Analyst" | "SOC Analyst" | "Auditor" | "Viewer">("Administrator");
  const [jwtToken, setJwtToken] = useState("");
  
  // Connection / App Mode
  const [connectionMode, setConnectionMode] = useState<"Live" | "Demo">("Demo");
  const [wsStatus, setWsStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000");

  // Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "endpoints" | "alerts" | "incidents" | "rules" | "audit" | "reports" | "system">("dashboard");

  // Core Data Entities
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [postureScore, setPostureScore] = useState(90);
  const [postureDeductions, setPostureDeductions] = useState<string[]>([]);
  const [postureRecommendations, setPostureRecommendations] = useState<any[]>([]);

  // Telemetry Simulation Parameters
  const [isSimulatingAgent, setIsSimulatingAgent] = useState(true);

  // Detail Modals
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
  const [isAnalyzingAlert, setIsAnalyzingAlert] = useState(false);

  // Form states for rule creation
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleType, setNewRuleType] = useState("Process");
  const [newRuleSeverity, setNewRuleSeverity] = useState("High");
  const [newRuleField, setNewRuleField] = useState("name");
  const [newRuleOperator, setNewRuleOperator] = useState("equals");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");

  // Recharts CSR state
  const [isMounted, setIsMounted] = useState(false);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // Seed baseline data for Demo Mode
  useEffect(() => {
    setIsMounted(true);
    // Baseline Endpoints
    setEndpoints([
      { id: "e1", hostname: "SOC-WIN11-SYS", ip_address: "192.168.1.12", mac_address: "00:1A:2B:3C:4D:5E", os_name: "Windows", os_version: "11 Enterprise", status: "Online", health_status: "Healthy", posture_score: 95, last_seen: new Date().toISOString() },
      { id: "e2", hostname: "SOC-LINUX-SRV", ip_address: "192.168.1.50", mac_address: "00:1A:2B:3C:4D:9F", os_name: "Linux", os_version: "Ubuntu 22.04 LTS", status: "Online", health_status: "Warning", posture_score: 75, last_seen: new Date().toISOString() },
      { id: "e3", hostname: "FINANCE-DESKTOP", ip_address: "192.168.3.15", mac_address: "00:1A:2B:3C:99:AA", os_name: "Windows", os_version: "10 Pro", status: "Online", health_status: "Critical", posture_score: 45, last_seen: new Date().toISOString() },
      { id: "e4", hostname: "CEO-MACBOOK", ip_address: "192.168.1.150", mac_address: "00:1A:2B:99:88:77", os_name: "Darwin", os_version: "macOS Sonoma", status: "Offline", health_status: "Healthy", posture_score: 100, last_seen: new Date(Date.now() - 3600000).toISOString() }
    ]);

    // Baseline Alerts
    setAlerts([
      {
        id: 1,
        endpoint_id: "e3",
        hostname: "FINANCE-DESKTOP",
        alert_type: "Process",
        title: "Credential Dumping Activity",
        description: "Execution of mimikatz.exe privilege::debug sekurlsa::logonpasswords cmdline",
        threat_score: 95,
        severity: "Critical",
        risk_explanation: "Processes attempting privilege expansion and dumping credentials memory target identity vectors. Standard hacker signature.",
        status: "New",
        process_name: "mimikatz.exe",
        process_pid: 5312,
        created_at: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 2,
        endpoint_id: "e2",
        hostname: "SOC-LINUX-SRV",
        alert_type: "Network",
        title: "Reverse Shell Network Port",
        description: "Active outbound socket connection to remote host port 4444.",
        threat_score: 80,
        severity: "High",
        risk_explanation: "Outbound connections to target port 4444 bypass boundary firewalls creating backdoor tunnels.",
        status: "In-Progress",
        process_name: "nc",
        process_pid: 2901,
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 3,
        endpoint_id: "e3",
        hostname: "FINANCE-DESKTOP",
        alert_type: "Keylogger",
        title: "Excessive Keyboard Hooking Detected",
        description: "Process monitor flags excessive low-level hooking APIs matching keylogger templates.",
        threat_score: 85,
        severity: "High",
        risk_explanation: "Low-level Win32 hooks (WH_KEYBOARD_LL) allow unprivileged programs to hijack keystrokes. NO KEYSTROKES WERE CAPTURED.",
        status: "New",
        process_name: "unknown_hook_injector.exe",
        process_pid: 9022,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]);

    // Baseline Incidents
    setIncidents([
      { id: 101, title: "Finance Host Credential Compromise", description: "Credential dumping and keylogger signals detected consecutively on Finance Desktop. Potential active attacker access.", status: "Open", severity: "Critical", created_at: new Date(Date.now() - 600000).toISOString(), alerts: [1, 3] }
    ]);

    // Baseline Rules
    setRules([
      { id: 1, name: "Credential Dumping Activity", description: "Detects mimikatz.exe", rule_type: "Process", severity: "Critical", rule_group: "Credential Access", is_active: true, details: { field: "name", operator: "equals", value: "mimikatz.exe" } },
      { id: 2, name: "Reverse Shell Network Port", description: "Detects port 4444 connections", rule_type: "Network", severity: "High", rule_group: "Command and Control", is_active: true, details: { field: "remote_port", operator: "equals", value: 4444 } },
      { id: 3, name: "Startup Folder Executable Drop", description: "Detects drops in startup folder", rule_type: "File", severity: "Critical", rule_group: "Persistence", is_active: true, details: { field: "path", operator: "contains", value: "Startup" } }
    ]);

    // Baseline Audit logs
    setAuditLogs([
      { id: 1, user_email: "admin@sentinelai.local", action: "USER_LOGIN", target: "admin@sentinelai.local", details: "Successful login (MFA bypassed)", timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 2, user_email: "admin@sentinelai.local", action: "RULE_CREATED", target: "Reverse Shell Network Port", details: "Created rule of type Network", timestamp: new Date(Date.now() - 7100000).toISOString() }
    ]);

    // Baseline Recommendations
    setPostureRecommendations([
      { control: "Multi-Factor Authentication (MFA)", impact: "High", suggestion: "MFA is disabled for user 'admin@sentinelai.local'. Turn on MFA configuration." },
      { control: "Isolation Rules", impact: "Critical", suggestion: "Finance Desktop has a Critical risk score. Isolate from local domain subnet." },
      { control: "Endpoint Software Update", impact: "Low", suggestion: "Upgrade Ubuntu server to version 24.04 to fix kernel CVE patches." }
    ]);
    setPostureDeductions([
      "MFA is not enabled on active Administrator profile.",
      "1 endpoint is exhibiting Critical health warnings.",
      "1 endpoint is exhibiting Warning health alerts."
    ]);
  }, []);

  // Try to connect to backend on mount
  useEffect(() => {
    testBackendConnection();
  }, [apiBaseUrl]);

  const testBackendConnection = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/`);
      if (res.ok) {
        const data = await res.json();
        setConnectionMode("Live");
        connectWebSocket();
        fetchLiveBackendData();
      } else {
        setConnectionMode("Demo");
      }
    } catch (e) {
      setConnectionMode("Demo");
      setWsStatus("Disconnected");
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) wsRef.current.close();
    
    // Map http url to ws url
    const wsUrl = apiBaseUrl.replace("http://", "ws://").replace("https://", "wss://") + "/ws/soc";
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("Connected");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_ALERT") {
          // Add incoming alert
          const newAlert: Alert = {
            id: data.alert.id,
            endpoint_id: data.alert.endpoint_id,
            hostname: data.alert.hostname,
            alert_type: data.alert.alert_type,
            title: data.alert.title,
            description: "Live real-time EDR hit: " + data.alert.title,
            threat_score: data.alert.threat_score,
            severity: data.alert.severity,
            risk_explanation: "This alert was streamed live from the endpoint agent. Investigating active process hooks and sockets.",
            status: "New",
            created_at: data.alert.created_at
          };
          setAlerts(prev => [newAlert, ...prev]);
          addAuditLogEntry("ALERT_STREAMED", newAlert.title, `Live telemetry flagged alert on host ${newAlert.hostname}`);
        } else if (data.type === "TELEMETRY_HEARTBEAT") {
          // Update endpoint posture
          setEndpoints(prev => prev.map(e => {
            if (e.id === data.endpoint_id) {
              return {
                ...e,
                posture_score: data.posture_score,
                health_status: data.health_status,
                last_seen: new Date().toISOString()
              };
            }
            return e;
          }));
        }
      };

      ws.onclose = () => {
        setWsStatus("Disconnected");
      };
    } catch (e) {
      setWsStatus("Disconnected");
    }
  };

  const fetchLiveBackendData = async () => {
    // Standard authenticated fetches if token is present
    if (!jwtToken) return;
    try {
      const headers = { "Authorization": `Bearer ${jwtToken}` };
      
      const resE = await fetch(`${apiBaseUrl}/api/v1/endpoints/`, { headers });
      if (resE.ok) setEndpoints(await resE.ok ? await resE.json() : []);

      const resA = await fetch(`${apiBaseUrl}/api/v1/alerts/`, { headers });
      if (resA.ok) setAlerts(await resA.json());

      const resI = await fetch(`${apiBaseUrl}/api/v1/incidents/`, { headers });
      if (resI.ok) setIncidents(await resI.json());

      const resR = await fetch(`${apiBaseUrl}/api/v1/rules/`, { headers });
      if (resR.ok) setRules(await resR.json());

      const resAu = await fetch(`${apiBaseUrl}/api/v1/audit/logs`, { headers });
      if (resAu.ok) setAuditLogs(await resAu.json());

      // Fetch posture score
      const resP = await fetch(`${apiBaseUrl}/api/v1/config/security-audit/posture`, { headers });
      if (resP.ok) {
        const posture = await resP.json();
        setPostureScore(posture.overall_posture_score);
        setPostureDeductions(posture.deductions_flagged);
        setPostureRecommendations(posture.recommendations);
      }
    } catch (e) {
      console.error("Failed to fetch live API data", e);
    }
  };

  const addAuditLogEntry = (action: string, target: string, details: string) => {
    const entry = {
      id: Date.now(),
      user_email: email,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // Auth Submit Action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionMode === "Demo") {
      if (authStep === "login") {
        setAuthStep("mfa");
      } else if (authStep === "mfa") {
        setIsAuthenticated(true);
        addAuditLogEntry("USER_LOGIN", email, "Demo login successful");
      } else if (authStep === "register") {
        setAuthStep("login");
      }
      return;
    }

    // Live mode authentication API calls
    try {
      if (authStep === "login") {
        const res = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.mfa_required) {
            setAuthStep("mfa");
          } else {
            setJwtToken(data.access_token);
            setIsAuthenticated(true);
            // Decode role dynamically
            if (data.user) {
              // Get actual role name from seeded mapping if user has role
              const roleName = data.user.role?.name || "Administrator";
              setUserRole(roleName);
            }
            fetchLiveBackendData();
          }
        } else {
          alert("Login credentials failed.");
        }
      } else if (authStep === "mfa") {
        const res = await fetch(`${apiBaseUrl}/api/v1/auth/mfa/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: mfaToken })
        });
        if (res.ok) {
          const data = await res.json();
          setJwtToken(data.access_token);
          setIsAuthenticated(true);
          fetchLiveBackendData();
        } else {
          alert("Invalid MFA token.");
        }
      } else if (authStep === "register") {
        const res = await fetch(`${apiBaseUrl}/api/v1/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role_name: userRole })
        });
        if (res.ok) {
          alert("Account registered successfully. Proceeding to login.");
          setAuthStep("login");
        } else {
          const err = await res.json();
          alert(`Registration failed: ${err.detail}`);
        }
      }
    } catch (err) {
      alert("Error communicating with API endpoint.");
    }
  };

  // Perform AI threat interpretation
  const handleAIThreatAnalysis = async (alert: Alert) => {
    setIsAnalyzingAlert(true);
    setAiAnalysis(null);
    if (connectionMode === "Demo") {
      // Simulate network request delay
      setTimeout(() => {
        // Fetch simulated AI responses based on keywords
        let analysis = {
          title: alert.title,
          severity: alert.severity,
          technical_explanation: "SentinelAI EDR identified low-level API queries accessing system processes key maps. This behavior maps closely to Input Capture (T1056) tactics.",
          business_impact: "Unauthorized capture of corporate credentials, proprietary systems command inputs, and core communications.",
          risk_assessment: "High severity compromise window. 85% analytical confidence. Target execution matches rogue keystroke hook loops.",
          remediation_guidance: "1. Terminate process with PID " + alert.process_pid + "\n2. Isolate network host " + alert.hostname + "\n3. Change user credentials.\n4. Enable kernel security audits.",
          model_used: "SentinelAI-Local-LLM (Simulation)"
        };
        if (alert.title.includes("Credential")) {
          analysis.technical_explanation = "Detected execution of Mimikatz. Mimikatz accesses LSASS memory structures to extract plaintext local accounts and NTLM credentials.";
          analysis.business_impact = "Provides administrative level lateral movement. Complete domain environment compromise vector.";
          analysis.remediation_guidance = "1. Block executing hash across the enterprise.\n2. Revoke active administrative tokens.\n3. Turn on LSA Protected Mode.";
        }
        setAiAnalysis(analysis);
        setIsAnalyzingAlert(false);
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/ai/analyze/${alert.id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      if (res.ok) {
        setAiAnalysis(await res.json());
      } else {
        alert("AI API analysis failed.");
      }
    } catch (e) {
      alert("Failed to contact AI engine.");
    } finally {
      setIsAnalyzingAlert(false);
    }
  };

  // CRUD Rule Actions
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleValue || !newRuleName) {
      alert("Please fill in Rule Name and Target Value fields");
      return;
    }

    // Role verification (RBAC Simulation/Enforcement)
    if (userRole === "Viewer" || userRole === "Auditor") {
      alert("Access Denied: Your assigned role does not allow modifying detection rules");
      return;
    }

    const payload = {
      name: newRuleName,
      description: newRuleDesc,
      rule_type: newRuleType,
      severity: newRuleSeverity,
      rule_group: "Custom EDR Rules",
      details: {
        field: newRuleField,
        operator: newRuleOperator,
        value: newRuleValue
      }
    };

    if (connectionMode === "Demo") {
      const customRule: DetectionRule = {
        id: Date.now(),
        ...payload,
        is_active: true
      };
      setRules(prev => [...prev, customRule]);
      addAuditLogEntry("RULE_CREATED", newRuleName, `Added detection rule targeting ${newRuleField} matches`);
      alert("Custom rule created in simulation console!");
      resetRuleForm();
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/rules/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Rule registered on backend engine!");
        resetRuleForm();
        fetchLiveBackendData();
      } else {
        alert("Failed to submit rule.");
      }
    } catch (e) {
      alert("Error submitting custom rule.");
    }
  };

  const resetRuleForm = () => {
    setNewRuleName("");
    setNewRuleDesc("");
    setNewRuleValue("");
  };

  const handleDeleteRule = async (id: number) => {
    if (userRole === "Viewer" || userRole === "Auditor") {
      alert("Access Denied: Your role does not allow deleting rules");
      return;
    }

    if (connectionMode === "Demo") {
      setRules(prev => prev.filter(r => r.id !== id));
      addAuditLogEntry("RULE_DELETED", String(id), "Deleted custom rule");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/rules/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${jwtToken}` }
      });
      if (res.ok) {
        fetchLiveBackendData();
      }
    } catch (e) {
      alert("Error deleting rule.");
    }
  };

  const toggleRuleActive = async (rule: DetectionRule) => {
    if (userRole === "Viewer" || userRole === "Auditor") {
      alert("Access Denied");
      return;
    }

    if (connectionMode === "Demo") {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
      return;
    }

    try {
      await fetch(`${apiBaseUrl}/api/v1/rules/${rule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ is_active: !rule.is_active })
      });
      fetchLiveBackendData();
    } catch (e) {
      alert("Error updating rule status");
    }
  };

  // Demo Trigger Simulator (Endpoint Agent Actions in Dashboard)
  const triggerDemoAgentSimulation = (type: "mimikatz" | "keylogger" | "network" | "file") => {
    addAuditLogEntry("AGENT_SIMULATION_TRIGGER", type.toUpperCase(), "Simulated telemetry anomaly injected");
    
    if (type === "mimikatz") {
      const newAlert: Alert = {
        id: Date.now(),
        endpoint_id: "e1",
        hostname: "SOC-WIN11-SYS",
        alert_type: "Process",
        title: "Credential Dumping Activity",
        description: "Anomalous process executing mimikatz.exe to grab raw SAM hashes.",
        threat_score: 95,
        severity: "Critical",
        risk_explanation: "Local LSASS memory dumping indicates privilege escalation attempts by malicious entities.",
        status: "New",
        process_name: "mimikatz.exe",
        process_pid: 8099,
        created_at: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      setPostureScore(prev => Math.max(15, prev - 30));
    } else if (type === "keylogger") {
      const newAlert: Alert = {
        id: Date.now(),
        endpoint_id: "e1",
        hostname: "SOC-WIN11-SYS",
        alert_type: "Keylogger",
        title: "Excessive Keyboard Hooking Detected",
        description: "Win32 DLL SetWindowsHookEx monitoring logged 45 input calls.",
        threat_score: 85,
        severity: "High",
        risk_explanation: "Persistent low-level keyboard listeners hook into raw input states. SentinelAI logs behavior. NO KEYSTROKES WERE INTERCEPTED.",
        status: "New",
        process_name: "win_hook_helper.exe",
        process_pid: 6112,
        created_at: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      setPostureScore(prev => Math.max(15, prev - 20));
    } else if (type === "network") {
      const newAlert: Alert = {
        id: Date.now(),
        endpoint_id: "e2",
        hostname: "SOC-LINUX-SRV",
        alert_type: "Network",
        title: "Reverse Shell Network Port",
        description: "Atypical connection outbound from /usr/bin/python to C2 server port 4444.",
        threat_score: 90,
        severity: "High",
        risk_explanation: "Outbound socket streams on port 4444 match default shell configurations.",
        status: "New",
        process_name: "python3",
        process_pid: 1400,
        created_at: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      setPostureScore(prev => Math.max(15, prev - 20));
    } else if (type === "file") {
      const newAlert: Alert = {
        id: Date.now(),
        endpoint_id: "e1",
        hostname: "SOC-WIN11-SYS",
        alert_type: "File",
        title: "Startup Folder Executable Drop",
        description: "File creation detected in Startup directory: payload.exe",
        threat_score: 95,
        severity: "Critical",
        risk_explanation: "Writing executables or registry keys to system Startup folders secures boot persistence.",
        status: "New",
        process_name: "explorer.exe",
        process_pid: 2200,
        created_at: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      setPostureScore(prev => Math.max(15, prev - 30));
    }
  };

  // Recharts Helper Chart Data
  const chartData = [
    { name: "00:00", threats: 1 },
    { name: "04:00", threats: 3 },
    { name: "08:00", threats: 2 },
    { name: "12:00", threats: 5 },
    { name: "16:00", threats: 4 },
    { name: "20:00", threats: alerts.length },
  ];

  const pieData = [
    { name: "Critical", value: alerts.filter(a => a.severity === "Critical").length, color: "#ef4444" },
    { name: "High", value: alerts.filter(a => a.severity === "High").length, color: "#f97316" },
    { name: "Medium", value: alerts.filter(a => a.severity === "Medium").length, color: "#eab308" },
    { name: "Low", value: alerts.filter(a => a.severity === "Low" || a.severity === "Informational").length, color: "#10b981" }
  ];

  const handleResolveAlert = (id: number) => {
    if (userRole === "Viewer") {
      alert("Access Denied: Viewers cannot change alert states");
      return;
    }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Resolved" } : a));
    // Improve posture score
    setPostureScore(prev => Math.min(100, prev + 15));
    addAuditLogEntry("ALERT_RESOLVED", String(id), "Analyst marked alert as resolved");
  };

  const handleCreateIncidentFromAlert = (alert: Alert) => {
    if (userRole === "Viewer") {
      alert("Access Denied");
      return;
    }
    const id = Date.now();
    const newInc: Incident = {
      id,
      title: `Incident: Investigation on ${alert.hostname}`,
      description: `Target alert: ${alert.title} - ${alert.description}`,
      status: "Open",
      severity: alert.severity,
      created_at: new Date().toISOString(),
      alerts: [alert.id]
    };
    setIncidents(prev => [newInc, ...prev]);
    // Link alert
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, incident_id: id, status: "In-Progress" } : a));
    addAuditLogEntry("INCIDENT_CREATED", alert.title, `Ticket created from alert ${alert.id}`);
    setActiveTab("incidents");
  };

  const handleUpdateIncidentStatus = (id: number, status: string) => {
    if (userRole === "Viewer") {
      alert("Access Denied");
      return;
    }
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    addAuditLogEntry("INCIDENT_STATUS_CHANGE", String(id), `Changed ticket status to ${status}`);
  };

  // Mock file exports (Module 15)
  const downloadReportFile = (type: "json" | "csv" | "html") => {
    addAuditLogEntry("REPORT_DOWNLOAD", type.toUpperCase(), "Exported security summary log");
    
    let content = "";
    let filename = `SentinelAI_Report_${Date.now()}`;
    if (type === "json") {
      content = JSON.stringify({
        report: "SentinelAI EDR Audit Log",
        posture_score: postureScore,
        active_endpoints: endpoints.length,
        total_alerts: alerts.length,
        timestamp: new Date().toISOString(),
        recommendations: postureRecommendations
      }, null, 2);
      filename += ".json";
    } else if (type === "csv") {
      content = "ID,Hostname,Alert Type,Title,Severity,Status\n" + 
        alerts.map(a => `${a.id},${a.hostname},${a.alert_type},"${a.title}",${a.severity},${a.status}`).join("\n");
      filename += ".csv";
    } else {
      content = `
        <html>
        <head><title>SentinelAI Security Posture Report</title></head>
        <body style="font-family:sans-serif; padding:30px; background:#080b11; color:#f8fafc;">
          <h1>SentinelAI EDR - Posture Report</h1>
          <p>Overall Security Score: <strong>${postureScore}/100</strong></p>
          <h2>Active Recommendations</h2>
          <ul>${postureRecommendations.map(r => `<li><strong>${r.control}:</strong> ${r.suggestion}</li>`).join("")}</ul>
        </body>
        </html>
      `;
      filename += ".html";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendering Functions
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-[#05070c]">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        {/* Animated Scanner Radar Line */}
        <div className="scanner-line"></div>

        <div className="w-full max-w-md p-8 rounded-xl glass-panel relative z-10 mx-4 border border-white/10">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-cyberBlue/10 rounded-full border border-cyberBlue/20 mb-3 animate-pulse">
              <Shield className="w-10 h-10 text-cyberBlue" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SentinelAI EDR</h1>
            <p className="text-xs text-slate-400 mt-1 text-center">
              Endpoint Security Monitoring & Threat Detection Platform
            </p>
          </div>

          <div className="flex justify-around mb-6 border-b border-white/5 pb-2">
            <button 
              onClick={() => { setAuthStep("login"); }}
              className={`pb-2 px-4 text-sm font-semibold transition-all ${authStep === "login" || authStep === "mfa" ? "text-cyberBlue border-b-2 border-cyberBlue" : "text-slate-400"}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthStep("register"); }}
              className={`pb-2 px-4 text-sm font-semibold transition-all ${authStep === "register" ? "text-cyberBlue border-b-2 border-cyberBlue" : "text-slate-400"}`}
            >
              Register Portal
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authStep !== "mfa" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyberBlue text-sm transition-all"
                  required
                />
              </div>
            )}

            {authStep === "login" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Account Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyberBlue text-sm transition-all"
                  required
                />
              </div>
            )}

            {authStep === "register" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Administrative Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyberBlue text-sm transition-all"
                  required
                />
                
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mt-3 mb-1">Select Default Role (Simulation Mode)</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyberBlue text-sm transition-all"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="SOC Analyst">SOC Analyst</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            )}

            {authStep === "mfa" && (
              <div className="space-y-3">
                <div className="p-3 bg-[#0d1527] border border-cyberBlue/10 rounded text-center">
                  <p className="text-xs text-cyberBlue font-medium">Multi-Factor Authentication Required</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter the code from your authenticator app. (Type <strong className="text-white">000000</strong> to test/bypass).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Verification Code</label>
                  <input 
                    type="text" 
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value)}
                    placeholder="e.g., 000000"
                    maxLength={6}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-2 text-center text-white focus:outline-none focus:border-cyberBlue text-base tracking-widest transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded text-sm transition-all flex items-center justify-center gap-2 mt-6"
            >
              {authStep === "mfa" ? <UserCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {authStep === "login" ? "Request Verification Token" : authStep === "mfa" ? "Authenticate Session" : "Confirm Registration"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 border-t border-white/5 pt-4 text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>Platform Mode:</span>
              <span className={`font-semibold ${connectionMode === "Live" ? "text-cyberGreen" : "text-cyberOrange"}`}>
                {connectionMode === "Live" ? "API Live Connected" : "Local Simulator Sandbox"}
              </span>
            </div>
            {connectionMode === "Live" && (
              <div className="flex justify-between">
                <span>API Endpoint:</span>
                <span className="font-mono text-[9px]">{apiBaseUrl}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#080b11] overflow-hidden text-slate-200">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0e17]/90 flex flex-col justify-between z-20">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Shield className="w-6 h-6 text-cyberBlue" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">SentinelAI</h2>
              <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">EDR Dashboard</span>
            </div>
          </div>

          {/* User Profile Info */}
          <div className="p-4 mx-3 my-4 bg-white/5 rounded-lg border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyberGreen animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-300 truncate">{email}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold bg-[#141b2c] px-2 py-0.5 rounded border border-cyberBlue/10">
                {userRole}
              </span>
              <span className="text-[9px] text-slate-400">{connectionMode} Mode</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <button 
              onClick={() => setActiveTab("dashboard")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "dashboard" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Cpu className="w-4 h-4" /> System Health Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("endpoints")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "endpoints" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Server className="w-4 h-4" /> Endpoints Inventory
            </button>
            <button 
              onClick={() => setActiveTab("alerts")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "alerts" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <AlertTriangle className="w-4 h-4" /> Threat Alerts
              {alerts.filter(a => a.status === "New").length > 0 && (
                <span className="ml-auto bg-cyberRed/20 text-cyberRed text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyberRed/20">
                  {alerts.filter(a => a.status === "New").length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("incidents")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "incidents" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <CheckCircle className="w-4 h-4" /> Incidents Board
            </button>
            <button 
              onClick={() => setActiveTab("rules")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "rules" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Shield className="w-4 h-4" /> Detection Rules
            </button>
            <button 
              onClick={() => setActiveTab("audit")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "audit" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Users className="w-4 h-4" /> Operations Audit
            </button>
            <button 
              onClick={() => setActiveTab("reports")} 
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${activeTab === "reports" ? "bg-gradient-to-r from-cyan-600/20 to-indigo-600/10 text-cyberBlue border border-cyan-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <FileText className="w-4 h-4" /> Security Reports
            </button>
          </nav>
        </div>

        {/* Configuration settings & logs toggle at base */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setActiveTab("system")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings className="w-4 h-4" /> System Controls
          </button>
          <div className="mt-3 text-[10px] text-slate-500 flex justify-between">
            <span>WebSocket:</span>
            <span className={`font-semibold ${wsStatus === "Connected" ? "text-cyberGreen" : "text-slate-500"}`}>
              {wsStatus}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* TOP BAR */}
        <header className="h-16 border-b border-white/5 bg-[#0b0e17]/50 backdrop-blur-md px-8 flex items-center justify-between z-10">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              {activeTab === "dashboard" && "SentinelAI Enterprise SOC Console"}
              {activeTab === "endpoints" && "Endpoint Security Inventories"}
              {activeTab === "alerts" && "Real-Time Threat Detection Log"}
              {activeTab === "incidents" && "SOC Incident Triaging Board"}
              {activeTab === "rules" && "EDR Behavioral Detection Rules"}
              {activeTab === "audit" && "Security Posture & Compliance Audit"}
              {activeTab === "reports" && "Executive Security Reports"}
              {activeTab === "system" && "Platform Operations & Connection Settings"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* RBAC Tester Dropdown */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Simulate Role:</span>
              <select 
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="bg-transparent text-xs text-cyberBlue font-bold focus:outline-none"
              >
                <option value="Administrator">Administrator</option>
                <option value="Security Analyst">Security Analyst</option>
                <option value="SOC Analyst">SOC Analyst</option>
                <option value="Auditor">Auditor</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            {/* Connection Switcher */}
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${connectionMode === "Live" ? "bg-cyberGreen animate-ping" : "bg-cyberOrange"}`}></span>
              <span className="font-semibold text-slate-300">{connectionMode} Mode</span>
            </div>
            
            {/* Signout */}
            <button 
              onClick={() => { setIsAuthenticated(false); setAuthStep("login"); }}
              className="text-xs bg-white/5 hover:bg-cyberRed/20 hover:text-cyberRed px-3 py-1 rounded border border-white/5 transition-all"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* TAB CONTENTS CONTAINER */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#080b11] relative">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Telemetry Simulator controls (for demo mode) */}
              {isSimulatingAgent && (
                <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20">
                      <Terminal className="w-5 h-5 text-cyberBlue" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">EDR Host Telemetry Simulator</h3>
                      <p className="text-xs text-slate-400">Inject security threats into the active platform to test automated alerting & posture logs.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => triggerDemoAgentSimulation("mimikatz")}
                      className="bg-cyberRed/10 hover:bg-cyberRed/20 text-cyberRed border border-cyberRed/20 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Execute mimikatz.exe
                    </button>
                    <button 
                      onClick={() => triggerDemoAgentSimulation("keylogger")}
                      className="bg-cyberOrange/10 hover:bg-cyberOrange/20 text-cyberOrange border border-cyberOrange/20 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Keylogger Global Hook
                    </button>
                    <button 
                      onClick={() => triggerDemoAgentSimulation("network")}
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Bind Port 4444
                    </button>
                    <button 
                      onClick={() => triggerDemoAgentSimulation("file")}
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" /> Drop Startup File
                    </button>
                  </div>
                </div>
              )}

              {/* OVERVIEW STATS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stat 1: Posture Score */}
                <div className="p-6 rounded-xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyberBlue/5 rounded-full blur-xl"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Posture</span>
                      <h2 className="text-3xl font-extrabold text-white mt-2">{postureScore}/100</h2>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${postureScore >= 85 ? "bg-cyberGreen/10 text-cyberGreen border-cyberGreen/20" : postureScore >= 60 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-cyberRed/10 text-cyberRed border-cyberRed/20"}`}>
                      {postureScore >= 85 ? "Optimal" : postureScore >= 60 ? "Warning" : "Critical"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Real-time system health evaluation.</span>
                  </div>
                </div>

                {/* Stat 2: Active Endpoints */}
                <div className="p-6 rounded-xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoints Enrolled</span>
                      <h2 className="text-3xl font-extrabold text-white mt-2">{endpoints.length}</h2>
                    </div>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      {endpoints.filter(e => e.status === "Online").length} Active
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cross-platform agents active.</span>
                  </div>
                </div>

                {/* Stat 3: Triggered Alerts */}
                <div className="p-6 rounded-xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyberRed/5 rounded-full blur-xl"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Threat Alerts Logs</span>
                      <h2 className="text-3xl font-extrabold text-white mt-2">{alerts.length}</h2>
                    </div>
                    {alerts.filter(a => a.status === "New").length > 0 && (
                      <span className="bg-cyberRed/10 text-cyberRed border border-cyberRed/20 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                        {alerts.filter(a => a.status === "New").length} Action Needed
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-cyberRed" />
                    <span>Process & network indicators.</span>
                  </div>
                </div>

                {/* Stat 4: Active Incidents */}
                <div className="p-6 rounded-xl glass-panel relative overflow-hidden border border-white/5 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyberOrange/5 rounded-full blur-xl"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SOC Incidents Opened</span>
                      <h2 className="text-3xl font-extrabold text-white mt-2">{incidents.filter(i => i.status !== "Closed" && i.status !== "Resolved").length}</h2>
                    </div>
                    <span className="bg-cyberOrange/10 text-cyberOrange border border-cyberOrange/20 px-2 py-0.5 rounded text-[10px] font-bold">
                      {incidents.filter(i => i.status === "Open").length} Unassigned
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle className="w-3.5 h-3.5 text-cyberOrange" />
                    <span>Active SOC cases under triage.</span>
                  </div>
                </div>

              </div>

              {/* CHARTS LAYER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 1: Threat Trend over time */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 lg:col-span-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6">Threat Volume Timeline (24h)</h3>
                  <div className="h-64">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00d8ff" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#00d8ff" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
                          <Tooltip contentStyle={{ background: '#0e1322', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                          <Area type="monotone" dataKey="threats" stroke="#00d8ff" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: Severity distribution */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Risk Severity Matrix</h3>
                  </div>
                  <div className="h-48 flex items-center justify-center relative">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData.filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="absolute text-center">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Total Alerts</span>
                      <h4 className="text-xl font-bold text-white">{alerts.length}</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-4 border-t border-white/5 pt-3">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}></span>
                        <span className="text-slate-400">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CRITICAL INCIDENTS & ALERT STREAM LOG */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: Latest alerts */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Unresolved Threats Log</h3>
                    <button onClick={() => setActiveTab("alerts")} className="text-[10px] text-cyberBlue hover:underline">View All</button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {alerts.filter(a => a.status === "New").length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No active unresolved alerts found. System is clean.
                      </div>
                    ) : (
                      alerts.filter(a => a.status === "New").map(alert => (
                        <div key={alert.id} className="p-3 bg-white/5 rounded-lg border-l-4 border-l-cyberRed border-white/5 flex justify-between items-center gap-4 hover:bg-white/10 transition-all">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{alert.title}</span>
                              <span className="text-[8px] bg-cyberRed/20 text-cyberRed border border-cyberRed/25 px-1 py-0.5 rounded font-extrabold uppercase">
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 truncate max-w-sm">{alert.description}</p>
                            <span className="text-[9px] text-slate-500 mt-1 block">Host: {alert.hostname} | {new Date(alert.created_at).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => { setSelectedAlert(alert); handleAIThreatAnalysis(alert); }}
                              className="bg-cyberBlue/10 hover:bg-cyberBlue/20 text-cyberBlue border border-cyberBlue/20 text-[9px] font-bold px-2.5 py-1.5 rounded transition-all"
                            >
                              AI Audit
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right: Security Posture Audit Recommendations */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Security Recommendations</h3>
                      <button onClick={() => setActiveTab("audit")} className="text-[10px] text-cyberBlue hover:underline">Scan Details</button>
                    </div>
                    <div className="space-y-4">
                      {postureRecommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="flex gap-3 items-start p-3 bg-white/5 rounded border border-white/5">
                          <div className={`p-1.5 rounded ${rec.impact === "Critical" ? "bg-cyberRed/10 text-cyberRed" : rec.impact === "High" ? "bg-cyberOrange/10 text-cyberOrange" : "bg-cyberBlue/10 text-cyberBlue"}`}>
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{rec.control}</span>
                              <span className={`text-[8px] font-bold px-1 rounded uppercase ${rec.impact === "Critical" ? "bg-cyberRed/20 text-cyberRed" : rec.impact === "High" ? "bg-cyberOrange/20 text-cyberOrange" : "bg-cyberBlue/20 text-cyberBlue"}`}>
                                {rec.impact} Priority
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{rec.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-cyan-950/10 border border-cyberBlue/10 rounded mt-4">
                    <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                      <strong>Defensive Platform Policy:</strong> SentinelAI EDR monitors local keyboard hooking metrics and API processes safely. In accordance with platform security parameters, no raw keystrokes or password strings are collected.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: ENDPOINTS INVENTORY */}
          {activeTab === "endpoints" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Endpoint search and listings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* List Pane */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-3 items-center">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Filter active hosts by hostname, IP address, OS..." 
                      className="bg-transparent focus:outline-none text-slate-200 text-xs w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {endpoints.map(ep => (
                      <div 
                        key={ep.id} 
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`p-5 rounded-xl glass-panel glass-panel-hover border cursor-pointer flex flex-col justify-between h-44 ${selectedEndpoint?.id === ep.id ? "border-cyberBlue bg-cyberBlue/5" : "border-white/5"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-white">{ep.hostname}</h4>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">{ep.ip_address} | {ep.mac_address}</span>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${ep.status === "Online" ? "bg-cyberGreen" : "bg-slate-500"}`}></span>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Operating System</span>
                            <span className="text-[10px] text-slate-300 font-semibold block">{ep.os_name} {ep.os_version}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Posture</span>
                            <span className={`text-xs font-extrabold ${ep.posture_score >= 80 ? "text-cyberGreen" : ep.posture_score >= 60 ? "text-yellow-500" : "text-cyberRed"}`}>
                              {ep.posture_score}/100
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 border-t border-white/5 pt-2 flex justify-between text-[9px] text-slate-500">
                          <span>Health: <strong className={ep.health_status === "Healthy" ? "text-cyberGreen" : ep.health_status === "Warning" ? "text-yellow-500" : "text-cyberRed"}>{ep.health_status}</strong></span>
                          <span>Last Seen: {new Date(ep.last_seen).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Selected Endpoint Deep Detail Panel */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col justify-between h-[500px]">
                  {selectedEndpoint ? (
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-white">{selectedEndpoint.hostname}</h3>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {selectedEndpoint.id}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedEndpoint.health_status === "Healthy" ? "bg-cyberGreen/10 text-cyberGreen" : "bg-cyberRed/10 text-cyberRed"}`}>
                            {selectedEndpoint.health_status}
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">IP Address:</span>
                            <span className="font-mono text-white">{selectedEndpoint.ip_address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">MAC Address:</span>
                            <span className="font-mono text-white">{selectedEndpoint.mac_address}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">OS Platform:</span>
                            <span className="text-white">{selectedEndpoint.os_name} {selectedEndpoint.os_version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Security Posture Score:</span>
                            <span className={`font-bold ${selectedEndpoint.posture_score >= 80 ? "text-cyberGreen" : "text-cyberRed"}`}>{selectedEndpoint.posture_score}/100</span>
                          </div>
                        </div>

                        {/* Interactive Process Tree simulation block */}
                        <div className="mt-6">
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Terminal className="w-3.5 h-3.5 text-cyberBlue" /> Audited Process Chain Tree
                          </h4>
                          <div className="p-3 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-slate-300 space-y-1 bg-opacity-70 h-44 overflow-y-auto">
                            <div className="text-cyberGreen">systemd (PID 1)</div>
                            <div className="pl-3">└─ sshd (PID 450)</div>
                            <div className="pl-6">└─ bash (PID 1201)</div>
                            {selectedEndpoint.health_status === "Critical" || selectedEndpoint.health_status === "Warning" ? (
                              <>
                                <div className="pl-9 text-cyberOrange">└─ python3 (PID 1400)</div>
                                <div className="pl-12 text-cyberRed font-bold">└─ nc (PID 2901) --listen 4444 [ALERT]</div>
                              </>
                            ) : (
                              <div className="pl-9 text-slate-500">└─ psutil_agent (PID 3055) [Auditing...]</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {userRole === "Administrator" && (
                        <button 
                          onClick={() => {
                            setEndpoints(prev => prev.filter(e => e.id !== selectedEndpoint.id));
                            addAuditLogEntry("ENDPOINT_DECOMMISSION", selectedEndpoint.hostname, "Decommissioned endpoint assets");
                            setSelectedEndpoint(null);
                          }}
                          className="w-full bg-cyberRed/10 hover:bg-cyberRed/20 text-cyberRed border border-cyberRed/20 py-2 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Decommission Endpoint
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                      <Server className="w-8 h-8 text-slate-600 mb-2" />
                      Select an endpoint to inspect live diagnostics logs, process hierarchies, and security configurations.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: THREAT ALERTS */}
          {activeTab === "alerts" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex gap-4">
                <select 
                  className="bg-[#0b0e17] text-xs border border-white/10 rounded px-3 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <select 
                  className="bg-[#0b0e17] text-xs border border-white/10 rounded px-3 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Alerts list */}
                <div className="lg:col-span-2 space-y-3">
                  {alerts.map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`p-4 rounded-xl glass-panel border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer transition-all ${selectedAlert?.id === alert.id ? "border-cyberBlue bg-cyberBlue/5" : "border-white/5 hover:bg-white/5"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${alert.severity === "Critical" ? "bg-cyberRed" : alert.severity === "High" ? "bg-cyberOrange" : "bg-yellow-500"}`}></span>
                          <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                          <span className={`text-[8px] font-bold px-1 rounded uppercase ${alert.severity === "Critical" ? "bg-cyberRed/20 text-cyberRed" : alert.severity === "High" ? "bg-cyberOrange/20 text-cyberOrange" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{alert.description}</p>
                        <div className="flex items-center gap-3 text-[9px] text-slate-500 mt-2">
                          <span>Endpoint: <strong>{alert.hostname}</strong></span>
                          <span>Category: <strong>{alert.alert_type}</strong></span>
                          <span>Status: <strong className={alert.status === "Resolved" ? "text-cyberGreen" : "text-cyberBlue"}>{alert.status}</strong></span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {alert.status === "New" && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCreateIncidentFromAlert(alert); }}
                            className="bg-cyberOrange/10 hover:bg-cyberOrange/20 text-cyberOrange border border-cyberOrange/20 text-[9px] font-bold px-2 py-1 rounded transition-all"
                          >
                            Create Incident
                          </button>
                        )}
                        {alert.status !== "Resolved" && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResolveAlert(alert.id); }}
                            className="bg-cyberGreen/10 hover:bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/20 text-[9px] font-bold px-2 py-1 rounded transition-all"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Panel: Threat Audit & AI Analysis Details */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col justify-between h-[520px]">
                  {selectedAlert ? (
                    <div className="flex flex-col justify-between h-full">
                      <div>
                        <div className="border-b border-white/5 pb-4 mb-4">
                          <h3 className="text-sm font-bold text-white">{selectedAlert.title}</h3>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">Host: {selectedAlert.hostname} | Severity: {selectedAlert.severity}</span>
                        </div>

                        <div className="space-y-4 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Risk Analysis Notes</span>
                            <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{selectedAlert.risk_explanation}</p>
                          </div>

                          {selectedAlert.process_name && (
                            <div className="p-2 bg-white/5 rounded border border-white/5 font-mono text-[9px] text-slate-400">
                              Process: {selectedAlert.process_name} (PID: {selectedAlert.process_pid})
                            </div>
                          )}

                          {/* AI Explanation Area */}
                          <div className="border-t border-white/5 pt-3">
                            <span className="text-[9px] text-cyberBlue font-bold uppercase tracking-wider flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5" /> Automated AI Impact Audit
                            </span>
                            
                            {isAnalyzingAlert ? (
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-3 animate-pulse">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Running AI Behavioral Analysis...</span>
                              </div>
                            ) : aiAnalysis ? (
                              <div className="mt-2 space-y-2 bg-[#0c1322] p-3 rounded border border-cyberBlue/10 max-h-56 overflow-y-auto">
                                <div>
                                  <span className="text-[9px] text-slate-400 font-semibold">Technical Breakdown:</span>
                                  <p className="text-[9px] text-slate-300 leading-relaxed mt-0.5">{aiAnalysis.technical_explanation}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 font-semibold">Business Risk:</span>
                                  <p className="text-[9px] text-slate-300 leading-relaxed mt-0.5">{aiAnalysis.business_impact}</p>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-400 font-semibold">Containment Action:</span>
                                  <p className="text-[9px] text-cyberOrange leading-relaxed mt-0.5">{aiAnalysis.remediation_guidance}</p>
                                </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleAIThreatAnalysis(selectedAlert)}
                                className="mt-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-1.5 px-3 rounded text-[10px] w-full transition-all flex items-center justify-center gap-2"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Request AI Incident Diagnosis
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* MITRE ATT&CK Mapping context */}
                      <div className="p-3 bg-slate-900/40 rounded border border-white/5 mt-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-cyberBlue" />
                        <div className="text-[9px] text-slate-400 leading-normal">
                          <strong>MITRE Alignment:</strong> Aligns to T1056 (Input Capture: Keylogging) & T1003 (Credential Dumping).
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                      <AlertTriangle className="w-8 h-8 text-slate-600 mb-2" />
                      Select a threat alert to review risk parameters, process context, and run AI impact assessments.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: INCIDENTS BOARD */}
          {activeTab === "incidents" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Kanban styled cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Open Incidents */}
                <div className="p-4 bg-[#0a0d15]/50 border border-white/5 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Open Incidents</span>
                    <span className="bg-cyberRed/15 text-cyberRed text-[10px] font-bold px-1.5 rounded">
                      {incidents.filter(i => i.status === "Open").length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px]">
                    {incidents.filter(i => i.status === "Open").map(inc => (
                      <div key={inc.id} className="p-4 bg-[#101423] rounded-lg border border-white/5 space-y-2 hover:border-cyberOrange transition-all">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white">{inc.title}</h4>
                          <span className="text-[8px] bg-cyberRed/10 text-cyberRed px-1 rounded uppercase font-bold">{inc.severity}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{inc.description}</p>
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[9px] text-slate-500">{new Date(inc.created_at).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleUpdateIncidentStatus(inc.id, "Investigating")}
                            className="bg-cyberBlue/10 hover:bg-cyberBlue/20 text-cyberBlue border border-cyberBlue/20 text-[9px] font-bold px-2 py-0.5 rounded transition-all"
                          >
                            Investigate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: In-Progress/Investigating */}
                <div className="p-4 bg-[#0a0d15]/50 border border-white/5 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Under Investigation</span>
                    <span className="bg-cyberBlue/15 text-cyberBlue text-[10px] font-bold px-1.5 rounded">
                      {incidents.filter(i => i.status === "Investigating").length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px]">
                    {incidents.filter(i => i.status === "Investigating").map(inc => (
                      <div key={inc.id} className="p-4 bg-[#101423] rounded-lg border border-white/5 space-y-2 hover:border-cyberBlue transition-all">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-white">{inc.title}</h4>
                          <span className="text-[8px] bg-cyberOrange/10 text-cyberOrange px-1 rounded uppercase font-bold">{inc.severity}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{inc.description}</p>
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[9px] text-slate-500">{new Date(inc.created_at).toLocaleDateString()}</span>
                          <button 
                            onClick={() => handleUpdateIncidentStatus(inc.id, "Resolved")}
                            className="bg-cyberGreen/10 hover:bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/20 text-[9px] font-bold px-2 py-0.5 rounded transition-all"
                          >
                            Resolve Case
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Resolved & Closed */}
                <div className="p-4 bg-[#0a0d15]/50 border border-white/5 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Resolved / Closed</span>
                    <span className="bg-cyberGreen/15 text-cyberGreen text-[10px] font-bold px-1.5 rounded">
                      {incidents.filter(i => i.status === "Resolved" || i.status === "Closed").length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px]">
                    {incidents.filter(i => i.status === "Resolved" || i.status === "Closed").map(inc => (
                      <div key={inc.id} className="p-4 bg-[#101423]/70 rounded-lg border border-white/5 space-y-2 opacity-85">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-slate-300">{inc.title}</h4>
                          <span className="text-[8px] bg-cyberGreen/10 text-cyberGreen px-1 rounded uppercase font-bold">{inc.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">{inc.description}</p>
                        <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500">
                          <span>Resolved: {new Date(inc.created_at).toLocaleDateString()}</span>
                          <span className="text-cyberGreen font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Closed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 5: DETECTION RULES */}
          {activeTab === "rules" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Create Custom Rule Form */}
                <div className="p-6 rounded-xl glass-panel border border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Add Behavioral Rule</h3>
                  <form onSubmit={handleCreateRule} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rule Name</label>
                      <input 
                        type="text" 
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        placeholder="e.g. Obfuscated PowerShell execution"
                        className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyberBlue"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rule Category</label>
                      <select 
                        value={newRuleType}
                        onChange={(e) => { setNewRuleType(e.target.value); setNewRuleField(e.target.value === "Process" ? "name" : (e.target.value === "Network" ? "remote_port" : "path")); }}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="Process">Process</option>
                        <option value="Network">Network</option>
                        <option value="File">File</option>
                        <option value="Resource">Resource</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Evaluate Field</label>
                        <select 
                          value={newRuleField}
                          onChange={(e) => setNewRuleField(e.target.value)}
                          className="w-full bg-[#0a0d16] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none"
                        >
                          {newRuleType === "Process" && (
                            <>
                              <option value="name">Process Name</option>
                              <option value="path">File Path</option>
                              <option value="cmdline">Cmdline String</option>
                              <option value="username">Executing User</option>
                            </>
                          )}
                          {newRuleType === "Network" && (
                            <>
                              <option value="remote_port">Target Port</option>
                              <option value="remote_ip">Target IP</option>
                              <option value="status">Socket Status</option>
                            </>
                          )}
                          {newRuleType === "File" && (
                            <>
                              <option value="path">File Folder Path</option>
                              <option value="action">Change Action</option>
                            </>
                          )}
                          {newRuleType === "Resource" && (
                            <>
                              <option value="cpu_percent">CPU usage %</option>
                              <option value="memory_percent">Memory usage %</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Operator</label>
                        <select 
                          value={newRuleOperator}
                          onChange={(e) => setNewRuleOperator(e.target.value)}
                          className="w-full bg-[#0a0d16] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none"
                        >
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="greater_than">&gt; Greater Than</option>
                          <option value="less_than">&lt; Less Than</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Value</label>
                      <input 
                        type="text" 
                        value={newRuleValue}
                        onChange={(e) => setNewRuleValue(e.target.value)}
                        placeholder="e.g. -EncodedCommand"
                        className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyberBlue"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Alert Severity</label>
                      <select 
                        value={newRuleSeverity}
                        onChange={(e) => setNewRuleSeverity(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                      <textarea 
                        value={newRuleDesc}
                        onChange={(e) => setNewRuleDesc(e.target.value)}
                        placeholder="Purpose of this behavioral signature check..."
                        rows={2}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyberBlue"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Save Detection Rule
                    </button>
                  </form>
                </div>

                {/* Rules Table */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Active System Rules</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400 uppercase tracking-widest text-[9px]">
                            <th className="py-2">Rule Name</th>
                            <th className="py-2">Category</th>
                            <th className="py-2">Condition</th>
                            <th className="py-2">Severity</th>
                            <th className="py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rules.map(rule => (
                            <tr key={rule.id} className="border-b border-white/5 text-slate-300">
                              <td className="py-3 font-semibold">{rule.name}</td>
                              <td className="py-3">{rule.rule_type}</td>
                              <td className="py-3 font-mono text-[10px]">
                                {rule.details.field} {rule.details.operator} "{rule.details.value}"
                              </td>
                              <td className="py-3">
                                <span className={`text-[8px] font-bold px-1 rounded uppercase ${rule.severity === "Critical" ? "bg-cyberRed/20 text-cyberRed" : rule.severity === "High" ? "bg-cyberOrange/20 text-cyberOrange" : "bg-yellow-500/20 text-yellow-400"}`}>
                                  {rule.severity}
                                </span>
                              </td>
                              <td className="py-3 text-right space-x-2">
                                <button 
                                  onClick={() => toggleRuleActive(rule)}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded border ${rule.is_active ? "bg-cyberGreen/10 text-cyberGreen border-cyberGreen/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}
                                >
                                  {rule.is_active ? "Enabled" : "Disabled"}
                                </button>
                                <button 
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="text-cyberRed hover:text-white"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: AUDIT LOGGER & POSTURE */}
          {activeTab === "audit" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Security Posture Dashboard */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col justify-between h-[300px]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Posture Score Evaluation</h3>
                    <span className="text-[10px] text-slate-400">Calculated based on active critical alerts and MFA states.</span>
                  </div>
                  <div className="text-center my-4">
                    <h2 className="text-5xl font-extrabold text-white">{postureScore} <span className="text-xs text-slate-500">/ 100</span></h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-3 ${postureScore >= 85 ? "bg-cyberGreen/10 text-cyberGreen border-cyberGreen/20" : postureScore >= 60 ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-cyberRed/10 text-cyberRed border-cyberRed/20"}`}>
                      {postureScore >= 85 ? "Compliant - Optimal" : postureScore >= 60 ? "Policy Deviation" : "At Immediate Risk"}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 leading-normal border-t border-white/5 pt-3">
                    <strong>Score Metrics:</strong> Deductions occur when unmitigated critical vulnerabilities occur or default configuration states exist.
                  </div>
                </div>

                {/* Posture Deductions */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 lg:col-span-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Security Audits Checklist</h3>
                  <div className="space-y-3">
                    {postureDeductions.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        All checks compliant. No posture deductions registered.
                      </div>
                    ) : (
                      postureDeductions.map((deduct, idx) => (
                        <div key={idx} className="p-3 bg-[#130d12] border border-cyberRed/10 rounded flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyberRed"></span>
                            <span className="text-xs text-slate-300">{deduct}</span>
                          </div>
                          <span className="text-[9px] text-cyberRed font-bold">- Deduct Points</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Administrative Logs (Module 16) */}
              <div className="p-6 rounded-xl glass-panel border border-white/5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">EDR Audit Log Trail</h3>
                <div className="max-h-72 overflow-y-auto pr-2 space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-3 bg-white/5 rounded border border-white/5 flex justify-between items-center text-[11px] hover:bg-white/10 transition-all">
                      <div>
                        <span className="font-bold text-cyberBlue">{log.action}</span>
                        <span className="text-slate-400 ml-3">{log.details}</span>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-mono">
                        <span>{log.user_email} | {new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: REPORTS ENGINE */}
          {activeTab === "reports" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Generation Control Panel */}
                <div className="p-6 rounded-xl glass-panel border border-white/5 flex flex-col justify-between h-[300px]">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Export Posture Snapshot</h3>
                    <p className="text-[10px] text-slate-400">Generate and download EDR logs, compliance metrics, and recommendations reports.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => downloadReportFile("json")}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-cyberBlue" /> Download JSON Dataset
                    </button>
                    <button 
                      onClick={() => downloadReportFile("csv")}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-cyberGreen" /> Download CSV Spreadsheet
                    </button>
                    <button 
                      onClick={() => downloadReportFile("html")}
                      className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-2 rounded text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Download HTML Report (Print PDF)
                    </button>
                  </div>

                  <div className="text-[9px] text-slate-500 text-center">
                    Audited files include endpoints lists and alert statuses.
                  </div>
                </div>

                {/* Layout preview mock */}
                <div className="lg:col-span-2 p-6 rounded-xl glass-panel border border-white/5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Report Preview Layout</h3>
                  <div className="p-4 bg-[#0a0d16] border border-white/5 rounded text-slate-400 font-mono text-[9px] space-y-4">
                    <div>
                      <span className="text-cyberBlue"># SentinelAI EDR Audit Log Summary</span>
                      <p className="text-[8px] text-slate-500 mt-1">Generated: {new Date().toISOString()}</p>
                    </div>
                    <div>
                      <strong className="text-white">## Executive Summary</strong>
                      <p className="leading-relaxed mt-1">ENVIRONMENT SECURITY POSTURE IS RATED {postureScore}/100. MULTIPLE COMPLIANCE CONFLICTS RESOLVED. 1 HOST DEMANDS NETWORK ISOLATION.</p>
                    </div>
                    <div>
                      <strong className="text-white">## Recommended Action Steps</strong>
                      <p>1. ACTIVATE MFA CONTROLS ON USER ACCOUNTS.</p>
                      <p>2. SHUT DOWN PORT 4444 ON SSH CHANNELS.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 8: SYSTEM SETTINGS */}
          {activeTab === "system" && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-6 rounded-xl glass-panel border border-white/5 max-w-2xl">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform Settings & Controls</h3>
                
                <div className="space-y-6">
                  {/* API Base Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">FastAPI Backend API Root URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={apiBaseUrl}
                        onChange={(e) => setApiBaseUrl(e.target.value)}
                        className="bg-[#0a0d16] border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyberBlue flex-1"
                      />
                      <button 
                        onClick={testBackendConnection}
                        className="bg-cyberBlue/10 hover:bg-cyberBlue/20 text-cyberBlue border border-cyberBlue/20 text-xs font-semibold px-4 py-1.5 rounded transition-all"
                      >
                        Test Connection
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      SentinelAI console attempts to connect to this API link to fetch live data.
                    </span>
                  </div>

                  {/* Simulator Toggles */}
                  <div className="border-t border-white/5 pt-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Simulators Configurations</label>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                      <div>
                        <span className="text-xs font-semibold text-white block">Heartbeat Telemetry Simulation Mode</span>
                        <span className="text-[10px] text-slate-400">Allows generating simulated telemetry without backend agent files.</span>
                      </div>
                      <button 
                        onClick={() => setIsSimulatingAgent(!isSimulatingAgent)}
                        className={`text-xs font-bold px-3 py-1 rounded transition-all ${isSimulatingAgent ? "bg-cyberGreen/10 text-cyberGreen border border-cyberGreen/20" : "bg-white/5 text-slate-400 border border-white/5"}`}
                      >
                        {isSimulatingAgent ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>

                  {/* User Profile / MFA Setup block */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Multi-Factor Authentication (MFA)</label>
                    <div className="p-4 bg-[#0a0e1a] rounded border border-cyberBlue/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-300">Set up standard authentication URI (Google Authenticator)</span>
                        <span className="text-[10px] text-slate-500">MFA Secret: {mfaSecret}</span>
                      </div>
                      <div className="bg-white p-2 rounded w-32 h-32 mx-auto flex items-center justify-center border border-white/10 relative">
                        {/* Mock QR Code representation */}
                        <div className="text-[8px] text-slate-900 font-mono text-center font-bold">
                          [SentinelAI QR Code]
                          <div className="mt-2 text-[6px]">otpauth://totp/...</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
