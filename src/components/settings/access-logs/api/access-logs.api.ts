import { UserSessionsService } from "@/services/user-sessions-service";
import type { LoginHistoryEntry, OnlineUserSession } from "@/types/user-sessions";

export const accessLogsApi = {
  getLoginHistory: (params: { from: string; to: string; userId?: number }) =>
    UserSessionsService.getLoginHistory(params),
  getOnlineSessions: () => UserSessionsService.getOnlineSessions(),
  logoutSession: (sessionId: string) => UserSessionsService.logoutSession(sessionId),
};
