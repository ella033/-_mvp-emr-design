export const userSessionsApi = {
  loginHistory: "/user-sessions/login-history",
  online: "/user-sessions/online",
  logout: (sessionId: string) => `/user-sessions/logout/${sessionId}`,
};
