import {
  CrmSendType,
  CrmMessageType,
  CrmMessageRegStatus,
} from "@/constants/crm-enums";

// CRM 메시지 발송 요청 DTO
export interface CrmMessageSendRequest {
  sendType: CrmSendType;
  sendDateTime?: string; // 예약발송일시
  senderNumber: string; // 발신번호
  messageType: CrmMessageType;
  messageContent: string;
  isAdDisplayed?: boolean;
  messageTemplateId?: number;
  recipients: CrmMessageRecipient[];
  image1?: File;
  image2?: File;
  image3?: File;
}

// 수신자 정보
export interface CrmMessageRecipient {
  patientId: number; // 환자id
  recipientName: string; // 수신자명
  recipientPhone?: string; // 수신번호
}

export interface CrmMessageSendResponse {
  id: number;
}

export interface CrmMessageReRegistrationResponse {
  sendStatus: CrmMessageRegStatus;
}

export interface CrmMessageResendRequest {
  recipientIds?: number[];
}

export interface CrmMessageResendResponse {
  success: boolean;
}

export interface SendEligibilityCheckResponse {
  sendablePatientIds: number[];
  unsendableReasons: {
    privacyNotAgreed: number;
    noPhoneNumber: number;
    marketingRejected: number;
  };
}
