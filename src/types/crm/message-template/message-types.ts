import type { CrmMessageType, CrmMessageSubType } from "@/constants/crm-enums";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

// 이미지 파일 타입 정의
export interface ImageFile {
  file: File;
  preview: string;
}

// 메시지 데이터 타입 정의
export interface MessageData {
  messageType: CrmMessageType;
  messageContent: string;
  messageSubType: CrmMessageSubType;
  isAdDisplayed?: boolean;
  messageTemplateId?: number;
  isGuideTemplate?: boolean;
  messageImageFileinfo?: FileUploadV2Uuid[];
  images?: ImageFile[];
}
