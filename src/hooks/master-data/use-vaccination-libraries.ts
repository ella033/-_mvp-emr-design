import { useQuery } from "@tanstack/react-query";
import { VaccinationLibrariesService } from "@/services/master-data/vaccination-libraries-service";

export const useVaccinationLibraries = (keyword: string) => {
  return useQuery({
    queryKey: ["vaccination-libraries", keyword],
    queryFn: () =>
      VaccinationLibrariesService.searchVaccinationLibraries(keyword),
  });
};
