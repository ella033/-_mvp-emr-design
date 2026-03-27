import type { components } from "@/generated/api/types";

// ================================ V2 API 타입 ================================

/**
 * 파일 카테고리
 * "general" | "patient_document" | "hospital_seal" | "user_profile" | "medical_record" | "prescription"
 */
export type FileCategory = components["schemas"]["FileCategory"];

/**
 * 엔티티 타입
 * "Patient" | "User" | "Hospital" | "Department"
 */
export type EntityType = components["schemas"]["EntityType"];

// ================================ 파일 업로드 V2 요청 ================================
export interface FileUploadV2Request {
  file: File;
  makeTransparent?: boolean;
  category?: FileCategory;
  entityType?: EntityType;
  entityId?: string;
  description?: string;
}

export interface FileUploadV2Uuid {
  id: number;
  uuid: string;
}

// ================================ 파일 업로드 V2 응답 ================================
export interface FileUploadV2Response {
  id: number;
  uuid: string;
  originalName: string;
  storedName: string;
  storagePath: string;
  mimeType: string;
  fileSize: string;
  fileExtension: string;
  category: FileCategory;
  entityType: EntityType;
  entityId: string;
  isImage: boolean;
  imageWidth: number;
  imageHeight: number;
  hasTransparency: boolean;
  thumbnailPath: string;
  accessLevel: number;
  isTemporary: boolean;
  expiryDateTime: string;
  description: string;
  metadata: string;
  createId: number;
  createDateTime: string;
  updateId: number;
  updateDateTime: string;
}

// ================================ 파일 다운로드 V2 응답 ================================
export interface FileDownloadV2Response {
  blob: Blob;
  filename?: string;
  contentType?: string;
}
