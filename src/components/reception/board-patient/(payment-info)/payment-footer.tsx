import type React from 'react';
import type { ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";

// payment-footer 내부 전역 변수: 수납완료된 영수증 ID (배열)
export let receiptIds: string[] = [];

interface PaymentFooterProps {
  printPrescription: boolean;
  setPrintPrescription: (checked: boolean) => void;
  printReceipt: boolean;
  setPrintReceipt: (checked: boolean) => void;
  printStatement: boolean;
  setPrintStatement: (checked: boolean) => void;
  onPayment: () => void;
  onCancelPayment?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  isPaymentCompleted?: boolean;
  /** 수납완료 상태일 때 사용할 영수증 정보 (취소용) */
  receiptData?: ReceiptDetailsResponse[] | null;
}

export default function PaymentFooter({
  printPrescription,
  setPrintPrescription,
  printReceipt,
  setPrintReceipt,
  printStatement,
  setPrintStatement,
  onPayment,
  onCancelPayment,
  isLoading = false,
  isDisabled = false,
  isPaymentCompleted = false,
  receiptData,
}: PaymentFooterProps) {
  // 수납완료 상태에서 넘어온 receiptData 기반으로 전역 ID 보관 (모든 receipt ID)
  if (receiptData && receiptData.length > 0) {
    receiptIds = receiptData.map((receipt) => receipt.id);
  } else {
    receiptIds = [];
  }

  return (
    <div className="flex justify-between items-center" data-testid="reception-payment-footer">
      {!isPaymentCompleted && !isDisabled && (
        <div className="flex gap-2" data-testid="reception-payment-print-options">
          <span className="text-md font-semibold text-[var(--gray-100)] mr-2 ml-2">출력</span>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              data-testid="reception-payment-print-prescription"
              checked={printPrescription}
              onChange={(e) => setPrintPrescription(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--gray-100)]">처방전</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              data-testid="reception-payment-print-receipt"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--gray-100)]">영수증</span>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              data-testid="reception-payment-print-statement"
              checked={printStatement}
              onChange={(e) => setPrintStatement(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-[var(--gray-100)]">진료비내역서</span>
          </label>
        </div>
      )}
      {isPaymentCompleted && !isDisabled && <div />}

      {isPaymentCompleted && !isDisabled ? (
        <button
          data-testid="reception-payment-cancel-button"
          onClick={onCancelPayment}
          disabled={isLoading}
          className="bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] text-white px-6 py-1.5 rounded-md text-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "처리 중..." : "수납취소"}
        </button>
      ) : (
        <button
          data-testid="reception-payment-submit-button"
          onClick={onPayment}
          disabled={isLoading || isDisabled}
          className="bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] text-white px-6 py-1.5 rounded-md text-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "처리 중..." : "수납"}
        </button>
      )}
    </div>
  );
}
