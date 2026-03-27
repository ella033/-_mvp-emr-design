"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { AdjustmentType } from "@/constants/common/common-enum";
import type {
  PaymentData,
  AdjustmentValues,
} from "@/types/payment-types";
import type { ReceiptAdjustmentBase } from "@/types/receipt/receipt-adjustment-types";
import { DiscountSelector, useDiscountTypeOptions } from "../discount-selector";

interface AdjustmentPopUpProps {
  isOpen: boolean;
  onCloseAction: () => void;
  paymentData: PaymentData;
  patientCopayCode?: string; // 본인부담 구분코드
  onApplyAction: (values: AdjustmentValues) => void;
  maxDeductionAmount: number;
}

export default function AdjustmentPopUp({
  isOpen,
  onCloseAction,
  paymentData,
  patientCopayCode = "",
  onApplyAction,
  maxDeductionAmount,
}: AdjustmentPopUpProps) {
  const discountTypeOptions = useDiscountTypeOptions();
  const [receivables] = useState<number>(
    paymentData.receivables || 0
  );
  const [healthMaintenanceFee, setHealthMaintenanceFee] = useState<number>(
    paymentData.healthMaintenanceFee ?? paymentData.cutPrice ?? 0
  );
  const maxDeduction = Math.max(0, maxDeductionAmount);

  // 우선순위에 따른 차감내역 계산: 지원금 > 건생비 > 감액
  // 1. 지원금: 잔액에 따라 자동 계산 (우선순위 1)
  const calculatedGrantAmount = useMemo(() => {
    const baseGrantAmount = paymentData.grantAmount || 0;
    // 잔액(maxDeduction) 내에서 지원금 계산
    return Math.min(baseGrantAmount, maxDeduction);
  }, [paymentData.grantAmount, maxDeduction]);

  // 2. 건생비: 지원금을 제외한 잔액에서 계산 (우선순위 2)
  const availableForHealthMaintenance = useMemo(() => {
    return Math.max(0, maxDeduction - calculatedGrantAmount);
  }, [maxDeduction, calculatedGrantAmount]);

  // 3. 감액: 지원금과 건생비를 제외한 잔액에서 계산 (우선순위 3)
  const availableForDiscount = useMemo(() => {
    return Math.max(0, availableForHealthMaintenance - healthMaintenanceFee);
  }, [availableForHealthMaintenance, healthMaintenanceFee]);

  // 감액 값과 타입을 상태로 관리 (초기값은 paymentData.adjustments에서 가져오기)
  const existingDiscountAdjustment = paymentData.adjustments?.find(
    (adj) => adj.adjustmentType === AdjustmentType.DISCOUNT
  );
  const [appliedDiscountValue, setAppliedDiscountValue] = useState<number>(
    existingDiscountAdjustment?.amount ?? 0
  );
  const [currentDiscountType, setCurrentDiscountType] = useState<string>(
    existingDiscountAdjustment?.discountType != null
      ? String(existingDiscountAdjustment.discountType)
      : ""
  );

  // adjustments 배열 생성 헬퍼 함수
  const createAdjustments = useCallback((discountType: string, discountAmount: number): ReceiptAdjustmentBase[] => {
    const adjustments: ReceiptAdjustmentBase[] = [];
    const discountReason =
      discountTypeOptions.find((option) => option.value === discountType)
        ?.label ?? "감액";

    if (discountAmount > 0 && discountType) {
      adjustments.push({
        adjustmentType: AdjustmentType.DISCOUNT,
        amount: discountAmount,
        discountType: discountType,
        reason: discountReason,
      });
    }

    if (calculatedGrantAmount > 0) {
      adjustments.push({
        adjustmentType: AdjustmentType.GRANT,
        amount: calculatedGrantAmount,
        grantType: "MEDICAL_AID",
        reason: "감면",
      });
    }

    return adjustments;
  }, [calculatedGrantAmount, discountTypeOptions]);

  const handleDiscountChange = (discountType: string, discountAmount: number) => {
    setCurrentDiscountType(discountType);
    setAppliedDiscountValue(discountAmount);

    // 즉시 adjustments를 업데이트하여 paymentData에 반영
    const adjustments = createAdjustments(discountType, discountAmount);

    // 즉시 적용하여 paymentData.adjustments를 업데이트
    onApplyAction({
      discount: discountAmount,
      healthMaintenanceFee,
      grantAmount: calculatedGrantAmount,
      adjustments,
    });
  };

  // 미수환불정산금 표기 (>=0이면 미수, <0이면 환불)
  const receivablesLabel = receivables >= 0 ? "미수" : "환불";
  const isReceivablesChecked = receivables < 0; // 환불일 때만 체크


  // paymentData.adjustments가 변경될 때 감액 값과 타입 동기화 (discountType은 API가 number로 올 수 있으므로 문자열로 통일)
  useEffect(() => {
    const discountAdjustment = paymentData.adjustments?.find(
      (adj) => adj.adjustmentType === AdjustmentType.DISCOUNT
    );
    if (discountAdjustment) {
      setAppliedDiscountValue(discountAdjustment.amount ?? 0);
      setCurrentDiscountType(
        discountAdjustment.discountType != null
          ? String(discountAdjustment.discountType)
          : ""
      );
    } else {
      setAppliedDiscountValue(0);
      setCurrentDiscountType("");
    }
  }, [paymentData.adjustments]);

  // 건생비가 사용 가능한 잔액을 초과하지 않도록 제한
  useEffect(() => {
    if (maxDeduction <= 0) {
      setHealthMaintenanceFee(0);
      return;
    }

    const clampedHealth = Math.min(healthMaintenanceFee, availableForHealthMaintenance);
    if (clampedHealth !== healthMaintenanceFee) {
      setHealthMaintenanceFee(clampedHealth);
    }
  }, [maxDeduction, availableForHealthMaintenance, healthMaintenanceFee]);

  const deductionTotal = useMemo(() => {
    return (
      appliedDiscountValue +
      receivables +
      calculatedGrantAmount +
      healthMaintenanceFee
    );
  }, [appliedDiscountValue, receivables, calculatedGrantAmount, healthMaintenanceFee]);

  // 건생비 변경 버튼 핸들러
  const handleHealthMaintenanceChange = () => {
    const newValue = prompt(
      "건생비를 입력하세요:",
      healthMaintenanceFee.toString()
    );
    if (newValue !== null) {
      const numValue = Number(newValue.replace(/[^0-9]/g, "")) || 0;
      // 지원금을 제외한 잔액 내에서만 건생비 설정 가능
      const clamped = Math.min(numValue, availableForHealthMaintenance);
      setHealthMaintenanceFee(clamped);
    }
  };

  // 팝업 닫을 때 조정값 적용
  const handleApplyAndClose = () => {
    const resolvedDiscountType = currentDiscountType || "";
    const adjustments = createAdjustments(resolvedDiscountType, appliedDiscountValue);

    onApplyAction({
      discount: appliedDiscountValue,
      healthMaintenanceFee,
      grantAmount: calculatedGrantAmount,
      adjustments,
    });
    onCloseAction();
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={handleApplyAndClose}
      title="차감내역"
      width="350px"
      height="320px"
      alwaysCenter={true}
      closeOnOutsideClick={false}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 첫째줄: 감액 & select박스 / 선택.계산된 금액 혹은 직접기입 */}
          <div className="flex w-full">
            <DiscountSelector
              paymentData={paymentData}
              availableForDiscount={availableForDiscount}
              onDiscountChange={handleDiscountChange}
              disabled={false}
            />
          </div>

          {/* 둘째줄: 미수환불정산금 & 체크박스 / 미수환불정산금 */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="flex items-center">
              <span className="text-sm pr-2">미수환불정산금</span>
              <input
                type="checkbox"
                checked={isReceivablesChecked}
                disabled
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-500">
                {receivablesLabel}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">
                {Math.abs(receivables).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 셋째줄: 건생비 & 차감액 변경 버튼 / 건생비 금액 */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="flex items-center gap-2">
              <span className="text-sm">건생비</span>
              <button
                onClick={handleHealthMaintenanceChange}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                변경
              </button>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold">
                  {healthMaintenanceFee.toLocaleString()}
                </span>
                {/* TODO: 실제 데이터로 받아온 건생비 잔액 표시 */}
                <span className="text-xs text-gray-400">
                  잔액 0{/* TODO: paymentData.healthMaintenanceFeeBalance 또는 실제 잔액 데이터 */}
                </span>
              </div>
            </div>
          </div>

          {/* 넷째줄: 지원금 / 지원금 금액 (자동 계산) */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <span className="text-sm">지원금</span>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold">
                  {calculatedGrantAmount.toLocaleString()}
                </span>
                {/* 의료급여산전지원금 span과 잔액 표기 */}
                <div>
                  <span className="bg-[var(--bg-3)] px-2 py-1 rounded text-xs">
                    의료급여산전지원금
                  </span>
                  {/* TODO: 실제 데이터로 받아온 지원금 잔액 표시 */}
                  <span className="text-xs text-gray-400 ml-1">
                    잔액 0{/* TODO: paymentData.grantAmountBalance 또는 실제 잔액 데이터 */}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 마지막 줄: 본인부담 구분코드 */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <span className="text-sm border border-gray-300 rounded px-2 py-1">본인부담 구분코드</span>
              <span className="text-sm px-2">{patientCopayCode || "-"}</span>
            </div>
          </div>
        </div>

        {/* Summary: 차감내역합계 */}
        <div className="p-4 bg-[var(--red-1)]">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">차감내역합계</span>
            <span className="text-sm font-semibold">
              {deductionTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </MyPopup>
  );
}

