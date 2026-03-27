import { ApiClient } from "@/lib/api/api-client";
import { hospitalChatsApi } from "@/lib/api/routes/hospital-chats-api";
import type {
  HospitalChatRoom,
  HospitalChatMessage,
  HospitalChatMessageListResponse,
  MentionPatientResult,
  PatientMention,
} from "@/types/hospital-chat-types";

export class HospitalChatsService {
  // ── 채팅방 ──

  static async getRooms(): Promise<HospitalChatRoom[]> {
    return await ApiClient.get<HospitalChatRoom[]>(hospitalChatsApi.rooms);
  }

  static async getRoom(roomId: number) {
    return await ApiClient.get(hospitalChatsApi.room(roomId));
  }

  static async createRoom(
    name: string,
    memberUserIds: number[],
    description?: string
  ) {
    return await ApiClient.post(hospitalChatsApi.createRoom, {
      name,
      memberUserIds,
      description,
    });
  }

  static async updateRoom(
    roomId: number,
    data: { name?: string; description?: string }
  ) {
    return await ApiClient.patch(hospitalChatsApi.updateRoom(roomId), data);
  }

  static async deleteRoom(roomId: number) {
    return await ApiClient.delete(hospitalChatsApi.deleteRoom(roomId));
  }

  // ── 멤버 ──

  static async addMembers(roomId: number, userIds: number[]) {
    return await ApiClient.post(hospitalChatsApi.addMembers(roomId), {
      userIds,
    });
  }

  static async removeMember(roomId: number, userId: number) {
    return await ApiClient.delete(
      hospitalChatsApi.removeMember(roomId, userId)
    );
  }

  // ── 메시지 ──

  static async getMessages(
    roomId: number,
    cursor?: number,
    limit: number = 50
  ): Promise<HospitalChatMessageListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", String(cursor));
    const response = await ApiClient.get<
      HospitalChatMessageListResponse | HospitalChatMessage[]
    >(`${hospitalChatsApi.messages(roomId)}?${params.toString()}`);
    if (Array.isArray(response)) {
      return {
        items: response,
        hasNextPage: response.length >= limit,
        nextCursor:
          response.length > 0 ? response[response.length - 1].id : null,
      };
    }
    return response;
  }

  static async createMessage(
    roomId: number,
    content: string,
    mentions?: PatientMention[]
  ): Promise<HospitalChatMessage> {
    return await ApiClient.post<HospitalChatMessage>(
      hospitalChatsApi.createMessage(roomId),
      { content, mentions }
    );
  }

  static async updateMessage(
    roomId: number,
    msgId: number,
    content: string
  ): Promise<HospitalChatMessage> {
    return await ApiClient.patch<HospitalChatMessage>(
      hospitalChatsApi.updateMessage(roomId, msgId),
      { content }
    );
  }

  static async deleteMessage(roomId: number, msgId: number): Promise<void> {
    await ApiClient.delete(hospitalChatsApi.deleteMessage(roomId, msgId));
  }

  static async getPinnedMessages(
    roomId: number
  ): Promise<HospitalChatMessage[]> {
    return await ApiClient.get<HospitalChatMessage[]>(
      hospitalChatsApi.pinnedMessages(roomId)
    );
  }

  static async togglePin(
    roomId: number,
    msgId: number,
    isPinned: boolean
  ): Promise<HospitalChatMessage> {
    return await ApiClient.patch<HospitalChatMessage>(
      hospitalChatsApi.togglePin(roomId, msgId),
      { isPinned }
    );
  }

  static async markAsRead(roomId: number) {
    return await ApiClient.patch(hospitalChatsApi.markAsRead(roomId));
  }

  // ── @멘션 ──

  static async searchMentionPatients(
    q: string
  ): Promise<MentionPatientResult[]> {
    return await ApiClient.get<MentionPatientResult[]>(
      `${hospitalChatsApi.mentionPatients}?q=${encodeURIComponent(q)}`
    );
  }
}
