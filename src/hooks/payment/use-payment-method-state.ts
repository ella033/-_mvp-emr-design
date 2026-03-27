"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaymentMethodData } from "@/types/payment-types";
import { CashApprovalMethod } from "@/constants/common/common-enum";

interface UsePaymentMethodStateReturn {
  isCardChecked: boolean;
  setIsCardChecked: (value: boolean) => void;
  isCashChecked: boolean;
  setIsCashChecked: (value: boolean) => void;
  installment: string;
  setInstallment: (value: string) => void;
  cardAmount: string;
  setCardAmount: (value: string) => void;
  cashAmount: string;
  setCashAmount: (value: string) => void;
  transferAmount: string;
  setTransferAmount: (value: string) => void;
  isCashReceiptChecked: boolean;
  setIsCashReceiptChecked: (value: boolean) => void;
  cashReceiptAmount: string;
  setCashReceiptAmount: (value: string) => void;
  approvalMethod: CashApprovalMethod | "";
  setApprovalMethod: (value: CashApprovalMethod | "") => void;
  approvalNumber: string;
  setApprovalNumber: (value: string) => void;
  isTerminal: boolean;
  setIsTerminal: (value: boolean) => void;
  cardApprovalNumber: string;
  setCardApprovalNumber: (value: string) => void;
  resetPaymentMethodState: () => void;
}

export function usePaymentMethodState(
  isPaymentCompleted: boolean,
  paymentMethodData: PaymentMethodData | null
): UsePaymentMethodStateReturn {
  const [isCardChecked, setIsCardChecked] = useState(false);
  const [isCashChecked, setIsCashChecked] = useState(false);
  const [installment, setInstallment] = useState("일시불");
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isCashReceiptChecked, setIsCashReceiptChecked] = useState(false);
  const [cashReceiptAmount, setCashReceiptAmount] = useState("");
  const [approvalMethod, setApprovalMethod] = useState<CashApprovalMethod | "">("");
  const [approvalNumber, setApprovalNumber] = useState("");
  const [isTerminal, setIsTerminal] = useState(true);
  const [cardApprovalNumber, setCardApprovalNumber] = useState("");

  const paymentMethodDataAppliedRef = useRef<string | null>(null);
  const prevIsPaymentCompletedRef = useRef(isPaymentCompleted);

  const resetPaymentMethodState = useCallback(() => {
    setIsCardChecked(false);
    setIsCashChecked(false);
    setInstallment("일시불");
    setCardAmount("");
    setCashAmount("");
    setTransferAmount("");
    setIsCashReceiptChecked(false);
    setCashReceiptAmount("");
    setApprovalMethod(CashApprovalMethod.휴대폰번호);
    setApprovalNumber("");
    setIsTerminal(true);
    setCardApprovalNumber("");
    // paymentMethodDataAppliedRef를 유지하여, isPaymentCompleted가 일시적으로 true인 렌더에서
    // applyCompletedPaymentMethod가 재적용되는 것을 방지.
    // ref는 isPaymentCompleted가 false로 전환될 때 effect에서 자연스럽게 초기화됨.
  }, []);

  const applyCompletedPaymentMethod = useCallback(() => {
    if (!paymentMethodData) return;
    const dataKey = JSON.stringify(paymentMethodData);
    if (paymentMethodDataAppliedRef.current === dataKey) return;

    setIsCardChecked(paymentMethodData.isCardChecked);
    setIsCashChecked(paymentMethodData.isCashChecked);
    setCardAmount(paymentMethodData.cardAmount);
    setCashAmount(paymentMethodData.cashAmount);
    setTransferAmount(paymentMethodData.accountAmount);
    setInstallment(paymentMethodData.installment);
    setIsCashReceiptChecked(paymentMethodData.isCashReceiptChecked);
    setCashReceiptAmount(paymentMethodData.cashReceiptAmount);
    setApprovalMethod(paymentMethodData.approvalMethod || "");
    setApprovalNumber(paymentMethodData.approvalNumber);
    paymentMethodDataAppliedRef.current = dataKey;
  }, [paymentMethodData]);

  // isPaymentCompleted가 true→false로 전환될 때 (수납취소 등) 결제수단 상태를 초기화
  // handleConfirmCancel의 resetPaymentMethodState() 호출보다 먼저 effect 단계에서 실행되므로
  // Zustand 업데이트 → 리렌더 → effect 순서가 보장됨
  useEffect(() => {
    const wasCompleted = prevIsPaymentCompletedRef.current;
    prevIsPaymentCompletedRef.current = isPaymentCompleted;

    if (wasCompleted && !isPaymentCompleted) {
      // 수납완료 → 수납대기 전환: 결제수단 전체 초기화
      setIsCardChecked(false);
      setIsCashChecked(false);
      setInstallment("일시불");
      setCardAmount("");
      setCashAmount("");
      setTransferAmount("");
      setIsCashReceiptChecked(false);
      setCashReceiptAmount("");
      setApprovalMethod(CashApprovalMethod.휴대폰번호);
      setApprovalNumber("");
      setIsTerminal(true);
      setCardApprovalNumber("");
      paymentMethodDataAppliedRef.current = null;
      return;
    }

    if (isPaymentCompleted && paymentMethodData) {
      applyCompletedPaymentMethod();
    } else if (!isPaymentCompleted) {
      paymentMethodDataAppliedRef.current = null;
    }
  }, [isPaymentCompleted, paymentMethodData, applyCompletedPaymentMethod]);

  return useMemo(
    () => ({
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
      resetPaymentMethodState,
    }),
    [
      approvalMethod,
      approvalNumber,
      cardAmount,
      cardApprovalNumber,
      cashAmount,
      cashReceiptAmount,
      installment,
      isCardChecked,
      isCashChecked,
      isCashReceiptChecked,
      isTerminal,
      transferAmount,
      resetPaymentMethodState,
    ]
  );
}


