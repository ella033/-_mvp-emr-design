import { useMutation } from "@tanstack/react-query";
import { DiseasesService } from "@/services/diseases-service";
import type { DeleteDiseaseResponse } from "@/types/chart/disease-types";

export const useDeleteDisease = (options?: {
  onSuccess?: (data: DeleteDiseaseResponse) => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (id: string) => DiseasesService.deleteDisease(id),
    ...options,
  });
};
