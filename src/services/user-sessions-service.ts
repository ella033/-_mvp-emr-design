import { ApiClient } from "@/lib/api/api-client";
import { userSessionsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  LoginHistoryEntry,
  OnlineUserSession,
} from "@/types/user-sessions";

type LoginHistoryParams = {
  from: string;
  to: string;
  userId?: number | string;
};

export class UserSessionsService {
  static async getLoginHistory(
    params: LoginHistoryParams
  ): Promise<LoginHistoryEntry[]> {
    const { from, to, userId } = params;

    const query: Record<string, string> = {
      from,
      to,
    };

    if (userId !== undefined && userId !== null && `${userId}`.trim() !== "") {
      query.userId = validateId(userId, "User ID");
    }

    try {
      return await ApiClient.get<LoginHistoryEntry[]>(
        userSessionsApi.loginHistory,
        query
      );
    } catch (_) {
      throw new Error("Failed to load login history");
    }
  }

  static async getOnlineSessions(): Promise<OnlineUserSession[]> {
    try {
      return await ApiClient.get<OnlineUserSession[]>(
        userSessionsApi.online
      );
    } catch (_) {
      throw new Error("Failed to load online sessions");
    }
  }

  static async logoutSession(sessionId: string | number): Promise<void> {
    const validatedSessionId = validateId(sessionId, "Session ID");
    try {
      await ApiClient.delete(userSessionsApi.logout(validatedSessionId));
    } catch (_) {
      throw new Error("Failed to logout session");
    }
  }
}
