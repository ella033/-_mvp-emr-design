import { ApiClient } from "@/lib/api/api-client";
import { scheduledOrderApi } from "@/lib/api/scheduled-order-api";
import type {
  ScheduledOrder,
  CreateScheduledOrderRequest,
  CreateScheduledOrderResponse,
  UpdateScheduledOrderRequest,
  UpdateScheduledOrderResponse,
  DeleteScheduledOrderResponse,
  DeleteUpsertManyScheduledOrdersRequest,
} from "@/types/scheduled-order-types";
export class ScheduledOrderService {
  // 예약 처방 상세 조회
  static async getScheduledOrder(
    id: number,
    baseDate: string // yyyy-MM-dd 형태의 기준일
  ): Promise<ScheduledOrder> {
    try {
      return await ApiClient.get<ScheduledOrder>(
        scheduledOrderApi.detail(id, baseDate)
      );
    } catch (error: any) {
      throw new Error("예약 처방 상세 조회 실패", error.status);
    }
  }

  // 환자별 예약 처방 목록 조회
  static async getScheduledOrdersByPatient(
    patientId: number,
    baseDate: string // yyyy-MM-dd 형태의 기준일
  ): Promise<ScheduledOrder[]> {
    try {
      return await ApiClient.get<ScheduledOrder[]>(
        scheduledOrderApi.listByPatient(patientId, baseDate)
      );
    } catch (error: any) {
      throw new Error("환자별 예약 처방 목록 조회 실패", error.status);
    }
  }

  // 예약 처방 생성
  static async createScheduledOrder(
    data: CreateScheduledOrderRequest
  ): Promise<CreateScheduledOrderResponse> {
    try {
      return await ApiClient.post<CreateScheduledOrderResponse>(
        scheduledOrderApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("예약 처방 생성 실패", error.status);
    }
  }

  // 예약 처방 수정
  static async updateScheduledOrder(
    id: number,
    data: UpdateScheduledOrderRequest
  ): Promise<UpdateScheduledOrderResponse> {
    try {
      return await ApiClient.put<UpdateScheduledOrderResponse>(
        scheduledOrderApi.update(id),
        data
      );
    } catch (error: any) {
      throw new Error("예약 처방 수정 실패", error.status);
    }
  }

  // 예약 처방 삭제
  static async deleteScheduledOrder(
    id: number
  ): Promise<DeleteScheduledOrderResponse> {
    try {
      return await ApiClient.delete<DeleteScheduledOrderResponse>(
        scheduledOrderApi.delete(id)
      );
    } catch (error: any) {
      throw new Error("예약 처방 삭제 실패", error.status);
    }
  }

  // 환자별 예약 처방 일괄 삭제/추가/수정
  static async deleteUpsertMany(
    patientId: number,
    data: DeleteUpsertManyScheduledOrdersRequest
  ): Promise<ScheduledOrder[]> {
    try {
      return await ApiClient.post<ScheduledOrder[]>(
        scheduledOrderApi.deleteUpsertMany(patientId),
        data
      );
    } catch (error: any) {
      throw new Error("예약 처방 일괄 처리 실패", error.status);
    }
  }
}
