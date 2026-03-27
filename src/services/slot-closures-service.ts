import { ApiClient } from "@/lib/api/api-client";
import { slotClosuresApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type { CreateSlotClosureRequest, UpdateSlotClosureRequest } from "@/types/appointments/slot-closures-types";

export class SlotClosuresService {
  static async getSlotClosures(queryString: string): Promise<any[]> {
    try {
      return await ApiClient.get<any[]>(slotClosuresApi.list(queryString));
    } catch (error: any) {
      throw new Error("예약 마감 목록 조회 실패", error.status);
    }
  }

  static async getSlotClosure(id: number): Promise<any> {
    const validatedId = validateId(id, "SlotClosure ID");
    try {
      return await ApiClient.get<any>(slotClosuresApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("예약 마감 조회 실패", error.status);
    }
  }

  static async createSlotClosure(data: CreateSlotClosureRequest): Promise<any> {
    try {
      return await ApiClient.post<any>(slotClosuresApi.create, data);
    } catch (error: any) {
      throw new Error("예약 마감 생성 실패", error.status);
    }
  }

  static async updateSlotClosure(id: number, data: UpdateSlotClosureRequest): Promise<any> {
    const validatedId = validateId(id, "SlotClosure ID");
    try {
      return await ApiClient.put<any>(
        slotClosuresApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("예약 마감 수정 실패", error.status);
    }
  }

  static async deleteSlotClosure(id: number): Promise<any> {
    const validatedId = validateId(id, "SlotClosure ID");
    try {
      return await ApiClient.delete<any>(slotClosuresApi.delete(validatedId));
    } catch (error: any) {
      throw new Error("예약 마감 삭제 실패", error.status);
    }
  }
}
