// 발급이력 관련 타입 정의

export type IssuanceHistoryType = 'patient' | 'document';

export interface IssuanceHistoryItem {
  issuanceId: number;
  issuedAt: string; // 발급일시 (ISO 8601)
  issuedBy: number; // 발급자 ID
  formName: string; // 서식명
  patientId: number; // 환자 ID
  patientName: string; // 환자명
  status?: number; // 발급 상태 (0: 임시저장, 1: 발급완료)
}

