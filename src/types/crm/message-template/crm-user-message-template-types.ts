import type { CrmMessageType, CrmMessageSubType } from "@/constants/crm-enums";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

// CRM 사용자 메시지 템플릿 트리 항목
export interface TreeItemDto {
  id: number; // 항목 ID
  name: string; // 항목 이름
  isFolder: boolean; // 폴더 여부
  isExpanded?: boolean; // 폴더 펼침 여부 (폴더일 때만 해당)
  children?: TreeItemDto[]; // 하위 항목 목록 (폴더일 때만 해당)
}

// CRM 사용자 메시지 템플릿 트리 조회 응답
export type TreeHierarchyResponse = TreeItemDto[];

// CRM 사용자 메시지 템플릿 폴더
export interface FolderDto {
  id: number; // 폴더 ID
  name: string; // 폴더 이름
}

// CRM 사용자 메시지 템플릿 폴더 목록 조회 응답
export type FoldersResponse = FolderDto[];

// CRM 사용자 메시지 템플릿 정보
export interface GetTemplateResponseDto {
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

// CRM 사용자 메시지 템플릿 목록 조회 응답
export type TemplatesByFolderResponse = GetTemplateResponseDto[];

// CRM 사용자 메시지 템플릿 생성 요청
export interface CreateTemplateDto {
  messageType: CrmMessageType; // 메시지 유형 (1: 문자 2: 알림톡)
  name: string; // 템플릿명 (최대 30자)
  parentId?: number; // 상위 폴더 ID
  messageContent: string; // 메시지 내용 (최대 1000자)
  messageImageFileinfo?: FileUploadV2Uuid[]; // 메시지 첨부 이미지 파일 정보
  isAdDisplayed?: boolean; // 광고성 메시지 표시 여부 (기본값: false)
  messageSubType?: CrmMessageSubType; // 메시지 서브 타입 (0: SMS, 3: LMS, 4:MMS, 5:알림톡, 6:친구톡, 7:친구톡이미지)
  guideMessageTemplateId?: number; // 가이드 메시지 템플릿 ID
}

// CRM 사용자 메시지 템플릿 생성 응답
export interface CreateTemplateResponse {
  id: number; // 생성된 템플릿 ID
}

// CRM 사용자 메시지 템플릿 폴더 생성 요청
export interface CreateFolderDto {
  messageType: CrmMessageType; // 메시지 유형 (1: 문자 2: 알림톡)
  name: string; // 폴더명 (최대 100자)
}

// CRM 사용자 메시지 템플릿 폴더 생성 응답
export interface CreateFolderResponseDto {
  id: number; // 생성된 폴더 ID
  name: string; // 폴더 이름
  sortOrder: number; // 정렬 순서
}

// CRM 사용자 메시지 템플릿 폴더 수정 요청
export interface UpdateFolderDto {
  name: string; // 폴더명 (최대 100자)
}

// CRM 사용자 메시지 템플릿 폴더 수정 응답
export interface UpdateFolderResponseDto {
  id: number; // 수정된 폴더 ID
}

// CRM 사용자 메시지 템플릿 폴더 삭제 응답
export interface DeleteFolderResponseDto {
  id: number; // 삭제된 폴더 ID
}

// CRM 사용자 메시지 템플릿 수정 요청
export interface UpdateTemplateDto {
  messageType?: CrmMessageType; // 메시지 유형 (1: 문자 2: 알림톡)
  name?: string; // 템플릿명 (최대 30자)
  parentId?: number; // 상위 폴더 ID
  messageContent?: string; // 메시지 내용 (최대 1000자)
  messageImageFileinfo?: FileUploadV2Uuid[]; // 메시지 첨부 이미지 파일 정보
  isAdDisplayed?: boolean; // 광고성 메시지 표시 여부 (기본값: false)
  messageSubType?: CrmMessageSubType; // 메시지 서브 타입 (0: SMS, 3: LMS, 4:MMS, 5:알림톡, 6:친구톡, 7:친구톡이미지)
  guideMessageTemplateId?: number; // 가이드 메시지 템플릿 ID
}

// CRM 사용자 메시지 템플릿 수정 응답
export interface UpdateTemplateResponseDto {
  id: number; // 수정된 템플릿 ID
}

// CRM 사용자 메시지 템플릿 삭제 응답
export interface DeleteTemplateResponseDto {
  id: number; // 삭제된 템플릿 ID
}

// CRM 사용자 메시지 템플릿 위치 이동 요청
export interface MoveTemplateDto {
  targetFolderId: number; // 삽입할 폴더 ID
  afterFileId?: number | null; // 해당 파일 뒤에 삽입 (null이면 맨 앞)
}

// CRM 사용자 메시지 템플릿 위치 이동 응답
export interface MoveTemplateResponseDto {
  id: number; // 위치 변경된 템플릿 ID
}

// CRM 사용자 메시지 템플릿 폴더 위치 이동 요청
export interface MoveFolderDto {
  afterFolderId?: number | null; // 해당 폴더 뒤에 위치 (null이면 맨 앞)
}

// CRM 사용자 메시지 템플릿 폴더 위치 이동 응답
export interface MoveFolderResponseDto {
  id: number; // 위치 변경된 폴더 ID
}
