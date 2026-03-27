import type { OperatingHours } from "./calendar-types";
import type { Facility } from "./facility-types";
import type { FileUploadV2Uuid } from "./file-types-v2";
import type { AuthLoginCredentialsRequest } from "./auth-types";

// ================================ 병원 기본 ================================
export interface HospitalBase {
  name: string;
  number: string;
  type: number;
  locationType: number;
  bizRegNumber: string;
  address1: string;
  address2: string;
  zipcode: string;
  phone: string;
  mobile?: string;
  fax?: string;
  director?: string;
  email?: string;
  beds?: number;
  departments: number[];
  facilities: Facility[];
  isActive: boolean;
  nameEn?: string;
  directorEn?: string;
  address1En?: string;
  address2En?: string;
  isPharmacyException?: boolean;
  isMoonlightChildHospital?: boolean;
  isAttachedClinic?: boolean;
  // 실제 서버 응답에 맞는 필드들
  logoFileinfo?: FileUploadV2Uuid;
  sealFileinfo?: FileUploadV2Uuid;
  directorSealFileinfo?: FileUploadV2Uuid;
  operatingHours?: OperatingHours[];
}

// ================================ 원내 검사실 정보 ================================
export interface InternalLabInfo {
  specimenQualityGrades: SpecimenQualityGrade[];
  currentGrade?: SpecimenQualityGrade | null;
}

export interface SpecimenQualityGrade {
  id?: string;
  applyDate: string;
  qualityGrade: number;
  isPathologyCertified: boolean;
  isNuclearMedicineCertified: boolean;
  pathologyAddOnRate?: number;
  nuclearMedicineAddOnRate?: number;
}

// ================================ 병원 정보 ================================
export interface Hospital extends HospitalBase {
  id: number;
  createId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
  internalLabInfo?: InternalLabInfo | null;
}

// ================================ 병원 생성 ================================
export interface CreateHospitalRequest extends HospitalBase { }
export interface CreateHospitalWithCredentialRequest {
  credentials: AuthLoginCredentialsRequest;
  hospital: HospitalBase;
}
export interface CreateHospitalResponse {
  id: number;
}

// ================================ 병원 수정 ================================
export interface UpdateHospitalRequest extends Partial<HospitalBase> { }
export interface UpdateHospitalResponse extends Hospital { }

// ================================ 병원 삭제 ================================
export interface DeleteHospitalRequest { }
export interface DeleteHospitalResponse {
  id: number;
}
