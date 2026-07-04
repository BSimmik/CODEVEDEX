"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { ShieldAlert, KeyRound, ArrowRight } from "lucide-react";

export default function MFAPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cachedUsername = localStorage.getItem("phishguard_mfa_username");
    if (!cachedUsername) {
      router.push("/login");
    } else {
      setUsername(cachedUsername);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await fetchApi("/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ username, code }),
      });

      localStorage.removeItem("phishguard_mfa_username");
      localStorage.setItem("phishguard_token", data.access_token);
      localStorage.setItem("phishguard_role", data.role);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid MFA code. Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#060913] relative overflow-hidden">
      <div className="absolute w-[400px] h-[400px] bg-cyber-primary/5 rounded-full blur-[80px] -top-20 -left-20"></div>

      <div className="w-full max-w-sm p-8 rounded-2xl glass-panel-neon relative z-10">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-cyber-primary/10 border border-cyber-primary/30">
            <KeyRound className="w-8 h-8 text-cyber-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">MFA Authentication</h2>
          <p className="text-xs text-cyber-textMuted tracking-wide text-center">
            Multi-Factor Authentication is active for this account. Enter the 6-digit code from your authenticator application.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-cyber-textMuted uppercase tracking-wider text-center">Authenticator Token</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000 000"
              className="w-full text-center tracking-[12px] py-3 rounded-lg bg-slate-900/60 border border-cyber-cardBorder text-base font-bold text-cyber-primary placeholder-slate-600 focus:outline-none focus:border-cyber-primary/50 transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-cyber-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-cyber-primary/80 transition-all disabled:opacity-50 mt-2"
          >
            {submitting ? "Verifying..." : "Verify Code"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
