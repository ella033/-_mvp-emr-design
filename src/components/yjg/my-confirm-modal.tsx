"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface MyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  subDescription?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function MyConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  subDescription,
  confirmText = "확인",
  cancelText = "취소",
  isDestructive = false,
  isLoading = false,
}: MyConfirmModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg bg-popover p-5 shadow-xl border border-border">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {description}
          </p>
          {subDescription && (
            <p className="text-xs text-destructive">
              {subDescription}
            </p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="min-w-[72px] rounded-[4px] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`min-w-[72px] rounded-[4px] px-4 py-2 text-sm font-medium text-primary-foreground transition-colors ${isDestructive
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90"
              }`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
