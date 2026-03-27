import { FacilityService } from "@/services/facility-service";
import type { CreateFacilityRequest } from "@/types/facility-types";
import { useMutation } from "@tanstack/react-query";

export const useCreateFacility = () => {
  return useMutation({
    mutationFn: (facility: CreateFacilityRequest) => FacilityService.createFacility(facility),
  });
};
