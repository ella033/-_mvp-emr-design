import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ReceptionInitialTab } from "@/constants/common/common-enum";
import { normalizeRegistrationId } from "@/lib/registration-utils";
import {
  createInitialReceptionViewState,
  type ReceptionViewState,
  type TabStateByTab,
} from "@/types/common/reception-view-types";

export type ReceptionId = string;

export interface ReceptionTabState {
  view: ReceptionViewState;
  isDirty: boolean;
}

export interface ReceptionViewTabsState {
  activeReceptionId: ReceptionId | null;
  tabs: Record<ReceptionId, ReceptionTabState>;

  setActiveReceptionId: (receptionId: ReceptionId | null) => void;
  ensureTabState: (
    receptionId: ReceptionId,
    initialTab?: ReceptionInitialTab
  ) => void;

  getTabState: (receptionId: ReceptionId) => ReceptionTabState;
  setTabState: (receptionId: ReceptionId, state: ReceptionTabState) => void;
  updateTabState: (
    receptionId: ReceptionId,
    updates: Partial<ReceptionTabState>
  ) => void;

  updateView: (
    receptionId: ReceptionId,
    updater: (view: ReceptionViewState) => ReceptionViewState
  ) => void;
  updateViewTabState: <T extends ReceptionInitialTab>(
    receptionId: ReceptionId,
    tab: T,
    updates: Partial<TabStateByTab[T]>
  ) => void;

  markDirty: (receptionId: ReceptionId) => void;
  clearDirty: (receptionId: ReceptionId) => void;
  clearTabState: (receptionId: ReceptionId) => void;
  resetTabState: (
    receptionId: ReceptionId,
    initialTab?: ReceptionInitialTab
  ) => void;
}

const createInitialTabState = (
  initialTab: ReceptionInitialTab = ReceptionInitialTab.환자정보
): ReceptionTabState => ({
  view: createInitialReceptionViewState(initialTab),
  isDirty: false,
});

const tabKeyMap: Record<ReceptionInitialTab, keyof ReceptionViewState> = {
  [ReceptionInitialTab.환자정보]: "patientInfo",
  [ReceptionInitialTab.처방조회]: "patientChart",
  [ReceptionInitialTab.보험이력변경]: "insuranceHistory",
  [ReceptionInitialTab.수납정보]: "paymentInfo",
  [ReceptionInitialTab.미수환불]: "notPaid",
  [ReceptionInitialTab.예약현황]: "appointmentHistory",
  [ReceptionInitialTab.출력센터]: "printCenter",
};

export const useReceptionViewTabsStore = create<ReceptionViewTabsState>()(
  devtools(
    (set, get) => ({
      activeReceptionId: null,
      tabs: {},

      setActiveReceptionId: (receptionId: ReceptionId | null) => {
        set({ activeReceptionId: receptionId });
        if (receptionId) {
          get().ensureTabState(receptionId);
        }
      },

      ensureTabState: (
        receptionId: ReceptionId,
        initialTab: ReceptionInitialTab = ReceptionInitialTab.환자정보
      ) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const { tabs } = get();
        if (!tabs[normalizedId]) {
          set({
            tabs: {
              ...tabs,
              [normalizedId]: createInitialTabState(initialTab),
            },
          });
        }
      },

      getTabState: (receptionId: ReceptionId) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const { tabs } = get();
        return tabs[normalizedId] || createInitialTabState();
      },

      setTabState: (receptionId: ReceptionId, state: ReceptionTabState) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const { tabs } = get();
        set({
          tabs: {
            ...tabs,
            [normalizedId]: state,
          },
        });
      },

      updateTabState: (
        receptionId: ReceptionId,
        updates: Partial<ReceptionTabState>
      ) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const currentState = get().getTabState(normalizedId);
        get().setTabState(normalizedId, {
          ...currentState,
          ...updates,
        });
      },

      updateView: (
        receptionId: ReceptionId,
        updater: (view: ReceptionViewState) => ReceptionViewState
      ) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const currentState = get().getTabState(normalizedId);
        const nextView = updater(currentState.view);
        get().setTabState(normalizedId, {
          ...currentState,
          view: nextView,
        });
      },

      updateViewTabState: <T extends ReceptionInitialTab>(
        receptionId: ReceptionId,
        tab: T,
        updates: Partial<TabStateByTab[T]>
      ) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const tabKey = tabKeyMap[tab];
        get().updateView(normalizedId, (view) => ({
          ...view,
          [tabKey]: {
            ...(view[tabKey] as TabStateByTab[T]),
            ...updates,
          },
        }));
      },

      markDirty: (receptionId: ReceptionId) => {
        get().updateTabState(receptionId, { isDirty: true });
      },

      clearDirty: (receptionId: ReceptionId) => {
        get().updateTabState(receptionId, { isDirty: false });
      },

      clearTabState: (receptionId: ReceptionId) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        const { tabs } = get();
        const nextTabs = { ...tabs };
        delete nextTabs[normalizedId];
        set({ tabs: nextTabs });
      },

      resetTabState: (
        receptionId: ReceptionId,
        initialTab: ReceptionInitialTab = ReceptionInitialTab.환자정보
      ) => {
        const normalizedId = normalizeRegistrationId(receptionId);
        get().setTabState(normalizedId, createInitialTabState(initialTab));
      },
    }),
    {
      name: "reception-view-tabs-store",
    }
  )
);

