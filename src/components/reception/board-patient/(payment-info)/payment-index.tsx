"use client";

import { useState } from "react";
import { usePaymentIndex } from "@/hooks/payment/use-payment-index";
import PaymentAmount from "./payment-amount";
import PaymentMethod from "./payment-method";
import PaymentFooter from "./payment-footer";
import PaymentOrders from "./payment-orders-tree";
import InsuranceHistoryPopup from "@/components/reception/board-patient/(insurance-info)/insurance-history-popup";
import { ReceptionService } from "@/services/reception-service";
import type { Reception } from "@/types/common/reception-types";
import type { Encounter } from "@/types/chart/encounter-types";
import type { PaymentData } from "@/types/payment-types";
import type { PaymentInfoViewState } from "@/types/common/reception-view-types";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import AdjustmentPopUp from "./adjustment-pop-up/adjustment-pop-up";
import { AlertBarContainerDirect } from "@/components/ui/alert-bar";

interface PaymentInfoPanelProps {
  paymentData?: PaymentData;
  onPayment?: () => void;
  className?: string;
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  isDisabled?: boolean;
  initialPaymentUIState?: Partial<PaymentInfoViewState>;
  onPaymentUIStateChange?: (state: Partial<PaymentInfoViewState>) => void;
}

export default function PaymentInfoPanel({
  paymentData: externalPaymentData,
  onPayment,
  className = "",
  reception: externalReception,
  receptionId: externalReceptionId,
  isDisabled = false,
  initialPaymentUIState,
  onPaymentUIStateChange,
}: PaymentInfoPanelProps) {
  const [isInsuranceHistoryPopupOpen, setIsInsuranceHistoryPopupOpen] =
    useState(false);

  const preserveReceivedAmount = (() => {
    if (initialPaymentUIState?.receivedAmount === undefined) return false;
    const numericValue = Number(initialPaymentUIState.receivedAmount);
    return Number.isFinite(numericValue) && numericValue > 0;
  })();
  const {
    currentReception,
    activeReceptionId,
    receptionEncounter,
    isPaymentCompleted,
    shouldUseReceiptAsCompleted,
    paymentData,
    orders,
    receiptData,
    paymentMethodState,
    receiptMemo,
    setReceiptMemo,
    receivedAmount,
    setReceivedAmount,
    printOptions,
    isPaymentLoading,
    handlePayment,
    handleCancelPayment,
    handleConfirmCancel,
    closeCancelPopup,
    isCancelPopupOpen,
    cancelMessage,
    handleDeductionDetailClick,
    handleApplyAdjustment,
    isAdjustmentPopupOpen,
    handleCloseAdjustmentPopup,
    basePaymentAmount,
    availableForDiscount,
    handleDiscountChange,
    hasAlertBar,
    ReceptionHtmlHiddenRenderer,
  } = usePaymentIndex({
    externalReception,
    externalReceptionId,
    externalPaymentData,
    onPayment,
    initialUIState: initialPaymentUIState,
    onUIStateChange: onPaymentUIStateChange,
  });

  const {
    isCardChecked,
    setIsCardChecked,
    isCashChecked,
    setIsCashChecked,
    installment,
    setInstallment,
    cardAmount,
    setCardAmount,
    cashAmount,
    setCashAmount,
    transferAmount,
    setTransferAmount,
    isCashReceiptChecked,
    setIsCashReceiptChecked,
    cashReceiptAmount,
    setCashReceiptAmount,
    approvalMethod,
    setApprovalMethod,
    approvalNumber,
    setApprovalNumber,
    isTerminal,
    setIsTerminal,
    cardApprovalNumber,
    setCardApprovalNumber,
  } = paymentMethodState;

  const {
    printPrescription,
    setPrintPrescription,
    printReceipt,
    setPrintReceipt,
    printStatement,
    setPrintStatement,
  } = printOptions;

  return (
    <div className={`h-full ${className}`}>
      <div className="w-full h-full flex flex-col min-h-0">
        {/* 영역1: 환자 처방내역 (가변 높이) */}
        <div className="flex-1 mb-2 min-h-0 overflow-y-auto border-b border-[var(--border-1)]">
          <PaymentOrders
            encounter={receptionEncounter as Encounter | null}
            orders={orders}
            isLoading={false}
            receptionId={activeReceptionId}
            onInsuranceHistoryChange={() => setIsInsuranceHistoryPopupOpen(true)}
          />
        </div>

        {/* 영역2: 수납내역 정보 (고정 높이 24rem) */}
        <div className="h-[24rem] flex-shrink-0 flex flex-col p-1">
          <div className="grid grid-cols-2 grid-rows-1 gap-2 mb-2 flex-1 min-h-0">
            <PaymentAmount
              paymentData={paymentData}
              receiptMemo={receiptMemo}
              setReceiptMemo={setReceiptMemo}
              receivedAmount={receivedAmount}
              setReceivedAmount={setReceivedAmount}
              onDeductionDetailClick={handleDeductionDetailClick}
              onDiscountChange={handleDiscountChange}
              availableForDiscount={availableForDiscount}
              preserveReceivedAmount={preserveReceivedAmount}
              disabled={shouldUseReceiptAsCompleted || isDisabled}
              encounter={receptionEncounter as Encounter | null}
            />

            <PaymentMethod
              receivedAmount={receivedAmount}
              isCardChecked={isCardChecked}
              setIsCardChecked={setIsCardChecked}
              isCashChecked={isCashChecked}
              setIsCashChecked={setIsCashChecked}
              installment={installment}
              setInstallment={setInstallment}
              cardAmount={cardAmount}
              setCardAmount={setCardAmount}
              cashAmount={cashAmount}
              setCashAmount={setCashAmount}
              transferAmount={transferAmount}
              setTransferAmount={setTransferAmount}
              isCashReceiptChecked={isCashReceiptChecked}
              setIsCashReceiptChecked={setIsCashReceiptChecked}
              cashReceiptAmount={cashReceiptAmount}
              setCashReceiptAmount={setCashReceiptAmount}
              approvalMethod={approvalMethod}
              setApprovalMethod={setApprovalMethod}
              approvalNumber={approvalNumber}
              setApprovalNumber={setApprovalNumber}
              isTerminal={isTerminal}
              setIsTerminal={setIsTerminal}
              cardApprovalNumber={cardApprovalNumber}
              setCardApprovalNumber={setCardApprovalNumber}
              disabled={shouldUseReceiptAsCompleted || isDisabled}
              patientPhone={externalReception?.patientBaseInfo?.phone1}
            />
          </div>

          <AlertBarContainerDirect />
          <PaymentFooter
            printPrescription={printPrescription}
            setPrintPrescription={setPrintPrescription}
            printReceipt={printReceipt}
            setPrintReceipt={setPrintReceipt}
            printStatement={printStatement}
            setPrintStatement={setPrintStatement}
            onPayment={handlePayment}
            onCancelPayment={handleCancelPayment}
            isLoading={isPaymentLoading}
            isDisabled={isDisabled || hasAlertBar}
            isPaymentCompleted={isPaymentCompleted || shouldUseReceiptAsCompleted}
            receiptData={shouldUseReceiptAsCompleted ? receiptData || null : null}
          />
        </div>
      </div>

      <MyPopupYesNo
        isOpen={isCancelPopupOpen}
        onCloseAction={closeCancelPopup}
        onConfirmAction={handleConfirmCancel}
        title="수납 취소"
        message={cancelMessage}
        confirmText="확인"
        cancelText="취소"
      />

      <AdjustmentPopUp
        isOpen={isAdjustmentPopupOpen}
        onCloseAction={handleCloseAdjustmentPopup}
        paymentData={paymentData}
        patientCopayCode=""
        onApplyAction={handleApplyAdjustment}
        maxDeductionAmount={basePaymentAmount}
      />

      {/* HTML 인쇄용 숨김 렌더러 */}
      <ReceptionHtmlHiddenRenderer />

      {/* 보험이력변경 팝업 */}
      <InsuranceHistoryPopup
        isOpen={isInsuranceHistoryPopupOpen}
        onClose={() => setIsInsuranceHistoryPopupOpen(false)}
        registration={
          currentReception
            ? ReceptionService.convertReceptionToRegistration(currentReception)
            : null
        }
        reception={currentReception ?? null}
      />
    </div>
  );
}

// 개별 컴포넌트들도 export하여 필요시 개별 사용 가능
export { PaymentAmount, PaymentMethod, PaymentFooter };
export type { PaymentData };