import { useQuery } from "@tanstack/react-query";
import { DiseaseLibrariesService } from "@/services/disease-libraries-service";

export function useDiseaseLibraryDetail(id: number | undefined) {
  return useQuery({
    queryKey: ["disease-libraries", "detail", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      return await DiseaseLibrariesService.getDiseaseLibraryById(id);
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

