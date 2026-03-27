import { FacilityService } from "@/services/facility-service";
import { Facility, CreateFacilityRequest, UpdateFacilityRequest } from "@/types/facility-types";

export const spaceInfoApi = {
  getFacilities: async (hospitalId: string) => {
    return FacilityService.getFacilities(`hospitalId=${hospitalId}`);
  },

  createFacility: async (data: CreateFacilityRequest): Promise<Facility> => {
    // FacilityService usually returns the created object.
    // Need to check FacilityService definition if verify needed, but assuming standard service.
    // Wait, useCreateFacility hook in original code used `createFacilityMutation.mutateAsync`.
    // I'll assume usage of ApiClient logic inside FacilityService.
    // Let's assume FacilityService has create/update/delete.
    // If not, I'll fallback to what useCreateFacility used.
    // Actually `useCreateFacility` imports `FacilityService` and calls `createFacility`.
    return FacilityService.createFacility(data);
  },

  updateFacility: async (id: number, data: UpdateFacilityRequest): Promise<void> => {
    return FacilityService.updateFacility(id, data);
  },

  deleteFacility: async (id: number): Promise<void> => {
    return FacilityService.deleteFacility(id);
  }
};
