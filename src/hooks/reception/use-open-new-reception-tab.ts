import { useCallback } from "react";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { useReceptionTabsStore, useSelectedDate } from "@/store/reception";
import { ReceptionInitialTab, 접수상태 } from "@/constants/common/common-enum";
import { buildProvisionalRegistrationId } from "@/lib/registration-utils";
import { createReceptionDateTime } from "@/lib/date-utils";
import type { Registration } from "@/types/registration-types";
import type { Reception } from "@/types/common/reception-types";
import type { Patient } from "@/types/patient-types";

/**
 * 접수 취소 후 "새 접수 내역 생성하여 탭 열기" 공통 로직.
 * handleAddRegistration(추가 접수)와 동일한 방식으로 최근 접수 조회 → 임시 ID reception → 탭 추가 및 활성화.
 */
export function useOpenNewReceptionTab(options?: {
  onError?: (title: string, message: string) => void;
}) {
  const { getLatestReception } = usePatientReception();
  const selectedDate = useSelectedDate();
  const { addOpenedReception, setOpenedReceptionId, setInitialTab } =
    useReceptionTabsStore();
  const showError = options?.onError ?? (() => {});

  const openNewReceptionTab = useCallback(
    async (
      registration?: Registration | null,
      reception?: Reception | null
    ): Promise<boolean> => {
      const patient: Patient | null =
        registration?.patient ??
        (reception?.patientBaseInfo
          ? ({
              id: Number(reception.patientBaseInfo.patientId),
              patientNo: reception.patientBaseInfo.patientNo,
              name: reception.patientBaseInfo.name,
              birthDate: reception.patientBaseInfo.birthday,
            } as unknown as Patient)
          : null);

      if (!patient?.id) {
        showError("환자 정보를 열 수 없습니다.", "환자 정보를 찾을 수 없습니다.");
        return false;
      }

      try {
        const latestReception = await getLatestReception(patient, true);
        if (!latestReception) {
          showError(
            "환자 정보를 열 수 없습니다.",
            "최근 접수 내역이 없습니다."
          );
          return false;
        }

        const provisionalId = buildProvisionalRegistrationId(
          `${patient.id}-${Date.now()}`
        );
        const receptionDateTime = createReceptionDateTime(selectedDate);

        const receptionToOpen: Reception = {
          ...latestReception,
          receptionDateTime,
          patientStatus: {
            ...latestReception.patientStatus,
            status: 접수상태.대기,
          },
          receptionInfo: {
            ...latestReception.receptionInfo,
            status: 접수상태.대기,
            encounters: null,
            paymentInfo: { totalAmount: 0, payments: [] },
            hasReceipt: false,
            appointmentId: null,
          },
          originalRegistrationId: provisionalId,
        };

        setInitialTab(ReceptionInitialTab.환자정보);
        addOpenedReception(receptionToOpen);
        setOpenedReceptionId(provisionalId);
        return true;
      } catch (err) {
        console.error("[useOpenNewReceptionTab] 실패:", err);
        showError(
          "환자 정보를 열 수 없습니다.",
          err instanceof Error ? err.message : "다시 시도해주세요."
        );
        return false;
      }
    },
    [
      getLatestReception,
      selectedDate,
      addOpenedReception,
      setOpenedReceptionId,
      setInitialTab,
      showError,
    ]
  );

  return { openNewReceptionTab };
}
