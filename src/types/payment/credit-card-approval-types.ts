export interface CreditCardApprovalItem {
  paymentId: string;
  settlementId: string;
  hospitalId: number;
  paymentSource: string;
  paymentMethod: string;
  paymentAmount: number;
  approvalNo: string | null;
  approvalDate: string | null;
  vanType: string | null;
  vanTransactionNo: string | null;
  catId: string | null;
  catVersion: string | null;
  receiptType: number | null;
  identificationNumber: string | null;
  cardNumber: string | null;
  issuerCode: string | null;
  issuerName: string;
  installmentMonths: number;
  acquirerCode: string | null;
  acquirerName: string | null;
  cashType: string | null;
  cashReceived: number | null;
  cashChange: number | null;
  bankCode: string | null;
  bankName: string | null;
  accountNumber: string | null;
  depositorName: string | null;
  transferDateTime: string | null;
  isAuto: boolean;
  isActive: boolean;
  isCanceled: boolean;
  cancelApprovalNo: string | null;
  cancelApprovalDate: string | null;
  originalPaymentId: string | null;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  deleteId: number | null;
  deleteDateTime: string | null;
  /**
   * 환자 정보
   * - 일부 응답에서는 patient로 오거나, 아예 포함되지 않을 수 있어 optional 처리
   * - NOTE: 현재 백엔드 응답 키가 `pateint`(오타)로 내려오는 케이스가 있어 함께 허용
   */
  pateint?: { id: number; name: string; patientNo: number } | null;
  patient?: { id: number; name: string; patientNo: number } | null;
  totalMedicalFee: number | null;
  isCombinedPayment: boolean;
}

