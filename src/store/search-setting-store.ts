import { create } from "zustand";
import { useSettingsStore } from "@/store/settings-store";
import { SettingsService } from "@/services/settings-service";

// 검색 모드 타입
export type SearchMode = "default" | "elasticsearch";

const SEARCH_SETTINGS = {
  scope: "user" as const,
  category: "search-setting",
  pageContext: "patient-diagnosis-prescription-header",
};

let saveSearchSettingsTimer: NodeJS.Timeout | null = null;

// 일반 설정 타입
interface SearchSettings {
  searchMode: SearchMode;
  showLibrary: boolean;
}

// 기본값
const defaultSettings: SearchSettings = {
  searchMode: "default",
  showLibrary: false,
};

// settings-store에서 설정 불러오기 (showLibrary는 불러오지 않음 - 한 번만 적용 옵션)
const loadSettingsFromStore = (): SearchSettings => {
  const state = useSettingsStore.getState();
  const savedSetting = state.getSettingsByCategoryAndPageContext(
    SEARCH_SETTINGS.category,
    SEARCH_SETTINGS.pageContext
  );
  const settings = savedSetting?.settings as
    | Partial<{ searchMode: string; showLibrary: boolean }>
    | undefined;
  const migratedSettings: Partial<SearchSettings> = settings
    ? {
        searchMode: settings.searchMode as SearchMode | undefined,
      }
    : {};
  return {
    ...defaultSettings,
    ...migratedSettings,
    showLibrary: false, // 항상 false로 초기화 (저장/불러오기 없음, 한 번만 적용)
  };
};

const saveSettings = (settings: SearchSettings) => {
  const state = useSettingsStore.getState();
  const existingSetting = state.getSettingsByCategoryAndPageContext(
    SEARCH_SETTINGS.category,
    SEARCH_SETTINGS.pageContext
  );
  const existingSettings = existingSetting?.settings as
    | Partial<SearchSettings>
    | undefined;
  const mergedExisting: SearchSettings = {
    ...defaultSettings,
    ...(existingSettings ?? {}),
  };

  const payload = {
    scope: SEARCH_SETTINGS.scope,
    category: SEARCH_SETTINGS.category,
    pageContext: SEARCH_SETTINGS.pageContext,
    settings,
  };

  // 기존 값과 동일하면 로컬/원격 저장 모두 스킵
  if (isSameSettings(mergedExisting, settings)) return;

  // 스토어는 즉시 반영
  state.updateSettingLocally(payload);

  // API 저장은 debounce 처리
  if (saveSearchSettingsTimer) {
    clearTimeout(saveSearchSettingsTimer);
  }

  saveSearchSettingsTimer = setTimeout(() => {
    SettingsService.createOrUpdateSetting(payload).catch((error) => {
      console.error("[SearchSettingStore] 설정 저장 실패:", error);
    });
    saveSearchSettingsTimer = null;
  }, 400);
};

// Store 타입
interface SearchSettingState extends SearchSettings {
  setSearchMode: (mode: SearchMode) => void;
  setShowLibrary: (show: boolean) => void;
  /** 처방 추가 시 MASTER 포함 옵션 해제 */
  resetShowLibrary: () => void;
  syncFromSettings: () => void;
  useElasticsearch: () => boolean;
}

const pickSearchSettings = (state: SearchSettingState): SearchSettings => ({
  searchMode: state.searchMode,
  showLibrary: state.showLibrary,
});

const isSameSettings = (a: SearchSettings, b: SearchSettings) =>
  a.searchMode === b.searchMode && a.showLibrary === b.showLibrary;

export const useSearchSettingStore = create<SearchSettingState>(
  (set, get) => {
    const initialSettings = loadSettingsFromStore();

    return {
      ...initialSettings,

      setSearchMode: (mode: SearchMode) => {
        if (get().searchMode === mode) return;
        set({ searchMode: mode });
        saveSettings({
          ...pickSearchSettings(get()),
          searchMode: mode,
          showLibrary: false, // 저장 시에는 항상 false (MASTER 포함은 저장하지 않음)
        });
      },

      setShowLibrary: (show: boolean) => {
        if (get().showLibrary === show) return;
        set({ showLibrary: show });
        // showLibrary는 저장하지 않음 (한 번만 적용 옵션)
      },

      /** 처방 추가 시 호출 - MASTER 포함 옵션 해제 */
      resetShowLibrary: () => {
        set({ showLibrary: false });
      },

      syncFromSettings: () => {
        const loadedSettings = loadSettingsFromStore();
        const currentSettings = pickSearchSettings(get());
        if (isSameSettings(currentSettings, loadedSettings)) return;
        set(loadedSettings);
      },

      useElasticsearch: () => get().searchMode === "elasticsearch",
    };
  }
);
