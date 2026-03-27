import { CrmMessageType, CrmMessageSubType } from "@/constants/crm-enums";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

// CRM 가이드 메시지 템플릿 폴더
export interface GuideFolderDto {
  id: number; // 폴더 ID
  name: string; // 폴더 이름
}

// CRM 가이드 메시지 템플릿 폴더 목록 조회 응답
export type GuideFoldersResponse = GuideFolderDto[];

// CRM 가이드 메시지 템플릿 정보
export interface GuideTemplateDto {
  id: number; // 템플릿 ID
  messageType: CrmMessageType; // 메시지 타입
  name: string; // 템플릿 타이틀
  parentId: number; // 폴더(카테고리) ID
  messageContent: string; // 템플릿 내용
  isAdDisplayed: boolean; // 광고 표시 여부
  messageSubType: CrmMessageSubType; // 메시지 서브타입
  messageSubTypeName: string; // SMS/LMS/MMS
  messageImageFileinfo?: FileUploadV2Uuid[]; // 메시지 첨부 이미지 파일 정보
}

// CRM 가이드 메시지 템플릿 목록 조회 응답
export type GuideTemplatesByFolderResponse = GuideTemplateDto[];
