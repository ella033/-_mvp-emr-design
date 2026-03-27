import { SettingsService } from "@/services/settings-service";
import { createMutationHook } from "@/hooks/common/use-query-factory";
import { useQuery } from "@tanstack/react-query";
import type {
  SettingsListParams,
  SettingsItem,
  LiveUpdateSettingsParams,
  DeleteSettingsParams,
} from "@/types/common/settings-types";

/**
 * 설정 목록 조회
 * @param params - scope, category, pageContext (모두 optional)
 */
export function useSettings(params?: SettingsListParams) {
  return useQuery({
    queryKey: ["settings", params?.scope, params?.category, params?.pageContext],
    queryFn: async () => {
      return await SettingsService.getSettings(params);
    },
  });
}

/**
 * 설정 생성/수정 뮤테이션
 */
export const useCreateOrUpdateSettings = createMutationHook(
  async (items: SettingsItem[]) => {
    return await SettingsService.createOrUpdateSettings(items);
  },
  {
    invalidateQueries: [["settings"]],
  }
);

/**
 * 단일 설정 생성/수정 뮤테이션 (편의 훅)
 */
export const useCreateOrUpdateSetting = createMutationHook(
  async (item: SettingsItem) => {
    return await SettingsService.createOrUpdateSetting(item);
  },
  {
    invalidateQueries: [["settings"]],
  }
);

/**
 * 설정 실시간 업데이트 뮤테이션
 */
export const useLiveUpdateSettings = createMutationHook(
  async ({
    params,
    data,
  }: {
    params: LiveUpdateSettingsParams;
    data: Record<string, any>;
  }) => {
    return await SettingsService.liveUpdateSettings(params, data);
  },
  {
    invalidateQueries: [["settings"]],
  }
);

/**
 * 설정 삭제 뮤테이션
 */
export const useDeleteSetting = createMutationHook(
  async (params: DeleteSettingsParams) => {
    return await SettingsService.deleteSetting(params);
  },
  {
    invalidateQueries: [["settings"]],
  }
);
