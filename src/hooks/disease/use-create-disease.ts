import { useMutation } from "@tanstack/react-query";
import { DiseasesService } from "@/services/diseases-service";
import type {
  CreateDiseaseRequest,
  CreateDiseaseResponse,
} from "@/types/chart/disease-types";

export function useCreateDisease(options?: {
  onSuccess?: (data: CreateDiseaseResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (disease: CreateDiseaseRequest) =>
      DiseasesService.createDisease(disease),
    ...options,
  });
}
