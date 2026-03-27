import { ApiClient } from "@/lib/api/api-client";
import { vitalSignSubItemsApi } from "@/lib/api/routes/vital-sign-sub-items.api";
import { validateId } from "@/lib/validation";
import type {
  CreateVitalSignSubItemRequest,
  UpdateVitalSignSubItemRequest,
  VitalSignSubItem,
} from "@/types/vital/vital-sign-sub-items-types";

export class VitalSignSubItemsService {
  static async getVitalSignSubItems(
    itemId: number
  ): Promise<VitalSignSubItem[]> {
    const validatedItemId = validateId(itemId, "vitalSignItemId");
    try {
      return await ApiClient.get<VitalSignSubItem[]>(
        vitalSignSubItemsApi.list(validatedItemId)
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 서브 항목 목록 조회 실패", error.status);
    }
  }
  static async createVitalSignSubItem(
    data: CreateVitalSignSubItemRequest
  ): Promise<VitalSignSubItem> {
    try {
      return await ApiClient.post<VitalSignSubItem>(
        vitalSignSubItemsApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 서브 항목 생성 실패", error.status);
    }
  }
  static async updateVitalSignSubItem(
    id: number,
    data: UpdateVitalSignSubItemRequest
  ): Promise<VitalSignSubItem> {
    const validatedId = validateId(id, "vitalSignSubItemId");
    try {
      return await ApiClient.put<VitalSignSubItem>(
        vitalSignSubItemsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 서브 항목 수정 실패", error.status);
    }
  }
  static async deleteVitalSignSubItem(id: number): Promise<VitalSignSubItem> {
    const validatedId = validateId(id, "vitalSignSubItemId");
    try {
      return await ApiClient.delete<VitalSignSubItem>(
        vitalSignSubItemsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 서브 항목 삭제 실패", error.status);
    }
  }
}
