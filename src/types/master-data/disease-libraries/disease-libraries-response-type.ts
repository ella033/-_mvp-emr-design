import type { DiseaseLibraryDetail } from "./disease-libraries-detail-type";

export interface DiseaseLibrariesResponse {
  items: DiseaseLibrariesType[];
  nextCursor: number;
  hasNextPage: boolean;
  totalCount: number;
}

export interface DiseaseLibrariesType {
  id: number;
  name: string;
  nameEn: string;
  details: DiseaseLibraryDetail[];
}
