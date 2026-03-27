import { useMutation } from "@tanstack/react-query";
import type { FAMILY_OPTIONS } from "@/constants/form-options";
import { PatientFamiliesService } from "@/services/patient-families-service";
import type { DeleteUpsertManyPatientFamiliesResponse } from "@/types/patient-family-types";

export type FamilyRelationType = (typeof FAMILY_OPTIONS)[number]["value"];
export type SavePatientFamilyType = {
  patientId: number;
  items: {
    id: number | null;
    patientFamilyId: number;
    relationType: FamilyRelationType;
  }[];
};

export function useUpsertPatientFamiliesByPatient(options?: {
  onSuccess?: (data: DeleteUpsertManyPatientFamiliesResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: SavePatientFamilyType) =>
      PatientFamiliesService.deleteUpsertManyPatientFamiliesByPatient(
        data.patientId,
        {
          items: data.items.map((item) => ({
            id: item.id ?? undefined,
            patientFamilyId: item.patientFamilyId,
            relationType: item.relationType,
          })),
        }
      ),
    ...options,
  });
}
