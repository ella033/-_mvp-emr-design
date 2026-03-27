import { useMutation } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";
import type {
  UpdateRegistrationRequest,
  UpdateRegistrationResponse,
} from "@/types/registration-types";

// 접수 정보 업데이트용 커스텀 훅
export function useUpdateRegistration(options?: {
  onSuccess?: (data: UpdateRegistrationResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRegistrationRequest;
    }) => {
      return await RegistrationsService.updateRegistration(id, data);
    },
    ...options,
  });
}
