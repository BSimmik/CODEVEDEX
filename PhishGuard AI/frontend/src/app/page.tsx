"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  ShieldAlert, 
  User, 
  TrendingDown, 
  FileText, 
  Activity, 
  RefreshCw, 
  Download, 
  AlertTriangle,
  QrCode,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [role, setRole] = useState("");
  const [mfaSecretData, setMfaSecretData] = useState<{ secret: string; provisioning_uri: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [mfaError, setMfaError] = useState("");

  const loadData = async () => {
    try {
      const data = await fetchApi("/risk/dashboard");
      setDashboard(data);
      
      const me = await fetchApi("/auth/me");
      setRole(me.role);
      setMfaEnabled(me.mfa_enabled);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetchApi("/risk/calculate", { method: "POST" });
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Recalculate failed or permissions denied.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownload = async (format: "pdf" | "csv" | "json") => {
    try {
      const endpoint = `/reports/export/${format}`;
      const blob = await fetchApi(endpoint);
      
      if (format === "json") {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(blob, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `PhishGuard_Security_Report.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        return;
      }

      // PDF or CSV
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PhishGuard_Security_Report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Failed to export report format. Verify your organizational access levels.");
    }
  };

  const handleMfaSetup = async () => {
    try {
      setMfaError("");
      const data = await fetchApi("/auth/mfa/setup", { method: "POST" });
      setMfaSecretData(data);
    } catch (err: any) {
      setMfaError(err.message || "Failed to setup MFA.");
    }
  };

  const handleMfaVerifyAndEnable = async () => {
    try {
      setMfaError("");
      await fetchApi("/auth/mfa/enable", {
        method: "POST",
        body: JSON.stringify({ username: "", code: mfaCode }) // Username injected from token headers
      });
      setMfaSuccess(true);
      setMfaEnabled(true);
      setMfaSecretData(null);
    } catch (err: any) {
      setMfaError(err.message || "Invalid validation token.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  // Prep department comparison data
  const deptChartData = dashboard?.departments ? Object.entries(dashboard.departments).map(([name, data]: any) => ({
    name,
    score: Math.round(data.score),
  })) : [];

  const canManageReports = ["Super Admin", "Security Trainer", "Analyst"].includes(role);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center p-6 rounded-xl glass-panel relative overflow-hidden border-l-4 border-cyber-primary">
        <div>
          <h2 className="text-xl font-extrabold text-white">Security Operations Console</h2>
          <p className="text-xs text-cyber-textMuted mt-1">Review organizational threat vectors, employee simulation histories, and compliance readiness stats.</p>
        </div>
        {canManageReports && (
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-primary text-slate-950 text-xs font-bold rounded-lg hover:bg-cyber-primary/80 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate Org Risk
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-5 rounded-xl glass-panel flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">Monitored Personnel</span>
          <span className="text-2xl font-black text-white">{dashboard?.total_users || 0}</span>
          <span className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-semibold">Active directory synchronized</span>
        </div>

        <div className="p-5 rounded-xl glass-panel flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">Simulations Dispatched</span>
          <span className="text-2xl font-black text-white">{dashboard?.total_simulations || 0}</span>
          <span className="text-[10px] text-cyber-textMuted mt-2 flex items-center gap-1 font-semibold">Safe sandbox campaigns</span>
        </div>

        <div className="p-5 rounded-xl glass-panel flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">Simulation Clicks</span>
          <span className="text-2xl font-black text-rose-400">{dashboard?.clicks_count || 0}</span>
          <span className="text-[10px] text-rose-500 flex items-center gap-1 font-semibold mt-2">Requires remediation training</span>
        </div>

        <div className="p-5 rounded-xl glass-panel flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">Quizzes Passed</span>
          <span className="text-2xl font-black text-emerald-400">{dashboard?.quizzes_passed || 0}</span>
          <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-semibold mt-2">
            Success Rate: {dashboard?.quizzes_taken > 0 ? Math.round((dashboard.quizzes_passed / dashboard.quizzes_taken) * 100) : 100}%
          </span>
        </div>
      </div>

      {/* Main Charts & Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk score gauge card */}
        <div className="lg:col-span-1 p-6 rounded-xl glass-panel flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Global Threat Index</h3>
            <p className="text-[11px] text-cyber-textMuted mb-4">Calculated based on active employee click counts vs quiz credits.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-slate-800 border-t-cyber-primary neon-border-cyan animate-pulse-glow">
              <div className="text-center">
                <span className="text-4xl font-black tracking-tight text-white">{Math.round(dashboard?.organization_risk || 50)}</span>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-cyber-primary mt-1">{dashboard?.organization_level || 'Medium'}</p>
              </div>
            </div>
          </div>

          <div className="text-center px-4">
            <span className="text-[10px] text-cyber-textMuted uppercase font-bold block mb-1">Security Alert Level</span>
            <p className="text-[11px] font-semibold text-slate-300">
              {dashboard?.organization_risk >= 75 ? "🔴 CRITICAL: Mandatory simulation review recommended." : 
               dashboard?.organization_risk >= 50 ? "🟡 HIGH: Review credential phishing modules." : 
               "🟢 STABLE: Normal baseline operations."}
            </p>
          </div>
        </div>

        {/* Line graph of risk trends */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Threat Index Trends</h3>
          <div className="h-56">
            {dashboard?.trends && dashboard.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }}
                    labelStyle={{ color: "#06b6d4", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-cyber-textMuted">
                Seeding initial metrics. Recalculate score history to display trend lines.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Heatmap and administrative actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department bar chart */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Department Threat Factor</h3>
          <div className="h-56">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b0f19", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10 }}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {deptChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.score >= 70 ? "#f43f5e" : entry.score >= 45 ? "#f59e0b" : "#10b981"} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-cyber-textMuted">
                No departmental data calculated yet.
              </div>
            )}
          </div>
        </div>

        {/* MFA setup panel */}
        <div className="lg:col-span-1 p-6 rounded-xl glass-panel flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-2">Credential Verification Guard</h3>
            <p className="text-[11px] text-cyber-textMuted mb-4">Secure your profile login with time-based multi-factor tokens (TOTP).</p>
          </div>

          <div className="py-4">
            {mfaEnabled ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xs font-bold text-white">Multi-Factor Guard Enabled</h4>
                <p className="text-[10px] text-cyber-textMuted px-4">Your administrative login requires authentication challenge codes.</p>
              </div>
            ) : mfaSecretData ? (
              <div className="flex flex-col gap-4 text-center items-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-cyber-cardBorder">
                  <QrCode className="w-20 h-20 text-cyber-primary" />
                </div>
                <div className="w-full text-left">
                  <span className="text-[9px] uppercase font-bold text-cyber-textMuted">Secret:</span>
                  <code className="block p-1 bg-slate-900 text-[10px] text-cyber-primary font-mono select-all text-center rounded">{mfaSecretData.secret}</code>
                </div>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Verify code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-2 py-1.5 rounded bg-slate-900 border border-cyber-cardBorder text-center font-mono text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleMfaVerifyAndEnable}
                    className="px-3 py-1.5 bg-cyber-primary text-slate-950 text-xs font-bold rounded"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500">
                  <LockKeyhole className="w-8 h-8" />
                </div>
                <h4 className="text-xs font-bold text-white">MFA Configuration Missing</h4>
                <p className="text-[10px] text-cyber-textMuted mb-2">Generate a secret key to hook PhishGuard with Google Authenticator.</p>
                <button
                  onClick={handleMfaSetup}
                  className="px-4 py-2 bg-cyber-secondary text-white font-semibold text-[10px] rounded-lg hover:bg-cyber-secondary/80 transition-all uppercase tracking-wider"
                >
                  Configure Token Key
                </button>
              </div>
            )}
            {mfaError && <p className="text-[10px] text-rose-400 mt-2 text-center">{mfaError}</p>}
          </div>

          <div className="text-[9px] text-cyber-textMuted text-center border-t border-cyber-cardBorder/50 pt-3">
            Supports Google Authenticator, Duo Security, and Yubico.
          </div>
        </div>
      </div>

      {/* Exporter control area for admins */}
      {canManageReports && (
        <div className="p-6 rounded-xl glass-panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Export Audit Compliance Pack</h3>
              <p className="text-[11px] text-cyber-textMuted mt-1">Export raw risk distribution tables, department clicks, and training checklists for regulatory audit boards.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDownload("pdf")}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-cyber-cardBorder rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-cyber-primary" />
                PDF Report
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-cyber-cardBorder rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-cyber-primary" />
                CSV Dataset
              </button>
              <button
                onClick={() => handleDownload("json")}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-cyber-cardBorder rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-cyber-primary" />
                JSON Dump
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
