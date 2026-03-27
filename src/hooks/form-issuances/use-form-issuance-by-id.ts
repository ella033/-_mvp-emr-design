import { useQuery } from "@tanstack/react-query";
import { FormIssuancesService } from "@/services/form-issuances-service";
import type { components } from "@/generated/api/types";

type GetFormIssuanceByIdResponseDto =
  components["schemas"]["GetFormIssuanceByIdResponseDto"];

export const FORM_ISSUANCE_BY_ID_QUERY_KEY = "form-issuance-by-id";

export function useFormIssuanceById(
  issuanceId: number | null,
  options?: {
    enabled?: boolean;
  }
) {
  const hasIssuanceId =
    typeof issuanceId === "number" &&
    Number.isFinite(issuanceId) &&
    issuanceId > 0;
  const isEnabled = options?.enabled ?? true;

  return useQuery<GetFormIssuanceByIdResponseDto>({
    queryKey: [FORM_ISSUANCE_BY_ID_QUERY_KEY, issuanceId],
    queryFn: async () => {
      if (!hasIssuanceId || issuanceId === null) {
        throw new Error("issuanceId is required");
      }

      return await FormIssuancesService.getFormIssuanceById(issuanceId);
    },
    enabled: hasIssuanceId && isEnabled,
  });
}
