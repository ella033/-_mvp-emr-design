import { useState, useCallback } from "react";
import { useReceptionStore } from "@/store/common/reception-store";
import { useDeleteRegistration } from "@/hooks/registration/use-delete-registration";

export function useHandleRegistration(
  registrationId?: string,
  onSuccess?: () => void
) {
  const { registrations, setRegistrations } = useReceptionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: deleteRegistration } = useDeleteRegistration();

  // 접수 삭제
  const handleDeleteRegistration = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (!registrationId) throw new Error("접수 정보를 찾을 수 없습니다");

      await deleteRegistration(registrationId.toString());

      // 로컬 상태도 업데이트 (즉시 반영)
      const updatedRegistrations = registrations?.filter(
        (r) => r.id !== registrationId
      );
      setRegistrations(updatedRegistrations || []);

      onSuccess?.();
    } catch (error) {
      console.error("접수 취소 실패:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [registrations, deleteRegistration, setRegistrations, onSuccess, registrationId]);

  return {
    handleDeleteRegistration,
    isSubmitting,
  };
}
