import { useMutation } from "@tanstack/react-query";
import { DiseasesService } from "@/services/diseases-service";
import type { Disease } from "@/types/chart/disease-types";

export interface ApiDisease {
  id?: string;
  sortNumber: number;
  code: string;
  name: string;
  isSuspected: boolean;
  isExcluded: boolean;
  isLeftSide: boolean;
  isRightSide: boolean;
  department: number;
  specificSymbol?: string;
  externalCauseCode?: string;
  isSurgery: boolean;
  diseaseLibraryId: number;
}

export function useUpsertDiseasesByEncounter(options?: {
  onSuccess?: (data: Disease[]) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: ({ encounterId, diseases }: { encounterId: string; diseases: ApiDisease[] }) =>
      DiseasesService.deleteUpsertManyDiseasesByEncounter(encounterId, {
        items: diseases,
      }),
    ...options,
  });
}
