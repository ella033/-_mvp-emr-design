import { ApiClient } from "../api-client";
import type {
  GetConsentsListParams,
  ConsentsListResponse,
} from "@/types/consents-types";

export type ConsentStatus = "PENDING" | "SIGNED";
export type ConsentListStatus = "PENDING" | "SIGNED" | "REVOKED" | "VOIDED";

export interface CreateConsentRequest {
  patientId: number;
  consentTemplateId: number;
  status: ConsentListStatus;
  encounterId?: number | null;
  signerIpAddress?: string | null;
  signerDeviceInfo?: Record<string, unknown> | null;
}

// category로 다건 생성 요청
export interface CreateConsentByCategoryRequest {
  patientId: number;
  category: string; // e.g., "PRIVACY"
  status: ConsentListStatus;
  encounterId?: number | null;
  signerIpAddress?: string | null;
  signerDeviceInfo?: Record<string, unknown> | null;
}

// category로 다건 생성 응답
export interface CreateConsentByCategoryResponse {
  items: ConsentResponse[];
  createdCount: number;
}

export interface ConsentResponse {
  id: number;
  patientId: number;
  status: ConsentStatus;
  createDateTime: string;
}

export interface PendingPatient {
  patientId: number;
  patientName: string;
  patientNo?: string;
  patientBirthDate?: string;
  patientGender?: number;
  patientRrn?: string;
  facilityName?: string;
  consentTemplateId: number;
  consentTemplateName?: string;
  encounterId?: number;
  requestedAt: string;
}

export interface PendingPatientsResponse {
  items: PendingPatient[];
  totalCount: number;
}

export interface ConsentListItem {
  id: number;
  patientId: number;
  patientName?: string;
  encounterId?: number | null;
  consentTemplateId: number;
  templateTitle: string;
  templateCode?: string;
  status: ConsentListStatus;
  templateVersion?: number;
  signedAt?: string | null;
  signatureData?: string[] | null;
  createDateTime: string;
  updateDateTime?: string;
}

export interface ConsentListResponse {
  items: ConsentListItem[];
  nextCursor?: number | null;
  hasNextPage: boolean;
}

export interface ConsentListParams {
  patientId?: number;
  status?: ConsentListStatus;
  cursor?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ConsentSignatureField {
  fieldId: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required?: boolean;
  order?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ConsentField {
  key: string;
  name: string;
  type: number;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  order?: number;
  dataSource?: string;
  options?: Record<string, unknown>;
}

export type ConsentDetailContent =
  | {
      type: "PDF";
      blobUrl: string;
      coordinateSystem?: "PDF_POINTS";
      pageWidth?: number;
      pageHeight?: number;
      pageSizes?: Array<{ page: number; width: number; height: number }>;
      signatureFields?: ConsentSignatureField[];
      fields?: ConsentField[];
    }
  | { sections: Array<{ title: string; items: string[] }> };

export interface ConsentDetailResponse {
  id: number;
  title: string;
  content: ConsentDetailContent;
}

export interface UpdateConsentSignatureRequest {
  consentId: number;
  signatures: Record<string, File>; // { [fieldId]: File }
  signerIpAddress?: string;
  signerDeviceInfo?: string;
}

export interface UpdateConsentSignatureResponse {
  id: number;
  status: ConsentStatus;
  signedAt: string;
}

export interface SignConsentFieldValue {
  key: string;
  value: string | boolean;
}

export interface SignConsentSignature {
  fieldId: string;
  image: string; // data URL (base64 PNG)
}

export interface SignConsentRequest {
  fields: SignConsentFieldValue[];
  signatures: SignConsentSignature[];
  signerIpAddress?: string;
  signerDeviceInfo?: Record<string, unknown>;
}

export interface SignConsentResponse {
  id: number;
  status: ConsentStatus;
  signedAt: string;
  signedPdfUrl: string;
}

export interface DeleteConsentsRequest {
  patientIds: number[];
}

export interface DeleteConsentsResponse {
  voidedCount: number;
  voidedConsentIds: number[];
}

// 동의서 템플릿 (환자 미서명 최신 버전)
export interface ConsentTemplateItem {
  id: number;
  title: string;
}

export interface ConsentTemplatesResponse {
  items: ConsentTemplateItem[];
}

export const ConsentsApi = {
  /**
   * 동의서 생성 (단건)
   * @param data - 동의서 생성 요청 데이터
   * @returns 생성된 동의서 정보
   *
   * @example
   * // 웹에서 PENDING 상태로 전송
   * await ConsentsApi.create({
   *   patientId: 1,
   *   consentTemplateId: 1,
   *   status: "PENDING"
   * });
   */
  create: async (data: CreateConsentRequest): Promise<ConsentResponse> => {
    return await ApiClient.post<ConsentResponse>("/consents", {
      patientId: data.patientId,
      encounterId: data.encounterId ?? null,
      consentTemplateId: data.consentTemplateId,
      status: data.status,
      signerIpAddress: data.signerIpAddress ?? null,
      signerDeviceInfo: data.signerDeviceInfo ?? null,
    });
  },

  /**
   * 동의서 생성 (카테고리별 다건)
   * - 해당 카테고리의 isActive=true, 최신 버전 템플릿 중
   * - 환자가 아직 SIGNED하지 않은 템플릿들로 동의서 생성
   * @param data - 카테고리 기반 생성 요청 데이터
   * @returns 생성된 동의서 목록과 개수
   *
   * @example
   * await ConsentsApi.createByCategory({
   *   patientId: 1,
   *   category: "PRIVACY",
   *   status: "PENDING"
   * });
   */
  createByCategory: async (data: CreateConsentByCategoryRequest): Promise<CreateConsentByCategoryResponse> => {
    return await ApiClient.post<CreateConsentByCategoryResponse>("/consents", {
      patientId: data.patientId,
      encounterId: data.encounterId ?? null,
      category: data.category,
      status: data.status,
      signerIpAddress: data.signerIpAddress ?? null,
      signerDeviceInfo: data.signerDeviceInfo ?? null,
    });
  },


  /**
   * PENDING 상태인 환자 목록 조회 (초기 로딩용)
   * Kafka + WebSocket으로 실시간 업데이트되지만, 초기 로딩 시 DB에서 조회
   */
  getPendingPatients: async (): Promise<PendingPatientsResponse> => {
    return await ApiClient.get<PendingPatientsResponse>("/consents/pending-patients");
  },

  /**
   * 환자별 동의서 목록 조회
   */
  getByPatient: async (params: {
    patientId: number;
    status?: ConsentListStatus;
    cursor?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
  }): Promise<ConsentListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("patientId", params.patientId.toString());
    if (params.status) queryParams.append("status", params.status);
    if (params.cursor !== undefined) queryParams.append("cursor", String(params.cursor));
    if (params.take !== undefined) queryParams.append("take", String(params.take));
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.search) queryParams.append("search", params.search);

    return await ApiClient.get<ConsentListResponse>(
      `/consents?${queryParams.toString()}`
    );
  },

