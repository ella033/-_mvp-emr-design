import { FacilityService } from "@/services/facility-service";
import type { UpdateFacilityRequest } from "@/types/facility-types";
import { useMutation } from "@tanstack/react-query";

export const useUpdateFacility = () => {
  return useMutation({
    mutationFn: ({ id, facility }: { id: number, facility: UpdateFacilityRequest }) => FacilityService.updateFacility(id, facility),
  });
};