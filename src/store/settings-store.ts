import { create } from "zustand";
import { syncWithBroadcast } from "@/lib/broadcast-sync";
import type { SettingsTypes, SettingsScope, SettingsItem } from "@/types/common/settings-types";

interface SettingsState {
  // 전체 설정 목록
  settings: SettingsTypes[];
  isLoaded: boolean;

  // Actions
  setSettings: (settings: SettingsTypes[]) => void;
  setIsLoaded: (isLoaded: boolean) => void;

  // 특정 설정 조회 헬퍼
  getSettingsByCategory: (category: string) => SettingsTypes | undefined;
  getSettingsByCategoryAndScope: (
    category: string,
    scope: SettingsScope
  ) => SettingsTypes | undefined;
  getSettingsByCategoryAndPageContext: (
    category: string,
    pageContext: string
  ) => SettingsTypes | undefined;
  getSettingValue: <T = any>(
    category: string,
    key: string,
    defaultValue?: T
  ) => T | undefined;

  // 설정 업데이트 (로컬) - API 호출 전 로컬 상태 즉시 반영용
  updateSettingLocally: (setting: SettingsItem) => void;
  removeSettingLocally: (category: string, key?: string) => void;

  // 초기화
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>(
  syncWithBroadcast("settings-store", (set, get) => ({
  settings: [],
  isLoaded: false,

  setSettings: (settings) => set({ settings }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  getSettingsByCategory: (category) => {
    return get().settings.find((s) => s.category === category);
  },

  getSettingsByCategoryAndScope: (category, scope) => {
    return get().settings.find(
      (s) => s.category === category && s.scope === scope
    );
  },

  getSettingsByCategoryAndPageContext: (category, pageContext) => {
    return get().settings.find(
      (s) => s.category === category && s.pageContext === pageContext
    );
  },

  getSettingValue: <T = any>(
    category: string,
    key: string,
    defaultValue?: T
  ): T | undefined => {
    const setting = get().settings.find((s) => s.category === category);
    if (setting?.settings && typeof setting.settings === "object") {
      return (setting.settings as Record<string, any>)[key] ?? defaultValue;
    }
    return defaultValue;
  },

  updateSettingLocally: (setting) => {
    set((state) => {
      const existingIndex = state.settings.findIndex(
        (s) =>
          s.category === setting.category &&
          s.scope === setting.scope &&
          s.pageContext === setting.pageContext
      );

      if (existingIndex >= 0) {
        // 기존 설정의 id, userId, hospitalId는 유지하고 settings만 업데이트
        const updatedSettings = [...state.settings];
        const existingSetting = updatedSettings[existingIndex]!;
        updatedSettings[existingIndex] = {
          ...existingSetting,
          settings: setting.settings,
        };
        return { settings: updatedSettings };
      } else {
        // 새 설정 추가 시 임시 값 사용 (서버 응답 후 덮어쓰기됨)
        const newSetting: SettingsTypes = {
          id: 0,
          scope: setting.scope ?? "user",
          category: setting.category,
          userId: 0,
          hospitalId: 0,
          pageContext: setting.pageContext ?? "",
          settings: setting.settings,
        };
        return { settings: [...state.settings, newSetting] };
      }
    });
  },

  removeSettingLocally: (category, key) => {
    set((state) => {
      if (key) {
        // 특정 키만 제거
        return {
          settings: state.settings.map((s) => {
            if (s.category === category && s.settings) {
              const newSettings = { ...s.settings } as Record<string, any>;
              delete newSettings[key];
              return { ...s, settings: newSettings };
            }
            return s;
          }),
        };
      } else {
        // 카테고리 전체 제거
        return {
          settings: state.settings.filter((s) => s.category !== category),
        };
      }
    });
  },

  reset: () => set({ settings: [], isLoaded: false }),
}), {
  pick: ["settings", "isLoaded"],
}));

