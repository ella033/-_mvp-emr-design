import { useMutation } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";
import type {
  CreatePatientRequest,
  CreatePatientResponse,
} from "@/types/patient-types";
import { useToastHelpers } from "@/components/ui/toast";
import type { ApiError } from "@/lib/api/api-proxy";

// Prisma Unique constraint 에러인지 확인하는 헬퍼 함수
function isUniqueConstraintError(error: any): boolean {
  const apiError = error as ApiError;
  const errorData = apiError?.data;

  if (!errorData?.error) {
    return false;
  }

  const errorName = errorData.error.name;
  const errorStack = errorData.error.stack || "";

  return (
    errorName === "PrismaClientKnownRequestError" &&
    errorStack.includes("Unique constraint failed on the fields: (`hospital_id`,`rrn_hash`)")
  );
}

// 환자등록용 커스텀 훅
export function useCreatePatient(options?: {
  onSuccess?: (data: CreatePatientResponse) => void;
  onError?: (error: Error) => void;
}) {
  const { error: showErrorToast } = useToastHelpers();

  return useMutation({
    mutationFn: async (patient: CreatePatientRequest) => {
      try {
        return await PatientsService.createPatient(patient);
      } catch (error: any) {
        if (isUniqueConstraintError(error)) {
          showErrorToast("동일한 주민등록번호를 가진 환자가 있습니다");
          const duplicateError = new Error("동일한 주민등록번호를 가진 환자가 있습니다");
          duplicateError.name = "DuplicatePatientError";
          throw duplicateError;
        }
        throw error;
      }
    },
    retry: (_failureCount, error: any) => {
      if (error?.name === "DuplicatePatientError" || isUniqueConstraintError(error)) {
        return false;
      }
      return false;
    },
    onError: (error: any) => {
      options?.onError?.(error);
    },
    onSuccess: options?.onSuccess,
  });
}
