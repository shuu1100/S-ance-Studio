"use client";

import React from "react";
import { Sparkles, Brain, Flame, AlertCircle, Info, X } from "lucide-react";
import { NotificationToast } from "../../types";

export interface ToastProps {
  toasts: NotificationToast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const icon = {
          clue: <Sparkles className="w-4 h-4 text-[#dfc282]" />,
          sanity: <Brain className="w-4 h-4 text-[#fca5a5]" />,
          tension: <Flame className="w-4 h-4 text-[#f5b041]" />,
          error: <AlertCircle className="w-4 h-4 text-[#ef4444]" />,
          warning: <AlertCircle className="w-4 h-4 text-[#f5b041]" />,
          info: <Info className="w-4 h-4 text-[#7dd3fc]" />,
        }[toast.type];

        const borderStyle = {
          clue: "border-[#c5a059] bg-[#1a1510]",
          sanity: "border-[#8a1f29] bg-[#220a0e]",
          tension: "border-[#e29d42] bg-[#221309]",
          error: "border-[#ef4444] bg-[#260c0f]",
          warning: "border-[#f5b041] bg-[#1e140b]",
          info: "border-[#38bdf8] bg-[#0d181d]",
        }[toast.type];

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 border ${borderStyle} text-[#ece3cd] shadow-[0_8px_24px_rgba(0,0,0,0.85)] animate-in slide-in-from-right-5 fade-in duration-200 rounded-[1px]`}
          >
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-serif font-semibold tracking-wider text-[#dfc282] uppercase">
                {toast.title}
              </h4>
              <p className="text-xs text-[#d4c8af] mt-0.5 leading-relaxed">
                {toast.message}
              </p>
              <span className="text-[10px] text-[#7d7265] font-mono mt-1 block">
                {toast.timestamp}
              </span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#7d7265] hover:text-[#dfc282] p-1 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
