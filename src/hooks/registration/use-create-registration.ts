import { useMutation } from "@tanstack/react-query";
import { RegistrationsService } from "@/services/registrations-service";
import type {
  CreateRegistrationRequest,
  CreateRegistrationResponse,
} from "@/types/registration-types";

// 접수 등록용 커스텀 훅
export function useCreateRegistration(options?: {
  onSuccess?: (data: CreateRegistrationResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: CreateRegistrationRequest) => {
      return await RegistrationsService.createRegistration(data);
    },
    ...options,
  });
}
