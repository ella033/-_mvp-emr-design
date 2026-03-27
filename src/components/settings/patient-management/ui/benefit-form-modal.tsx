"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import MyPopup from "@/components/yjg/my-pop-up";
import MyInput from "@/components/yjg/my-input";
import { MySelect, type MySelectOption } from "@/components/yjg/my-select";
import { MyButton } from "@/components/yjg/my-button";
import type {
  Benefit,
  CreateBenefitRequest,
  DiscountTarget,
  DiscountUnit,
} from "../model";
import {
  DISCOUNT_TARGET_OPTIONS,
  DISCOUNT_UNIT_OPTIONS,
  DEFAULT_DISCOUNT_CONFIG,
} from "../model";
import { validateBenefitForm } from "../model/validators";

type BenefitFormModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  initialBenefit: Benefit | null;
  onClose: () => void;
  onSubmit: (payload: CreateBenefitRequest) => Promise<boolean>;
};

const targetOptions: MySelectOption[] = DISCOUNT_TARGET_OPTIONS.map((item) => ({
  value: item.value,
  label:
    item.value === "PAYABLE_AMOUNT"
      ? "납부금 감액"
      : item.value === "COPAY"
        ? "본인부담금"
        : "비급여",
}));

const unitOptions: MySelectOption[] = DISCOUNT_UNIT_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

export function BenefitFormModal({
  isOpen,
  isSubmitting,
  initialBenefit,
  onClose,
  onSubmit,
}: BenefitFormModalProps) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState<DiscountTarget>(
    DEFAULT_DISCOUNT_CONFIG.target
  );
  const [unit, setUnit] = useState<DiscountUnit>(DEFAULT_DISCOUNT_CONFIG.unit);
  const [valueText, setValueText] = useState(
    String(DEFAULT_DISCOUNT_CONFIG.value)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialBenefit) {
      setName("");
      setTarget(DEFAULT_DISCOUNT_CONFIG.target);
      setUnit(DEFAULT_DISCOUNT_CONFIG.unit);
      setValueText(String(DEFAULT_DISCOUNT_CONFIG.value));
      setErrorMessage(null);
      return;
    }

    setName(initialBenefit.name);
    setTarget(initialBenefit.config.target);
    setUnit(initialBenefit.config.unit);
    setValueText(String(initialBenefit.config.value));
    setErrorMessage(null);
  }, [initialBenefit, isOpen]);

  const valueGuide = useMemo(() => {
    if (unit === "PERCENT") return "0 ~ 100 범위의 정수를 입력하세요.";
    return "0 이상의 정수를 입력하세요.";
  }, [unit]);

  const handleSubmit = async () => {
    const validation = validateBenefitForm({
      name,
      unit,
      valueText,
    });

    if (!validation.ok) {
      setErrorMessage(validation.errorMessage);
      return;
    }

    setErrorMessage(null);
    const ok = await onSubmit({
      name: validation.name,
      type: "DISCOUNT",
      config: {
        target,
        unit,
        value: validation.value,
      },
    });

    if (ok) {
      onClose();
    }
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      width="320px"
      height="auto"
      fitContent
      hideHeader
    >
      <div className="-m-[10px] w-[300px] max-w-[88vw] rounded-md border border-[var(--border-secondary)] bg-[var(--card-bg)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-3 py-2">
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">
            {initialBenefit ? "감액 수정" : "감액 추가"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--text-secondary)]">
            혜택명
          </label>
          <MyInput
            type="text"
            className="h-[26px]"
            value={name}
            maxLength={100}
            onChange={setName}
            placeholder="비급여 100%"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--text-secondary)]">
            감액 대상
          </label>
          <MySelect
            options={targetOptions}
            value={target}
            onChange={(next) => setTarget(next as DiscountTarget)}
            className="h-[26px] w-full"
            parentClassName="w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--text-secondary)]">
            감액 값
          </label>
          <div className="grid grid-cols-[1fr_64px] gap-1">
            <MyInput
              type="text"
              className="h-[26px]"
              value={valueText}
              onChange={setValueText}
              placeholder={unit === "PERCENT" ? "예: 10" : "예: 3000"}
            />
            <MySelect
              options={unitOptions}
              value={unit}
              onChange={(next) => setUnit(next as DiscountUnit)}
              className="h-[26px] w-full"
              parentClassName="w-full"
            />
          </div>
        </div>

        {errorMessage ? (
          <p className="text-[11px] text-red-500">{errorMessage}</p>
        ) : null}

        <p className="text-[10px] text-[var(--text-secondary)]">{valueGuide}</p>

        <div className="mt-1 flex justify-end gap-1">
          <MyButton variant="outline" className="h-[24px] min-w-[38px] px-2 text-[10px]" onClick={onClose}>
            취소
          </MyButton>
          <MyButton
            className="h-[24px] min-w-[38px] px-2 text-[10px]"
            onClick={() => void handleSubmit()}
            loading={isSubmitting}
          >
            저장
          </MyButton>
        </div>
        </div>
      </div>
    </MyPopup>
  );
}
