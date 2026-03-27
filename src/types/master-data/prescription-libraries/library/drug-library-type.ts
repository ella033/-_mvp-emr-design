export type DrugLibraryType = {
  type: number; // 처방구분 (2:약가)
  typePrescriptionLibraryId: number; // 타입별 처방 라이브러리 아이디, 가상키 = 청구코드, 청구코드가 달라지는 경우에도 가상키로 연결하여 관리하기 위함
  administrationRoute: string; // 투여경로(내복, 외용, 주사, 기타)
  exceptionDrugCategory: string; // 예외의약품구분 (00,41,45,51,52 등)
  classificationNo: string; // 약가:분류번호(3자리 숫자)
  specification: string; // 규격, 1500(1)
  unit: string; // 단위, mL/병
  manufacturerName: string; // 업소명.제조사, 에스케이플라즈마(주)
  specializationType: string; // 전문_일반(전문의약품 or 일반의약품)
  drugEquivalence: string; // 의약품동등성, 생동(사후통보), 의약품동등
  substituteType: string; // 저가대체가산여부,	대체조제가능
  prohibitedCompounding: string; // 임의조제불가항목 (마약, 부신피질호르몬제... 등)
  sameDrugCode: string; // 동일_의약품	코드
  claimSpecification: string; // 청구규격	(숫자 + 문자 혼합)
};
