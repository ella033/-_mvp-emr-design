export type MedicalLibraryType = {
  type: number; // 처방구분 (1:수가)
  typePrescriptionLibraryId: number; // 타입별 처방 라이브러리 아이디, 가상키 = 청구코드, 청구코드가 달라지는 경우에도 가상키로 연결하여 관리하기 위함
  nameEn: string; // 영문명 (수가만 해당)
  assessmentName: string; // 산정명칭(수가만 해당)
  surgeryType: string; // 수술여부	0 or 9
  isDuplicateAllowed: boolean; // 중복인정여부	N or Y
  organCategory: string; // 장구분
  sectionCategory: string; // 절구분
  subCategory: string; // 세분류
  classificationNo: string; // 수가:분류번호	가1가(2)
  examCategory: number | null; // 검사구분	수가만 해당 (1:일반 ~ 6:초음파검사) - 계산 생성
  examDetailCategory: number | null; // 검사세부구분	수가만 해당 (1:일반진단검사 ~ 36:특수초음파) - 계산 생성
  radiationCategory: number | null; // 방사선촬영구분	수가만 해당 (1:단순촬영 ~ 7:골밀도) - 계산 생성
};
