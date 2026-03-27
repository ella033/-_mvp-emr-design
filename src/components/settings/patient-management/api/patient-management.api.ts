import { ApiClient } from "@/lib/api/api-client";
import type {
  Benefit,
  CreateBenefitRequest,
  CreatePatientGroupRequest,
  PatientGroup,
  UpdateBenefitRequest,
  UpdatePatientGroupRequest,
} from "../model";

const BENEFITS_BASE_PATH = "/benefits";
const PATIENT_GROUPS_BASE_PATH = "/patient-groups";

export const patientManagementApi = {
  getBenefits: async (): Promise<Benefit[]> => {
    return ApiClient.get(BENEFITS_BASE_PATH);
  },

  createBenefit: async (payload: CreateBenefitRequest): Promise<Benefit> => {
    return ApiClient.post(BENEFITS_BASE_PATH, payload);
  },

  updateBenefit: async (
    id: number,
    payload: UpdateBenefitRequest
  ): Promise<Benefit> => {
    return ApiClient.put(`${BENEFITS_BASE_PATH}/${id}`, payload);
  },

  deleteBenefit: async (id: number): Promise<void> => {
    await ApiClient.delete(`${BENEFITS_BASE_PATH}/${id}`);
  },

  getPatientGroups: async (): Promise<PatientGroup[]> => {
    return ApiClient.get(PATIENT_GROUPS_BASE_PATH);
  },

  createPatientGroup: async (
    payload: CreatePatientGroupRequest
  ): Promise<PatientGroup> => {
    return ApiClient.post(PATIENT_GROUPS_BASE_PATH, payload);
  },

  updatePatientGroup: async (
    id: number,
    payload: UpdatePatientGroupRequest
  ): Promise<PatientGroup> => {
    return ApiClient.put(`${PATIENT_GROUPS_BASE_PATH}/${id}`, payload);
  },

  deletePatientGroup: async (id: number): Promise<void> => {
    await ApiClient.delete(`${PATIENT_GROUPS_BASE_PATH}/${id}`);
  },
};
