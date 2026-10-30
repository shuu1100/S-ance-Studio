"use client";

import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost" | "parchment";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  ornate?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      ornate = true,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a059] disabled:opacity-45 disabled:pointer-events-none select-none cursor-pointer";

    // Size variants
    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 tracking-wider",
      md: "text-sm px-4 py-2 gap-2 tracking-wider",
      lg: "text-base px-6 py-3 gap-2.5 tracking-widest",
    }[size];

    // Style variants matching Victorian Gothic aesthetics
    const variantStyles = {
      primary:
        "bg-gradient-to-b from-[#2a221b] via-[#1e1713] to-[#140f0c] text-[#dfc282] border border-[#c5a059]/60 hover:border-[#dfc282] hover:text-[#f8edd2] hover:shadow-[0_0_12px_rgba(197,160,89,0.25)] active:translate-y-[1px]",
      secondary:
        "bg-[#131012] text-[#ece3cd] border border-[#c5a059]/25 hover:border-[#c5a059]/50 hover:bg-[#1a1518] hover:text-[#dfc282] active:translate-y-[1px]",
      destructive:
        "bg-gradient-to-b from-[#3a1015] to-[#20080b] text-[#fca5a5] border border-[#8a1f29]/70 hover:border-[#ef4444] hover:text-white hover:shadow-[0_0_12px_rgba(138,31,41,0.35)] active:translate-y-[1px]",
      ghost:
        "bg-transparent text-[#b8a88a] hover:text-[#dfc282] hover:bg-[#c5a059]/10 border border-transparent",
      parchment:
        "bg-[#d8c8a8] text-[#1a1511] font-serif border border-[#9b855b] hover:bg-[#e6d8ba] hover:shadow-[0_2px_8px_rgba(0,0,0,0.5)] active:translate-y-[1px]",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {ornate && variant !== "ghost" && (
          <>
            <span className="absolute top-[2px] left-[3px] text-[7px] text-[#c5a059]/50 pointer-events-none">
              ✦
            </span>
            <span className="absolute bottom-[2px] right-[3px] text-[7px] text-[#c5a059]/50 pointer-events-none">
              ✦
            </span>
          </>
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
