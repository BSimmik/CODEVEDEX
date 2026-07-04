"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  Trophy, 
  Award, 
  ShieldCheck, 
  Zap, 
  UserCheck, 
  Star,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export default function GamificationPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/auth/me")
      .then((data) => {
        setUser(data);
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
        <Trophy className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  // Leaderboard lists
  const leaderboard = [
    { rank: 1, name: "Alice Security", dept: "Threat Intel", points: 850, badge: "Grandmaster" },
    { rank: 2, name: "Bob DevSecOps", dept: "Engineering", points: 600, badge: "Defender" },
    { rank: 3, name: user?.username || "You", dept: user?.department || "General", points: user?.points || 0, badge: "Specialist", active: true },
    { rank: 4, name: "Charlie Sales", dept: "Sales", points: 200, badge: "Novice" },
    { rank: 5, name: "HR Coordinator", dept: "Human Resources", points: 150, badge: "Novice" },
  ];

  // Sort by points
  leaderboard.sort((a, b) => b.points - a.points);
  // Re-map ranks after sorting
  leaderboard.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const achievements = [
    {
      title: "MFA Pioneer",
      desc: "Activated Multi-Factor Authenticator challenge guard.",
      completed: user?.mfa_enabled,
      points: 150
    },
    {
      title: "First Blood Specialist",
      desc: "Successfully passed an assessment certification quiz.",
      completed: (user?.points || 0) >= 200,
      points: 200
    },
    {
      title: "Vigilant Eye",
      desc: "Flagged and reported simulated phishing mail.",
      completed: (user?.points || 0) >= 100,
      points: 100
    },
    {
      title: "Apex Defender",
      desc: "Scored 100% on a course final exam.",
      completed: (user?.points || 0) >= 300,
      points: 250
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="p-6 rounded-xl glass-panel border-l-4 border-cyber-primary">
        <h2 className="text-xl font-extrabold text-white">Security Champion Leaderboard</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Earn points by passing training quizzes, reporting simulation threats, and setting up MFA guards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Leaderboard table */}
        <div className="lg:col-span-2 p-6 rounded-xl glass-panel flex flex-col gap-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">Organizational Rankings</h3>
          
          <div className="flex flex-col gap-2">
            {leaderboard.map((player) => (
              <div 
                key={player.name} 
                className={`p-4 rounded-lg flex items-center justify-between transition-all ${
                  player.active 
                    ? "bg-cyber-primary/10 border border-cyber-primary/30" 
                    : "bg-slate-900/60 border border-cyber-cardBorder"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full font-black text-xs ${
                    player.rank === 1 ? 'bg-amber-500 text-slate-950 font-bold' :
                    player.rank === 2 ? 'bg-slate-300 text-slate-950 font-bold' :
                    player.rank === 3 && !player.active ? 'bg-amber-700 text-white font-bold' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {player.rank}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {player.name}
                      {player.active && <span className="text-[8px] uppercase font-bold bg-cyber-primary/20 text-cyber-primary px-1.5 py-0.5 rounded">You</span>}
                    </h4>
                    <span className="text-[10px] text-cyber-textMuted">{player.dept}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-[9px] uppercase font-semibold text-cyber-textMuted bg-slate-800 px-2 py-1 rounded">
                    {player.badge}
                  </span>
                  <span className="text-xs font-black text-white">{player.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements list */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyber-textMuted">Achievements</h3>
          <div className="p-6 rounded-xl glass-panel flex flex-col gap-4">
            {achievements.map((ach) => (
              <div 
                key={ach.title} 
                className={`p-4 rounded-lg flex items-start gap-3 border transition-all ${
                  ach.completed 
                    ? "bg-emerald-950/15 border-emerald-500/25" 
                    : "bg-slate-900/60 border-cyber-cardBorder opacity-65"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  ach.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {ach.completed ? <Star className="w-4 h-4 fill-emerald-400" /> : <Star className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${ach.completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {ach.title}
                  </h4>
                  <p className="text-[10px] text-cyber-textMuted mt-0.5 leading-relaxed">{ach.desc}</p>
                  <span className="text-[9px] font-bold mt-1.5 block text-cyber-primary">+{ach.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
