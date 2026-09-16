import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast";

export const metadata: Metadata = {
  title: "ResolveGraph — Deterministic Civic Resolution Orchestrator",
  description:
    "Autonomous DAG-based grievance resolution orchestration engine converting complex public complaints into verifiable administrative action graphs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

      </head>
      <body className="bg-bg-base min-h-[100dvh] font-sans text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-100">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
