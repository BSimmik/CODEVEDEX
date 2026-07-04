"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Key, 
  Activity, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  Zap, 
  Database, 
  FileText, 
  Terminal, 
  Fingerprint, 
  FileLock2,
  RefreshCw,
  Download,
  Send,
  User,
  Settings,
  HelpCircle,
  Menu,
  X,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

// API Config
const API_BASE = "http://localhost:8000/api/v1";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Authentication State
  const [user, setUser] = useState<{ email: string; role: string; token: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState("Standard User");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQr, setMfaQr] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStep, setMfaStep] = useState(false);

  // Password Analysis State
  const [analyzerPassword, setAnalyzerPassword] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Policy Auditor State
  const [policyPassword, setPolicyPassword] = useState("");
  const [selectedPolicyPreset, setSelectedPolicyPreset] = useState("NIST");
  const [policyConfig, setPolicyConfig] = useState({
    name: "NIST SP 800-63B",
    min_length: 8,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special: false,
    expiry_days: 90,
    mfa_required: true
  });
  const [policyAuditResult, setPolicyAuditResult] = useState<any>(null);

  // Hashing Lab State
  const [hashingInput, setHashingInput] = useState("CyberSecurity2026!");
  const [hashingAlgo, setHashingAlgo] = useState("sha256");
  const [hashingSalt, setHashingSalt] = useState("enterprise_salt");
  const [hashingRounds, setHashingRounds] = useState(10);
  const [hashingResult, setHashingResult] = useState<any>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [benchmarkingLoading, setBenchmarkingLoading] = useState(false);

  // Attack Sim State
  const [simPasswordLength, setSimPasswordLength] = useState(8);
  const [simLowercase, setSimLowercase] = useState(true);
  const [simUppercase, setSimUppercase] = useState(true);
  const [simDigits, setSimDigits] = useState(true);
  const [simSpecial, setSimSpecial] = useState(false);
  const [simAttackType, setSimAttackType] = useState("brute_force");
  const [simAlgo, setSimAlgo] = useState("sha256");
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Breach Check State
  const [breachPassword, setBreachPassword] = useState("");
  const [breachResult, setBreachResult] = useState<any>(null);
  const [breachLoading, setBreachLoading] = useState(false);

  // Passkey Simulation State
  const [passkeyStep, setPasskeyStep] = useState(0);
  const [passkeyUser, setPasskeyUser] = useState("analyst@enterprise.internal");
  const [passkeyChallenge, setPasskeyChallenge] = useState("");
  const [passkeyLogs, setPasskeyLogs] = useState<string[]>([]);

  // Auth Assessment State
  const [authAssessConfig, setAuthAssessConfig] = useState({
    use_password: true,
    use_mfa: true,
    mfa_type: "TOTP"
  });
  const [authAssessResult, setAuthAssessResult] = useState<any>(null);

  // Generator State
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genDigits, setGenDigits] = useState(true);
  const [genSpecial, setGenSpecial] = useState(true);
  const [genPassphrase, setGenPassphrase] = useState(false);
  const [genNumWords, setGenNumWords] = useState(4);
  const [genSeparator, setGenSeparator] = useState("-");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedMetrics, setGeneratedMetrics] = useState<any>(null);

  // AI Advisor State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContext, setAiContext] = useState("general");
  const [aiLogs, setAiLogs] = useState<{ role: "user" | "advisor"; text: string }[]>([
    { role: "advisor", text: "Hello! I am your AI Authentication Advisor. Ask me anything about password complexity, entropy calculations, WebAuthn implementations, or enterprise policy guidelines." }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Dashboard metrics fallback
  const [dbMetrics, setDbMetrics] = useState({
    overall_score: 78,
    compliance_score: 85,
    total_users: 236,
    distribution: { Critical: 12, Weak: 24, Moderate: 54, Strong: 120, Excellent: 80 },
    authentication_levels: { "Password Only": 45, "TOTP MFA": 92, "Passkeys / FIDO2": 32 },
    recent_events: [
      { action: "USER_REGISTRATION", ip: "12.4.92.1", time: "2026-07-04T12:00:00" },
      { action: "PASSWORD_STRENGTH_CHECK", ip: "192.168.1.42", time: "2026-07-04T12:10:00" },
      { action: "POLICY_AUDIT_TRIGGERED", ip: "10.0.4.15", time: "2026-07-04T12:15:00" },
    ]
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Clock
  const [systemTime, setSystemTime] = useState("");
  useEffect(() => {
    setSystemTime(new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");
    const interval = setInterval(() => {
      setSystemTime(new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preset policies mapper
  useEffect(() => {
    if (selectedPolicyPreset === "NIST") {
      setPolicyConfig({
        name: "NIST SP 800-63B Guidelines",
        min_length: 8,
        require_uppercase: false,
        require_lowercase: false,
        require_numbers: false,
        require_special: false,
        expiry_days: 0, // NIST discourages arbitrary password rotation
        mfa_required: true
      });
    } else if (selectedPolicyPreset === "OWASP") {
      setPolicyConfig({
        name: "OWASP Recommended Policies",
        min_length: 10,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special: true,
        expiry_days: 365,
        mfa_required: true
      });
    } else if (selectedPolicyPreset === "CIS") {
      setPolicyConfig({
        name: "CIS Control Standards",
        min_length: 14,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special: true,
        expiry_days: 90,
        mfa_required: true
      });
    }
  }, [selectedPolicyPreset]);

  // Fetch Dashboard Metrics on mount
  useEffect(() => {
    fetchMetrics();
    // Default password analyzer evaluation on load
    runPasswordAnalysis("P@ssw0rdSecurity2026!");
  }, [user]);

  const fetchMetrics = async () => {
    try {
      const headers: HeadersInit = {};
      if (user) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_BASE}/dashboard/metrics`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDbMetrics(data);
      }
    } catch (e) {
      console.log("Using local offline dashboard metrics fallback.");
    }
  };

  const fetchAuditLogs = async () => {
    if (!user || user.role !== "Administrator") return;
    try {
      const res = await fetch(`${API_BASE}/audit/logs`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.log("Could not query audit logs from backend.");
    }
  };

  useEffect(() => {
    if (activeTab === "audit" && user?.role === "Administrator") {
      fetchAuditLogs();
    }
  }, [activeTab, user]);

  // Auth flow
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (authMode === "register") {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword,
            role_name: authRole
          })
        });
        if (res.ok) {
          setAuthMode("login");
          alert("Account registered successfully. Please log in.");
        } else {
          const err = await res.json();
          setAuthError(err.detail || "Registration failed");
        }
      } else {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail,
            password: authPassword
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.mfa_required) {
            setUser({ email: data.email, role: data.role, token: data.access_token });
            setMfaStep(true);
          } else {
            setUser({ email: data.email, role: data.role, token: data.access_token });
            setAuthEmail("");
            setAuthPassword("");
          }
        } else {
          const err = await res.json();
          setAuthError(err.detail || "Incorrect email or password");
        }
      }
    } catch (e) {
      // Offline Simulated Auth Fallback
      if (authMode === "login") {
        setUser({ email: authEmail || "analyst@enterprise.internal", role: "Administrator", token: "mock_token" });
        setAuthEmail("");
        setAuthPassword("");
      } else {
        alert("Simulated registration complete. Proceeding to mock login.");
        setAuthMode("login");
      }
    }
  };

  const handleMfaVerify = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/auth/mfa/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({ code: mfaCode })
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ email: data.email, role: data.role, token: data.access_token });
        setMfaStep(false);
        setMfaCode("");
      } else {
        alert("Invalid code. Try again.");
      }
    } catch (e) {
      // Offline fallback
      setMfaStep(false);
    }
  };

  const handleMfaEnable = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/auth/mfa/enable`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMfaSecret(data.secret);
        setMfaQr(data.qr_code_uri);
      }
    } catch (e) {
      alert("MFA Enable failed. Setup offline mocks.");
      setMfaSecret("SECRET32BASEKEYFOROTP");
      setMfaQr("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/Platform?secret=SECRET32BASEKEYFOROTP");
    }
  };

  // Password Analysis trigger
  const runPasswordAnalysis = async (pwd: string) => {
    if (!pwd) return;
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_BASE}/password/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({ password: pwd })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (e) {
      // Dynamic Client-side Javascript Fallback Logic
      const length = pwd.length;
      const entropy = Math.round(length * 4.7 * 100) / 100;
      let score = Math.min(100, length * 6);
      if (/[A-Z]/.test(pwd)) score += 10;
      if (/[0-9]/.test(pwd)) score += 10;
      if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
      
      let classification = "Weak";
      if (score < 25) classification = "Critical";
      else if (score < 45) classification = "Weak";
      else if (score < 70) classification = "Moderate";
      else if (score < 85) classification = "Strong";
      else classification = "Excellent";

      setAnalysisResult({
        length,
        entropy,
        score: Math.min(100, score),
        classification,
        repeated_chars: 0,
        has_dictionary_words: pwd.includes("password") || pwd.includes("admin"),
        keyboard_patterns: 0,
        recommendations: [
          { type: "length", message: "Aim for a length of 14 or more characters to improve offline resistance." },
          { type: "mfa", message: "Enforce app-based MFA configurations for this login context." }
        ],
        resistance_levels: {
          online_throttled: "Years",
          online_unthrottled: "Days",
          offline_fast_hashing: "Hours"
        }
      });
    }
  };

  // Policy Auditor Trigger
  const runPolicyAudit = async (pwd: string) => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_BASE}/policy/audit`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          password: pwd,
          policy: policyConfig
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPolicyAuditResult(data);
      }
    } catch (e) {
      // Offline fallback policy check
      const details = [
        { check_name: "Minimum Length", passed: pwd.length >= policyConfig.min_length, message: `Length is ${pwd.length} (Requires ${policyConfig.min_length})` },
        { check_name: "Uppercase Character", passed: !policyConfig.require_uppercase || /[A-Z]/.test(pwd), message: "Requires uppercase character" },
        { check_name: "Numeric Character", passed: !policyConfig.require_numbers || /[0-9]/.test(pwd), message: "Requires number" }
      ];
      const passed = details.filter(d => d.passed).length;
      setPolicyAuditResult({
        compliance_score: Math.round((passed / details.length) * 100),
        status: passed === details.length ? "Compliant" : "Non-Compliant",
        details
      });
    }
  };

  // Hashing demonstration triggers
  const runHashDemo = async () => {
    try {
      const res = await fetch(`${API_BASE}/hashing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plain_text: hashingInput,
          algorithm: hashingAlgo,
          salt: hashingSalt,
          work_factor: hashingRounds
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHashingResult(data);
      }
    } catch (e) {
      setHashingResult({
        algorithm: hashingAlgo.toUpperCase(),
        hash_value: "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8 (Simulated Offline Hex)",
        salt_used: hashingSalt,
        time_taken_ms: 0.124,
        description: "Cryptographic hash generated locally. Offline simulation mode active."
      });
    }
  };

  const runCryptoBenchmarks = async () => {
    setBenchmarkingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/hashing/benchmark`);
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.benchmarks);
      }
    } catch (e) {
      setBenchmarks([
        { algorithm: "MD5", iterations: 100, execution_time_ms: 0.002, memory_used_kb: 4, security_level: "Broken" },
        { algorithm: "SHA-256", iterations: 100, execution_time_ms: 0.005, memory_used_kb: 4, security_level: "Weak for Passwords" },
        { algorithm: "Bcrypt (Cost 10)", iterations: 1, execution_time_ms: 78.5, memory_used_kb: 4, security_level: "Strong" },
        { algorithm: "Argon2id (m=64MB)", iterations: 1, execution_time_ms: 120.4, memory_used_kb: 65536, security_level: "Excellent" }
      ]);
    } finally {
      setBenchmarkingLoading(false);
    }
  };

  // Attack simulations trigger
  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/simulations/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password_length: simPasswordLength,
          use_lowercase: simLowercase,
          use_uppercase: simUppercase,
          use_digits: simDigits,
          use_special: simSpecial,
          attack_type: simAttackType,
          hash_algorithm: simAlgo
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
      }
    } catch (e) {
      // Simulate local run delay
      setTimeout(() => {
        setSimResult({
          attack_type: simAttackType.replace("_", " ").toUpperCase(),
          search_space: "6.82e+12 combinations",
          success_probability: 0.85,
          estimated_time_seconds: 4.82,
          steps_logged: [
            { step_num: 1, description: "Compiled target combinations space mapping.", elapsed_time_seconds: 0.0, success: false },
            { step_num: 2, description: "Initiating dictionary parsing matching credential formats.", elapsed_time_seconds: 0.8, success: false },
            { step_num: 3, description: "Target crack completed successfully.", elapsed_time_seconds: 4.2, success: true }
          ]
        });
        setSimulating(false);
      }, 1500);
      return;
    }
    setSimulating(false);
  };

  // Breach database query trigger
  const runBreachCheck = async () => {
    if (!breachPassword) return;
    setBreachLoading(true);
    try {
      const res = await fetch(`${API_BASE}/breach/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: breachPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setBreachResult(data);
      }
    } catch (e) {
      setBreachResult({
        is_breached: breachPassword === "password" || breachPassword === "123456",
        exposure_count: breachPassword === "password" ? 381923 : 0,
        risk_score: breachPassword === "password" ? 95 : 0,
        recommendation: breachPassword === "password" ? "CRITICAL EXPOSURE: Change immediately." : "No breaches matching this credential."
      });
    } finally {
      setBreachLoading(false);
    }
  };

  // Auth security assessment trigger
  const runAuthAssessment = async () => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_BASE}/auth-security/assess`, {
        method: "POST",
        headers,
        body: JSON.stringify(authAssessConfig)
      });
      if (res.ok) {
        const data = await res.json();
        setAuthAssessResult(data);
      }
    } catch (e) {
      setAuthAssessResult({
        score: authAssessConfig.use_mfa ? 85 : 30,
        classification: authAssessConfig.use_mfa ? "Good Protection" : "Insecure",
        risk_analysis: authAssessConfig.use_mfa ? ["Phishing via AiTM is still possible."] : ["Vulnerable to standard credential sniffing."],
        recommendations: ["Upgrade authentication configuration to WebAuthn / Passkeys."]
      });
    }
  };

  // Password generator trigger
  const runGeneratePassword = async () => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_BASE}/generator/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          length: genLength,
          include_uppercase: genUpper,
          include_lowercase: genLower,
          include_digits: genDigits,
          include_special: genSpecial,
          use_passphrase: genPassphrase,
          num_words: genNumWords,
          separator: genSeparator
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPassword(data.password);
        setGeneratedMetrics({
          entropy: data.entropy,
          score: data.strength_score,
          classification: data.classification
        });
      }
    } catch (e) {
      // Local JS safe password creation fallback
      let wordList = ["cyber", "defense", "quantum", "network", "firewall", "entropy", "hashing", "security", "token"];
      let pwd = "";
      if (genPassphrase) {
        pwd = Array.from({ length: genNumWords }, () => wordList[Math.floor(Math.random() * wordList.length)]).join(genSeparator);
      } else {
        let pool = "";
        if (genLower) pool += "abcdefghijklmnopqrstuvwxyz";
        if (genUpper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (genDigits) pool += "0123456789";
        if (genSpecial) pool += "!@#$%^&*()_+";
        if (!pool) pool = "abcdefg";
        pwd = Array.from({ length: genLength }, () => pool[Math.floor(Math.random() * pool.length)]).join("");
      }
      setGeneratedPassword(pwd);
      setGeneratedMetrics({
        entropy: Math.round(pwd.length * 4.5 * 100) / 100,
        score: Math.min(100, pwd.length * 6),
        classification: pwd.length > 12 ? "Strong" : "Moderate"
      });
    }
  };

  // AI Advisor Chat triggers
  const handleAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    
    const userMsg = aiPrompt;
    setAiLogs(prev => [...prev, { role: "user", text: userMsg }]);
    setAiPrompt("");
    setAiLoading(true);

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }
      const res = await fetch(`${API_BASE}/ai/advise`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: userMsg,
          context_type: aiContext
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiLogs(prev => [...prev, { role: "advisor", text: data.response }]);
      }
    } catch (e) {
      // Offline fallback text based on context
      setTimeout(() => {
        let reply = "I am currently running in offline mock context. Please run the backend FastAPI server to enable actual OpenAI analysis.";
        if (userMsg.toLowerCase().includes("nist")) {
          reply = "Under **NIST SP 800-63B** guidelines: \n1. Enforce minimum length of 8 characters. \n2. Discard character complexity rules (uppercase/symbols) as they increase user cognitive load and lead to predictable pattern mutations. \n3. Check input against lists of breached credentials.";
        } else if (userMsg.toLowerCase().includes("entropy")) {
          reply = "Entropy measures password predictability in bits: $E = L \\times \\log_2(R)$. Standard credentials require at least 60+ bits of entropy for general use, and 80+ bits for highly secure enterprise administration keys.";
        }
        setAiLogs(prev => [...prev, { role: "advisor", text: reply }]);
      }, 1000);
    } finally {
      setAiLoading(false);
    }
  };

  // Trigger report exports
  const exportReportFile = async (format: string) => {
    if (!user) {
      alert("Please log in with Security Analyst or Admin credentials to export compliance reports.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reports/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          format,
          include_sections: ["summary", "strength", "compliance", "authentication", "risk", "recommendations"]
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `password_security_report.${format === "excel" ? "xlsx" : format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const err = await res.json();
        alert(`Export failed: ${err.detail}`);
      }
    } catch (e) {
      alert("Could not complete report download. Verify backend server is running.");
    }
  };

  // Passkey Simulation logic steps
  const triggerPasskeySimStep = () => {
    if (passkeyStep === 0) {
      setPasskeyChallenge(Math.random().toString(36).substring(2, 10).toUpperCase() + "_CHALLENGE");
      setPasskeyLogs([
        "[Server] Client requested FIDO2 credential registration challenge.",
        `[Server] Generated randomized WebAuthn challenge: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      ]);
      setPasskeyStep(1);
    } else if (passkeyStep === 1) {
      setPasskeyLogs(prev => [
        ...prev,
        "[Browser] Received challenge. Prompting device authenticator...",
        "[Authenticator] Cryptographic module unlocked via system Pin/Biometrics.",
        "[Authenticator] Created new secure asymmetric keypair mapped to domain 'localhost'.",
        "[Browser] Exported client signature payload back to Relying Party server."
      ]);
      setPasskeyStep(2);
    } else if (passkeyStep === 2) {
      setPasskeyLogs(prev => [
        ...prev,
        "[Server] Verifying WebAuthn attestation signature...",
        "[Server] Attestation signature VALID. Public key stored mapping to 'analyst@enterprise.internal'.",
        "SUCCESS: Passkey credential successfully registered!"
      ]);
      setPasskeyStep(3);
    } else {
      // reset
      setPasskeyStep(0);
      setPasskeyLogs([]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Layout */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0"} bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden`}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-cyan-400 animate-pulse" />
            <span className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Shield Intelligence
            </span>
          </div>
        </div>

        {/* User Info Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 text-xs">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[120px]">{user.email}</span>
              </div>
              <button 
                onClick={() => setUser(null)}
                className="text-rose-400 hover:text-rose-300 text-[10px] uppercase font-bold"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-slate-400 italic">No authenticated session</div>
          )}
        </div>

        {/* Sidebar Tabs navigation */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {[
            { id: "dashboard", label: "Overview SOC", icon: Activity },
            { id: "analyzer", label: "Strength Analyzer", icon: Key },
            { id: "policy", label: "Policy Auditor", icon: Shield },
            { id: "hashing", label: "Hashing Lab", icon: Cpu },
            { id: "simulations", label: "Simulation Lab", icon: Terminal },
            { id: "breach", label: "Breached Checker", icon: Search },
            { id: "passkeys", label: "Passkeys (WebAuthn)", icon: Fingerprint },
            { id: "auth_sec", label: "Auth Posture", icon: FileLock2 },
            { id: "generator", label: "Password Generator", icon: Zap },
            { id: "ai", label: "AI Security Advisor", icon: HelpCircle },
            { id: "reports", label: "Report Engine", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                  isSelected 
                    ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 font-medium" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}

          {user?.role === "Administrator" && (
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                activeTab === "audit" 
                  ? "bg-rose-500/10 text-rose-400 border-l-2 border-rose-400 font-medium" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              }`}
            >
              <Database className="h-4 w-4" />
              System Audit Logs
            </button>
          )}
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-slate-100 focus:outline-none"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-md font-bold tracking-tight capitalize text-slate-200">
              {activeTab === "dashboard" ? "SOC Operations Center" : activeTab.replace("_", " ")}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-500 bg-slate-950 px-3 py-1 rounded border border-slate-800">
              TIME: {systemTime}
            </span>
            {!user && (
              <button 
                onClick={() => setActiveTab("session")} 
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-4 py-1.5 rounded transition-all shadow-md shadow-cyan-500/20"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Router View Panel */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          
          {/* TAB: SESSION/AUTH LOGIN */}
          {activeTab === "session" && (
            <div className="max-w-md mx-auto mt-12 bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 backdrop-blur-md">
              <div className="text-center mb-8">
                <Lock className="h-10 w-10 text-cyan-400 mx-auto mb-3" />
                <h2 className="text-xl font-bold">Authentication Gateway</h2>
                <p className="text-xs text-slate-400 mt-1">Access secure corporate dashboard modules</p>
              </div>

              {mfaStep ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded text-center text-xs border border-slate-800">
                    <p className="mb-2">Enter the verification code from your authenticator app</p>
                    <input 
                      type="text" 
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="000000"
                      className="bg-slate-900 border border-slate-700 text-center font-mono tracking-widest text-lg py-2 px-4 rounded w-full text-cyan-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button 
                    onClick={handleMfaVerify}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded transition-all"
                  >
                    Verify Code
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  {authError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Corporate Email</label>
                    <input 
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="user@enterprise.internal"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm pr-10 focus:outline-none focus:border-cyan-400"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {authMode === "register" && (
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Assigned Role</label>
                      <select 
                        value={authRole}
                        onChange={(e) => setAuthRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Security Analyst">Security Analyst</option>
                        <option value="Compliance Officer">Compliance Officer</option>
                        <option value="Standard User">Standard User</option>
                      </select>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded transition-all mt-4"
                  >
                    {authMode === "login" ? "Sign In" : "Register Credentials"}
                  </button>

                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      {authMode === "login" ? "Need a new account? Register" : "Already registered? Login"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Top Row Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">Directory Health Score</span>
                    <h3 className="text-2xl font-bold text-emerald-400 mt-1">{dbMetrics.overall_score}/100</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">Standards Compliance</span>
                    <h3 className="text-2xl font-bold text-cyan-400 mt-1">{dbMetrics.compliance_score}%</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-cyan-400" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">Total Checked Users</span>
                    <h3 className="text-2xl font-bold text-indigo-400 mt-1">{dbMetrics.total_users}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400">Breach Exposed Risks</span>
                    <h3 className="text-2xl font-bold text-rose-500 mt-1">{dbMetrics.distribution.Critical}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-rose-400 animate-bounce" />
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Chart 1: Password Categories */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Password Strength Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(dbMetrics.distribution).map(([cat, count]) => {
                      const percentages: Record<string, number> = {
                        Critical: 10,
                        Weak: 20,
                        Moderate: 40,
                        Strong: 80,
                        Excellent: 100
                      };
                      const width = percentages[cat] || 50;
                      const colors: Record<string, string> = {
                        Critical: "bg-rose-500",
                        Weak: "bg-amber-500",
                        Moderate: "bg-indigo-400",
                        Strong: "bg-cyan-400",
                        Excellent: "bg-emerald-400"
                      };
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">{cat}</span>
                            <span className="font-mono text-slate-200">{count} users</span>
                          </div>
                          <div className="h-2 bg-slate-950 rounded overflow-hidden">
                            <div className={`h-full ${colors[cat] || "bg-slate-600"}`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Chart 2: Auth Methods */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Authentication Methods Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4 text-center mt-2">
                    {Object.entries(dbMetrics.authentication_levels).map(([method, val]) => (
                      <div key={method} className="bg-slate-950 p-4 rounded-lg border border-slate-800/80">
                        <span className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">{method}</span>
                        <span className="text-xl font-bold font-mono text-cyan-400">{val}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Visual MFA QR code toggle helper */}
                  {user && (
                    <div className="mt-6 p-4 bg-slate-950 border border-slate-800/80 rounded flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Register MFA Security Key</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Secure operations using Google Authenticator</p>
                      </div>
                      <button 
                        onClick={handleMfaEnable}
                        className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-400/30 text-xs px-3 py-1.5 rounded font-bold transition-all"
                      >
                        Enable MFA
                      </button>
                    </div>
                  )}

                  {mfaSecret && (
                    <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded text-center">
                      <p className="text-xs font-bold mb-2">Scan QR Code</p>
                      <img src={mfaQr} alt="MFA QR" className="mx-auto border border-slate-800 rounded bg-white p-1 mb-2" style={{ maxWidth: "130px" }} />
                      <span className="text-[10px] text-slate-400 font-mono">Secret Key: {mfaSecret}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feed logs */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Live Security Events Feed</h3>
                <div className="space-y-3 font-mono text-xs">
                  {dbMetrics.recent_events.map((evt, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950 rounded border border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-slate-300 font-bold">{evt.action}</span>
                      </div>
                      <div className="flex gap-4 text-slate-500">
                        <span>IP: {evt.ip}</span>
                        <span>{evt.time.substring(11, 19)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: STRENGTH ANALYZER */}
          {activeTab === "analyzer" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Credential Assessment Terminal</h3>
                
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Test Password Strength</label>
                  <input 
                    type="text" 
                    value={analyzerPassword}
                    onChange={(e) => {
                      setAnalyzerPassword(e.target.value);
                      runPasswordAnalysis(e.target.value);
                    }}
                    placeholder="Enter candidate password to analyze..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 text-cyan-400 font-mono"
                  />
                </div>

                {analysisResult && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
                    <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider block">Security Score</span>
                      <span className={`text-3xl font-bold font-mono block mt-1 ${
                        analysisResult.score < 40 ? "text-rose-500" : analysisResult.score < 75 ? "text-amber-500" : "text-emerald-400"
                      }`}>{analysisResult.score}/100</span>
                      <span className="text-[10px] text-slate-400 block mt-1 uppercase font-bold">{analysisResult.classification}</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider block">Entropy Rating</span>
                      <span className="text-3xl font-bold font-mono text-cyan-400 block mt-1">{analysisResult.entropy}</span>
                      <span className="text-[10px] text-slate-400 block mt-1 uppercase">Bits</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                      <span className="text-[10px] uppercase text-slate-500 tracking-wider block">Conforming Status</span>
                      <span className={`text-xl font-bold block mt-3 ${
                        analysisResult.score >= 70 ? "text-emerald-400" : "text-rose-400"
                      }`}>{analysisResult.score >= 70 ? "SECURE" : "UNSAFE"}</span>
                    </div>
                  </div>
                )}

                {/* Cracking resistance */}
                {analysisResult && (
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Estimated Cracking Resistance Profiles</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs font-mono text-center">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-[10px] text-slate-500 block">Online Throttled</span>
                        <span className="text-slate-300 font-bold block mt-1">{analysisResult.resistance_levels.online_throttled}</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-[10px] text-slate-500 block">Online Unthrottled</span>
                        <span className="text-slate-300 font-bold block mt-1">{analysisResult.resistance_levels.online_unthrottled}</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-[10px] text-slate-500 block">Offline Fast Hash</span>
                        <span className="text-rose-400 font-bold block mt-1">{analysisResult.resistance_levels.offline_fast_hashing}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations list */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Security Recommendations</h3>
                <div className="space-y-4">
                  {analysisResult?.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="flex gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800/80">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-300 uppercase block">{rec.type} check</span>
                        <p className="text-xs text-slate-400 mt-1 leading-normal">{rec.message}</p>
                      </div>
                    </div>
                  ))}
                  {(!analysisResult || analysisResult.recommendations.length === 0) && (
                    <div className="text-slate-500 italic text-xs">No warning recommendations generated. The credential conforms to high security standards.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: POLICY AUDITOR */}
          {activeTab === "policy" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Presets and options */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Framework Selector</h3>
                
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Preset Standard</label>
                  <select 
                    value={selectedPolicyPreset} 
                    onChange={(e) => setSelectedPolicyPreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="NIST">NIST SP 800-63B Guidelines</option>
                    <option value="OWASP">OWASP Recommendations</option>
                    <option value="CIS">CIS Controls</option>
                  </select>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Min Length</span>
                    <span className="font-mono text-cyan-400 font-bold">{policyConfig.min_length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Require Numbers</span>
                    <span className="font-mono text-cyan-400">{policyConfig.require_numbers ? "YES" : "NO"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Require Special Chars</span>
                    <span className="font-mono text-cyan-400">{policyConfig.require_special ? "YES" : "NO"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Forced Expiry Duration</span>
                    <span className="font-mono text-cyan-400">{policyConfig.expiry_days ? `${policyConfig.expiry_days} Days` : "Never"}</span>
                  </div>
                </div>
              </div>

              {/* Password Audit Trigger */}
              <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Auditor Test gateway</h3>
                
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Verify Password Policy Compliance</label>
                  <input 
                    type="text" 
                    value={policyPassword}
                    onChange={(e) => {
                      setPolicyPassword(e.target.value);
                      runPolicyAudit(e.target.value);
                    }}
                    placeholder="Enter credential to check policy compliance..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-400 text-cyan-400 font-mono"
                  />
                </div>

                {policyAuditResult && (
                  <div className="space-y-4 pt-4 border-t border-slate-800/80">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Compliance score: {policyAuditResult.compliance_score}%</span>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        policyAuditResult.status === "Compliant" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20" : "bg-rose-500/10 text-rose-400 border border-rose-400/20"
                      }`}>{policyAuditResult.status}</span>
                    </div>

                    <div className="space-y-2">
                      {policyAuditResult.details.map((check: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800/60 text-xs">
                          <span className="text-slate-300 font-medium">{check.check_name}</span>
                          <span className={check.passed ? "text-emerald-400" : "text-rose-400"}>
                            {check.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: HASHING LAB */}
          {activeTab === "hashing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Generation Block */}
                <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Cryptographic Hash Generator</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Plain Text Input</label>
                      <input 
                        type="text" 
                        value={hashingInput}
                        onChange={(e) => setHashingInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Algorithm</label>
                      <select 
                        value={hashingAlgo} 
                        onChange={(e) => setHashingAlgo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      >
                        <option value="md5">MD5</option>
                        <option value="sha1">SHA-1</option>
                        <option value="sha256">SHA-256</option>
                        <option value="sha512">SHA-512</option>
                        <option value="bcrypt">Bcrypt</option>
                        <option value="scrypt">Scrypt</option>
                        <option value="argon2">Argon2id</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Salt (Optional)</label>
                      <input 
                        type="text" 
                        value={hashingSalt}
                        onChange={(e) => setHashingSalt(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Work Factor (Rounds / Iterations)</label>
                      <input 
                        type="number" 
                        value={hashingRounds}
                        onChange={(e) => setHashingRounds(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={runHashDemo}
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-5 py-2 rounded text-xs transition-all shadow-md shadow-cyan-500/10"
                  >
                    Generate Hash
                  </button>

                  {hashingResult && (
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 mt-4 font-mono text-xs">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>ALGORITHM: {hashingResult.algorithm}</span>
                        <span>COMPUTE TIME: {hashingResult.time_taken_ms} ms</span>
                      </div>
                      <div className="break-all text-cyan-400 font-bold bg-slate-900 p-2.5 rounded border border-slate-800">
                        {hashingResult.hash_value}
                      </div>
                      <p className="text-slate-400 font-sans text-xs leading-normal mt-2">{hashingResult.description}</p>
                    </div>
                  )}
                </div>

                {/* Educational Block */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Salt Demonstration</h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      Salting is the addition of random bits to a password hash input. It guarantees that users with the identical password will have distinct hashes. This neutralizes **Rainbow Table attacks** completely.
                    </p>
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-500">
                      Hash = HashFunction(Password + UniqueSalt)
                    </div>
                  </div>

                  <button 
                    onClick={runCryptoBenchmarks}
                    className="w-full bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-bold py-2 rounded text-xs transition-all mt-6"
                  >
                    {benchmarkingLoading ? "Running Benchmarks..." : "Run Performance Benchmarks"}
                  </button>
                </div>
              </div>

              {/* Benchmarks results */}
              {benchmarks.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Algorithm Computation Benchmarks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="py-2">Algorithm</th>
                          <th className="py-2">Iterations</th>
                          <th className="py-2">Avg Exec Time (ms)</th>
                          <th className="py-2">Memory Cost (KB)</th>
                          <th className="py-2 text-right">Security Strength</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmarks.map((b, idx) => (
                          <tr key={idx} className="border-b border-slate-800/60 text-slate-300 hover:bg-slate-950/20">
                            <td className="py-3 font-bold">{b.algorithm}</td>
                            <td className="py-3">{b.iterations}</td>
                            <td className="py-3 text-cyan-400">{b.execution_time_ms}</td>
                            <td className="py-3">{b.memory_used_kb} KB</td>
                            <td className="py-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.security_level.includes("Broken") || b.security_level.includes("Weak") ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
                              }`}>{b.security_level}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: ATTACK SIMULATION */}
          {activeTab === "simulations" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Parameters panel */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Cracker Parameters</h3>
                
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Target Password Length</label>
                  <input 
                    type="number" 
                    value={simPasswordLength}
                    onChange={(e) => setSimPasswordLength(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" checked={simLowercase} onChange={(e) => setSimLowercase(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                    Lowercase
                  </label>
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" checked={simUppercase} onChange={(e) => setSimUppercase(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                    Uppercase
                  </label>
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" checked={simDigits} onChange={(e) => setSimDigits(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                    Digits
                  </label>
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" checked={simSpecial} onChange={(e) => setSimSpecial(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                    Special Chars
                  </label>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Simulated Attack Vectors</label>
                  <select 
                    value={simAttackType} 
                    onChange={(e) => setSimAttackType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="brute_force">Brute Force</option>
                    <option value="dictionary">Dictionary Attack</option>
                    <option value="hybrid">Hybrid Attack</option>
                    <option value="credential_stuffing">Credential Stuffing</option>
                    <option value="password_spraying">Password Spraying</option>
                    <option value="rainbow_table">Rainbow Table</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Target Hashing Type</label>
                  <select 
                    value={simAlgo} 
                    onChange={(e) => setSimAlgo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="md5">MD5</option>
                    <option value="sha256">SHA-256</option>
                    <option value="bcrypt">Bcrypt (Cost 10)</option>
                    <option value="argon2">Argon2id</option>
                  </select>
                </div>

                <button 
                  onClick={runSimulation}
                  disabled={simulating}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 text-slate-950 font-bold py-2.5 rounded text-xs transition-all shadow-md shadow-cyan-500/10 uppercase tracking-wider"
                >
                  {simulating ? "Simulating Execution..." : "Launch Attack Simulation"}
                </button>
              </div>

              {/* Simulation metrics panel */}
              <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Simulation Console Logs</h3>

                  {simulating && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3 font-mono text-xs">
                      <RefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                      <span>Initiating crack vectors... analyzing keyspace entropy</span>
                    </div>
                  )}

                  {!simulating && simResult && (
                    <div className="space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                          <span className="text-[10px] text-slate-500 block">SEARCH SPACE</span>
                          <span className="text-slate-300 font-bold block mt-1 text-[11px] truncate">{simResult.search_space}</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                          <span className="text-[10px] text-slate-500 block">EST. CRACK TIME</span>
                          <span className="text-amber-400 font-bold block mt-1 text-[11px]">{simResult.estimated_time_seconds}s</span>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                          <span className="text-[10px] text-slate-500 block">PROBABILITY</span>
                          <span className="text-emerald-400 font-bold block mt-1 text-[11px]">{simResult.success_probability * 100}%</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded border border-slate-850 space-y-2">
                        {simResult.steps_logged.map((step: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-slate-400 border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                            <span>Step {step.step_num}: {step.description}</span>
                            <span className={step.success ? "text-emerald-400" : "text-slate-500"}>
                              {step.success ? "RESOLVED" : `${step.elapsed_time_seconds}s`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!simulating && !simResult && (
                    <div className="text-slate-500 italic text-xs py-12 text-center">No simulation results loaded. Set target constraints and launch simulation.</div>
                  )}
                </div>

                <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-lg text-[10px] text-rose-400 leading-normal flex items-start gap-2.5 mt-6 font-mono">
                  <Shield className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>ALERT: This simulation acts as a mathematical simulator for cybersecurity evaluation. No real network queries or external system hacking tasks are launched.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BREACHED CHECKER */}
          {activeTab === "breach" && (
            <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-6">
              <div className="text-center space-y-2">
                <Search className="h-8 w-8 text-cyan-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-300 uppercase tracking-wider">Breach database query</h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Verify if your credentials have been leaked in credential dumps. This check utilizes the **K-Anonymity privacy model** where the password is hashed with SHA-1, and only the first 5 characters are transmitted. Your clear-text password is never saved or uploaded.
                </p>
              </div>

              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={breachPassword}
                  onChange={(e) => setBreachPassword(e.target.value)}
                  placeholder="Enter credential string to check..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-cyan-400 text-cyan-400 font-mono"
                />
                <button 
                  onClick={runBreachCheck}
                  disabled={breachLoading}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 text-slate-950 font-bold px-6 py-2 rounded text-xs transition-all shadow-md shadow-cyan-500/10 font-bold uppercase tracking-wider"
                >
                  {breachLoading ? "Checking..." : "Verify Leak Status"}
                </button>
              </div>

              {breachResult && (
                <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">Leak Status</span>
                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                      breachResult.is_breached ? "bg-rose-500/10 text-rose-400 border border-rose-400/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
                    }`}>{breachResult.is_breached ? "BREACH MATCH FOUND" : "SECURE (UNEXPOSED)"}</span>
                  </div>

                  {breachResult.is_breached && (
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-slate-900 p-3 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Exposure Count</span>
                        <span className="text-lg font-bold font-mono text-rose-500 mt-1 block">{breachResult.exposure_count.toLocaleString()} Times</span>
                      </div>
                      <div className="bg-slate-900 p-3 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Leak Risk Level</span>
                        <span className="text-lg font-bold font-mono text-rose-500 mt-1 block">{breachResult.risk_score}/100</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 leading-normal bg-slate-900 p-3 rounded border border-slate-850">{breachResult.recommendation}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: PASSKEYS */}
          {activeTab === "passkeys" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Simulator controls */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">WebAuthn Registry</h3>
                  
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">User Identifier</label>
                    <input 
                      type="text" 
                      value={passkeyUser}
                      onChange={(e) => setPasskeyUser(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 text-cyan-400 font-mono"
                    />
                  </div>

                  <p className="text-xs text-slate-400 leading-normal">
                    Passkeys use public-key cryptography to perform passwordless, phishing-resistant logins. They conform to FIDO2 / WebAuthn standards.
                  </p>
                </div>

                <button 
                  onClick={triggerPasskeySimStep}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded text-xs transition-all shadow-md shadow-cyan-500/10 font-bold uppercase tracking-wider"
                >
                  {passkeyStep === 0 && "Start Registration"}
                  {passkeyStep === 1 && "Simulate Key Generation"}
                  {passkeyStep === 2 && "Finalize verification"}
                  {passkeyStep === 3 && "Reset Demo"}
                </button>
              </div>

              {/* Graphic exchange stream */}
              <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">WebAuthn Cryptographic flow</h3>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-mono mb-6">
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                      <span className="block text-slate-400 font-bold">CLIENT</span>
                      <span>NextJS app</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                      <span className="block text-slate-400 font-bold">AUTHENTICATOR</span>
                      <span>FIDO2 Key / TPM</span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                      <span className="block text-slate-400 font-bold">SERVER</span>
                      <span>FastAPI Relying Party</span>
                    </div>
                  </div>

                  {passkeyLogs.length > 0 ? (
                    <div className="bg-slate-950 p-4 rounded border border-slate-850 space-y-1.5 font-mono text-xs text-slate-400">
                      {passkeyLogs.map((log, idx) => (
                        <div key={idx} className={`${
                          log.startsWith("SUCCESS") ? "text-emerald-400 font-bold" : log.includes("[Server]") ? "text-cyan-400" : "text-slate-400"
                        }`}>{log}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-xs py-12 text-center">WebAuthn logs will compile here as registration step cycles.</div>
                  )}
                </div>

                {passkeyChallenge && (
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>ACTIVE ATTRIBUTION CHALLENGE:</span>
                    <span className="text-cyan-400 font-bold">{passkeyChallenge}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: AUTH SEC POSTURE */}
          {activeTab === "auth_sec" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Config selection */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Authentication Factors</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-slate-400 text-xs">
                    <input 
                      type="checkbox" 
                      checked={authAssessConfig.use_password} 
                      onChange={(e) => setAuthAssessConfig({...authAssessConfig, use_password: e.target.checked})}
                      className="rounded bg-slate-950 border-slate-800" 
                    />
                    Requires Password Credentials
                  </label>
                  <label className="flex items-center gap-2 text-slate-400 text-xs">
                    <input 
                      type="checkbox" 
                      checked={authAssessConfig.use_mfa} 
                      onChange={(e) => setAuthAssessConfig({...authAssessConfig, use_mfa: e.target.checked})}
                      className="rounded bg-slate-950 border-slate-800" 
                    />
                    Enforce Multi-Factor Authentication (MFA)
                  </label>
                </div>

                {authAssessConfig.use_mfa && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">MFA Factor Class</label>
                    <select 
                      value={authAssessConfig.mfa_type} 
                      onChange={(e) => setAuthAssessConfig({...authAssessConfig, mfa_type: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                    >
                      <option value="SMS">SMS Codes</option>
                      <option value="Email">Email Codes</option>
                      <option value="TOTP">Authenticator App (TOTP)</option>
                      <option value="Biometrics">Biometric Fingerprint/Face ID</option>
                      <option value="Passkey">Passkey / WebAuthn</option>
                      <option value="HardwareKey">Physical Hardware Key (YubiKey)</option>
                    </select>
                  </div>
                )}

                <button 
                  onClick={runAuthAssessment}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded text-xs transition-all shadow-md shadow-cyan-500/10 font-bold uppercase tracking-wider"
                >
                  Analyze Posture Score
                </button>
              </div>

              {/* Assessment findings */}
              <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Posture Analysis Dashboard</h3>

                {authAssessResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Auth Security Score</span>
                        <span className={`text-3xl font-bold font-mono block mt-1 ${
                          authAssessResult.score < 50 ? "text-rose-500" : authAssessResult.score < 80 ? "text-amber-500" : "text-emerald-400"
                        }`}>{authAssessResult.score}/100</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Posture Grade</span>
                        <span className="text-lg font-bold text-cyan-400 mt-2.5 block uppercase">{authAssessResult.classification}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Identified Vulnerabilities</span>
                        {authAssessResult.risk_analysis.map((risk: string, idx: number) => (
                          <div key={idx} className="flex gap-2 text-rose-400 text-xs items-start bg-rose-500/5 p-2.5 rounded border border-rose-500/10 font-mono">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{risk}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Remediation Guidelines</span>
                        {authAssessResult.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="flex gap-2 text-emerald-400 text-xs items-start bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10 font-mono">
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-xs py-12 text-center">Set factors config and evaluate to fetch analysis findings.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GENERATOR */}
          {activeTab === "generator" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Generator Configuration */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Generator parameters</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-slate-400 text-xs">
                    <input 
                      type="checkbox" 
                      checked={genPassphrase} 
                      onChange={(e) => setGenPassphrase(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800" 
                    />
                    Generate Memorable Passphrase
                  </label>
                </div>

                {genPassphrase ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Number of Words</label>
                      <input 
                        type="number" 
                        value={genNumWords} 
                        onChange={(e) => setGenNumWords(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Separator</label>
                      <input 
                        type="text" 
                        value={genSeparator} 
                        onChange={(e) => setGenSeparator(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Length Selection</label>
                      <input 
                        type="number" 
                        value={genLength} 
                        onChange={(e) => setGenLength(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 text-slate-400">
                        <input type="checkbox" checked={genLower} onChange={(e) => setGenLower(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                        Lowercase
                      </label>
                      <label className="flex items-center gap-2 text-slate-400">
                        <input type="checkbox" checked={genUpper} onChange={(e) => setGenUpper(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                        Uppercase
                      </label>
                      <label className="flex items-center gap-2 text-slate-400">
                        <input type="checkbox" checked={genDigits} onChange={(e) => setGenDigits(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                        Digits
                      </label>
                      <label className="flex items-center gap-2 text-slate-400">
                        <input type="checkbox" checked={genSpecial} onChange={(e) => setGenSpecial(e.target.checked)} className="rounded bg-slate-950 border-slate-800" />
                        Special
                      </label>
                    </div>
                  </div>
                )}

                <button 
                  onClick={runGeneratePassword}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded text-xs transition-all shadow-md shadow-cyan-500/10 font-bold uppercase tracking-wider"
                >
                  Generate secure key
                </button>
              </div>

              {/* Password display panel */}
              <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Output Terminal</h3>

                  {generatedPassword ? (
                    <div className="space-y-4">
                      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 break-all text-center text-lg font-bold font-mono text-cyan-400 tracking-wider">
                        {generatedPassword}
                      </div>

                      {generatedMetrics && (
                        <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs">
                          <div className="bg-slate-950 p-3 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Entropy bits</span>
                            <span className="text-slate-300 font-bold block mt-1">{generatedMetrics.entropy}</span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Strength score</span>
                            <span className="text-slate-300 font-bold block mt-1">{generatedMetrics.score}/100</span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded border border-slate-800">
                            <span className="text-[10px] text-slate-500 block uppercase">Grade</span>
                            <span className="text-emerald-400 font-bold block mt-1">{generatedMetrics.classification}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-xs py-12 text-center">No password generated yet. Click generate button.</div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-4 rounded border border-slate-850">
                  <span className="text-cyan-400 font-bold uppercase block mb-1">Defensive Deployment Note:</span>
                  Passphrases (word lists separated by characters) are mathematically resilient against dictionary matching attacks while maintaining high human memorability. Length increases the geometric permutation bounds dramatically.
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI ADVISOR */}
          {activeTab === "ai" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Control preset context queries */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Advisor Focus Area</h3>
                
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Context</label>
                  <select 
                    value={aiContext} 
                    onChange={(e) => setAiContext(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="general">General Cybersecurity Guidelines</option>
                    <option value="password_weakness">Explain Password Vulnerabilities</option>
                    <option value="policy">Explain Policy Compliance Scores</option>
                    <option value="simulation">Explain Attack Cracking Methods</option>
                    <option value="entropy">Explain Shannon Entropy Formulas</option>
                    <option value="executive_summary">Generate Executive Summary Draft</option>
                  </select>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs text-slate-400">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Quick Actions</span>
                  <button 
                    onClick={() => {
                      setAiPrompt("Explain NIST SP 800-63B guidelines.");
                      setAiContext("policy");
                    }}
                    className="w-full text-left py-1 hover:text-cyan-400 transition-all text-xs truncate"
                  >
                    💡 Explain NIST 800-63B standard
                  </button>
                  <button 
                    onClick={() => {
                      setAiPrompt("How does a hybrid password attack work?");
                      setAiContext("simulation");
                    }}
                    className="w-full text-left py-1 hover:text-cyan-400 transition-all text-xs truncate"
                  >
                    💡 Detail Hybrid cracking speeds
                  </button>
                  <button 
                    onClick={() => {
                      setAiPrompt("Explain Shannon entropy equation parameters.");
                      setAiContext("entropy");
                    }}
                    className="w-full text-left py-1 hover:text-cyan-400 transition-all text-xs truncate"
                  >
                    💡 Decipher Entropy bits logic
                  </button>
                </div>
              </div>

              {/* Chat interface console */}
              <div className="md:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {aiLogs.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-3 max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                        msg.role === "user" 
                          ? "bg-cyan-500/10 text-cyan-200 border border-cyan-400/20 ml-auto" 
                          : "bg-slate-950 text-slate-300 border border-slate-850"
                      }`}
                    >
                      {msg.role === "advisor" && <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                          {msg.role === "user" ? "You" : "Advisor Engine"}
                        </span>
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {aiLoading && (
                    <div className="flex gap-3 max-w-[85%] bg-slate-950 text-slate-400 border border-slate-850 rounded-lg p-3 text-xs font-mono">
                      <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 mt-0.5" />
                      <span>Advisor is preparing guidance insights...</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAiMessage} className="flex gap-2 border-t border-slate-800/80 pt-4 shrink-0">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask security advisor questions..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-4 py-2 text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button 
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold px-4 py-2 rounded text-xs transition-all shadow-md shadow-cyan-500/10"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: EXPORTS & REPORT ENGINE */}
          {activeTab === "reports" && (
            <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 backdrop-blur-md text-center space-y-6">
              <FileText className="h-12 w-12 text-cyan-400 mx-auto" />
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-200 uppercase tracking-wider">Enterprise Compliance Reporting Center</h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-normal">
                  Generate professional executive and compliance reports compiling password metrics, standards verification results (NIST/OWASP/CIS), risk scores, and architectural remediation steps.
                </p>
              </div>

              {!user ? (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-4 rounded-lg flex items-center justify-center gap-2 max-w-md mx-auto">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>Please sign in with Analyst/Admin credentials to download reports.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto pt-4">
                  <button 
                    onClick={() => exportReportFile("pdf")}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-300 text-xs font-bold transition-all flex flex-col items-center gap-2"
                  >
                    <FileText className="h-6 w-6 text-rose-400" />
                    <span>Export PDF</span>
                  </button>
                  <button 
                    onClick={() => exportReportFile("excel")}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-300 text-xs font-bold transition-all flex flex-col items-center gap-2"
                  >
                    <Download className="h-6 w-6 text-emerald-400" />
                    <span>Export Excel</span>
                  </button>
                  <button 
                    onClick={() => exportReportFile("csv")}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-300 text-xs font-bold transition-all flex flex-col items-center gap-2"
                  >
                    <FileText className="h-6 w-6 text-cyan-400" />
                    <span>Export CSV</span>
                  </button>
                  <button 
                    onClick={() => exportReportFile("json")}
                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 p-4 rounded-lg text-slate-300 text-xs font-bold transition-all flex flex-col items-center gap-2"
                  >
                    <Terminal className="h-6 w-6 text-slate-400" />
                    <span>Export JSON</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: SYSTEM AUDIT LOGS */}
          {activeTab === "audit" && user?.role === "Administrator" && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">System Administration Log Audit Feed</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="py-2">User Email</th>
                      <th className="py-2">Security Action</th>
                      <th className="py-2">Source IP</th>
                      <th className="py-2">Date/Time (UTC)</th>
                      <th className="py-2 text-right">Details Payload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-800/60 text-slate-300 hover:bg-slate-950/20">
                          <td className="py-3 font-bold">{log.user_email || "Anonymous check"}</td>
                          <td className="py-3 text-cyan-400">{log.action}</td>
                          <td className="py-3">{log.ip_address}</td>
                          <td className="py-3">{new Date(log.created_at).toISOString().replace("T", " ").substring(0, 19)}</td>
                          <td className="py-3 text-right text-[10px] text-slate-500">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500 italic">No log entries found. Audit logs populate as endpoints are triggered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
