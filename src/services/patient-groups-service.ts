import { patientGroupsApi } from "@/lib/api/routes/patient-groups-api";
import { ApiClient } from "@/lib/api/api-client";
import type {
  CreatePatientGroupRequest,
  PatientGroup,
  UpdatePatientGroupRequest,
} from "@/types/patient-groups-types";
import type { Patient } from "@/types/patient-types";

export class PatientGroupsService {
  static async getPatientGroups(): Promise<PatientGroup[]> {
    try {
      const response = await ApiClient.get<PatientGroup[] | { data: PatientGroup[] }>(
        patientGroupsApi.list
      );
      const raw = response as any;
      if (Array.isArray(raw)) return raw;
      return raw?.data ?? [];
    } catch (error: any) {
      throw new Error("환자 그룹 목록 조회 실패", error.status);
    }
  }

  static async getPatientGroupById(id: string): Promise<PatientGroup> {
    try {
      const response = await ApiClient.get<PatientGroup | { data: PatientGroup }>(
        patientGroupsApi.detail(id)
      );
      const raw = response as any;
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw) {
        return raw.data;
      }
      return raw;
    } catch (error: any) {
      throw new Error("환자 그룹 상세 조회 실패", error.status);
    }
  }

  static async getPatientGroupDetailPatientsListById(id: string): Promise<Patient[]> {
    try {
      const response = await ApiClient.get<Patient[] | { data: Patient[] }>(
        patientGroupsApi.detailPatient(id)
      );
      const raw = response as any;
      if (Array.isArray(raw)) return raw;
      return raw?.data ?? [];
    } catch (error: any) {
      throw new Error("환자 그룹 환자 목록 조회 실패", error.status);
    }
  }

  static async createPatientGroup(
    data: CreatePatientGroupRequest
  ): Promise<PatientGroup> {
    try {
      const response = await ApiClient.post<PatientGroup | { data: PatientGroup }>(
        patientGroupsApi.create,
        data
      );
      const raw = response as any;
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw) {
        return raw.data;
      }
      return raw;
    } catch (error: any) {
      throw new Error("환자 그룹 생성 실패", error.status);
    }
  }

  static async updatePatientGroup(
    id: string,
    data: UpdatePatientGroupRequest
  ): Promise<PatientGroup> {
    try {
      const response = await ApiClient.put<PatientGroup | { data: PatientGroup }>(
        patientGroupsApi.update(id),
        data
      );
      const raw = response as any;
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "data" in raw) {
        return raw.data;
      }
      return raw;
    } catch (error: any) {
      throw new Error("환자 그룹 수정 실패", error.status);
    }
  }

  static async deletePatientGroup(id: string): Promise<void> {
    try {
      await ApiClient.delete(patientGroupsApi.delete(id));
    } catch (error: any) {
      throw new Error("환자 그룹 삭제 실패", error.status);
    }
  }
}
