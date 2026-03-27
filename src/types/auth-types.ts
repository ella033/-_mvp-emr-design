import type { UserType } from "@/constants/common/common-enum";
import { User } from "./user-types";

export interface AuthUser extends User {
  passwordChangedAt?: string | null;
}

// ================================ 프로필 정보 ================================
export interface AuthProfileResponse {
  sub: number;
  loginId: string;
  type: number;
  hospitalId: number;
  iat: number;
  exp: number;
}

// ================================ 로그인 ================================
export interface AuthLoginCredentialsRequest {
  loginId: string;
  password: string;
}

export interface AuthLoginRequest {
  loginId: string;
  password: string;
  hospitalId: number;
  clientType?: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ================================ 소속 병원 정보 ============================

export interface AuthGetHospitalsRequest extends AuthLoginCredentialsRequest {
  invitationId?: string;
}

export interface AuthUserHospital {
  hospitalId: number;
  hospitalName: string;
  isActive: boolean;
}

// ================================ 로그아웃 ================================
export interface AuthLogoutResponse {
  message: string;
}

// ================================ 토큰 갱신 ================================
export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserType {
  id: number;
  hospitalId: number;
  loginId: string;
  type: UserType;
  name: string;
  email: string;
  mobile: string;
  createId: number;
  createDateTime: string;
  updateId: number;
  updateDateTime: string;
  isActive: boolean;
  hospitals: AuthUserHospital[];
}

// ================================ 계정 잠금 해제 & 비밀번호 재설정 ================================
export interface RequestUnlockTokenRequest {
  loginId: string;
}

export interface VerifyUnlockTokenRequest {
  loginId: string;
  token: string;
}

export interface VerifyUnlockTokenResponse {
  isValid: boolean;
  code?: 'SUCCESS' | 'MISMATCH' | 'EXPIRED' | 'NOT_FOUND';
}

export interface ResetPasswordWithTokenRequest extends VerifyUnlockTokenRequest {
  newPassword: string;
}

export interface ResetPasswordWithTokenResponse {
  message: string;
}