  /**
   * 동의서 서명내역(리스트) 조회
   * - Reception 화면에서 사용
   * - 예시에 없는 queryParam은 보내지 않아도 됨
   */
  getConsentsList: async (
    params: GetConsentsListParams = {}
  ): Promise<ConsentsListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.cursor !== undefined)
      queryParams.append("cursor", String(params.cursor));
    if (params.take !== undefined) queryParams.append("take", String(params.take));
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    if (params.filter !== undefined) {
      const filterValue =
        typeof params.filter === "string"
          ? params.filter
          : JSON.stringify(params.filter);
      queryParams.append("filter", filterValue);
    }

    if (params.patientId !== undefined)
      queryParams.append("patientId", String(params.patientId));
    if (params.status) queryParams.append("status", String(params.status));
    if (params.search) queryParams.append("search", params.search);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const qs = queryParams.toString();
    return await ApiClient.get<ConsentsListResponse>(`/consents${qs ? `?${qs}` : ""}`);
  },

  /**
   * 동의서 단건 조회
   */
  getById: async (consentId: number): Promise<ConsentDetailResponse> => {
    return await ApiClient.get<ConsentDetailResponse>(`/consents/${consentId}`);
  },

  /**
   * 동의서 서명 완료된 PDF 다운로드
   */
  getSignedPdfById: async (consentId: number): Promise<Blob> => {
    const result = await ApiClient.get<any>(`/consents/${consentId}/signed-pdf`);
    // proxyApiResponse는 바이너리를 기본적으로 stream(res.body)로 반환합니다.
    if (result instanceof Blob) {
      const normalized =
        result.type === "application/pdf"
          ? result
          : new Blob([result], { type: "application/pdf" });
      return normalized;
    }

    const maybeStream = result as ReadableStream<Uint8Array> | null | undefined;
    const hasReader =
      maybeStream && typeof (maybeStream as any).getReader === "function";

    if (hasReader) {
      const blob = await new Response(maybeStream).blob();
      const normalized =
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      return normalized;
    }

    // 일부 환경/클라이언트가 arrayBuffer로 받는 경우 대비
    if (result instanceof ArrayBuffer) {
      return new Blob([result], { type: "application/pdf" });
    }
    if (result instanceof Uint8Array) {
      return new Blob([result], { type: "application/pdf" });
    }

    throw new Error("signed-pdf 응답이 올바르지 않습니다.");
  },
  /**
   * 동의서 서명 업데이트 (PATCH)
   * 서명 파일들을 fieldId별로 업로드
   */
  updateSignature: async (data: UpdateConsentSignatureRequest): Promise<UpdateConsentSignatureResponse> => {
    const formData = new FormData();
    Object.entries(data.signatures).forEach(([fieldId, file]) => {
      formData.append(`signature_${fieldId}`, file);
    });
    if (data.signerIpAddress) {
      formData.append("signerIpAddress", data.signerIpAddress);
    }
    if (data.signerDeviceInfo) {
      formData.append("signerDeviceInfo", data.signerDeviceInfo);
    }
    return await ApiClient.patch<UpdateConsentSignatureResponse>(
      `/consents/${data.consentId}/signature`,
      formData
    );
  },

  /**
   * 동의서 서명 완료 (필드 값 + 서명 이미지)
   */
  sign: async (consentId: number, data: SignConsentRequest): Promise<SignConsentResponse> => {
    return await ApiClient.post<SignConsentResponse>(`/consents/${consentId}/sign`, data);
  },

  /**
   * 동의서 삭제(무효화)
   */
  deleteMany: async (data: DeleteConsentsRequest): Promise<DeleteConsentsResponse> => {
    return await ApiClient.delete<DeleteConsentsResponse>("/consents", data);
  },

  /**
   * 동의서 템플릿 목록 조회 (환자 미서명 최신 버전)
   * - isActive=true인 템플릿 중 templateCode별 최신 버전만 조회
   * - 해당 환자가 이미 SIGNED한 동의서가 있으면 제외
   * @param patientId - 환자 ID (필수)
   */
  getTemplates: async (patientId: number): Promise<ConsentTemplatesResponse> => {
    return await ApiClient.get<ConsentTemplatesResponse>(
      `/consents/templates?patientId=${patientId}`
    );
  },
};
