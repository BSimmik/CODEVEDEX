"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  ShieldAlert, 
  Mail, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RotateCcw,
  Sparkles,
  Inbox,
  Flag
} from "lucide-react";

export default function SimulationsPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeSim, setActiveSim] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ status: string; mistakes: string[]; recommendations: string[] } | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchApi("/simulations/scenarios");
      setScenarios(data);
      const me = await fetchApi("/auth/me");
      setUserProfile(me);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLaunchScenario = async (scenario: any) => {
    try {
      setFeedback(null);
      // Start simulation run on backend
      const res = await fetchApi("/simulations/start", {
        method: "POST",
        body: JSON.stringify({
          scenario_name: scenario.name,
          user_id: userProfile.id
        })
      });
      setActiveSim({
        id: res.simulation_id,
        name: scenario.name,
        subject: res.subject,
        sender: res.sender,
        content: res.content,
        indicators: res.indicators
      });
    } catch (e) {
      alert("Failed to initialize simulation scenario.");
    }
  };

  const handleInteract = async (type: "Clicked" | "Replied" | "Flagged") => {
    if (!activeSim) return;
    
    // Determine mistakes if Clicked or Replied
    const mistakes = type === "Flagged" ? [] : [...activeSim.indicators];
    
    try {
      const res = await fetchApi(`/simulations/${activeSim.id}/interact`, {
        method: "PUT",
        body: JSON.stringify({
          status: type,
          clicked_at: type === "Clicked" ? new Date().toISOString() : null,
          replied_at: type === "Replied" ? new Date().toISOString() : null,
          response_time: 15, // mocked seconds
          mistakes_made: mistakes
        })
      });

      // Show immediate educational report
      setFeedback({
        status: type,
        mistakes: mistakes,
        recommendations: type === "Flagged" 
          ? ["Excellent vigilance! Reporting suspicious mail helps security analysts isolate the threat vectors organization-wide."]
          : ["Hover over links to verify destinations.", "Review the envelope domain address, not just display names.", "Avoid act-now threats."]
      });
    } catch (e) {
      alert("Failed to log simulation outcome.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <ShieldAlert className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      {!activeSim && (
        <div className="p-6 rounded-xl glass-panel border-l-4 border-cyber-primary">
          <h2 className="text-xl font-extrabold text-white">Safe Simulation Sandbox</h2>
          <p className="text-xs text-cyber-textMuted mt-1">
            Test your abilities to spot credential harvest markers and social engineering attempts in a controlled cyber range.
          </p>
        </div>
      )}

      {!activeSim ? (
        /* Scenarios Catalog list */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((sc) => (
            <div key={sc.name} className="p-6 rounded-xl glass-panel flex flex-col justify-between border border-cyber-cardBorder hover:border-cyber-primary/20 transition-all min-h-[220px]">
              <div>
                <div className="flex items-center gap-2 mb-3 text-cyber-primary">
                  <Mail className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Scenario Template</span>
                </div>
                <h3 className="text-sm font-extrabold text-white mb-2">{sc.name}</h3>
                <p className="text-xs text-cyber-textMuted leading-relaxed line-clamp-3">{sc.content}</p>
              </div>

              <button
                onClick={() => handleLaunchScenario(sc)}
                className="mt-6 flex items-center justify-center gap-2 py-2 bg-slate-900 border border-cyber-cardBorder hover:border-cyber-primary/30 hover:text-cyber-primary rounded-lg text-xs font-bold transition-all text-slate-300"
              >
                Launch Simulation <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Mail Client Simulation Container */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-cyber-primary tracking-widest">
              ACTIVE THREAT CHALLENGE: {activeSim.name}
            </h3>
            <button
              onClick={() => { setActiveSim(null); setFeedback(null); }}
              className="text-xs text-cyber-textMuted hover:text-white font-bold"
            >
              Cancel Scenario
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Email Interface Container */}
            <div className="lg:col-span-2 rounded-xl glass-panel-neon overflow-hidden">
              {/* Mail top header */}
              <div className="px-6 py-4 bg-[#0d1326] border-b border-cyber-cardBorder/60 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">INCOMING EDUCATIONAL PHISH BLOCK</span>
              </div>

              {/* Envelope details */}
              <div className="p-6 border-b border-cyber-cardBorder/40 flex flex-col gap-3">
                <div className="flex items-center text-xs">
                  <span className="w-16 font-bold text-cyber-textMuted uppercase">Sender:</span>
                  <span className="text-slate-300 font-mono select-none hover:underline cursor-pointer decoration-dotted text-xs" onClick={() => handleInteract("Clicked")}>
                    {activeSim.sender}
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-16 font-bold text-cyber-textMuted uppercase">Subject:</span>
                  <span className="text-white font-bold">{activeSim.subject}</span>
                </div>
              </div>

              {/* Body message viewport */}
              <div className="p-8 min-h-[220px] bg-slate-950/20 text-xs text-slate-300 leading-relaxed relative">
                {activeSim.content}

                <div className="mt-8 flex gap-4">
                  {/* Click trigger buttons to register simulation interactions */}
                  <button
                    onClick={() => handleInteract("Clicked")}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/35 text-rose-400 text-xs font-bold rounded-lg transition-all"
                  >
                    Click Verification Link
                  </button>
                  <button
                    onClick={() => handleInteract("Replied")}
                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/35 text-amber-400 text-xs font-bold rounded-lg transition-all"
                  >
                    Reply with Personal Info
                  </button>
                </div>
              </div>

              {/* Client Action Footer */}
              <div className="px-6 py-4 bg-[#0d1326] border-t border-cyber-cardBorder/40 flex justify-between items-center">
                <span className="text-[10px] text-cyber-textMuted uppercase font-semibold">Spot the indicators and take action</span>
                <button
                  onClick={() => handleInteract("Flagged")}
                  className="flex items-center gap-2 px-4 py-2 bg-cyber-primary text-slate-950 text-xs font-bold rounded-lg hover:bg-cyber-primary/80 transition-all"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Report Phishing Attempt
                </button>
              </div>
            </div>

            {/* Right: Feedback Inspector */}
            <div className="lg:col-span-1">
              {feedback ? (
                /* Educational Report post-simulation */
                <div className={`p-6 rounded-xl border flex flex-col gap-6 ${
                  feedback.status === "Flagged" 
                    ? "bg-emerald-950/20 border-emerald-500/30" 
                    : "bg-rose-950/20 border-rose-500/30"
                }`}>
                  <div className="flex items-center gap-3">
                    {feedback.status === "Flagged" ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400" />
                    )}
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">
                      {feedback.status === "Flagged" ? "Scenario Defeated" : "Compromise Alert"}
                    </h4>
                  </div>

                  {feedback.mistakes.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Threat Indicators Missed:</span>
                      <div className="flex flex-col gap-2">
                        {feedback.mistakes.map((mk) => (
                          <div key={mk} className="p-3 bg-slate-900 rounded-lg text-[10px] font-medium border border-rose-500/20 text-slate-300 flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                            {mk}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-cyber-primary uppercase tracking-wider block">Security Advice:</span>
                    <ul className="text-slate-300 text-[10.5px] leading-relaxed list-disc pl-4 flex flex-col gap-1.5">
                      {feedback.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => { setActiveSim(null); setFeedback(null); }}
                    className="mt-4 flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-cyber-cardBorder rounded-lg text-xs font-bold text-white transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Exit Scenario
                  </button>
                </div>
              ) : (
                /* Static placeholder deck */
                <div className="p-6 rounded-xl glass-panel text-center py-12 flex flex-col items-center gap-3">
                  <Sparkles className="w-8 h-8 text-cyber-primary animate-pulse" />
                  <h4 className="text-xs font-bold text-white uppercase">Vigilance Deck</h4>
                  <p className="text-[10px] text-cyber-textMuted px-4">
                    Analyze the display address, text urgency, and link destinations in the simulator box. Click a button to test your reaction.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
