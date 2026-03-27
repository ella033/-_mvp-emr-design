import { ApiClient } from "@/lib/api/api-client";
import { ordersApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  DeleteOrderResponse,
  Order,
  UpdateOrderRequest,
  UpdateOrderResponse,
  UpsertManyOrdersRequest,
} from "@/types/chart/order-types";

export class OrdersService {
  static async getOrder(id: string): Promise<Order> {
    const validatedId = validateId(id, "orderId");
    try {
      return await ApiClient.get<Order>(ordersApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("오더 조회 실패", error.status);
    }
  }
  static async getOrdersByEncounter(encounterId: string): Promise<Order[]> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    try {
      return await ApiClient.get<Order[]>(
        ordersApi.listByEncounter(validatedEncounterId)
      );
    } catch (error: any) {
      throw new Error("오더 조회 실패", error.status);
    }
  }
  static async createOrder(
    data: CreateOrderRequest
  ): Promise<CreateOrderResponse> {
    try {
      return await ApiClient.post<CreateOrderResponse>(ordersApi.create, data);
    } catch (error: any) {
      throw new Error("오더 생성 실패", error.status);
    }
  }
  static async deleteUpsertManyOrdersByEncounter(
    encounterId: string,
    data: UpsertManyOrdersRequest
  ): Promise<Order[]> {
    const validatedEncounterId = validateId(encounterId, "encounterId");
    try {
      return await ApiClient.post<Order[]>(
        ordersApi.deleteUpsertManyByEncounter(validatedEncounterId),
        data
      );
    } catch (error: any) {
      throw new Error("오더 삭제 및 업데이트 실패", error.status);
    }
  }
  static async updateOrder(
    id: string,
    data: UpdateOrderRequest
  ): Promise<UpdateOrderResponse> {
    const validatedId = validateId(id, "orderId");
    try {
      return await ApiClient.put<UpdateOrderResponse>(
        ordersApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("오더 수정 실패", error.status);
    }
  }
  static async deleteOrder(id: string): Promise<DeleteOrderResponse> {
    const validatedId = validateId(id, "orderId");
    try {
      return await ApiClient.delete<DeleteOrderResponse>(
        ordersApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("오더 삭제 실패", error.status);
    }
  }
}
