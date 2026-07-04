"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  BarChart3, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  Award, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  User,
  Info
} from "lucide-react";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/analytics/me")
      .then((data) => {
        setMetrics(data);
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
        <BarChart3 className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  const hasMistakes = metrics?.common_mistakes && Object.keys(metrics.common_mistakes).length > 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Title */}
      <div className="p-6 rounded-xl glass-panel border-l-4 border-cyber-primary">
        <h2 className="text-xl font-extrabold text-white">Behavioral Analytics Engine</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Review your personal simulation reaction profiles, common mistake markers, and learning progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Security Awareness Score Dial */}
        <div className="lg:col-span-1 p-6 rounded-xl glass-panel flex flex-col justify-between items-center text-center">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Awareness Rating</h3>
            <p className="text-[10px] text-cyber-textMuted mt-1">Your combined training and simulation resilience score.</p>
          </div>

          <div className="py-6 flex items-center justify-center relative">
            <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center relative ${
              (metrics?.score || 100) >= 80 ? 'border-emerald-500 border-t-emerald-300' :
              (metrics?.score || 100) >= 50 ? 'border-amber-500 border-t-amber-300' :
              'border-rose-500 border-t-rose-300'
            }`}>
              <div>
                <span className="text-4xl font-black text-white">{metrics?.score || 100}</span>
                <span className="block text-[8px] uppercase tracking-wider font-extrabold text-cyber-textMuted mt-1">resilience pts</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-cyber-textMuted block mb-1">Defense Health</span>
            <p className="text-[11px] font-semibold text-slate-300">
              {(metrics?.score || 100) >= 80 ? "🏆 Tier-1 Security Champion status. Safe habits." : 
               (metrics?.score || 100) >= 50 ? "⚠️ Tier-2 Warning. Review phishing courses." : 
               "🚨 Critical risk. Complete immediate remediation labs."}
            </p>
          </div>
        </div>

        {/* Clicks & Quizzes statistics cards */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Resilience breakdown</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-cyber-cardBorder flex items-center gap-4">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Simulation Clicks</span>
                <span className="text-xl font-bold text-white mt-1 block">{metrics?.clicks_count || 0}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-cyber-cardBorder flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Credential Replies</span>
                <span className="text-xl font-bold text-white mt-1 block">{metrics?.replies_count || 0}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-cyber-cardBorder flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Assessments Attempted</span>
                <span className="text-xl font-bold text-white mt-1 block">{metrics?.quizzes_taken || 0}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-cyber-cardBorder flex items-center gap-4">
              <div className="p-3 rounded-full bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-cyber-textMuted block">Assessments Passed</span>
                <span className="text-xl font-bold text-white mt-1 block">{metrics?.quizzes_passed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Common mistakes and training recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mistakes List */}
        <div className="p-6 rounded-xl glass-panel">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Identified Threat Vulnerabilities</h3>
          {hasMistakes ? (
            <div className="flex flex-col gap-3">
              {Object.entries(metrics.common_mistakes).map(([mistake, count]: any) => (
                <div key={mistake} className="p-3 bg-slate-900/60 border border-cyber-cardBorder/60 rounded-lg flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">{mistake}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/20 text-[10px] text-rose-400 font-bold">
                    Triggered {count}x
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 animate-pulse" />
              <p className="text-[11px] text-cyber-textMuted">No compromise flags recorded in this simulation session.</p>
            </div>
          )}
        </div>

        {/* Training recommendations based on metrics */}
        <div className="p-6 rounded-xl glass-panel-neon flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white mb-6">Remedial Action Map</h3>
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-cyber-cardBorder flex items-start gap-3">
                <Info className="w-4 h-4 text-cyber-primary flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-slate-300">
                  {(metrics?.clicks_count || 0) > 0 
                    ? "Based on simulation clicks: Complete the 'Introduction to Email Phishing' module focusing on Sender Domain Verification." 
                    : "No clicks flagged. Keep practicing by verifying URL domains via Hover inspect."}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/60 border border-cyber-cardBorder flex items-start gap-3">
                <Info className="w-4 h-4 text-cyber-primary flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-slate-300">
                  {(metrics?.replies_count || 0) > 0 
                    ? "Based on credential replies: Review the 'Spear Phishing and wire transfer fraud (BEC)' course module immediately." 
                    : "No credentials compromised. Maintain credential protection safeguards."}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-cyber-textMuted text-right mt-6 border-t border-cyber-cardBorder/40 pt-4">
            Analytics synced: {metrics?.last_updated ? new Date(metrics.last_updated).toLocaleString() : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
