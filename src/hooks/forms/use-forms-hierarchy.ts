import { useQuery } from "@tanstack/react-query";
import { FormsService } from "@/services/forms-service";
import type { components } from "@/generated/api/types";

type GetFormFavoritesResponseDto =
  components["schemas"]["GetFormFavoritesResponseDto"];

export const FORMS_HIERARCHY_QUERY_KEY = "forms-hierarchy";

export function useFormsHierarchy(searchQuery: string) {
  return useQuery<GetFormFavoritesResponseDto>({
    queryKey: [FORMS_HIERARCHY_QUERY_KEY, searchQuery],
    queryFn: async () => {
      return await FormsService.getFormsHierarchy(searchQuery);
    },
  });
}
