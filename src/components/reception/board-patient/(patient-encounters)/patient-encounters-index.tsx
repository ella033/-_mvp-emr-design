"use client";

import { useMemo } from "react";
import { MedicalUiProvider } from "@/app/medical/contexts/medical-ui-context";
import type { ExternalReception } from "../types";
import EncounterHistory from "@/app/medical/_components/panels/(patient-history)/(encounter-history)/encounter-history";
// import ReceptionEncounterHistory from "./reception-encounter-history";

export interface PatientEncountersIndexProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
}

/**
 * 처방 조회 탭 내에서 EncounterHistory 재사용
 * - 외부 `reception`을 `ReceptionService`로 `Registration`으로 변환해 store에 셋팅
 * - 기존의 reception-specific 컴포넌트는 필요 시 주석 해제하여 사용
 */
export default function PatientEncountersIndex({
  reception,
  receptionId,
}: PatientEncountersIndexProps) {
  void receptionId;

  const patientId = useMemo(() => {
    const raw = reception?.patientBaseInfo?.patientId ?? "0";
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [reception?.patientBaseInfo?.patientId]);

  return (
    <MedicalUiProvider>
      <div className="flex h-full w-full flex-col">
        {/* 기존 리셉션용 컴포넌트:
        <ReceptionEncounterHistory
          reception={reception}
          receptionId={receptionId}
        />
        */}
        {patientId > 0 ? (
          <EncounterHistory
            isReception={true}
            patientIdOverride={patientId}
            selectedEncounterIdForAutoOpen={
              reception?.receptionInfo?.encounters?.[0]?.id ?? null
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--gray-600)]">
            환자 정보를 불러오는 중...
          </div>
        )}
      </div>
    </MedicalUiProvider>
  );
}

