"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import "@/app/globals.css";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  GraduationCap, 
  Terminal, 
  Bot, 
  BarChart3, 
  Bookmark, 
  Trophy, 
  LogOut, 
  UserCheck,
  AlertTriangle
} from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string; points: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/mfa";

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("phishguard_token");
    if (!token) {
      router.push("/login");
      setLoading(false);
      return;
    }

    fetchApi("/auth/me")
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("phishguard_token");
        router.push("/login");
        setLoading(false);
      });
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("phishguard_token");
    setUser(null);
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Training Hub", href: "/training", icon: GraduationCap },
    { label: "Simulation Lab", href: "/simulations", icon: ShieldAlert },
    { label: "Analysis Sandbox", href: "/analysis", icon: Terminal },
    { label: "AI Assistant", href: "/ai-assistant", icon: Bot },
    { label: "Analytics & Risk", href: "/analytics", icon: BarChart3 },
    { label: "Compliance Map", href: "/compliance", icon: Bookmark },
    { label: "Champion Board", href: "/gamification", icon: Trophy },
  ];

  return (
    <html lang="en">
      <body className="flex h-screen w-screen overflow-hidden text-slate-100 bg-cyber-bg select-none">
        {loading ? (
          <div className="flex items-center justify-center w-full h-full bg-[#060913]">
            <div className="flex flex-col items-center gap-4">
              <ShieldAlert className="w-12 h-12 text-cyber-primary animate-pulse" />
              <p className="text-sm font-semibold tracking-wider uppercase text-cyber-primary neon-text-cyan">Initializing PhishGuard AI...</p>
            </div>
          </div>
        ) : isAuthPage ? (
          <main className="w-full h-full">{children}</main>
        ) : (
          <div className="flex w-full h-full overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="flex flex-col justify-between w-64 h-full border-r border-cyber-cardBorder bg-[#080d1a] px-4 py-6">
              <div className="flex flex-col gap-8">
                {/* Brand Logo */}
                <div className="flex items-center gap-3 px-2">
                  <ShieldAlert className="w-8 h-8 text-cyber-primary" />
                  <div>
                    <h1 className="text-base font-bold tracking-tight text-white leading-none">PhishGuard <span className="text-cyber-primary">AI</span></h1>
                    <span className="text-[10px] text-cyber-textMuted uppercase tracking-wider font-semibold">SOC Platform</span>
                  </div>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                          isActive 
                            ? "bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 shadow-lg shadow-cyber-primary/5" 
                            : "text-slate-400 hover:bg-slate-800/30 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* User Footer profile / Logout */}
              <div className="flex flex-col gap-4 border-t border-cyber-cardBorder pt-4">
                {user && (
                  <div className="flex items-center gap-3 px-2">
                    <div className="p-2 rounded-lg bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/20">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{user.username}</p>
                      <p className="text-[10px] text-cyber-textMuted uppercase font-semibold">{user.role}</p>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </aside>

            {/* Main Area */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              {/* Header bar */}
              <header className="flex items-center justify-between h-16 px-8 border-b border-cyber-cardBorder bg-[#080d1a]/50 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyber-textMuted uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Security Monitoring Node Connected
                </div>

                <div className="flex items-center gap-6">
                  {user && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold text-xs">
                      <Trophy className="w-3.5 h-3.5" />
                      {user.points} SEC Points
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Controlled Threat Lab
                  </div>
                </div>
              </header>

              {/* Sub-page viewport */}
              <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
