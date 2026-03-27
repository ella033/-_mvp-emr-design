import { useQuery } from "@tanstack/react-query";
import { PaymentsServices } from "@/services/payments-services";
import type { PaymentsListParams } from "@/types/payment-types";

export const usePaymentsByDates = <T = any>(params: PaymentsListParams) => {
  return useQuery<T>({
    queryKey: [
      "payments",
      "list",
      params.settlementId,
      params.paymentSource,
      params.paymentMethod,
      params.receiptId,
      params.patientId,
      params.startDate,
      params.endDate,
      params.includedCanceled
    ],
    queryFn: async () => {
      const result = await PaymentsServices.getPayments<T>(params);

      if (!result || !Array.isArray(result)) {
        return ([] as T);
      }

      // 날짜 기준으로 내림차순 정렬
      // 정렬 기준: cancelApprovalDate > approvalDate > createDateTime
      const sortedResult = [...result].sort((a: any, b: any) => {
        // 각 항목의 정렬 기준 날짜를 결정하는 함수
        const getSortDate = (item: any): string | null => {
          if (item.cancelApprovalDate) return item.cancelApprovalDate;
          if (item.approvalDate) return item.approvalDate;
          if (item.createDateTime) return item.createDateTime;
          return null;
        };

        const dateA = getSortDate(a);
        const dateB = getSortDate(b);

        // null 값은 맨 뒤로
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        // 내림차순 정렬 (최신 날짜가 먼저)
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return sortedResult as T;
    },
    enabled: !!(params.startDate && params.endDate),
  });
};

export const usePaymentStatistics = <T = any>(
  startDate?: string,
  endDate?: string
) => {
  return useQuery<T>({
    queryKey: ["payments", "statistics", startDate, endDate],
    queryFn: async () => {
      return PaymentsServices.getPaymentStatistics<T>(startDate, endDate);
    },
    enabled: !!(startDate && endDate),
  });
};