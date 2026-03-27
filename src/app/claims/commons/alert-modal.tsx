"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isConfirmLoading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmClassName?: string;
  cancelClassName?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onOpenChange,
  title = "알럿",
  message,
  confirmText = "확인",
  cancelText = "취소",
  showCancel = true,
  isConfirmLoading = false,
  onConfirm,
  onCancel,
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] p-0 gap-0 overflow-hidden rounded-[6px] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] border-0 [&>button]:hidden">
        {/* 본문 */}
        <div className="px-5 py-5 text-[16px] font-medium text-[var(--gray-200)] leading-[1.4] tracking-[-0.16px] whitespace-pre-line">
          {message ?? title}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="flex min-w-[64px] px-3 py-2 justify-center items-center gap-1 rounded-[4px] border border-[var(--border-1)] bg-white text-[13px] font-medium text-[var(--gray-100)] tracking-[-0.13px] leading-[1.25] hover:bg-[var(--bg-1)] transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={isConfirmLoading}
            className="flex min-w-[64px] px-3 py-2 justify-center items-center gap-1 rounded-[4px] bg-[var(--main-color)] text-[13px] font-medium text-white tracking-[-0.13px] leading-[1.25] hover:bg-[var(--main-color-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirmLoading ? "진행 중..." : confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AlertModal;
