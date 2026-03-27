export type MaterialLibraryType = {
  type: number; // 처방구분 (3:재료대)
  typePrescriptionLibraryId: number; // 타입별 처방 라이브러리 아이디, 가상키 = 청구코드, 청구코드가 달라지는 경우에도 가상키로 연결하여 관리하기 위함
  middleCategory: string; // 중분류
  middleCategoryCode: string; // 중분류코드
  isDuplicateAllowed: boolean; // 중복인정여부	N or Y
  specification: string; // 규격, 1500(1)
  unit: string; // 단위, mL/병
  material: string; // 재질
  manufacturerName: string; // 업소명.제조사, 에스케이플라즈마(주)
  importCompany: string; // 수입업소
};
