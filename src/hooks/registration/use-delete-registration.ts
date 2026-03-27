import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";

export function useDeleteRegistration(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await RegistrationsService.deleteRegistration(id);
    },
    onSuccess: () => {
      // registrations 관련 쿼리들을 무효화하여 새로운 데이터 조회
      queryClient.invalidateQueries({
        queryKey: ['registrations', 'hospital']
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.log("[useDeleteRegistration] onError", error);
      options?.onError?.(error);
    },
  });
}
