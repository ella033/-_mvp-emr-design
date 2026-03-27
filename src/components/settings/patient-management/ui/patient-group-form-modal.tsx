"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import MyPopup from "@/components/yjg/my-pop-up";
import MyInput from "@/components/yjg/my-input";
import { MySelect, type MySelectOption } from "@/components/yjg/my-select";
import { MyButton } from "@/components/yjg/my-button";
import type { Benefit, PatientGroup } from "../model";
import { validatePatientGroupForm } from "../model/validators";

type PatientGroupFormValues = {
  name: string;
  benefitId?: number;
  clearBenefit?: boolean;
};

type PatientGroupFormModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  initialGroup: PatientGroup | null;
  benefits: Benefit[];
  onClose: () => void;
  onSubmit: (values: PatientGroupFormValues) => Promise<boolean>;
};

const EMPTY_BENEFIT_VALUE = "__none__";

export function PatientGroupFormModal({
  isOpen,
  isSubmitting,
  initialGroup,
  benefits,
  onClose,
  onSubmit,
}: PatientGroupFormModalProps) {
  const [name, setName] = useState("");
  const [selectedBenefitValue, setSelectedBenefitValue] =
    useState<string>(EMPTY_BENEFIT_VALUE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialGroup) {
      setName("");
      setSelectedBenefitValue(EMPTY_BENEFIT_VALUE);
      setErrorMessage(null);
      return;
    }
    setName(initialGroup.name);
    const linkedBenefit = initialGroup.benefits?.[0];
    setSelectedBenefitValue(
      linkedBenefit ? String(linkedBenefit.id) : EMPTY_BENEFIT_VALUE
    );
    setErrorMessage(null);
  }, [initialGroup, isOpen]);

  const benefitOptions = useMemo<MySelectOption[]>(() => {
    const rows: MySelectOption[] = [
      { value: EMPTY_BENEFIT_VALUE, label: "연결 안함" },
    ];
    for (const benefit of benefits) {
      rows.push({ value: String(benefit.id), label: benefit.name });
    }
    return rows;
  }, [benefits]);

  const handleSubmit = async () => {
    const validation = validatePatientGroupForm({
      name,
      selectedBenefitValue,
      emptyBenefitValue: EMPTY_BENEFIT_VALUE,
    });

    if (!validation.ok) {
      setErrorMessage(validation.errorMessage);
      return;
    }

    setErrorMessage(null);
    const ok = await onSubmit({
      name: validation.name,
      benefitId: validation.benefitId,
      clearBenefit: validation.clearBenefit,
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
            {initialGroup ? "환자 그룹 수정" : "환자 그룹 추가"}
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
              환자그룹명
            </label>
            <MyInput
              type="text"
              className="h-[26px]"
              value={name}
              maxLength={100}
              onChange={setName}
              placeholder="환자그룹명"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--text-secondary)]">
              감액 연동
            </label>
            <MySelect
              options={benefitOptions}
              value={selectedBenefitValue}
              onChange={(next) => setSelectedBenefitValue(String(next))}
              className="h-[26px] w-full"
              parentClassName="w-full"
            />
          </div>

          {errorMessage ? (
            <p className="text-[11px] text-red-500">{errorMessage}</p>
          ) : null}

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
