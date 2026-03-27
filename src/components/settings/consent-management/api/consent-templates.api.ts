import { ApiClient } from "@/lib/api/api-client";

const BASE_PATH = "/consent-templates";

export interface ConsentTemplate {
  id: number;
  templateCode: string;
  title: string;
  content: {
    type: string;
    blobUrl: string;
    fields?: any[];
    signatureFields?: any[];
    pageWidth?: number;
    pageHeight?: number;
  };
  category: string | null;
  version: number;
  isActive: boolean;
  createDateTime: string;
  updateDateTime: string;
}

export interface ConsentTemplateListResponse {
  data: ConsentTemplate[];
}

export interface CreateConsentTemplatePayload {
  templateCode?: string;
  title: string;
  category?: string;
  fields?: string;
  signatureFields?: string;
  pageWidth?: string;
  pageHeight?: string;
  file: File;
}

export const consentTemplatesApi = {
  getAll: async (
    isActive?: boolean,
    category?: string
  ): Promise<ConsentTemplateListResponse> => {
    const params: Record<string, string> = {};
    if (isActive !== undefined) params.isActive = String(isActive);
    if (category) params.category = category;

    const qs = new URLSearchParams(params).toString();
    return ApiClient.get<ConsentTemplateListResponse>(
      `${BASE_PATH}${qs ? `?${qs}` : ""}`
    );
  },

  getById: async (id: number): Promise<ConsentTemplate> => {
    return ApiClient.get<ConsentTemplate>(`${BASE_PATH}/${id}`);
  },

  create: async (
    payload: CreateConsentTemplatePayload
  ): Promise<ConsentTemplate> => {
    const formData = new FormData();
    if (payload.templateCode) formData.append("templateCode", payload.templateCode);
    formData.append("title", payload.title);
    if (payload.category) formData.append("category", payload.category);
    if (payload.fields) formData.append("fields", payload.fields);
    if (payload.signatureFields)
      formData.append("signatureFields", payload.signatureFields);
    if (payload.pageWidth) formData.append("pageWidth", payload.pageWidth);
    if (payload.pageHeight) formData.append("pageHeight", payload.pageHeight);
    formData.append("file", payload.file);

    return ApiClient.post<ConsentTemplate>(BASE_PATH, formData);
  },

  activate: async (id: number): Promise<ConsentTemplate> => {
    return ApiClient.patch<ConsentTemplate>(`${BASE_PATH}/${id}/activate`);
  },

  deactivate: async (id: number): Promise<ConsentTemplate> => {
    return ApiClient.patch<ConsentTemplate>(`${BASE_PATH}/${id}/deactivate`);
  },
};
