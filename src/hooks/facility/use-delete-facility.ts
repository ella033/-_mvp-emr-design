import { FacilityService } from "@/services/facility-service";
import { useMutation } from "@tanstack/react-query";

export const useDeleteFacility = () => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => FacilityService.deleteFacility(id),
  });
};