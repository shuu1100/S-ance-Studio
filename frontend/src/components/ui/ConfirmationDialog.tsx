"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "primary";
}

export function ConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm Ritual",
  cancelLabel = "Step Back",
  variant = "primary",
}: ConfirmationDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      subtitle="Irreversible Inquest Step"
      maxWidth="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-2">
        <div
          className={`shrink-0 p-2 border rounded-[2px] ${
            variant === "destructive"
              ? "bg-[#2b0c10] border-[#8a1f29] text-[#fca5a5]"
              : "bg-[#241c14] border-[#c5a059] text-[#dfc282]"
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-sm text-[#d4c8af] leading-relaxed">
          {description}
        </div>
      </div>
    </Modal>
  );
}
