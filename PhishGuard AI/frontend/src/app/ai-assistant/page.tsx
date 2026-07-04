"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { 
  Bot, 
  Send, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle, 
  Sparkles,
  Info,
  User
} from "lucide-react";

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [takeaways, setTakeaways] = useState<string[]>([]);

  const handleSend = async (msgToSend?: string) => {
    const text = msgToSend || message;
    if (!text.trim()) return;

    const userMessage = { sender: "user", text };
    setChatHistory((prev) => [...prev, userMessage]);
    if (!msgToSend) setMessage("");
    setLoading(true);

    try {
      const data = await fetchApi("/ai/query", {
        method: "POST",
        body: JSON.stringify({ message: text })
      });

      const aiMessage = { sender: "ai", text: data.reply };
      setChatHistory((prev) => [...prev, aiMessage]);
      setIndicators(data.phishing_indicators || []);
      setTakeaways(data.educational_takeaways || []);
    } catch (e: any) {
      const errorMessage = { sender: "ai", text: "Error communicating with security assistant. Please verify token parameters." };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "What are common email phishing indicators?",
    "How can I spot typosquatting in a URL?",
    "Explain what Business Email Compromise (BEC) is.",
    "Tell me best practices for MFA security."
  ];

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      {/* Title */}
      <div className="p-6 rounded-xl glass-panel relative overflow-hidden border-l-4 border-cyber-primary flex-shrink-0">
        <h2 className="text-xl font-extrabold text-white">AI Phishing Detection Assistant</h2>
        <p className="text-xs text-cyber-textMuted mt-1">
          Ask questions about social engineering, examine email content blocks, and request best practice checklists.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-0">
        {/* Chat client pane */}
        <div className="lg:col-span-3 p-6 rounded-xl glass-panel flex flex-col justify-between min-h-0">
          {/* Chat scrolling viewport */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-6">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <Bot className="w-12 h-12 text-cyber-primary animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-white uppercase">PhishGuard Security Bot</h4>
                  <p className="text-[10px] text-cyber-textMuted px-8 leading-relaxed mt-1">
                    Ask me to analyze suspect headers, verify URL spoof risk patterns, or teach you defensive protocols.
                  </p>
                </div>
                {/* Suggestions list */}
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-4">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cyber-cardBorder hover:border-cyber-primary/20 hover:text-cyber-primary transition-all text-[10px] font-semibold text-slate-400"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((chat, idx) => {
                const isUser = chat.sender === "user";
                return (
                  <div key={idx} className={`flex gap-3 max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
                    <div className={`p-2 rounded-full border flex-shrink-0 w-8 h-8 flex items-center justify-center ${
                      isUser ? 'bg-cyber-primary/10 border-cyber-primary/30 text-cyber-primary' : 'bg-cyber-secondary/10 border-cyber-secondary/30 text-cyber-secondary'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                      isUser ? 'bg-[#0f172a]/65 text-slate-100' : 'bg-slate-900/60 text-slate-300 border border-cyber-cardBorder/50'
                    }`}>
                      <p className="whitespace-pre-line">{chat.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex gap-3 max-w-[80%] self-start">
                <div className="p-2 rounded-full bg-cyber-secondary/10 border border-cyber-secondary/30 text-cyber-secondary">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-xl text-xs text-cyber-textMuted italic">
                  Analyzing queries against cyber threat intelligence parameters...
                </div>
              </div>
            )}
          </div>

          {/* Form input field */}
          <div className="flex gap-3 flex-shrink-0">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about BEC wires, attachment macros, URL inspections..."
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900 border border-cyber-cardBorder text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-primary/50 focus:ring-1 focus:ring-cyber-primary/20"
            />
            <button
              onClick={() => handleSend()}
              className="px-5 py-3 bg-cyber-primary text-slate-950 font-bold rounded-lg text-xs hover:bg-cyber-primary/80 transition-all flex items-center gap-1.5"
            >
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sidebar key metrics extraction */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyber-textMuted flex-shrink-0">Assistant Notes</h3>
          <div className="p-5 rounded-xl glass-panel-neon flex flex-col gap-5">
            {/* Indicators checklist */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Threat Indicators Spot:</span>
              {indicators.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {indicators.map((ind, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-cyber-cardBorder/60 rounded text-[10px] text-slate-300 flex items-start gap-2 leading-tight">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      {ind}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-cyber-textMuted italic">No active threat flags parsed.</p>
              )}
            </div>

            {/* Educational takeaway cards */}
            <div className="flex flex-col gap-3 border-t border-cyber-cardBorder/40 pt-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Defense Protocols:</span>
              {takeaways.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {takeaways.map((tk, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 border border-cyber-cardBorder/60 rounded text-[10px] text-slate-300 flex items-start gap-2 leading-tight">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      {tk}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-cyber-textMuted italic">Awaiting query parameters.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
