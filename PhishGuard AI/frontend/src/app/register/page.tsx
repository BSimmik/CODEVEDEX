"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { ShieldAlert, User, Lock, Mail, Users2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [department, setDepartment] = useState("General");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password, role, department }),
      });
      // Redirect to login after successful register
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const roles = ["Employee", "Student", "Analyst", "Security Trainer", "Super Admin"];
  const departments = ["General", "Engineering", "Sales", "Human Resources", "Finance", "IT & Security"];

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#060913] relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute w-[500px] h-[500px] bg-cyber-primary/5 rounded-full blur-[80px] -top-20 -left-20"></div>

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel-neon relative z-10">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-cyber-primary/10 border border-cyber-primary/30">
            <ShieldAlert className="w-8 h-8 text-cyber-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create Security Account</h2>
          <p className="text-xs text-cyber-textMuted tracking-wide uppercase font-semibold">Join the PhishGuard simulation network</p>
        </div>

        {error && (
          <div className="px-4 py-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                className="w-full pl-11 pr-4 py-2 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@company.com"
                className="w-full pl-11 pr-4 py-2 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-primary/50 transition-all"
              />
            </div>
          </div>

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
                className="w-full pl-11 pr-4 py-2 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 focus:outline-none focus:border-cyber-primary/50"
              >
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-slate-900">{r}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-xs text-slate-100 focus:outline-none focus:border-cyber-primary/50"
              >
                {departments.map((d) => (
                  <option key={d} value={d} className="bg-slate-900">{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-cyber-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-cyber-primary/80 transition-all disabled:opacity-50 mt-3"
          >
            {submitting ? "Registering account..." : "Establish Profile"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-cyber-textMuted">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-cyber-primary hover:underline font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
