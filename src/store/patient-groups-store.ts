import type { GetPatientGroupsResponse } from "@/types/patient-groups-types";
import { create } from "zustand";

type PatientGroupsState = {
  patientGroups: GetPatientGroupsResponse;
  setPatientGroups: (groups: GetPatientGroupsResponse) => void;
};

export const usePatientGroupsStore = create<PatientGroupsState>((set) => ({
  patientGroups: [],
  setPatientGroups: (patientGroups) => set({ patientGroups }),
}));
