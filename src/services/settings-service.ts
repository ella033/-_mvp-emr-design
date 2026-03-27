import { ApiClient } from "@/lib/api/api-client";
import { settingsApi } from "@/lib/api/api-routes";
import type {
  SettingsTypes,
  SettingsListParams,
  CreateOrUpdateSettingsRequest,
  LiveUpdateSettingsParams,
  DeleteSettingsParams,
  SettingsItem,
} from "@/types/common/settings-types";

// Query string 빌드 유틸
function buildQueryString(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== ""
  );
  return entries.map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join("&");
}

export class SettingsService {
  /**
   * 설정 목록 조회
   * @param params - scope, category, pageContext (모두 optional)
   */
  static async getSettings(params?: SettingsListParams): Promise<SettingsTypes[]> {
    try {
      const queryString = buildQueryString({
        scope: params?.scope,
        category: params?.category,
        pageContext: params?.pageContext,
      });
      return await ApiClient.get<SettingsTypes[]>(settingsApi.list(queryString));
    } catch (error: any) {
      throw new Error("설정 목록 조회 실패", error.status);
    }
  }

  /**
   * 설정 생성 또는 수정 (PUT)
   * @param items - 생성/수정할 설정 항목들
   */
  static async createOrUpdateSettings(
    items: SettingsItem[]
  ): Promise<SettingsTypes[]> {
    try {
      const body: CreateOrUpdateSettingsRequest = { items };
      return await ApiClient.put<SettingsTypes[]>(settingsApi.createOrUpdate(), body);
    } catch (error: any) {
      throw new Error("설정 생성/수정 실패", error.status);
    }
  }

  /**
   * 단일 설정 생성 또는 수정 (편의 메서드)
   */
  static async createOrUpdateSetting(item: SettingsItem): Promise<SettingsTypes | null> {
    const result = await this.createOrUpdateSettings([item]);
    return result[0] ?? null;
  }

  /**
   * 실시간 설정 업데이트
   * @param params - scope (optional), category (필수), pageContext (optional)
   * @param data - 자유로운 JSON 형태의 설정 데이터
   */
  static async liveUpdateSettings(
    params: LiveUpdateSettingsParams,
    data: Record<string, any>
  ): Promise<SettingsTypes> {
    try {
      const queryString = buildQueryString({
        scope: params.scope,
        category: params.category,
        pageContext: params.pageContext,
      });
      return await ApiClient.patch<SettingsTypes>(settingsApi.liveUpdate() + `?${queryString}`, data);
    } catch (error: any) {
      throw new Error("설정 실시간 업데이트 실패", error.status);
    }
  }

  /**
   * 설정 삭제
   * @param params - scope (optional), category (필수), pageContext (optional), key (필수)
   */
  static async deleteSetting(params: DeleteSettingsParams): Promise<void> {
    try {
      const queryString = buildQueryString({
        scope: params.scope,
        category: params.category,
        pageContext: params.pageContext,
        key: params.key,
      });
      await ApiClient.delete<void>(settingsApi.delete(queryString));
    } catch (error: any) {
      throw new Error("설정 삭제 실패", error.status);
    }
  }
}

