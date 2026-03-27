export interface MedicalUserCodeType {
  id: number;
  prescriptionUserCodeId: number;
  isAgeAdditionExcluded: boolean; // 나이가산제외여부
  isNightHolidayExcluded: boolean; // 야간공휴가산제외여부
  isExamResultViewExcluded: boolean; // 검사결과 보기 제외
  isPathologyNuclearAdditionExcluded: boolean; // 병리가산/핵의학 가산 제외
}
