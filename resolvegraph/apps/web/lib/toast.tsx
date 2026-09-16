"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Warning, Info, X } from "@phosphor-icons/react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3800);
    },
    [removeToast]
  );

  const success = useCallback((msg: string) => showToast(msg, "success"), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, "error"), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, "warning"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast floating container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => {
          const typeStyles = {
            success: "border-emerald-500/40 bg-zinc-900/95 text-emerald-300 shadow-card",
            error: "border-rose-500/40 bg-zinc-900/95 text-rose-300 shadow-card",
            warning: "border-amber-500/40 bg-zinc-900/95 text-amber-300 shadow-card",
            info: "border-zinc-700 bg-zinc-900/95 text-zinc-200 shadow-card",
          }[t.type];

          const icon = {
            success: <CheckCircle size={16} weight="fill" className="text-emerald-400 shrink-0" />,
            error: <XCircle size={16} weight="fill" className="text-rose-400 shrink-0" />,
            warning: <Warning size={16} weight="fill" className="text-amber-400 shrink-0" />,
            info: <Info size={16} weight="fill" className="text-zinc-400 shrink-0" />,
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-md animate-slide-in text-xs font-medium transition-all ${typeStyles}`}
            >
              <span className="mt-0.5">{icon}</span>
              <span className="flex-1 leading-relaxed text-zinc-200">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-400 hover:text-zinc-100 transition-colors ml-1 mt-0.5 active:scale-90"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (m: string) => console.log(m),
      success: (m: string) => console.log(m),
      error: (m: string) => console.error(m),
      info: (m: string) => console.info(m),
      warning: (m: string) => console.warn(m),
    };
  }
  return ctx;
}
