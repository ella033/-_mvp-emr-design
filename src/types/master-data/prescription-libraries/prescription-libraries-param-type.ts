import type {
  PrescriptionSubType,
  PrescriptionType,
} from "@/constants/master-data-enum";

export interface PrescriptionLibrariesParamType {
  keyword?: string; // 검색어 (사용자코드 또는 처방명 또는 청구코드)
  limit?: number; // 결과 수 (기본값: 20)
  cursor?: number; // 다음 페이지 커서
  baseDate?: string; // 기준일 (YYYY-MM-DD 형식, 해당 날짜 기준의 유효한 처방 정보 조회)
  type?: PrescriptionType; // 처방구분 (1:수가, 2:약가, 3:재료대)
  subType?: PrescriptionSubType; // 하위구분 (1:행위, 2:검사)
  itemType?: string; // 항목구분 (ex: 0101, 0201, S01 등) - 모든 타입에 적용
  codeType?: number; // 코드구분 (1:수가, 2:준용수가, 3:보험등재약, 4:원료약_조제약, 5:보험등재약의일반명, 8:치료재료) - 모든 타입에 적용
  examCategory?: number; // 검사구분 (1:일반, 2:검체검사, 3:병리검사, 4:기능검사, 5:내시경천자생검, 6:초음파검사)
  examDetailCategory?: number; // 검사세부구분 (1:일반진단검사 ~ 36:특수초음파)
  oneTwoType?: number; // 란구분 (1:재료1란, 2:행위2란) - 수가(type=1)일 때만 적용
  surgeryType?: string; // 수술여부 ("0":일반, "9":수술) - 수가(type=1)일 때만 적용
  administrationRoute?: string; // 투여경로(내복, 외용, 주사, 기타)
  radiationCategory?: number; // 방사선촬영구분 (1:단순촬영 ~ 7:골밀도) - 수가(type=1)일 때만 적용
  isIncludeAssessment?: string; // 산정코드 포함여부 (true: 포함, false: 미포함, 기본값: false) - 수가(type=1)일 때만 적용
  activeIngredientCode?: string; // 주성분코드 (DUR 등 점검 시 사용) - 약가(type=2)일 때만 적용
  salaryStandard?: string; // 급여기준 (급여, 급여정지, 보훈급여, 삭제, 산정불가 등) - 약가(type=2)일 때만 적용
  withdrawalPrevention?: string; // 퇴장방지 (사용장려, 원가+장려, 원가보전 등) - 약가(type=2)일 때만 적용
  sameDrugCode?: string; // 동일_의약품 코드 - 약가(type=2)일 때만 적용
  specializationType?: string; // 전문_일반(전문의약품 or 일반의약품) - 약가(type=2)일 때만 적용
  drugEquivalence?: string; // 의약품동등성 (생동(사후통보), 의약품동등) - 약가(type=2)일 때만 적용
  substituteType?: string; // 저가대체가산여부 (대체조제가능) - 약가(type=2)일 때만 적용
  importCompany?: string; // 수입업소 - 재료대(type=3)일 때만 적용
  manufacturerName?: string; // 업소명.제조사 (에스케이플라즈마(주) 등) - 약가(type=2)/재료대(type=3) 모두 적용
}
