import { useQuery } from "@tanstack/react-query";
import { SpecimenLibrariesService } from "@/services/specimen-libraries-service";

export const useSpecimenLibraries = (keyword: string) => {
  return useQuery({
    queryKey: ["specimen-libraries", keyword],
    queryFn: () => SpecimenLibrariesService.getSpecimenLibraries(keyword),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
