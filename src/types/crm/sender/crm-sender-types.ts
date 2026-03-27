// CRM 발송번호 정보
export interface CrmSender {
  senderNumber: string; // 발송번호
  isMain: boolean; // 기본 발송번호 여부
}

// CRM 발송번호 목록 응답
export type CrmSenderListResponse = CrmSender[];
