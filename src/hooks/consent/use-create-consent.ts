import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ConsentsApi,
  CreateConsentRequest,
  ConsentResponse,
  PendingPatient,
  PendingPatientsResponse,
  ConsentListStatus,
  ConsentListResponse,
  ConsentDetailResponse,
  UpdateConsentSignatureRequest,
  UpdateConsentSignatureResponse,
  SignConsentRequest,
  SignConsentResponse,
  DeleteConsentsRequest,
  DeleteConsentsResponse,
  ConsentTemplatesResponse,
  CreateConsentByCategoryRequest,
  CreateConsentByCategoryResponse,
} from "@/lib/api/routes/consents-api";

/**
 * 동의서 생성 Hook
 * 
 * @example
 * // 웹에서 PENDING 상태로 전송
 * const { mutate: createConsent } = useCreateConsent({
 *   onSuccess: () => {
 *     toast.success("동의서가 전송되었습니다");
 *   }
 * });
 * 
 * createConsent({
 *   patientId: 1,
 *   consentTemplateId: 1,
 *   status: "PENDING"
 * });
 */
export function useCreateConsent(options?: {
  onSuccess?: (data: ConsentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: CreateConsentRequest) => ConsentsApi.create(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * 동의서 카테고리별 다건 생성 Hook
 *
 * @example
 * const { mutate: createConsentByCategory } = useCreateConsentByCategory({
 *   onSuccess: (data) => {
 *     toast.success(`${data.createdCount}개의 동의서가 전송되었습니다`);
 *   }
 * });
 *
 * createConsentByCategory({
 *   patientId: 1,
 *   category: "PRIVACY",
 *   status: "PENDING"
 * });
 */
export function useCreateConsentByCategory(options?: {
  onSuccess?: (data: CreateConsentByCategoryResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: CreateConsentByCategoryRequest) => ConsentsApi.createByCategory(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * PENDING 상태인 환자 목록 조회 Hook (초기 로딩용)
 * 실시간 업데이트는 WebSocket으로 처리
 */
export function usePendingPatients() {
  return useQuery({
    queryKey: ["consents", "pending-patients"],
    queryFn: async () => {
      const response = await ConsentsApi.getPendingPatients();
      return response;
    },
    staleTime: 0, // 항상 최신 데이터로 간주
    refetchOnMount: true,
  });
}

/**
 * 환자별 동의서 목록 조회 Hook
 */
export function usePatientConsents(params: {
  patientId?: number;
  status?: ConsentListStatus;
  take?: number;
}) {
  return useQuery<ConsentListResponse>({
    queryKey: ["consents", "patient", params.patientId, params.status, params.take],
    queryFn: async () => {
      if (!params.patientId) {
        return { items: [], hasNextPage: false };
      }
      return await ConsentsApi.getByPatient({
        patientId: params.patientId,
        status: params.status,
        take: params.take,
      });
    },
    enabled: !!params.patientId,
    staleTime: 0,
    refetchOnMount: true,
  });
}

/**
 * 동의서 단건 조회 Hook
 */
export function useConsentById(consentId?: number) {
  return useQuery<ConsentDetailResponse>({
    queryKey: ["consents", "detail", consentId],
    queryFn: async () => {
      if (!consentId) {
        throw new Error("consentId is required");
      }
      return await ConsentsApi.getById(consentId);
    },
    enabled: !!consentId,
    staleTime: 0,
    refetchOnMount: true,
  });
}

/**
 * 동의서 서명 업데이트 Hook (PATCH)
 */
export function useUpdateConsentSignature(options?: {
  onSuccess?: (data: UpdateConsentSignatureResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: UpdateConsentSignatureRequest) => ConsentsApi.updateSignature(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * 동의서 서명 완료 Hook
 */
export function useSignConsent(options?: {
  onSuccess?: (data: SignConsentResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (params: { consentId: number; data: SignConsentRequest }) =>
      ConsentsApi.sign(params.consentId, params.data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * 동의서 삭제(무효화) Hook
 */
export function useDeleteConsents(options?: {
  onSuccess?: (data: DeleteConsentsResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: DeleteConsentsRequest) => ConsentsApi.deleteMany(data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}

/**
 * 동의서 템플릿 목록 조회 Hook (환자 미서명 최신 버전)
 * - 환자가 아직 서명하지 않은 동의서 템플릿 목록 조회
 * @param patientId - 환자 ID
 */
export function useConsentTemplates(patientId?: number) {
  return useQuery<ConsentTemplatesResponse>({
    queryKey: ["consents", "templates", patientId],
    queryFn: async () => {
      if (!patientId) {
        return { items: [] };
      }
      return await ConsentsApi.getTemplates(patientId);
    },
    enabled: !!patientId,
    staleTime: 0,
    refetchOnMount: true,
  });
}
