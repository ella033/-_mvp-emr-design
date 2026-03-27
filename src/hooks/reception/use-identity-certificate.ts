"use client";

import { useState, useCallback } from "react";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import { useToastHelpers } from "@/components/ui/toast";

export interface UseIdentityCertificateOptions {
  /** 환자 ID (number | string, 없거나 유효하지 않으면 확인 시 에러) */
  patientId: number | string | undefined;
  /** 본인확인 저장 성공 시 호출 (예: 접수/환자 정보 로컬 상태 갱신) */
  onSuccess?: (data: { identityVerifiedAt: Date; identityOptional: false }) => void;
}

export function useIdentityCertificate(options: UseIdentityCertificateOptions) {
  const { patientId, onSuccess } = options;
  const updatePatientMutation = useUpdatePatient();
  const { success: showSuccess, error: showError } = useToastHelpers();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleOpen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (patientId === undefined || patientId === null || patientId === "" || patientId === "0" || patientId === "new") {
      showError("환자 정보가 없습니다.");
      setIsOpen(false);
      return;
    }
    const patientIdNumber = Number(patientId);
    if (!Number.isInteger(patientIdNumber) || patientIdNumber <= 0) {
      showError("환자 ID가 없습니다.");
      setIsOpen(false);
      return;
    }
    try {
      await updatePatientMutation.mutateAsync({
        patientId: patientIdNumber,
        updatePatient: {
          identityVerifiedAt: new Date(),
          identityOptional: false,
        } as any,
      });
      showSuccess("본인확인 정보가 저장되었습니다.");
      onSuccess?.({ identityVerifiedAt: new Date(), identityOptional: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "본인확인 정보 저장에 실패했습니다.";
      showError(message);
    } finally {
      setIsOpen(false);
    }
  }, [patientId, onSuccess, updatePatientMutation, showError, showSuccess]);

  const handleCheck = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close,
    handleOpen,
    handleConfirm,
    handleCheck,
  };
}
