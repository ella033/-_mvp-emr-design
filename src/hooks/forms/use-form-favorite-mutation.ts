import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormsService } from "@/services/forms-service";
import { FORMS_HIERARCHY_QUERY_KEY } from "./use-forms-hierarchy";

export function useAddFormFavorite(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: number) => FormsService.addFavorite(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_HIERARCHY_QUERY_KEY] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}

export function useRemoveFormFavorite(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId: number) => FormsService.removeFavorite(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_HIERARCHY_QUERY_KEY] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
