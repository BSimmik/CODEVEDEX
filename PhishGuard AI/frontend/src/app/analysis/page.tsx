"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  Terminal, 
  Search, 
  AlertOctagon, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle,
  Link,
  ChevronRight,
  Info
} from "lucide-react";

export default function AnalysisSandboxPage() {
  const [activeTab, setActiveTab] = useState<"email" | "url">("email");

  // Email Analysis State
  const [headers, setHeaders] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailResult, setEmailResult] = useState<any | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // URL Analysis State
  const [url, setUrl] = useState("");
  const [urlResult, setUrlResult] = useState<any | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);

  const handleEmailAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailContent) return;
    
    setEmailLoading(true);
    setEmailResult(null);
    try {
      const data = await fetchApi("/analysis/email", {
        method: "POST",
        body: JSON.stringify({ headers, content: emailContent }),
      });
      setEmailResult(data);
    } catch (err: any) {
      alert("Email analysis failed: " + err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUrlAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setUrlLoading(true);
    setUrlResult(null);
    try {
      const data = await fetchApi("/analysis/url", {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setUrlResult(data);
    } catch (err: any) {
      alert("URL analysis failed: " + err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="p-6 rounded-xl glass-panel border-l-4 border-cyber-primary">
        <h2 className="text-xl font-extrabold text-white">Threat Indicators Analysis Sandbox</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Evaluate email headers, suspicious content blocks, or strange links to identify risk profiles before interacting.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-cyber-cardBorder/50 pb-px">
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "email"
              ? "border-cyber-primary text-cyber-primary"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Email Analysis Trainer
        </button>
        <button
          onClick={() => setActiveTab("url")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "url"
              ? "border-cyber-primary text-cyber-primary"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Link className="w-4 h-4" />
          URL Inspection Lab
        </button>
      </div>

      {/* Viewport */}
      {activeTab === "email" ? (
        /* Email Sandbox Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email analyzer Form */}
          <div className="p-6 rounded-xl glass-panel">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Inspect Email Content</h3>
            <form onSubmit={handleEmailAnalyze} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Email Headers (Optional)</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder="Paste RFC 5322 email headers here (From: ..., Return-Path: ...)"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Email Body Content</label>
                <textarea
                  required
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Paste raw email body message or copy text block here..."
                  rows={6}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="py-3 bg-cyber-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-cyber-primary/80 transition-all uppercase tracking-wider"
              >
                {emailLoading ? "Parsing threat factors..." : "Scan Email Indicators"}
              </button>
            </form>
          </div>

          {/* Email Analysis Response */}
          <div className="flex flex-col gap-6">
            {emailResult ? (
              <div className="p-6 rounded-xl glass-panel-neon flex flex-col gap-6">
                {/* Risk score block */}
                <div className="flex justify-between items-center border-b border-cyber-cardBorder/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Risk Classification</span>
                    <h4 className="text-sm font-black text-white">{emailResult.risk_category} Threat Profile</h4>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-black text-xs ${
                    emailResult.risk_score >= 70 ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' :
                    emailResult.risk_score >= 40 ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' :
                    'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                  }`}>
                    Score: {emailResult.risk_score}/100
                  </div>
                </div>

                {/* Explanation text */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-cyber-primary tracking-wider">Threat Explanation:</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-lg border border-cyber-cardBorder/30">
                    {emailResult.threat_explanation}
                  </p>
                </div>

                {/* Indicators grid */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">Key Markers Identified:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border text-[10px] font-bold ${
                      emailResult.indicators.urgency ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-slate-900 border-cyber-cardBorder text-slate-500'
                    }`}>
                      🔴 Urgency Language Context
                    </div>
                    <div className={`p-3 rounded-lg border text-[10px] font-bold ${
                      emailResult.indicators.sender_mismatch ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-slate-900 border-cyber-cardBorder text-slate-500'
                    }`}>
                      🔴 Sender Display Mismatch
                    </div>
                    <div className={`p-3 rounded-lg border text-[10px] font-bold ${
                      emailResult.indicators.suspicious_links ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-slate-900 border-cyber-cardBorder text-slate-500'
                    }`}>
                      🔴 Contains External Links
                    </div>
                    <div className={`p-3 rounded-lg border text-[10px] font-bold ${
                      emailResult.indicators.credential_harvest ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-slate-900 border-cyber-cardBorder text-slate-500'
                    }`}>
                      🔴 Credentials Call-To-Action
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="flex flex-col gap-3 border-t border-cyber-cardBorder/40 pt-4">
                  <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">Safety Recommendations:</span>
                  <ul className="text-slate-300 text-[10.5px] leading-relaxed list-disc pl-4 flex flex-col gap-1.5">
                    {emailResult.security_recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl glass-panel text-center py-16 flex flex-col items-center justify-center gap-3">
                <Search className="w-8 h-8 text-slate-600 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase">Inspection Deck Empty</h4>
                <p className="text-[10px] text-cyber-textMuted px-4 leading-relaxed">
                  Enter email information and run the analyzer to verify structural threat percentages.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* URL Inspection Lab Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* URL inspector form */}
          <div className="p-6 rounded-xl glass-panel">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Inspect Link safety</h3>
            <form onSubmit={handleUrlAnalyze} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Target URL Address</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://secure-chase-account-verify.net/signin"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={urlLoading}
                className="py-3 bg-cyber-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-cyber-primary/80 transition-all uppercase tracking-wider"
              >
                {urlLoading ? "Mapping URL routing redirects..." : "Inspect URL Credentials"}
              </button>
            </form>
          </div>

          {/* URL Analysis Response view */}
          <div className="flex flex-col gap-6">
            {urlResult ? (
              <div className="p-6 rounded-xl glass-panel-neon flex flex-col gap-6">
                {/* Risk score header */}
                <div className="flex justify-between items-center border-b border-cyber-cardBorder/50 pb-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">URL Threat level</span>
                    <h4 className="text-sm font-black text-white">{urlResult.risk_category} Risk</h4>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-black text-xs ${
                    urlResult.risk_score >= 70 ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400' :
                    urlResult.risk_score >= 40 ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' :
                    'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                  }`}>
                    Score: {urlResult.risk_score}/100
                  </div>
                </div>

                {/* Heuristic metadata row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded-lg text-center border border-cyber-cardBorder/40">
                    <span className="text-[8px] uppercase font-bold text-cyber-textMuted block">Domain Age</span>
                    <span className="text-xs font-bold text-white mt-1 block">{urlResult.domain_age_years} yrs</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-center border border-cyber-cardBorder/40">
                    <span className="text-[8px] uppercase font-bold text-cyber-textMuted block">Typosquatting</span>
                    <span className={`text-xs font-bold mt-1 block ${urlResult.typo_squatting ? 'text-rose-400' : 'text-slate-400'}`}>
                      {urlResult.typo_squatting ? "Detected" : "Clean"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-center border border-cyber-cardBorder/40">
                    <span className="text-[8px] uppercase font-bold text-cyber-textMuted block">External Redirect</span>
                    <span className={`text-xs font-bold mt-1 block ${urlResult.has_redirects ? 'text-rose-400' : 'text-slate-400'}`}>
                      {urlResult.has_redirects ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-cyber-primary tracking-wider">Threat Indicators Breakdown:</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-lg border border-cyber-cardBorder/30">
                    {urlResult.explanation}
                  </p>
                </div>

                {/* Safe browsing recs */}
                <div className="flex flex-col gap-3 border-t border-cyber-cardBorder/40 pt-4">
                  <span className="text-[10px] uppercase font-bold text-cyber-textMuted tracking-wider">URL Protection Advice:</span>
                  <ul className="text-slate-300 text-[10.5px] leading-relaxed list-disc pl-4 flex flex-col gap-1.5">
                    {urlResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl glass-panel text-center py-16 flex flex-col items-center justify-center gap-3">
                <Search className="w-8 h-8 text-slate-600 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase">URL Inspector Empty</h4>
                <p className="text-[10px] text-cyber-textMuted px-4 leading-relaxed">
                  Submit link parameters (HTTP address) to evaluate domains against phishing structural patterns.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
