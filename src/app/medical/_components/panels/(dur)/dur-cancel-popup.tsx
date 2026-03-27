"use client";

import { useState, useMemo } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { MySelect } from "@/components/yjg/my-select";
import type { Encounter } from "@/types/chart/encounter-types";
import { formatDateByPattern } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { PatientBasicInfoBadge } from "../../widgets/medical-patient-badge";
import { WarningIcon } from "@/components/custom-icons";
import { useHospitalStore } from "@/store/hospital-store";
import type { Hospital } from "@/types/hospital-types";
import type { Patient } from "@/types/patient-types";
import { useToastHelpers } from "@/components/ui/toast";
import { useAgentDur } from "@/hooks/use-agent-dur";
import type { DurCancelRequest, DurCheckResult } from "@/services/agent/agent-dur-service";
import DurInfoPopup from "./dur-info-popup";

const MAX_REASON_LENGTH = 100;

/** DUR 취소 API 성공 응답 코드 */
const DUR_CANCEL_SUCCESS_CODES: number[] = [0, 53002];

const DELETE_REASON_OPTIONS = [
  { value: "M1", label: "M1 / 주민등록번호 착오입력" },
  { value: "M2", label: "M2 / 처방전 발행기관 기호 착오입력" },
  { value: "M3", label: "M3 / 처방전 교부번호 착오입력" },
  { value: "M4", label: "M4 / 의사면허번호 착오입력" },
  { value: "M5", label: "M5 / 처방 또는 조제일자 착오입력" },
  { value: "M8", label: "M8 / 약품 착오입력" },
  { value: "MT", label: "MT / 기타 착오입력 또는 사유가 2가지 이상인 경우 Text로 입력" },
  { value: "V", label: "V / DUR 팝업 내용 참고 처방전을 취소한 경우" },
];

export default function DurCancelPopup({
  patient,
  encounter,
  onConfirmAction,
  onCloseAction,
}: {
  patient: Patient;
  encounter: Encounter;
  onConfirmAction: (encounter: Encounter) => void;
  onCloseAction: (open: boolean) => void;
}) {
  const { success, error } = useToastHelpers();
  const { hospital } = useHospitalStore();
  const { durCancel } = useAgentDur();
  const [selectedReasonValue, setSelectedReasonValue] = useState<string>("");
  const [detailReason, setDetailReason] = useState("");
  const [showDurInfoPopup, setShowDurInfoPopup] = useState(false);
  const [durResult, setDurResult] = useState<DurCheckResult | null>(null);

  const handleClose = () => {
    onCloseAction(false);
  };

  const handleConfirm = async () => {
    if (selectedReasonValue === "") {
      error("삭제 사유를 선택해주세요.");
      return;
    }

    const hospitalCode = hospital?.number ?? "";
    if (!hospitalCode) {
      error("처방기관기호를 찾을 수 없습니다.");
      return;
    }

    const patJuminNo = (patient?.rrn ?? "").replace(/-/g, "");
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
      yKiHo: hospitalCode,
      mprscGrantNo: encounter.issuanceNumber ?? "",
      reasonCd: selectedReasonValue,
      reasonText: detailReason.trim() || null,
      makerCode: hospitalCode,
    };

    try {
      const res = (await durCancel.execute(hospitalCode, request)) as {
        Code?: number;
        HelpMessage?: string;
      };
      if (res?.Code != null && DUR_CANCEL_SUCCESS_CODES.includes(res.Code)) {
        success("DUR 점검 취소가 완료되었습니다.");
        onConfirmAction(encounter);
        onCloseAction(false);
      } else {
        setDurResult({
          Success: false,
          ResultCode: res?.Code ?? -1,
          DurMessage: res?.HelpMessage ?? "알 수 없는 오류",
        });
        setShowDurInfoPopup(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "DUR 점검 취소에 실패했습니다.";
      error(message);
    }
  };

  const reasonOptions = DELETE_REASON_OPTIONS.map((o) => ({
    value: o.value as string | number,
    label: o.label,
  }));

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={handleClose}
      title={<h2 className="text-[14px] font-bold text-[var(--fg-main)]">
        <span className="text-[var(--negative)]">경고*</span> DUR 알림
      </h2>}
      width="500px"
      height="450px"
      minWidth="500px"
      minHeight="450px"
      localStorageKey={"dur-cancel-popup"}
    >
      <div className="flex flex-col p-4 h-full gap-4">
        <div className="flex flex-row items-center gap-2 rounded-[4px] bg-[var(--red-1)] px-3 py-2 text-[12px]">
          <WarningIcon className="w-4 h-4 shrink-0 text-[var(--negative)]" />
          <span>점검 취소 사유를 입력해 주세요.</span>
        </div>
        <DetailInfo patient={patient} encounter={encounter} hospital={hospital} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-[12px] font-semibold text-[var(--gray-300)]">
            삭제 사유
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <MySelect
              options={reasonOptions}
              value={selectedReasonValue}
              onChange={(v) => setSelectedReasonValue(v as string)}
              placeholder="삭제 사유를 선택해주세요"
              className="w-full"
            />
            <div className="flex flex-col w-full h-full border border-[var(--border-1)] rounded-[4px]">
              <textarea
                className="flex-1 w-full resize-none p-2 text-[12px] outline-none"
                placeholder="구체적인 삭제 사유를 입력하세요"
                value={detailReason}
                onChange={(e) => {
                  const v = e.target.value.slice(0, MAX_REASON_LENGTH);
                  setDetailReason(v);
                }}
              />
              <div className="flex justify-end px-2 py-1 text-[10px] text-[var(--gray-400)]">
                {detailReason.length}/{MAX_REASON_LENGTH}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-end gap-2 pb-2">
          <MyButton
            variant="outline"
            onClick={handleClose}
            disabled={durCancel.loading}
          >
            취소
          </MyButton>
          <MyButton
            onClick={handleConfirm}
            disabled={durCancel.loading}
          >
            {durCancel.loading ? "처리중..." : "확인"}
          </MyButton>
        </div>
      </div>
      {showDurInfoPopup && (
        <DurInfoPopup
          durResult={durResult}
          setOpen={setShowDurInfoPopup}
        />
      )}
    </MyPopup>
  );
}

