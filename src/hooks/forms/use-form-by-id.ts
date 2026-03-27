import { useQuery } from "@tanstack/react-query";
import { FormsService } from "@/services/forms-service";
import type { components } from "@/generated/api/types";

type GetFormByIdResponseDto = components["schemas"]["GetFormByIdResponseDto"];

export const FORM_BY_ID_QUERY_KEY = "form-by-id";

export function useFormById(
  formId: number | null,
  patientId?: number
) {
  const hasFormId = typeof formId === "number" && formId > 0;
  const hasPatientId = typeof patientId === "number" && patientId > 0;

  return useQuery<GetFormByIdResponseDto>({
    queryKey: [FORM_BY_ID_QUERY_KEY, formId, patientId],
    queryFn: async () => {
      if (!hasFormId || formId === null) {
        throw new Error("formId is required");
      }

      if (hasPatientId) {
        return await FormsService.getFormByIdWithPatient(formId, patientId);
      }

      return await FormsService.getFormById(formId);
    },
    enabled: hasFormId,
  });
}
