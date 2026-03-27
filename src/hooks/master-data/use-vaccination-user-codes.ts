import { useQuery } from "@tanstack/react-query";
import { VaccinationUserCodesService } from "@/services/master-data/vaccination-user-codes-service";

export const useVaccinationUserCodes = (keyword: string) => {
  return useQuery({
    queryKey: ["vaccination-user-codes", keyword],
    queryFn: () =>
      VaccinationUserCodesService.searchVaccinationUserCodes(keyword),
  });
};
