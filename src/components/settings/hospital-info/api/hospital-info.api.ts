import { HospitalsService } from "@/services/hospitals-service";
import type { Hospital } from "@/types/hospital-types";

export const hospitalInfoApi = {
  getHospital: (id: number) => HospitalsService.getHospital(id),
  updateHospital: (id: number, data: Partial<Hospital>) => HospitalsService.updateHospital(id, data),
};
