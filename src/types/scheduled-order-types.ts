import type { PrescriptionUserCodeType } from "./master-data/prescription-user-codes/prescription-user-code-type";
import type { PrescriptionLibraryType } from "./master-data/prescription-libraries/prescription-library-type";
import type { Bundle } from "./master-data/bundle/bundle-type";

// ================================ 예약 처방 기본 ================================
export interface ScheduledOrderBase {
  patientId?: number; // 환자 아이디
  userCodeId?: number | null; // 처방 사용자코드 아이디
  prescriptionLibraryId?: number | null; // 처방 라이브러리 아이디
  bundleItemId?: number | null; // 묶음 아이템 아이디
  memo?: string | null; // 메모
  dose: number; // 투여량(용량) = [1회 투약량] × [1일 투여량(투여(실시)횟수)] = 일투여량
  days: number; // 투여일수(일수)
  times: number; // 일투여횟수(일투수)
  applyDate?: string | null; // 적용일자
}

// ================================ 예약 처방 정보 ================================
export interface ScheduledOrder extends ScheduledOrderBase {
  id?: string; // 예약 처방 아이디 (PK)
  createId?: number; // 생성자
  createDateTime?: string; // 생성일시
  updateId?: number | null; // 수정자
  updateDateTime?: string | null; // 수정일시
  // Relations (optional, 필요시 해당 타입 import)
  prescriptionUserCode?: PrescriptionUserCodeType | null; // 처방 사용자코드
  prescriptionLibrary?: PrescriptionLibraryType | null; // 처방 라이브러리
  bundleItem?: Bundle | null; // 묶음 아이템
}

// ================================ 예약 처방 생성 ================================
export interface CreateScheduledOrderRequest extends ScheduledOrderBase {}

export interface CreateScheduledOrderResponse {
  id: number;
}

// ================================ 예약 처방 수정 ================================
export interface UpdateScheduledOrderRequest
  extends Partial<Omit<ScheduledOrderBase, "patientId">> {
  id: number;
}

export interface UpdateScheduledOrderResponse extends ScheduledOrder {}

// ================================ 예약 처방 삭제 ================================
export interface DeleteScheduledOrderResponse {
  id: number;
}

export interface DeleteUpsertManyScheduledOrdersRequest {
  items: ScheduledOrder[];
}
