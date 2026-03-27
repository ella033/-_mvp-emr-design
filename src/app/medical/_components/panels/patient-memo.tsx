"use client";

import { NoneSelectedPatient } from "../widgets/none-patient";
import { useEncounterStore } from "@/store/encounter-store";
import PatientMemoPanel from "@/app/reception/_components/panels/(patients-list)/patient-memo-panel";

export default function PatientMemo() {
  const selectedEncounter = useEncounterStore(
    (state) => state.selectedEncounter
  );

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  return <PatientMemoPanel patientId={selectedEncounter.patientId} />;
}
