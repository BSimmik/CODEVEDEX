import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelAI EDR - Endpoint Security Monitoring",
  description: "Enterprise cyber posture audits, process threat metrics, and automated AI analysis logs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen text-slate-100 bg-[#080b11]">
        {children}
      </body>
    </html>
  );
}
