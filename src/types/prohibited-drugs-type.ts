import type { PrescriptionUserCodeType } from "./master-data/prescription-user-codes/prescription-user-code-type";
import type { PrescriptionLibraryType } from "./master-data/prescription-libraries/prescription-library-type";

// ================================ 처방금지약품 기본 ================================
export interface ProhibitedDrugBase {
  patientId: number; // 환자 아이디 (FK)
  userCodeId: number | null; // 처방 사용자코드 아이디 (FK)
  prescriptionLibraryId: number | null; // 처방 라이브러리 아이디 (FK)
  name: string; // 약품명
  atcCode: string | null; // 주성분(코드)
  memo: string | null; // 메모
  isSameIngredientProhibited: boolean; // 동일성분금지 여부
  isPrescriptionAllowed: boolean; // 처방 허용 여부
}

// ================================ 처방금지약품 정보 ================================
export interface ProhibitedDrug extends ProhibitedDrugBase {
  id: string; // 처방금지약품 아이디 (PK)
  createId: number; // 생성자
  createDateTime: string; // 생성일시
  updateId: number | null; // 수정자
  updateDateTime: string | null; // 수정일시
  deleteId: number | null; // 삭제자
  deleteDateTime: string | null; // 삭제일시
  userCode?: PrescriptionUserCodeType | null; // 처방 사용자코드
  prescriptionLibrary?: PrescriptionLibraryType | null; // 처방 라이브러리
}

// ================================ 처방금지약품 여러 개 생성 또는 수정 ================================
export interface UpsertManyProhibitedDrugs {
  id?: string;
  userCodeId?: number;
  prescriptionLibraryId: number;
  name: string;
  atcCode: string;
  memo: string;
  isSameIngredientProhibited: boolean;
  isPrescriptionAllowed: boolean;
}

export interface UpsertManyProhibitedDrugsRequest {
  items: UpsertManyProhibitedDrugs[];
}
