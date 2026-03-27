// !! 이동 예정

import { FAMILY_OPTIONS } from "@/constants/form-options";

// Type hooks\patient-families\use-upsert-patient-families-by-patient 위치로 이동
export type FamilyRelationType = (typeof FAMILY_OPTIONS)[number]["value"];
export type SavePatientFamilyType = {
  patientId: number;
  items: {
    id: number | null;
    patientFamilyId: number;
    relationType: FamilyRelationType;
  }[];
};

export type PatientFamilyType = {
  patientId: number;
  patientFamilyId: number;
  relationType: FamilyRelationType;
};
