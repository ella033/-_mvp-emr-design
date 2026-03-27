// src/app/claims/commons/confirm-provider.tsx
"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import AlertModal from "./alert-modal";

type ConfirmOptions = {
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmClassName?: string;
  cancelClassName?: string;
  showCancel?: boolean;
};

type ConfirmContextType = { confirm: (opts: ConfirmOptions) => Promise<boolean> };

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const resolverRef = useRef<(value: boolean) => void>();

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts({ showCancel: true, cancelText: "취소", confirmText: "확인", ...options });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => { resolverRef.current?.(true); setOpen(false); };
  const handleCancel = () => { resolverRef.current?.(false); setOpen(false); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AlertModal
        open={open}
        onOpenChange={setOpen}
        message={opts.message}
        confirmText={opts.confirmText}
        cancelText={opts.cancelText}
        showCancel={opts.showCancel ?? true}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmClassName={opts.confirmClassName}
        cancelClassName={opts.cancelClassName}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return {
      confirm: async (options: ConfirmOptions) => {
        const msg = typeof options.message === "string" ? options.message : "확인하시겠습니까?";
        if (typeof window !== "undefined") return window.confirm(msg);
        return false;
      },
    };
  }
  return ctx;
};