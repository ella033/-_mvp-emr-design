import { ApiClient } from "@/lib/api/api-client";

export interface MyAccountProfileFileInfo {
  id: number;
  uuid: string;
}

export interface MyAccountProfile {
  name: string;
  nameEn: string | null;
  email: string;
  mobile: string | null;
  type: number;
  typeName: string;
  zipcode: string | null;
  address1: string | null;
  address2: string | null;
  licenseNo: string | number | null; // Handle both possibilities from user description
  birthDate: string | number | null;
  specialty: number;
  specialtyName: string;
  specialtyCertNo: string | null;
  roleId: number | null;
  roleName: string | null;
  hireDate: string | null;
  resignationDate: string | null;
  status: number;
  statusName: string;
  isOwner: boolean;
  profileFileInfo: MyAccountProfileFileInfo | null;
  sealFileInfo: MyAccountProfileFileInfo | null;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserSession {
  loginAt: string;
  userName: string;
  ipAddress: string;
  deviceInfo: {
    device: string;
    browser: string;
    platform: string;
  };
  sessionId: string;
  isCurrentSession: boolean;
}

export interface UpdateMyAccountProfileRequest {
  name: string;
  nameEn?: string | null;
  mobile?: string | null;
  birthDate?: string | null;
  zipcode?: string | null;
  address1?: string | null;
  address2?: string | null;
  type?: number;
  licenseNo?: string | null;
  specialty?: number;
  specialtyCertNo?: string | null;
}

export class MyAccountService {
  static async getProfile(): Promise<MyAccountProfile> {
    return ApiClient.get<MyAccountProfile>("/my-account/profile");
  }

  static async updateProfile(data: UpdateMyAccountProfileRequest): Promise<void> {
    return ApiClient.patch<void>("/my-account/profile", data);
  }

  static async updatePassword(data: UpdatePasswordRequest): Promise<void> {
    return ApiClient.patch<void>("/my-account/password", data);
  }

  static async uploadProfileImage(file: File): Promise<MyAccountProfileFileInfo> {
    const formData = new FormData();
    formData.append("file", file);
    return ApiClient.post<MyAccountProfileFileInfo>("/my-account/profile-image", formData);
  }

  static async deleteProfileImage(): Promise<void> {
    return ApiClient.delete<void>("/my-account/profile-image");
  }

  static async uploadSealImage(file: File): Promise<MyAccountProfileFileInfo> {
    const formData = new FormData();
    formData.append("file", file);
    return ApiClient.post<MyAccountProfileFileInfo>("/my-account/seal-image", formData);
  }

  static async deleteSealImage(): Promise<void> {
    return ApiClient.delete<void>("/my-account/seal-image");
  }

  static async getOnlineSessions(): Promise<UserSession[]> {
    return ApiClient.get<UserSession[]>("/my-sessions/online");
  }

  static async logoutSession(sessionId?: string): Promise<void> {
    return ApiClient.delete<void>("/my-sessions/logout", { params: { sessionId } });
  }
}
