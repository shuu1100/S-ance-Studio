"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop click listener */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={`relative w-full ${maxWidthClass} gothic-card border border-[#c5a059]/40 bg-[#120f12] text-[#ece3cd] shadow-[0_10px_40px_rgba(0,0,0,0.95)] z-10 p-6 rounded-[2px]`}
      >
        {/* Ornate corner markers */}
        <span className="absolute top-2 left-2 text-[10px] text-[#c5a059]/50 select-none">✦</span>
        <span className="absolute top-2 right-2 text-[10px] text-[#c5a059]/50 select-none">✦</span>
        <span className="absolute bottom-2 left-2 text-[10px] text-[#c5a059]/50 select-none">✦</span>
        <span className="absolute bottom-2 right-2 text-[10px] text-[#c5a059]/50 select-none">✦</span>

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#c5a059]/25 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#c5a059] text-xs">◈</span>
              <h2
                id="modal-title"
                className="font-serif text-lg md:text-xl font-normal text-[#dfc282] tracking-wide"
              >
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-[#b8a88a] mt-0.5 tracking-wider font-mono">
                {subtitle}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-[#b8a88a] hover:text-[#dfc282]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto pr-1 text-sm text-[#d4c8af] space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-6 pt-4 border-t border-[#c5a059]/20 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