function DetailInfo({
  patient,
  encounter,
  hospital
}: {
  patient: Patient;
  encounter: Encounter;
  hospital: Hospital;
}) {
  const receptionDateTime = encounter.registration?.receptionDateTime;
  const encounterDateTime = encounter.encounterDateTime;

  const receptionDateStr = useMemo(
    () =>
      receptionDateTime
        ? formatDateByPattern(receptionDateTime, "YYYY-MM-DD")
        : "-",
    [receptionDateTime]
  );
  const encounterDateStr = useMemo(
    () =>
      encounterDateTime
        ? formatDateByPattern(encounterDateTime, "YYYY-MM-DD")
        : "-",
    [encounterDateTime]
  );

  const TABLE_HEADER_CLASS = "text-[12px] text-[var(--gray-300)] px-2 py-1";
  const TABLE_CELL_CLASS = "text-[12px] text-[var(--fg-main)] whitespace-nowrap px-2 py-1";

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12px] font-semibold text-[var(--gray-300)]">
        상세 정보
      </div>
      <div className="bg-[var(--bg-1)] rounded-[4px] border border-[var(--border-1)] p-3">
        <table className="w-full">
          <tbody>
            <tr>
              <td className={TABLE_HEADER_CLASS}>환자 정보</td>
              <td className={cn(TABLE_CELL_CLASS, "flex items-center gap-1")}>{PatientBasicInfoBadge({ patient })}</td>
              <td className={TABLE_HEADER_CLASS}>처방일자</td>
              <td className={TABLE_CELL_CLASS}>{encounterDateStr}</td>
            </tr>
            <tr>
              <td className={TABLE_HEADER_CLASS}>주민번호</td>
              <td className={TABLE_CELL_CLASS}>{patient?.rrn?.slice(0, 6)}-{patient?.rrn?.slice(6)}</td>
              <td className={TABLE_HEADER_CLASS}>처방전발행기관기호</td>
              <td className={TABLE_CELL_CLASS}>{hospital.number}</td>
            </tr>
            <tr>
              <td className={TABLE_HEADER_CLASS}>진료일</td>
              <td className={TABLE_CELL_CLASS}>{receptionDateStr}</td>
              <td className={TABLE_HEADER_CLASS}>처방전교부번호</td>
              <td className={TABLE_CELL_CLASS}>{encounter.issuanceNumber ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}