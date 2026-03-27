import { useQuery } from "@tanstack/react-query";
import { DrugSeparationExceptionCodesService } from "@/services/drug-separation-exception-codes-service";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";

export const useDrugSeparationExceptionCodes = (
  type: DrugSeparationExceptionCodeType
) => {
  return useQuery({
    queryKey: ["drug-separation-exception-codes", type],
    queryFn: () =>
      DrugSeparationExceptionCodesService.getDrugSeparationExceptionCodes(type),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
