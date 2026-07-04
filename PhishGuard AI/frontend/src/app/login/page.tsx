"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { ShieldAlert, KeyRound, User, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (data.mfa_required) {
        localStorage.setItem("phishguard_mfa_username", username);
        router.push("/mfa");
      } else {
        localStorage.setItem("phishguard_token", data.access_token);
        localStorage.setItem("phishguard_role", data.role);
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#060913] relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute w-[500px] h-[500px] bg-cyber-primary/5 rounded-full blur-[80px] -top-20 -left-20 animate-pulse-glow"></div>
      <div className="absolute w-[400px] h-[400px] bg-cyber-secondary/5 rounded-full blur-[80px] -bottom-20 -right-20 animate-pulse-glow"></div>

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel-neon relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3 rounded-full bg-cyber-primary/10 border border-cyber-primary/30">
            <ShieldAlert className="w-8 h-8 text-cyber-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Sign In to PhishGuard AI</h2>
          <p className="text-xs text-cyber-textMuted tracking-wide uppercase font-semibold">Enter credentials to establish connection</p>
        </div>

        {error && (
          <div className="px-4 py-3 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-3 bg-cyber-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-cyber-primary/80 transition-all disabled:opacity-50 mt-2"
          >
            {submitting ? "Establishing Authentication..." : "Authenticate Session"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-cyber-textMuted">
            Need an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-cyber-primary hover:underline font-semibold"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
