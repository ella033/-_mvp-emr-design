export interface DiseaseLibraryDetail {
  diseaseId: number;
  applyDate: string;
  code: string;
  isComplete: boolean;
  isPossibleMainDisease: boolean;
  legalInfectiousCategory: string;
  gender: number;
  maxAge: number | null;
  minAge: number | null;
}
