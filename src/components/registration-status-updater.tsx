import { useEffect } from "react";
import { useReceptionStore } from "@/store/common/reception-store";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";

export default function RegistrationStatusUpdater() {
  const { pendingStatusUpdate, setPendingStatusUpdate } =
    useReceptionStore();
  const { mutate: updateRegistration } = useUpdateRegistration();

  useEffect(() => {
    if (pendingStatusUpdate) {
      // API로 상태 업데이트
      updateRegistration(
        {
          id: pendingStatusUpdate.id,
          data: {
            status: pendingStatusUpdate.status,
          },
        },
        {
          onSuccess: () => {
            // 성공 시 pending 상태 초기화
            setPendingStatusUpdate(null);
          },
          onError: (error) => {
            console.error("Failed to update registration status:", error);
            // 에러 시에도 pending 상태 초기화 (재시도 로직이 필요하다면 다르게 처리)
            setPendingStatusUpdate(null);
          },
        }
      );
    }
  }, [pendingStatusUpdate, updateRegistration, setPendingStatusUpdate]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
