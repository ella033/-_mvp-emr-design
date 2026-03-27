import { ApiClient } from "@/lib/api/api-client";
import { diseasesApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  CreateDiseaseRequest,
  CreateDiseaseResponse,
  DeleteDiseaseResponse,
  DeleteUpsertManyDiseasesRequest,
  Disease,
  UpdateDiseaseRequest,
  UpdateDiseaseResponse,
} from "@/types/chart/disease-types";

export class DiseasesService {
  static async getDisease(id: string): Promise<Disease> {
    const validatedId = validateId(id, "diseaseId");
    try {
      return await ApiClient.get<Disease>(diseasesApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("질병 조회 실패", error.status);
    }
  }
  static async getDiseasesByEncounter(encounterId: string): Promise<Disease[]> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    try {
      return await ApiClient.get<Disease[]>(
        diseasesApi.listByEncounter(validatedEncounterId)
      );
    } catch (error: any) {
      throw new Error("진료 기록별 질병 조회 실패", error.status);
    }
  }
  static async createDisease(
    data: CreateDiseaseRequest
  ): Promise<CreateDiseaseResponse> {
    try {
      return await ApiClient.post<CreateDiseaseResponse>(
        diseasesApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("질병 생성 실패", error.status);
    }
  }
  static async deleteUpsertManyDiseasesByEncounter(
    encounterId: string,
    data: DeleteUpsertManyDiseasesRequest
  ): Promise<Disease[]> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    try {
      return await ApiClient.post<Disease[]>(
        diseasesApi.deleteUpsertManyByEncounter(validatedEncounterId),
        data
      );
    } catch (error: any) {
      throw new Error("진료 기록별 질병 삭제 및 업데이트 실패", error.status);
    }
  }
  static async updateDisease(
    id: string,
    data: UpdateDiseaseRequest
  ): Promise<UpdateDiseaseResponse> {
    const validatedId = validateId(id, "diseaseId");
    try {
      return await ApiClient.put<UpdateDiseaseResponse>(
        diseasesApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("질병 수정 실패", error.status);
    }
  }
  static async deleteDisease(id: string): Promise<DeleteDiseaseResponse> {
    const validatedId = validateId(id, "diseaseId");
    try {
      return await ApiClient.delete<DeleteDiseaseResponse>(
        diseasesApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("질병 삭제 실패", error.status);
    }
  }
}
