import { ApiClient } from "@/lib/api/api-client";
import type { DidQueuesResponse } from "@/types/did-types";

export class DidService {
  static async getQueues(roomName?: string): Promise<DidQueuesResponse> {
    try {
      const url = roomName ? `/did/queues?roomName=${roomName}` : "/did/queues";
      return await ApiClient.get<DidQueuesResponse>(url);
    } catch (error: any) {
      throw new Error(error.message || "DID 대기열 조회 실패");
    }
  }
}
