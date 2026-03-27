export type IpWhitelistEntry = {
  id: number;
  ipAddress: string;
  memo?: string | null;
  createDateTime: string;
};

export type ExemptUser = {
  userId: number;
  userName: string;
  typeName: string;
  roleName: string;
  createDateTime: string;
  userStatus: number;
};

export type CreateWhitelistPayload = {
  ipAddress: string;
  memo?: string;
};

export type UpdateExemptUsersPayload = {
  userIds: number[];
};
