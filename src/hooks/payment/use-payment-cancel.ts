import { useState, useCallback } from "react";
import { PaymentsServices } from "@/services/payments-services";
import type { CancelPaymentRequest } from "@/types/payment-types";
import { useToastHelpers } from "@/components/ui/toast";

/**
 * 결제 취소를 위한 Custom Hook
 */
export function usePaymentCancel() {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToastHelpers();

  /**
   * 결제 취소 함수
   * @param paymentId - 취소할 결제 ID
   * @param request - 취소 요청 정보 (cancelApprovalNo, cancelApprovalDate)
   */
  const cancelPayment = useCallback(
    async (paymentId: string, request: CancelPaymentRequest) => {
      setIsLoading(true);
      try {
        await PaymentsServices.cancelPayment(paymentId, request);
        toast.success("결제 취소 완료", "결제가 취소되었습니다.");
      } catch (error: any) {
        const errorMessage = error?.message || "결제 취소 처리 중 오류가 발생했습니다.";
        toast.error("결제 취소 실패", errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  return {
    cancelPayment,
    isLoading,
  };
}


