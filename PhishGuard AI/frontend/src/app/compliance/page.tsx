"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  Bookmark, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  FileSpreadsheet, 
  ClipboardCheck 
} from "lucide-react";

export default function CompliancePage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/risk/dashboard")
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Bookmark className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  // Calculate mock compliance states based on real dashboard metrics
  const mfaSet = dashboard?.total_users > 0; // if users are initialized
  const trainingTaken = (dashboard?.quizzes_taken || 0) > 0;
  const trainingPassed = (dashboard?.quizzes_passed || 0) > 0;
  const simRun = (dashboard?.total_simulations || 0) > 0;

  const frameworks = [
    {
      id: "NIST-CSF-PR-AT",
      name: "NIST Cybersecurity Framework",
      control: "PR.AT-1 (Awareness & Training)",
      desc: "Ensure all personnel are trained on corporate security policies and social engineering risks.",
      status: trainingPassed ? "Met" : trainingTaken ? "Partially Met" : "Not Met",
      remediation: "Enroll all active employees in Course 1: Introduction to Email Phishing."
    },
    {
      id: "NIST-800-50",
      name: "NIST Special Publication 800-50",
      control: "Information Security Awareness",
      desc: "Establish a continuous security awareness program with periodic simulations.",
      status: simRun ? "Met" : "Not Met",
      remediation: "Deploy at least 1 safe phishing simulation campaign targeting all employees."
    },
    {
      id: "ISO-27001-A7",
      name: "ISO/IEC 27001:2022",
      control: "Control A.7.2.2 (Security Awareness)",
      desc: "Employees must receive appropriate education and training on security protocols.",
      status: trainingTaken ? "Met" : "Not Met",
      remediation: "Configure final assessment quizzes for critical operational departments."
    },
    {
      id: "CIS-14",
      name: "CIS Critical Security Controls",
      control: "Control 14 (Security Awareness Program)",
      desc: "Implement a security awareness program to influence behaviors and reduce risks.",
      status: trainingPassed && simRun ? "Met" : (trainingPassed || simRun) ? "Partially Met" : "Not Met",
      remediation: "Review risk dashboard trends and recalculate department threat indexes weekly."
    },
    {
      id: "OWASP-AT",
      name: "OWASP Security Awareness",
      control: "Credential Theft Mitigation",
      desc: "Implement awareness training highlighting standard credential harvest tricks.",
      status: trainingTaken ? "Met" : "Not Met",
      remediation: "Configure multi-factor authentication (MFA) across user dashboards."
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="p-6 rounded-xl glass-panel border-l-4 border-cyber-primary">
        <h2 className="text-xl font-extrabold text-white">Compliance Mapping Matrix</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Map cybersecurity activities, simulations, and user assessment completions directly to industry frameworks.
        </p>
      </div>

      {/* Compliance Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl glass-panel flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-cyber-textMuted block">Controls Met</span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              {frameworks.filter(f => f.status === "Met").length} / {frameworks.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl glass-panel flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-cyber-textMuted block">Partially Met</span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              {frameworks.filter(f => f.status === "Partially Met").length} / {frameworks.length}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl glass-panel flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-cyber-textMuted block">Needs Attention</span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              {frameworks.filter(f => f.status === "Not Met").length} / {frameworks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Frameworks Table */}
      <div className="p-6 rounded-xl glass-panel flex flex-col gap-6">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Framework Mapping Details</h3>
        
        <div className="flex flex-col gap-4">
          {frameworks.map((fw) => (
            <div key={fw.id} className="p-5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5 max-w-[70%]">
                <span className="text-[10px] font-bold text-cyber-primary uppercase tracking-widest">{fw.name}</span>
                <h4 className="text-xs font-bold text-white">{fw.control}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">{fw.desc}</p>
                <span className="text-[10px] text-cyber-textMuted font-semibold mt-1">
                  💡 Remediation: {fw.remediation}
                </span>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  fw.status === "Met" ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-400" :
                  fw.status === "Partially Met" ? "bg-amber-500/15 border border-amber-500/20 text-amber-500" :
                  "bg-rose-500/15 border border-rose-500/20 text-rose-400"
                }`}>
                  {fw.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
