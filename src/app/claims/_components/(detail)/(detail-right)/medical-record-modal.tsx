"use client";

import MyPopup from "@/components/yjg/my-pop-up";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface MedicalRecordModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  patientId?: number | string;
  treatmentDate?: string | Date;
}

export default function MedicalRecordModal({
  open,
  onOpenChangeAction,
  patientId,
  treatmentDate,
}: MedicalRecordModalProps) {
  const medicalUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (patientId !== undefined && patientId !== null) {
      params.set("patientId", String(patientId));
    }
    if (treatmentDate) {
      params.set("treatmentDate", new Date(treatmentDate).toISOString());
    }
    params.set("from", "claims");
    const queryString = params.toString();
    return queryString ? `/medical?${queryString}` : "/medical";
  }, [patientId, treatmentDate]);

  const handleOpenNewTab = () => {
    window.open(medicalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <MyPopup
      isOpen={open}
      onCloseAction={() => onOpenChangeAction(false)}
      title="진료기록"
      width="90vw"
      height="90vh"
      localStorageKey="claims-medical-record-modal"
    >
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between rounded-[6px] border border-[var(--border-1)] bg-[var(--bg-1)] px-3 py-2">
          <p className="text-[12px] text-[var(--gray-300)]">
            현재 진료 화면을 모달에서 엽니다.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-3 text-[12px]"
            onClick={handleOpenNewTab}
          >
            새창에서 열기
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-[6px] border border-[var(--border-1)] bg-[var(--bg-main)]">
          <iframe
            title="진료기록"
            src={medicalUrl}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </MyPopup>
  );
}
