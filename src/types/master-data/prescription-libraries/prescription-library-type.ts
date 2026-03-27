import type { MedicalLibraryType } from "./library/medical-library-type";
import type { DrugLibraryType } from "./library/drug-library-type";
import type { MaterialLibraryType } from "./library/material-library-type";
import type { PrescriptionType } from "@/constants/master-data-enum";

export type PrescriptionLibraryType = {
  id: number; // 처방 라이브러리 아이디
  type: PrescriptionType; // 처방구분 (1:수가, 2:약가, 3:재료대)
  typePrescriptionLibraryId: number; // 타입별 처방 라이브러리 아이디, 가상키 = 청구코드, 청구코드가 달라지는 경우에도 가상키로 연결하여 관리하기 위함
  name: string; // 한글명 or 품명
  itemType: string; // 항목구분 ex) 0000 or S01 - 항(2자리), 목(2자리) - 계산 생성
  codeType: number; // 코드구분 (1:수가, 2:준용수가, 3:보험등재약, 4:원료약_조제약, 5:보험등재약의일반명, 8:치료재료)
  receiptPrintLocation: number; // 영수증출력위치 (0:없음, 1:진찰료, 2:입원료, 3:식대, 4:투약_조제_행위료, 5:투약_조제_약품비, 6:주사_행위료, 7:주사_약품비, 8:마취료, 9:처치및수술료, 10:검사료, 11:영상진단료, 12:방사선치료료, 13:치료재료대, 14:재활및물리치료료, 15:정신요법료, 16:전혈및혈액성분제제료, 17:CT진단료, 18:MRI진단료, 19:PET진단료, 20:초음파진단료, 21:보철_교정료_기타)
  isSystemExternalLab?: boolean; // 시스템 제공 수탁기관 여부
  details: PrescriptionLibraryDetailType[];
  medicalLibrary: MedicalLibraryType | undefined;
  drugLibrary: DrugLibraryType | undefined;
  materialLibrary: MaterialLibraryType | undefined;
};

export type PrescriptionLibraryDetailType = {
  type: number; // 처방구분(FK) (1:수가, 2:약가, 3:재료대)
  typePrescriptionLibraryId: number; // 타입별 처방 라이브러리 아이디(FK), 가상키 = 청구코드, 청구코드가 달라지는 경우에도 가상키로 연결하여 관리하기 위함
  applyDate: string; // 적용일자(게시일, 시작일)
  claimCode: string; // 청구코드(수가, 약품, 재료대 등의 코드)
  price: number; // 금액(의원단가 or 상한가)
  isSelfPayRate30: boolean; // 본인부담률 30%
  isSelfPayRate50: boolean; // 본인부담률 50%
  isSelfPayRate80: boolean; // 본인부담률 80%
  isSelfPayRate90: boolean; // 본인부담률 90%
  isSelfPayRate100: boolean; // 본인부담률 100%
  oneTwoType: number; // 란구분(재료1란, 행위2란 구분)	수가만 해당 - 1 or 2 나머지는 재료1란, 1로 처리
  relativeValueScore: number; // 상대가치점수	수가만 해당 - 수가의 일부 항목이 가지는 점수
  salaryStandard: number | null; // 급여기준	약가만 해당 - 급여, 급여정지, 보훈급여, 삭제, 산정불가 등
  additionalPrice: number | null; // 가산금	약가만 해당 - 0원 ~
  activeIngredientCode: string | null; // 주성분코드	약가만 해당 - DUR 등 점검 시 사용 예시) 636401ACH
  withdrawalPrevention: string | null; // 퇴장방지	약가만 해당 - 예시) 사용장려, 원가+장려, 원가보전
};
