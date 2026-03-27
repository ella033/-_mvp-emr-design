import { ApiClient } from "@/lib/api/api-client";
import { patientChatsApi } from "@/lib/api/routes/patient-chats-api";
import type {
  PatientChatMessage,
  PatientChatListResponse,
} from "@/types/patient-chat-types";

export class PatientChatsService {
  static async getMessages(
    patientId: number,
    cursor?: number,
    limit: number = 50
  ): Promise<PatientChatListResponse> {
    const params = new URLSearchParams({
      patientId: String(patientId),
      limit: String(limit),
    });
    if (cursor) params.set("cursor", String(cursor));
    const response = await ApiClient.get<PatientChatListResponse | PatientChatMessage[]>(
      `${patientChatsApi.list}?${params.toString()}`
    );
    // 배열로 반환되는 경우 호환 처리
    if (Array.isArray(response)) {
      return {
        items: response,
        hasNextPage: response.length >= limit,
        nextCursor: response.length > 0 ? response[response.length - 1].id : null,
      };
    }
    return response;
  }

  static async getPinnedMessages(
    patientId: number
  ): Promise<PatientChatMessage[]> {
    const response = await ApiClient.get<PatientChatMessage[] | { items: PatientChatMessage[] }>(
      `${patientChatsApi.pinned}?patientId=${patientId}`
    );
    return Array.isArray(response) ? response : response.items ?? [];
  }

  static async createMessage(
    patientId: number,
    content: string
  ): Promise<PatientChatMessage> {
    return await ApiClient.post<PatientChatMessage>(patientChatsApi.create, {
      patientId,
      content,
    });
  }

  static async updateMessage(
    id: number,
    data: { content?: string; isPinned?: boolean }
  ): Promise<PatientChatMessage> {
    return await ApiClient.patch<PatientChatMessage>(
      patientChatsApi.update(id),
      data
    );
  }

  static async deleteMessage(id: number): Promise<void> {
    await ApiClient.delete(patientChatsApi.delete(id));
  }
}
