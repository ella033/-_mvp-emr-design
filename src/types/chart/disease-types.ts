// ================================ 질병 기본 ================================
export interface DiseaseBase {
  encounterId?: string;
  sortNumber?: number;
  code: string;
  name: string;
  isSuspected?: boolean;
  isExcluded?: boolean;
  isLeftSide?: boolean;
  isRightSide?: boolean;
  department?: number;
  specificSymbol?: string;
  externalCauseCode?: string;
  isSurgery?: boolean;
  diseaseLibraryId?: number;
  legalInfectiousCategory?: string;
}

// ================================ 질병 정보 ================================
export interface Disease extends DiseaseBase {
  id: string;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

// ================================ 질병 생성 ================================
export interface CreateDiseaseRequest extends DiseaseBase {}
export interface CreateDiseaseResponse extends Disease {}

// ================================ 질병 수정 ================================
export interface UpdateDiseaseRequest extends Partial<DiseaseBase> {}
export interface UpdateDiseaseResponse extends Disease {}

// ================================ 질병 여러 개 생성 또는 수정 ================================
export interface DeleteUpsertManyDiseasesRequest {
  items: (Omit<DiseaseBase, "encounterId"> & { id?: string })[];
}

// ================================ 질병 삭제 ================================
export interface DeleteDiseaseRequest {}
export interface DeleteDiseaseResponse {
  id: string;
}
