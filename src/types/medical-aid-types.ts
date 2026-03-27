export interface MedicalAidBase {
  patientId: number;
  disreg: string;
  disregData: string;
  queryDate: Date;
  /**
   * 본인확인 여부
   * true: 본인확인 필요없음 (예외)
   * false: 본인확인 필요 (identityVerifiedAt 날짜 기반으로 6개월 이내인 경우로 추가 판단)
   */
  identityOptional: boolean;
}

export interface MedicalAid extends MedicalAidBase {
  id: number;
  createId: number;
  createDateTime: Date;
  updateId: number;
  updateDateTime: Date;
}

export interface MedicalAidResponse extends MedicalAidBase {
  id: number;
  patientId: number;
  disreg: string;
  disregData: string;
  queryDate: Date;
  identityOptional: boolean;
  updateDateTime: Date;
}

export interface CreateMedicalAidRequest extends Partial<MedicalAidBase> { }

export interface CreateMedicalAidResponse {
  id: number;
}

export interface UpdateMedicalAidRequest extends Partial<MedicalAidBase> {
}

export interface UpdateMedicalAidResponse extends MedicalAid { }

export interface DeleteMedicalAidRequest { }

export interface DeleteMedicalAidResponse {
  id: number;
}