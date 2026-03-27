"use client";

import React from "react";
import { NoneSelectedPatient } from "../widgets/none-patient";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import { INPUT_FOCUS_CLASS } from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";
import { useEncounterStore } from "@/store/encounter-store";

export default function PatientEncounterSummary() {
  const selectedEncounter = useEncounterStore(
    (state) => state.selectedEncounter
  );
  const draftEncounterSummary = useEncounterStore(
    (state) => state.draftEncounterSummary
  );
  const setDraftEncounterSummary = useEncounterStore(
    (state) => state.setDraftEncounterSummary
  );

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  const patientId = selectedEncounter.patientId;

  return (
    <div className="flex flex-col p-1 h-full">
      <div
        className={cn("overflow-y-auto flex-1 rounded-sm", INPUT_FOCUS_CLASS)}
      >
        <MyTiptapEditor
          placeholder="진료이력 요약을 입력해주세요."
          content={draftEncounterSummary}
          onChange={setDraftEncounterSummary}
          imageCategory="patient_encounter_symptom"
          imageEntityType="patient"
          imageEntityId={patientId.toString()}
        />
      </div>
    </div>
  );
}
