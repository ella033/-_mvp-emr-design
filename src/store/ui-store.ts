import { create } from "zustand";

export type SettingsModalView = "user";

interface UIState {
  isSettingsModalOpen: boolean;
  settingsModalView: SettingsModalView;
  settingsModalTab?: string;
  openSettingsModal: (view: SettingsModalView, tab?: string) => void;
  closeSettingsModal: () => void;
  // 레이아웃 초기화 관련
  layoutResetTrigger: number;
  triggerLayoutReset: () => void;
  // 상용구 설정 팝업 관련
  isTemplateCodePopupOpen: boolean;
  openTemplateCodePopup: () => void;
  closeTemplateCodePopup: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsModalOpen: false,
  settingsModalView: "user",
  settingsModalTab: undefined,
  openSettingsModal: (view, tab) =>
    set({
      isSettingsModalOpen: true,
      settingsModalView: view,
      settingsModalTab: tab,
    }),
  closeSettingsModal: () =>
    set({
      isSettingsModalOpen: false,
      settingsModalTab: undefined,
    }),
  // 레이아웃 초기화 관련
  layoutResetTrigger: 0,
  triggerLayoutReset: () =>
    set((state) => ({ layoutResetTrigger: state.layoutResetTrigger + 1 })),
  // 상용구 설정 팝업 관련
  isTemplateCodePopupOpen: false,
  openTemplateCodePopup: () => set({ isTemplateCodePopupOpen: true }),
  closeTemplateCodePopup: () => set({ isTemplateCodePopupOpen: false }),
}));
