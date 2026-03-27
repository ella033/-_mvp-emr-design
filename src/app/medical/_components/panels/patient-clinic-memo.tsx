"use client";

import React from "react";
import { NoneSelectedPatient } from "../widgets/none-patient";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import { INPUT_FOCUS_CLASS } from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";
import { useEncounterStore } from "@/store/encounter-store";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";

export default function PatientClinicMemo() {
  const selectedEncounter = useEncounterStore(
    (state) => state.selectedEncounter
  );
  const draftClinicalMemo = useEncounterStore(
    (state) => state.draftClinicalMemo
  );
  const setDraftClinicalMemo = useEncounterStore(
    (state) => state.setDraftClinicalMemo
  );

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  const patientId = selectedEncounter.patientId;

  const handleTemplateClick = (template: TemplateCode) => {
    const newContent = `${draftClinicalMemo}${template.content}`;
    setDraftClinicalMemo(newContent);
  };

  return (
    <div className="flex flex-col p-1 h-full">
      <div
        className={cn("overflow-y-auto flex-1 rounded-sm", INPUT_FOCUS_CLASS)}
      >
        <MyTiptapEditor
          templateCodeType={TemplateCodeType.임상메모}
          testId="medical-clinical-memo-editor"
          placeholder="임상메모를 입력해주세요."
          content={draftClinicalMemo}
          onChange={setDraftClinicalMemo}
          imageCategory="patient_clinic_memo"
          imageEntityType="patient"
          imageEntityId={patientId.toString()}
        />
      </div>
      <TemplateCodeQuickBar
        templateCodeType={TemplateCodeType.임상메모}
        onTemplateClickAction={handleTemplateClick}
        className="pt-1"
      />
    </div>
  );
}
