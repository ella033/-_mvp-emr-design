"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  AdjustmentType,
  BenefitTarget,
  BenefitUnit,
} from "@/constants/common/common-enum";
import { useBenefitsStore } from "@/store/benefits-store";
import type { Benefit } from "@/types/benefits-types";
import type { PaymentData } from "@/types/payment-types";

/** store의 benefits로부터 Select용 옵션 생성 (label = name, value = id 문자열) */
export function useDiscountTypeOptions(): { value: string; label: string }[] {
  const benefits = useBenefitsStore((s) => s.benefits);
  return useMemo(
    () => [
      { value: "", label: "선택" },
      ...benefits.map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [benefits]
  );
}

const DEFAULT_DISCOUNT_TYPE = "";

function getBenefitById(id: string, benefits: Benefit[]): Benefit | undefined {
  const numId = Number(id);
  if (Number.isNaN(numId)) return undefined;
  return benefits.find((b) => b.id === numId);
}

/** target 기준 적용 금액 (COPAY / UNINSURED / 전체) */
function getBaseAmountByTarget(
  target: BenefitTarget,
  paymentData: PaymentData
): number {
  return target === BenefitTarget.COPAY
    ? paymentData.patientCopay
    : target === BenefitTarget.UNINSURED
      ? paymentData.nonCovered
      : paymentData.patientCopay + paymentData.nonCovered;
}

/** config 기준 할인 금액 계산 (정액: value 원, 정률: target 금액의 value%. 정액+target 시 정액이 타겟보다 크면 타겟만 할인) */
export function calculateAmountFromBenefit(
  benefit: Benefit,
  paymentData: PaymentData
): number {
  const { unit, value, target } = benefit.config;
  const baseAmount = getBaseAmountByTarget(target, paymentData);

  if (unit === BenefitUnit.WON) {
    return Math.min(value, baseAmount);
  }
  const rate = value / 100;
  return Math.floor(baseAmount * rate);
}

interface DiscountSelectorProps {
  paymentData: PaymentData;
  availableForDiscount: number;
  onDiscountChange?: (discountType: string, discountAmount: number) => void;
  disabled?: boolean;
  className?: string;
}

export function DiscountSelector({
  paymentData,
  availableForDiscount,
  onDiscountChange,
  disabled = false,
  className = "",
}: DiscountSelectorProps) {
  const benefits = useBenefitsStore((s) => s.benefits);
  const discountTypeOptions = useDiscountTypeOptions();

  // paymentData.adjustments에서 현재 discountType 가져오기
  const currentDiscountAdjustment = useMemo(() => {
    return paymentData.adjustments?.find(
      (adj) => adj.adjustmentType === AdjustmentType.DISCOUNT
    );
  }, [paymentData.adjustments]);

  const currentDiscountTypeFromData = useMemo(() => {
    const raw = currentDiscountAdjustment?.discountType ?? DEFAULT_DISCOUNT_TYPE;
    return raw !== "" && raw != null ? String(raw) : DEFAULT_DISCOUNT_TYPE;
  }, [currentDiscountAdjustment]);

  const [discountType, setDiscountType] = useState<string>(currentDiscountTypeFromData);

  // 사용자 변경인지 외부 변경인지 추적 (무한 루프 방지)
  const isUserChangeRef = useRef<boolean>(false);
  const prevAppliedDiscountValueRef = useRef<number>(0);

  const basePayableAmount = Math.max(
    0,
    paymentData.patientCopay + paymentData.nonCovered
  );

  // discountType(id)에 따라 config 기반 할인 금액 계산
  const calculateDiscountAmount = useMemo(() => {
    if (!discountType || discountType === "") return 0;
    const benefit = getBenefitById(discountType, benefits);
    if (!benefit) return 0;
    return calculateAmountFromBenefit(benefit, paymentData);
  }, [discountType, paymentData, benefits]);

  // 계산된 할인 금액을 사용 가능한 잔액과 납부할 금액 중 작은 값으로 제한
  const appliedDiscountValue = Math.min(
    calculateDiscountAmount,
    availableForDiscount,
    basePayableAmount
  );

  // paymentData.adjustments가 변경될 때마다 discountType 동기화
  useEffect(() => {
    // 현재 상태와 다를 때만 업데이트 (무한 루프 방지)
    if (currentDiscountTypeFromData !== discountType) {
      // 외부에서 변경된 경우이므로 isUserChangeRef를 false로 유지
      setDiscountType(currentDiscountTypeFromData);
    }
  }, [currentDiscountTypeFromData, discountType]);

  // 사용자가 직접 변경한 경우에만 onDiscountChange 호출 (외부 변경은 제외)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDiscountType = e.target.value;
    isUserChangeRef.current = true;
    setDiscountType(newDiscountType);

    const benefit = getBenefitById(newDiscountType, benefits);
    const calculatedAmount = benefit
      ? calculateAmountFromBenefit(benefit, paymentData)
      : 0;
    const newAppliedValue = Math.min(
      calculatedAmount,
      availableForDiscount,
      basePayableAmount
    );

    if (onDiscountChange) {
      prevAppliedDiscountValueRef.current = newAppliedValue;
      onDiscountChange(newDiscountType, newAppliedValue);
    }
  };

  // appliedDiscountValue가 변경되었을 때 onDiscountChange 호출 (사용자 변경이 아닌 경우만)
  useEffect(() => {
    // 사용자가 직접 변경한 경우는 handleSelectChange에서 이미 처리했으므로 스킵
    if (isUserChangeRef.current) {
      isUserChangeRef.current = false;
      return;
    }

    // 실제로 값이 변경되었을 때만 호출 (무한 루프 방지)
    const isDiscountValueChanged = prevAppliedDiscountValueRef.current !== appliedDiscountValue;

    if (isDiscountValueChanged && onDiscountChange) {
      prevAppliedDiscountValueRef.current = appliedDiscountValue;
      onDiscountChange(discountType, appliedDiscountValue);
    }
  }, [appliedDiscountValue, discountType, onDiscountChange]);

  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">감액</span>
        <select
          value={discountType}
          onChange={handleSelectChange}
          disabled={disabled}
          className="px-2 py-1 text-xs border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {discountTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <span className="text-sm font-semibold">
        {appliedDiscountValue.toLocaleString()}
      </span>
    </div>
  );
}

