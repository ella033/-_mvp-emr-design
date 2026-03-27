import { ApiClient } from "@/lib/api/api-client";
import { patientFamiliesApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  CreatePatientFamilyRequest,
  CreatePatientFamilyResponse,
  DeletePatientFamilyResponse,
  PatientFamily,
  UpdatePatientFamilyRequest,
  UpdatePatientFamilyResponse,
  DeleteUpsertManyPatientFamiliesResponse,
  DeleteUpsertManyPatientFamiliesRequest,
} from "@/types/patient-family-types";

export class PatientFamiliesService {
  static async getPatientFamily(id: number): Promise<PatientFamily> {
    const validatedId = validateId(id, "patientFamilyId");
    try {
      return await ApiClient.get<PatientFamily>(
        patientFamiliesApi.detail(validatedId)
      );
    } catch (error: any) {
      throw new Error("환자 가족 조회 실패", error.status);
    }
  }
  static async getPatientFamiliesByPatient(
    patientId: number
  ): Promise<PatientFamily[]> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<PatientFamily[]>(
        patientFamiliesApi.listByPatient(validatedPatientId)
      );
    } catch (error: any) {
      throw new Error("환자 가족 조회 실패", error.status);
    }
  }
  static async createPatientFamily(
    data: CreatePatientFamilyRequest
  ): Promise<CreatePatientFamilyResponse> {
    try {
      return await ApiClient.post<CreatePatientFamilyResponse>(
        patientFamiliesApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("환자 가족 생성 실패", error.status);
    }
  }
  static async deleteUpsertManyPatientFamiliesByPatient(
    patientId: number,
    data: DeleteUpsertManyPatientFamiliesRequest
  ): Promise<DeleteUpsertManyPatientFamiliesResponse> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.post<DeleteUpsertManyPatientFamiliesResponse>(
        patientFamiliesApi.deleteUpsertManyByPatient(validatedPatientId),
        data
      );
    } catch (error: any) {
      throw new Error("환자 가족 삭제 및 업데이트 실패", error.status);
    }
  }
  static async updatePatientFamily(
    id: number,
    data: UpdatePatientFamilyRequest
  ): Promise<UpdatePatientFamilyResponse> {
    const validatedId = validateId(id, "patientFamilyId");
    try {
      return await ApiClient.put<UpdatePatientFamilyResponse>(
        patientFamiliesApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("환자 가족 수정 실패", error.status);
    }
  }
  static async deletePatientFamily(
    id: number
  ): Promise<DeletePatientFamilyResponse> {
    const validatedId = validateId(id, "patientFamilyId");
    try {
      return await ApiClient.delete<DeletePatientFamilyResponse>(
        patientFamiliesApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("환자 가족 삭제 실패", error.status);
    }
  }
}
