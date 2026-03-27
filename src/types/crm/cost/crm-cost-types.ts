// CRM 메시지 발송 비용 조회 응답
export interface GetCostResponseDto {
  totalCost: number; // 총 이용 요금
  baseCost: number; // 기본 요금
  useCost: number; // 사용 요금
  standardCost: number; // 포인트당 기준 단가
  totalPoint: number; // 사용 포인트
  smsPoint: number; // SMS 사용 포인트 (SMS 건수 * 1P)
  lmsPoint: number; // LMS 사용 포인트 (LMS 건수 * 2P)
  mmsPoint: number; // MMS 사용 포인트 (MMS 건수 * 3P)
}

