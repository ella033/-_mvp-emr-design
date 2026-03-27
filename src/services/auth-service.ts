import { ApiClient } from "@/lib/api/api-client";
import { authApi } from "@/lib/api/api-routes";
import { TokenStorage } from "@/lib/token-storage";
import type {
  AuthGetHospitalsRequest,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthLogoutResponse,
  AuthProfileResponse,
  AuthRefreshResponse,
  AuthUserHospital,
  RequestUnlockTokenRequest,
  ResetPasswordWithTokenRequest,
  ResetPasswordWithTokenResponse,
  VerifyUnlockTokenRequest,
  VerifyUnlockTokenResponse,
} from "@/types/auth-types";

export class AuthService {
  static async getProfile(): Promise<AuthProfileResponse> {
    try {
      return await ApiClient.get<AuthProfileResponse>(authApi.profile);
    } catch (error: any) {
      throw new Error("프로필 조회에 실패했습니다.", error.status);
    }
  }
  static async getHospitals(
    credentials: AuthGetHospitalsRequest
  ): Promise<AuthUserHospital[]> {
    try {
      return await ApiClient.post<AuthUserHospital[]>(
        authApi.hospitals,
        credentials,
        { autoRefreshToken: false }
      );
    } catch (error: any) {
      throw new Error(error.message, error.status);
    }
  }
  static async login(
    credentials: AuthLoginRequest
  ): Promise<AuthLoginResponse> {
    try {
      const response = await ApiClient.post<AuthLoginResponse>(
        authApi.login,
        credentials,
        { autoRefreshToken: false }
      );

      // accessToken을 저장 (소켓 연결용)
      if (response.accessToken) {
        TokenStorage.setAccessToken(response.accessToken);
        console.log("[AuthService] accessToken 저장 완료");
      }

      return response;
    } catch (error: any) {
      throw error;
    }
  }
  static async logout(): Promise<AuthLogoutResponse> {
    try {
      const response = await ApiClient.post<AuthLogoutResponse>(
        authApi.logout,
        undefined,
        { autoRefreshToken: false }
      );

      // 로그아웃 시 저장된 토큰 제거
      TokenStorage.clearAccessToken();
      console.log("[AuthService] accessToken 제거 완료");

      return response;
    } catch (error: any) {
      // 에러가 발생해도 토큰은 제거
      TokenStorage.clearAccessToken();
      throw new Error("로그아웃에 실패했습니다.", error.status);
    }
  }
  static async refreshToken(): Promise<AuthRefreshResponse> {
    try {
      // 리프레시 토큰은 httpOnly 쿠키로 전달되므로 TokenStorage(accessToken) 없이도 갱신 가능
      const response = await ApiClient.post<AuthRefreshResponse>(
        authApi.refresh,
        {
          refreshToken: "string",
        }
      );

      // 갱신된 accessToken 저장
      if (response.accessToken) {
        TokenStorage.setAccessToken(response.accessToken);
        console.log("[AuthService] accessToken 갱신 완료");
      }

      return response;
    } catch (error: any) {
      throw new Error("토큰 갱신 실패", error.status);
    }
  }
  static async sessionPing(): Promise<{ refreshed?: boolean; accessToken?: string } | null> {
    try {
      const result = await ApiClient.get<{ refreshed?: boolean; accessToken?: string } | void>(
        authApi.sessionPing, undefined, { timeout: 5000 }
      );
      return result as { refreshed?: boolean; accessToken?: string } | null;
    } catch (error: any) {
      throw new Error("토큰 검증 실패", error.status);
    }
  }

  static async requestUnlockToken(
    credentials: RequestUnlockTokenRequest
  ): Promise<{ message: string }> {
    try {
      return await ApiClient.post<{ message: string }>(
        authApi.requestUnlockToken,
        credentials,
        { autoRefreshToken: false }
      );
    } catch (error: any) {
      throw new Error(error.message || "인증 코드 발송 실패", error.status);
    }
  }

  static async requestPasswordResetToken(
    credentials: RequestUnlockTokenRequest
  ): Promise<{ message: string }> {
    try {
      return await ApiClient.post<{ message: string }>(
        authApi.requestPasswordResetToken,
        credentials,
        { autoRefreshToken: false }
      );
    } catch (error: any) {
      throw new Error(error.message || "인증 코드 발송 실패", error.status);
    }
  }

  static async verifyUnlockToken(
    credentials: VerifyUnlockTokenRequest
  ): Promise<VerifyUnlockTokenResponse> {
    try {
      return await ApiClient.post<VerifyUnlockTokenResponse>(
        authApi.verifyUnlockToken,
        credentials,
        { autoRefreshToken: false }
      );
    } catch (error: any) {
      throw new Error(error.message || "인증 코드 검증 실패", error.status);
    }
  }

  static async resetPasswordWithToken(
    credentials: ResetPasswordWithTokenRequest
  ): Promise<ResetPasswordWithTokenResponse> {
    try {
      return await ApiClient.post<ResetPasswordWithTokenResponse>(
        authApi.resetPasswordWithToken,
        credentials,
        { autoRefreshToken: false }
      );
    } catch (error: any) {
      throw new Error(error.message || "비밀번호 재설정 실패", error.status);
    }
  }
}
