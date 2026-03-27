import type { ExternalLabExamination } from "./external-lab-examination-types";

export interface SpecimenQualityGrade {
  id: string;
  applyDate: string;
  qualityGrade: number;
  isPathologyCertified: boolean;
  isNuclearMedicineCertified: boolean;
}

// ================================ 외부 검사기관 정보 ================================
export interface ExternalLab {
  id: string;
  code: string;
  name: string;
  isSystemProvided: boolean;
  isEnabled: boolean;
  externalLabHospitalMappingId?: string;
  currentGrade?: SpecimenQualityGrade | null;
  specimenQualityGrades: SpecimenQualityGrade[];
}

// ================================ 외부 검사 데이터 (전체) ================================
export interface ExternalLabData {
  examination: ExternalLabExamination;
  externalLab: ExternalLab;
  serviceType: number;
  snapshotDateTime: string;
}
