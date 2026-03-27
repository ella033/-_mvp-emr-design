export interface MaterialUserCodeType {
  id: number; // 재료대 사용자코드 아이디 (PK)
  prescriptionUserCodeId: number; // 처방 사용자코드 아이디 (FK)
  material: string; // 재료
  manufacturerName: string; // 제조사
  importCompany: string; // 수입업소
  specification: string; // 규격
  unit: string; // 단위
  dose: number; // 투여량(용량)
}
