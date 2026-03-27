// ================================ 환자 가족 기본 ================================
export interface PatientFamilyBase {
  patientId: number;
  patientFamilyId: number;
  relationType: number;
}

// ================================ 환자 가족 정보 ================================
export interface PatientFamily extends PatientFamilyBase {
  id: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  patientFamily?: FamilyMember;
}

// ================================ 환자 가족 개인 ================================
export interface FamilyMember {
  id: number;
  uuid: string;
  name: string;
  rrn: string;
  birthDate: string;
  gender: number;
  phone1: string;
}

// ================================ 환자 가족 생성 ================================
export interface CreatePatientFamilyRequest extends PatientFamilyBase {}
export interface CreatePatientFamilyResponse extends PatientFamily {}

// ================================ 환자 가족 수정 ================================
export interface UpdatePatientFamilyRequest
  extends Partial<PatientFamilyBase> {}
export interface UpdatePatientFamilyResponse extends PatientFamily {}

// ================================ 환자 가족 여러 개 생성 또는 수정 ================================
export interface DeleteUpsertManyPatientFamiliesRequest {
  items: (Omit<PatientFamilyBase, "patientId"> & { id?: number })[];
}
export interface DeleteUpsertManyPatientFamiliesResponse {
  items: PatientFamily[];
}

// ================================ 환자 가족 삭제 ================================
export interface DeletePatientFamilyRequest {}
export interface DeletePatientFamilyResponse {
  id: number;
}
