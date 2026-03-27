import { useQuery } from "@tanstack/react-query";
import { FormsService } from "@/services/forms-service";
import type { components } from "@/generated/api/types";

type GetFormsSearchResponseDto =
  components["schemas"]["GetFormsSearchResponseDto"];

export function useSearchForms(formName: string) {
  const trimmedFormName = formName.trim();
  const isEnabled = Boolean(trimmedFormName);

  return useQuery({
    queryKey: ["forms-search", trimmedFormName],
    queryFn: async () => {
      return await FormsService.searchForms(trimmedFormName);
    },
    enabled: isEnabled,
  });
}


