import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";


export const useRegistrationMove = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => RegistrationsService.moveRegistrationPosition(body),
    onSuccess: () => {
      // 호출부에서 필요한 시점에 재조회하므로 여기서는 stale 마킹만 수행한다.
      queryClient.invalidateQueries({
        queryKey: ["registrations"],
        refetchType: "none",
      });
    },
    onError: (error: any) => {
      // 에러는 호출하는 쪽에서 처리하도록 다시 throw
      throw error;
    },
  });
};
