import { ExternalLabService } from "@/services/external-lab-service";
import { HospitalsService } from "@/services/hospitals-service";
import type { SpecimenQualityGrade } from "@/types/hospital-types";

export const labManagementApi = {
  // Internal Lab
  getInternalHospital: (id: number) => HospitalsService.getHospital(id),
  updateInternalLabInfo: (id: number, data: { specimenQualityGrades: SpecimenQualityGrade[] } | null) =>
    HospitalsService.updateInternalLabInfo(id, data),

  // External Lab
  getExternalLabs: () => ExternalLabService.getLabs(),
  updateLabMapping: (data: { externalLabId: string; isEnabled: boolean }) =>
    ExternalLabService.updateLabMapping(data),
  createLab: (data: { code: string; name: string }) => ExternalLabService.createLab(data),
  deleteLab: (id: string) => ExternalLabService.deleteLab(id),
  updateLab: (id: string, data: { name: string; code: string }) => ExternalLabService.updateLab(id, data),

  // External Lab Grades
  createLabGrade: (id: string, data: { qualityGrade: number; isPathologyCertified: boolean; isNuclearMedicineCertified: boolean; applyDate: string }) =>
    ExternalLabService.createLabGrade(id, data),
  updateLabGrade: (id: string, gradeId: string, data: { qualityGrade: number; isPathologyCertified: boolean; isNuclearMedicineCertified: boolean }) =>
    ExternalLabService.updateLabGrade(id, gradeId, data),
};
