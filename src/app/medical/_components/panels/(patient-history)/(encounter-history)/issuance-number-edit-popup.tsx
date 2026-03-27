"use client";

import { useState, useCallback, useEffect } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import type { Encounter } from "@/types/chart/encounter-types";
import type { Patient } from "@/types/patient-types";
import { formatDateByPattern } from "@/lib/date-utils";
import { useToastHelpers } from "@/components/ui/toast";
import { useHospitalStore } from "@/store/hospital-store";
import { useAgentDur } from "@/hooks/use-agent-dur";
import { useUpdateIssuanceNumber } from "@/hooks/encounter/use-update-issuance-number";
import type { DurCancelRequest } from "@/services/agent/agent-dur-service";
import { cn } from "@/lib/utils";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { ApiError } from "@/lib/api/api-proxy";

const DUR_CANCEL_SUCCESS_CODES = [0, 53002];
const ISSUANCE_SERIAL_LENGTH = 5;
const ISSUANCE_DATE_LENGTH = 8;

export default function IssuanceNumberEditPopup({
  isOpen,
  onCloseAction,
  encounter,
  patient,
  onSuccessAction,
}: {
  isOpen: boolean;
  onCloseAction: () => void;
  encounter: Encounter;
  patient: Patient | null | undefined;
  onSuccessAction?: (updatedEncounter: Encounter) => void;
}) {
  const { success, error } = useToastHelpers();
  const { hospital } = useHospitalStore();
  const { durCancel } = useAgentDur();
  const updateIssuanceNumberMutation = useUpdateIssuanceNumber();

  const datePart =
    encounter.issuanceNumber?.slice(0, ISSUANCE_DATE_LENGTH) ||
    formatDateByPattern(encounter.encounterDateTime, "YYYYMMDD") ||
    "";
  const initialSerial = encounter.issuanceNumber?.slice(ISSUANCE_DATE_LENGTH) ?? "";

  const dateDisplay =
    datePart.length === ISSUANCE_DATE_LENGTH
      ? formatDateByPattern(datePart, "YYYY-MM-DD")
      : formatDateByPattern(encounter.encounterDateTime, "YYYY-MM-DD") ?? "";

  const [serialInput, setSerialInput] = useState(initialSerial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const canSave =
    datePart.length === ISSUANCE_DATE_LENGTH &&
    serialInput.length === ISSUANCE_SERIAL_LENGTH &&
    /^\d+$/.test(serialInput);

  useEffect(() => {
    if (isOpen) {
      setSerialInput(initialSerial);
      setValidationError(null);
      setBackendError(null);
    }
  }, [isOpen, initialSerial]);

  const handleSerialChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, "").slice(0, ISSUANCE_SERIAL_LENGTH);
      setSerialInput(v);
      setBackendError(null);
      if (v.length > 0 && v.length !== ISSUANCE_SERIAL_LENGTH) {
        setValidationError(`${ISSUANCE_SERIAL_LENGTH}자리 숫자를 입력해주세요.`);
      } else {
        setValidationError(null);
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    setValidationError(null);
    setBackendError(null);

    if (datePart.length !== ISSUANCE_DATE_LENGTH) {
      setValidationError("교부일자 정보를 확인할 수 없습니다.");
      return;
    }
    if (serialInput.length !== ISSUANCE_SERIAL_LENGTH) {
      setValidationError(`${ISSUANCE_SERIAL_LENGTH}자리 숫자를 입력해주세요.`);
      return;
    }
    if (!/^\d+$/.test(serialInput)) {
      setValidationError("교부번호는 숫자만 입력할 수 있습니다.");
      return;
    }

    const fullIssuanceNumber = datePart + serialInput;
    if (fullIssuanceNumber.length !== ISSUANCE_DATE_LENGTH + ISSUANCE_SERIAL_LENGTH) {
      setValidationError("교부일자와 일련번호 형식이 올바르지 않습니다.");
      return;
    }

    const hasExistingIssuance = !!encounter.issuanceNumber;

    try {
      if (hasExistingIssuance && patient && hospital?.number) {
        const patJuminNo = (patient.rrn ?? "").replace(/-/g, "");
        if (patJuminNo.length !== 13) {
          error("수진자 주민번호가 올바르지 않습니다.");
          return;
        }
        const prscData = formatDateByPattern(
          encounter.encounterDateTime,
          "YYYYMMDD"
        );
        if (!prscData) {
          error("처방일자를 확인할 수 없습니다.");
          return;
        }
        const request: DurCancelRequest = {
          prscMake: "M",
          patJuminNo,
          prscData,
          yKiHo: hospital.number,
          mprscGrantNo: encounter.issuanceNumber ?? "",
          reasonCd: "M3",
          reasonText: "처방전 교부번호 착오입력",
          makerCode: hospital.number,
        };
        const res = (await durCancel.execute(hospital.number, request)) as {
          Code?: number;
          HelpMessage?: string;
        };
        if (res?.Code == null || !DUR_CANCEL_SUCCESS_CODES.includes(res.Code)) {
          setBackendError(res?.HelpMessage ?? "DUR 점검 취소에 실패했습니다.");
          return;
        }
      }

      const updated = await updateIssuanceNumberMutation.mutateAsync({
        id: encounter.id,
        issuanceNumber: fullIssuanceNumber,
      });
      success("교부번호가 변경되었습니다.");
      onSuccessAction?.(updated);
      onCloseAction();
    } catch (err: any) {
      const status = err instanceof ApiError ? err.status : err?.status;
      const message =
        err?.message ||
        err?.data?.message ||
        "교부번호 변경에 실패했습니다.";

      if (status === 404) {
        setBackendError("진료를 찾을 수 없습니다.");
      } else if (status === 409) {
        setBackendError("다른 진료건에 배정된 번호입니다.");
      } else if (status === 400) {
        setBackendError(
          typeof message === "string" ? message : "이 번호는 사용할 수 없습니다."
        );
      } else {
        setBackendError(typeof message === "string" ? message : "교부번호 변경에 실패했습니다.");
      }
    }
  }, [
    serialInput,
    datePart,
    encounter,
    patient,
    hospital,
    durCancel,
    updateIssuanceNumberMutation,
    onSuccessAction,
    onCloseAction,
    success,
    error,
  ]);

  const hasError = !!validationError || !!backendError;

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onCloseAction}
      title="교부번호 변경"
      fitContent={true}
      alwaysCenter={true}
    >
      <div className="flex flex-col gap-[16px] px-[16px] py-[8px] w-[320px]">
        <div className="flex flex-row items-center gap-[8px]">
          <span className="text-[12px] font-[400] text-[var(--gray-400)] whitespace-nowrap">
            교부일자
          </span>
          <span className="text-[12px]">
            {dateDisplay || "-"}
          </span>
        </div>
        <div className="flex flex-row items-center gap-[8px]">
          <label
            htmlFor="issuance-serial"
            className="text-[12px] font-[400] text-[var(--gray-400)] whitespace-nowrap"
          >
            교부번호
          </label>
          <input
            id="issuance-serial"
            type="text"
            inputMode="numeric"
            maxLength={ISSUANCE_SERIAL_LENGTH}
            placeholder={`${ISSUANCE_SERIAL_LENGTH}자리 숫자`}
            value={serialInput}
            onChange={handleSerialChange}
            className={cn(
              "w-full rounded-md border px-[8px] py-[4px] text-[12px] outline-none",
              "bg-[var(--card-bg)] border-[var(--border-1)]",
              hasError && "border-[var(--negative)]"
            )}
          />
        </div>
        {hasError && (
          <div className="flex items-center gap-1 text-[11px] text-[var(--negative)]">
            <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
            <span>{backendError || validationError}</span>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <MyButton variant="outline" onClick={onCloseAction}>
            취소
          </MyButton>
          <MyButton
            onClick={handleSave}
            disabled={
              !canSave ||
              durCancel.loading ||
              updateIssuanceNumberMutation.isPending
            }
          >
            {durCancel.loading || updateIssuanceNumberMutation.isPending
              ? "처리중..."
              : "저장"}
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
