import type {
  CrmEventSendTimeType,
  CrmEventType,
  CrmMessageType,
  CrmMessageSubType,
} from "@/constants/crm-enums";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

export interface EventListResponseDto {
  /** 발송 이벤트 아이디 */
  id: number;
  /** 조건명 */
  eventName: string;
  /** 발송 시점 서술 */
  eventDispSummary: string;
  /** 메시지 유형 */
  messageType?: CrmMessageType;
  /** 사용여부 */
  isActive: boolean;
}

export type CrmSendEventsListResponse = EventListResponseDto[];

/** 발송 시점 상세 */
export interface SendTiming {
  /** 발송 시점 단위 (days, hours 등) */
  unit: "days" | "weeks" | "months";
  /** 발송 시점 값 */
  value: number;
}

/** 발송 시점 상세 조건 */
export interface TimeDetails {
  /** 발송 시점 상세 */
  timing?: SendTiming;
  /** 휴일 미리 발송 (sat, sun, holi 등) */
  preSendDays?: ("sat" | "sun" | "holi")[];
  /** 발송 시간 (HH:mm 형식) */
  sendTime?: string;
}

/** 연령 조건 */
export type AgeConditionMode = "include" | "exclude";
export interface AgeCondition {
  mode: AgeConditionMode;
  min: number;
  max: number;
}

/** 발송 대상 환자 조건 */
export interface TargetPatientConditions {
  /** 성별 조건 (male: 남성, female: 여성) */
  gender?: "male" | "female";
  /** 출생년도 조건 (even: 짝수, odd: 홀수) */
  birthYear?: "even" | "odd";
  /** 연령 조건 */
  age?: AgeCondition;
  /** 처방 코드 배열 */
  claimCodes?: string[];
}

/** CRM 발송 이벤트 타입 */
export interface CrmSendEventType {
  /** 조건유형 (1: 예약완료, 변경, 취소 안내, 2: 내원 전 안내, 3: 내원 후 안내 등) */
  eventType: CrmEventType;
  /** 조건명 */
  eventName: string;
  /** 발송 시점 상세 */
  eventDispSummary: string;
  /** 사용여부 */
  isActive: boolean;
  /** 예약실ID 리스트 */
  appointmentRoomIds: number[];
  /** 예약유형ID 리스트 */
  appointmentTypeIds: number[];
  /** 발송 대상 환자 조건 */
  sendConditions?: TargetPatientConditions;
  /** 발송 시점 유형 (1: 예약 완료 시 2: 예약 변경 시 3: 예약 취소 시 99: 상세 설정) */
  sendTimeType?: CrmEventSendTimeType;
  /** 발송 시점 상세 조건 */
  sendTimeDetail?: TimeDetails;
  /** 발송번호 */
  senderNumber?: string;
  /** 메시지 유형 (1: 문자 2: 알림톡) */
  messageType?: CrmMessageType;
  /** 메시지 템플릿 ID */
  messageTemplateId?: number;
  /** 메시지 내용 */
  messageContent?: string;
  /** 메시지 첨부 이미지 파일 정보 */
  messageImageFileinfo?: FileUploadV2Uuid[];
  /** 광고성 메시지 표시 여부 */
  isAdDisplayed?: boolean;
  /** 가이드 템플릿 ID */
  guideTemplateId?: number;
  /** 메시지 서브 타입 (SMS, LMS, MMS, 알림톡, 친구톡, 친구톡이미지) */
  messageSubType?: CrmMessageSubType;
}

/** CRM 발송 이벤트 생성 요청 DTO */
export type CreateCrmSendEventDto = CrmSendEventType;

/** CRM 발송 이벤트 수정 요청 DTO */
export type UpdateCrmSendEventDto = Partial<CrmSendEventType>;

/** CRM 발송 이벤트 생성 응답 DTO */
export interface CreateCrmSendEventResponseDto {
  /** CRM 발송 이벤트 ID */
  id: number;
}

/** CRM 발송 이벤트 단일 조회 응답 DTO */
export interface CrmSendEventResponseDto extends CrmSendEventType {
  /** CRM 발송 이벤트 ID */
  id: number;
}
