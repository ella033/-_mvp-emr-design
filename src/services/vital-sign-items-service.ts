import { ApiClient } from "@/lib/api/api-client";
import { vitalSignItemsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  UpsertManyVitalSignItemSettingsRequest,
  UpsertManyVitalSignItemSettingsResponse,
} from "@/types/vital/vital-sign-item-setting-types";
import type {
  CreateVitalSignItemRequest,
  CreateVitalSignItemResponse,
  DeleteVitalSignItemResponse,
  UpdateVitalSignItemRequest,
  UpdateVitalSignItemResponse,
  VitalSignItem,
} from "@/types/vital/vital-sign-items-types";

export class VitalSignItemsService {
  static async getVitalSignItems(isActive?: boolean): Promise<VitalSignItem[]> {
    try {
      return await ApiClient.get<VitalSignItem[]>(
        vitalSignItemsApi.list(isActive)
      );
    } catch (error: any) {
      throw new Error("병원별 바이탈 사인 항목 목록 조회 실패", error.status);
    }
  }
  static async createVitalSignItem(
    data: CreateVitalSignItemRequest
  ): Promise<CreateVitalSignItemResponse> {
    try {
      return await ApiClient.post<CreateVitalSignItemResponse>(
        vitalSignItemsApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 항목 생성 실패", error.status);
    }
  }
  static async deleteUpsertManyVitalSignItems(
    data: UpsertManyVitalSignItemSettingsRequest
  ): Promise<UpsertManyVitalSignItemSettingsResponse> {
    try {
      return await ApiClient.post<UpsertManyVitalSignItemSettingsResponse>(
        vitalSignItemsApi.deleteUpsertMany(),
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 항목 삭제 및 수정 실패", error.status);
    }
  }
  static async updateVitalSignItem(
    id: number,
    data: UpdateVitalSignItemRequest
  ): Promise<UpdateVitalSignItemResponse> {
    const validatedId = validateId(id, "vitalSignItemId");
    try {
      return await ApiClient.put<UpdateVitalSignItemResponse>(
        vitalSignItemsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 항목 수정 실패", error.status);
    }
  }
  static async deleteVitalSignItem(
    id: number
  ): Promise<DeleteVitalSignItemResponse> {
    const validatedId = validateId(id, "vitalSignItemId");
    try {
      return await ApiClient.delete<DeleteVitalSignItemResponse>(
        vitalSignItemsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 항목 삭제 실패", error.status);
    }
  }
}
