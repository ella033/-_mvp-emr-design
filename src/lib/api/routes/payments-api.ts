import type { PaymentsListParams } from "@/types/payment-types";

export const paymentsApi = {
  list: (params: PaymentsListParams) => {
    const queryParams = new URLSearchParams();

    // startDate와 endDate는 우선순위가 높으므로 먼저 처리
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    // 나머지 optional 파라미터들
    if (params.settlementId) queryParams.append("settlementId", params.settlementId);
    if (params.paymentSource) queryParams.append("paymentSource", params.paymentSource);
    if (params.paymentMethod) queryParams.append("paymentMethod", params.paymentMethod);
    if (params.receiptId) queryParams.append("receiptId", params.receiptId);
    if (params.patientId) queryParams.append("patientId", params.patientId);
    if (params.includedCanceled) queryParams.append("includedCanceled", params.includedCanceled?.toString() ?? "false");

    const queryString = queryParams.toString();
    return `/payments${queryString ? `?${queryString}` : ""}`;
  },
  detail: (id: string) => `/payments/${id}`,
  statistics: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const queryString = params.toString();
    return `/payments/statistics${queryString ? `?${queryString}` : ""}`;
  },
  cancel: (id: string) => `/payments/${id}/cancel`,
}