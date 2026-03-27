import type {
  CrmSendType,
  CrmMessageType,
  CrmMessageRegStatus,
} from "@/constants/crm-enums";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

/** 발송 내역 조회 요청 파라미터 */
export interface GetSendHistoryParams {
  /** 조회 시작일 (YYYY-MM-DD) */
  from: string;
  /** 조회 종료일 (YYYY-MM-DD) */
  to: string;
  /** 발송 상태 (3: 발송성공, 4: 발송실패 / 6: 예약발송, 7: 발송취소) */
  status?: CrmMessageRegStatus;
}

/** 발송 내역 응답 DTO */
export interface GetSendHistoryResponseDto {
  /** CRM 메시지 발송 내역 ID */
  id: number;
  /** 발송경로 (1: 자동, 2: 수동, 3: 진료실호출, 4: 접수실호출) */
  sendType: CrmSendType;
  /** 발송수단 (1: 문자 2: 알림톡) */
  messageType: CrmMessageType;
  /** 발송일시 */
  sendDateTime: string;
  /** 수신자 요약 정보 */
  recipientSummary: string;
  /** 메시지 내용 */
  messageContent: string;
  /** 발송번호 */
  senderNumber: string;
  /** 발송상태 */
  status: CrmMessageRegStatus;
  /** 사용 포인트 */
  usedPoints: number;
  /** 실패 건수 */
  failedCount: number;
  /** 재발송가능여부 */
  canResend: boolean;
  /** 발송인 이름 */
  createName?: string | null;
}

/** 발송 내역 목록 응답 */
export type CrmSendHistoryListResponse = GetSendHistoryResponseDto[];

/** 예약 내역 조회 요청 파라미터 */
export interface GetSendReservedHistoryParams {
  /** 조회 시작일 (YYYY-MM-DD) */
  from: string;
  /** 조회 종료일 (YYYY-MM-DD) */
  to: string;
  /** 발송 상태 (3: 발송성공, 4: 발송실패 / 6: 예약발송, 7: 발송취소) */
  status?: CrmMessageRegStatus;
}

/** 예약 내역 응답 DTO */
export interface GetSendReservedHistoryResponseDto {
  /** CRM 메시지 발송 내역 ID */
  id: number;
  /** 발송경로 (1: 자동, 2: 수동, 3: 진료실호출, 4: 접수실호출) */
  sendType: CrmSendType;
  /** 발송수단 (1: 문자 2: 알림톡) */
  messageType: CrmMessageType;
  /** 발송예정일시 */
  sendDateTime: string;
  /** 수신자 요약 정보 */
  recipientSummary: string;
  /** 메시지 내용 */
  messageContent: string;
  /** 발송번호 */
  senderNumber: string;
  /** 발송상태 */
  status: CrmMessageRegStatus;
  /** 사용 예정 포인트 */
  expectedPoints: number;
  /** 예약취소가능여부 */
  canCancel: boolean;
  /** 발송인 이름 */
  createName?: string | null;
  /** 예약일시 */
  createDateTime: string;
}

/** 예약 내역 목록 응답 */
export type CrmSendReservedHistoryListResponse =
  GetSendReservedHistoryResponseDto[];

/** 메시지 내용 조회 응답 DTO */
export interface GetMessageContentResponseDto {
  /** 메시지 ID */
  id: number;
  /** 메시지 내용 */
  content: string;
  /** 첨부 이미지 파일 목록 (base64 []) */
  imageFile: string[];
}

/** 수신자 상세 정보 DTO */
export interface CrmSendRecipientDetailDto {
  /** 수신자 ID */
  id: number;
  /** 환자 ID */
  patientId: number;
  /** 수신자 이름 */
  recipientName: string;
  /** 수신자 전화번호 */
  recipientPhone: string;
  /** UBMS ID */
  ubmsId: number | null;
  /** 사용 포인트 (사용예정포인트) */
  points: number;
  /** 발송 상태 */
  status?: CrmMessageRegStatus;
  /** 실패 사유 */
  failedMessage?: string | null;
  /** 메시지 서브 타입 명칭 */
  messageSubTypeName?: string;
  /** 발송 메시지 (등록실패인 경우 재발송을 위한 원문 메시지) */
  sendMessage?: string | null;
  /** 첨부 이미지 파일 정보 (등록실패인 경우 미리보기에 첨부 이미지 표시를 위함) */
  messageImageFileinfo?: FileUploadV2Uuid[] | null;
}

/** 발송 내역 상세 조회 응답 DTO */
export interface GetSendHistoryDetailResponseDto {
  /** 발송 내역 ID */
  id: number;
  /** 발송 상태 */
  status: CrmMessageRegStatus;
  /** 발송 경로 */
  sendType: CrmSendType;
  /** 발송 일시(예약인 경우 예정일시) */
  sendDateTime: string;
  /** 발송 번호 */
  senderNumber: string;
  /** 발송 수단 */
  messageType: CrmMessageType;
  /** 등록 일시 */
  createDateTime: string;
  /** 총 사용 포인트 (총 사용예정포인트) */
  points: number;
  /** 재발송 가능 여부 */
  canResend: boolean;
  /** 예약 취소 가능 여부 */
  canCancel: boolean;
  /** 수신자 목록 */
  recipients: CrmSendRecipientDetailDto[];
}
