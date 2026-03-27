export type SessionDeviceInfo = {
  device?: string | null;
  browser?: string | null;
  platform?: string | null;
};

export type LoginHistoryEntry = {
  createdAt: string;
  userName: string | null;
  ipAddress: string;
  deviceInfo?: SessionDeviceInfo | null;
};

export type OnlineUserSession = {
  loginAt: string;
  userName: string | null;
  ipAddress: string;
  deviceInfo?: SessionDeviceInfo | null;
  sessionId: string;
  isCurrentSession: boolean;
};
