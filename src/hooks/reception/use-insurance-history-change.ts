import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";
import { DiseasesService } from "@/services/diseases-service";
import { OrdersService } from "@/services/orders-service";
import { EncountersService } from "@/services/encounters-service";
import { PaymentsServices } from "@/services/payments-services";
import { useReceptionStore } from "@/store/reception";
import type { Registration } from "@/types/registration-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import type { Order } from "@/types/chart/order-types";
import type { Disease } from "@/types/chart/disease-types";
import type { 보험구분상세 } from "@/constants/common/common-enum";
import { convertOrderToApiOrder } from "@/app/medical/_components/panels/(patient-diagnosis-prescription)/api-converter";
import {
  adjustOrdersForInsuranceChange,
  fetchUserCodePaymentInfoMap,
} from "@/lib/insurance/adjust-orders-for-insurance-change";

// ── Disease → ApiDisease 변환 ──
interface ApiDisease {
  id?: string;
  sortNumber: number;
  code: string;
  name: string;
  isSuspected: boolean;
  isExcluded: boolean;
  isLeftSide: boolean;
  isRightSide: boolean;
  department: number;
  specificSymbol: string;
  externalCauseCode: string;
  isSurgery: boolean;
  diseaseLibraryId?: number;
}

function convertDiseaseToApiDisease(disease: Disease): ApiDisease {
  return {
    id: disease.id,
    sortNumber: disease.sortNumber ?? 0,
    code: disease.code,
    name: disease.name,
    isSuspected: disease.isSuspected ?? false,
    isExcluded: disease.isExcluded ?? false,
    isLeftSide: disease.isLeftSide ?? false,
    isRightSide: disease.isRightSide ?? false,
    department: disease.department ?? 0,
    specificSymbol: disease.specificSymbol ?? "",
    externalCauseCode: disease.externalCauseCode ?? "",
    isSurgery: disease.isSurgery ?? false,
    diseaseLibraryId: disease.diseaseLibraryId,
  };
}

interface UseInsuranceHistoryChangeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useInsuranceHistoryChange(
  options?: UseInsuranceHistoryChangeOptions
) {
  const queryClient = useQueryClient();
  const { updateRegistration: updateStoreRegistration } = useReceptionStore();
  const [isLoading, setIsLoading] = useState(false);

  const executeInsuranceHistoryChange = useCallback(
    async (
      registration: Registration,
      newInsuranceInfo: Partial<InsuranceInfo>
    ) => {
      setIsLoading(true);

      try {
        // T0: encounter 데이터 캡처 (소켓 영향 방지)
        const encounters = registration.encounters;
        const encounterId = PaymentsServices.getLatestEncounterId(encounters);

        if (!encounterId) {
          throw new Error("차트 정보를 찾을 수 없습니다.");
        }

        // encounter에서 orders/diseases 가져오기
        const encounter = await EncountersService.getEncounter(encounterId);
        const capturedOrders: Order[] = encounter.orders ?? [];
        const capturedDiseases: Disease[] = encounter.diseases ?? [];

        // T2: 처방 수납방법 조정 (보험구분 변경에 따라)
        const newInsuranceType =
          newInsuranceInfo.uDeptDetail as 보험구분상세;
        const userCodePaymentInfoMap =
          await fetchUserCodePaymentInfoMap(capturedOrders);
        const adjustedOrders = adjustOrdersForInsuranceChange(
          capturedOrders,
          newInsuranceType,
          userCodePaymentInfoMap
        );

        // T1 이전: 소켓 이벤트 가드 조기 설정
        // T1~T5 동안 백엔드가 보내는 db.registration 소켓 이벤트를 차단하여 중복 refetch 방지
        useReceptionStore.getState().setLastLocalRegistrationUpdate({
          registrationId: registration.id,
          at: Date.now(),
        });

        // T1: updateRegistration (보험정보만 업데이트)
        // 백엔드의 saveOrders 단계에서 registration의 변경된 보험정보를 직접 조회하므로,
        // T3(saveDisease/saveOrder) 이전에 반드시 선행되어야 한다.
        const insurancePayload = {
          insuranceType: newInsuranceType,
          certificateNo: newInsuranceInfo.cardNumber,
          providerCode: newInsuranceInfo.unionCode,
          providerName: newInsuranceInfo.unionName,
          extraQualification: newInsuranceInfo.extraQualification,
        };
        await RegistrationsService.updateRegistration(
          registration.id,
          insurancePayload
        );

        // T3: saveDisease + saveOrder (조정된 데이터 사용)
        const upsertOrders = convertOrderToApiOrder(adjustedOrders);
        const upsertDiseases = capturedDiseases.map(convertDiseaseToApiDisease);

        await Promise.all([
          DiseasesService.deleteUpsertManyDiseasesByEncounter(encounterId, {
            items: upsertDiseases,
          }),
          OrdersService.deleteUpsertManyOrdersByEncounter(encounterId, {
            items: upsertOrders,
          }),
        ]);

        // T4: syncEncounterClaimDetail
        await EncountersService.syncEncounterClaimDetail(encounterId);

        // T5: 최신 registration 재조회 → Zustand 스토어 갱신
        // reception-tabs-store 동기화는 auto-sync subscription이 자동 처리
        const updatedRegistration = await RegistrationsService.getRegistration(
          registration.id
        );
        updateStoreRegistration(registration.id, updatedRegistration);

        // T7: React Query 캐시 무효화 → encounter/orders/diseases 갱신
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] }),
          queryClient.invalidateQueries({ queryKey: ["orders", encounterId] }),
          queryClient.invalidateQueries({ queryKey: ["diseases", encounterId] }),
        ]);

        options?.onSuccess?.();
      } catch (error) {
        console.error("[useInsuranceHistoryChange] error", error);
        options?.onError?.(
          error instanceof Error ? error : new Error("보험이력변경 실패")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient, options]
  );

  return {
    isLoading,
    executeInsuranceHistoryChange,
  };
}
