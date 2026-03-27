import { useCallback, useEffect, useMemo } from "react";
import { useReceptionViewTabsStore } from "@/store/common/reception-view-tabs-store";
import {
  createInitialReceptionViewState,
  type ReceptionViewState,
  type TabStateByTab,
} from "@/types/common/reception-view-types";
import { normalizeRegistrationId, REGISTRATION_ID_NEW } from "@/lib/registration-utils";
import { ReceptionInitialTab } from "@/constants/common/common-enum";

type UseReceptionViewStateOptionsBase = {
  receptionId?: string | null;
};

type UseReceptionViewStateOptionsWithTab<T extends ReceptionInitialTab> =
  UseReceptionViewStateOptionsBase & { tab: T };

type UseReceptionViewStateOptionsWithoutTab =
  UseReceptionViewStateOptionsBase & { tab?: undefined };

export function useReceptionViewState<T extends ReceptionInitialTab>(
  options: UseReceptionViewStateOptionsWithTab<T>
): {
  receptionId: string;
  viewState: ReceptionViewState;
  tabState: TabStateByTab[T];
  setViewState: (state: ReceptionViewState) => void;
  updateViewState: (updates: Partial<ReceptionViewState>) => void;
  updateTabState: (updates: Partial<TabStateByTab[T]>) => void;
};

export function useReceptionViewState(
  options?: UseReceptionViewStateOptionsWithoutTab
): {
  receptionId: string;
  viewState: ReceptionViewState;
  tabState: undefined;
  setViewState: (state: ReceptionViewState) => void;
  updateViewState: (updates: Partial<ReceptionViewState>) => void;
  updateTabState: (updates: Partial<TabStateByTab[ReceptionInitialTab]>) => void;
};

/**
 * Reception별 UI View 상태를 읽고/업데이트하는 훅
 * - 도메인 Reception과 분리된 per-tab UI 상태를 store 경유로 관리
 * - 얕은 병합으로만 업데이트 (deep merge 사용 안 함)
 */
export function useReceptionViewState(
  options?: UseReceptionViewStateOptionsWithTab<ReceptionInitialTab> | UseReceptionViewStateOptionsWithoutTab
) {
  const { receptionId, tab } = options || {};

  const normalizedId = useMemo(
    () => normalizeRegistrationId(receptionId ?? REGISTRATION_ID_NEW),
    [receptionId]
  );

  // fallback 초기값을 memo로 고정하여 selector가 매 렌더마다 새 객체를 반환하지 않도록 함
  const fallbackViewState = useMemo(
    () => createInitialReceptionViewState(),
    [normalizedId]
  );

  const ensureTabState = useReceptionViewTabsStore(
    (state) => state.ensureTabState
  );
  const updateView = useReceptionViewTabsStore((state) => state.updateView);
  const updateViewTabState = useReceptionViewTabsStore(
    (state) => state.updateViewTabState
  );

  useEffect(() => {
    ensureTabState(normalizedId);
  }, [ensureTabState, normalizedId]);

  // 현재 view state 선택 (없으면 초기값)
  const viewState = useReceptionViewTabsStore(
    useCallback(
      (state) => state.tabs[normalizedId]?.view ?? fallbackViewState,
      [normalizedId, fallbackViewState]
    )
  );

  const tabKeyMap: Record<ReceptionInitialTab, keyof ReceptionViewState> = {
    [ReceptionInitialTab.환자정보]: "patientInfo",
    [ReceptionInitialTab.처방조회]: "patientChart",
    [ReceptionInitialTab.보험이력변경]: "insuranceHistory",
    [ReceptionInitialTab.수납정보]: "paymentInfo",
    [ReceptionInitialTab.미수환불]: "notPaid",
    [ReceptionInitialTab.예약현황]: "appointmentHistory",
    [ReceptionInitialTab.출력센터]: "printCenter",
  };

  const tabState = useMemo(() => {
    if (!tab) return undefined;
    const tabKey = tabKeyMap[tab];
    return viewState[tabKey] as TabStateByTab[ReceptionInitialTab];
  }, [tab, tabKeyMap, viewState]);

  const setViewState = useCallback(
    (state: ReceptionViewState) => {
      updateView(normalizedId, () => state);
    },
    [normalizedId, updateView]
  );

  const updateViewState = useCallback(
    (updates: Partial<ReceptionViewState>) => {
      updateView(normalizedId, (current) => ({
        ...current,
        ...updates,
      }));
    },
    [normalizedId, updateView]
  );

  const updateTabState = useCallback(
    (updates: Partial<TabStateByTab[ReceptionInitialTab]>) => {
      if (!tab) return;
      updateViewTabState(
        normalizedId,
        tab,
        updates as Partial<TabStateByTab[ReceptionInitialTab]>
      );
    },
    [normalizedId, tab, updateViewTabState]
  );

  return {
    receptionId: normalizedId,
    viewState,
    tabState,
    setViewState,
    updateViewState,
    updateTabState,
  };
}

