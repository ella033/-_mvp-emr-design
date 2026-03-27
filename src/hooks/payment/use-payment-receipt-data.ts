"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PaymentsServices } from "@/services/payments-services";
import type { ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";

interface UseReceiptDataOptions {
  patientId?: string | null;
  encounterId?: string | null;
  isPaymentCompleted: boolean;
  /** 수납완료가 아니더라도 과거 수납 이력(hasReceipt)이 있는 케이스에서 receipts 조회가 필요 */
  shouldFetchReceipts?: boolean;
}

export function useReceiptDataForReception({
  patientId,
  encounterId,
  isPaymentCompleted,
  shouldFetchReceipts,
}: UseReceiptDataOptions) {
  const {
    data: receiptData,
    refetch,
    isFetched,
    isFetching,
    isLoading,
    isSuccess,
    isError,
  } = useQuery<ReceiptDetailsResponse[]>({
    queryKey: ["activeReceiptDetails", patientId, encounterId],
    queryFn: async () => {
      if (!patientId || !encounterId) {
        return [];
      }
      return await PaymentsServices.getActiveReceiptDetails(patientId, encounterId);
    },
    enabled: !!shouldFetchReceipts && !!patientId && !!encounterId,
    // 수납완료인데 영수증이 일시적으로 비어도 "버그 인지"는 상위에서 처리하고, 여기서는 throw 하지 않음
    retry: 0,
    staleTime: 30_000,
  });

  const normalizedReceiptData = useMemo(
    () => receiptData ?? [],
    [receiptData]
  );

  const ensureReceiptDataForCancel = useCallback(async (): Promise<ReceiptDetailsResponse[]> => {
    if (!isPaymentCompleted) {
      throw new Error("수납완료 상태에서만 영수증을 조회할 수 있습니다.");
    }

    if (normalizedReceiptData.length > 0) {
      return normalizedReceiptData;
    }

    if (!patientId || !encounterId) {
      throw new Error("영수증 조회에 필요한 환자 또는 접수 정보가 부족합니다.");
    }

    // 최신 데이터 강제 조회 (없으면 [] 반환)
    const refreshed = await PaymentsServices.getActiveReceiptDetails(patientId, encounterId);
    if (refreshed.length > 0) return refreshed;

    // react-query 캐시도 동기화 시도 (실패해도 무시)
    try {
      await refetch();
    } catch {
      // ignore
    }

    return refreshed;
  }, [isPaymentCompleted, patientId, encounterId, normalizedReceiptData, refetch]);

  return {
    receiptData: normalizedReceiptData,
    ensureReceiptDataForCancel,
    receiptQueryState: {
      isFetched,
      isFetching,
      isLoading,
      isSuccess,
      isError,
    },
  };
}

