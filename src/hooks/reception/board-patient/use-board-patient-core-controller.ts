import { useCallback, useEffect, useRef, useState } from "react";
import type { Reception } from "@/types/common/reception-types";
import type { TabItem } from "@/app/reception/_components/widgets/tabs";
import type { BoardPatientTabId } from "@/components/reception/board-patient/types";
import { mergeReception } from "@/lib/reception/merge-reception";
import { ReceptionInitialTab } from "@/constants/common/common-enum";

const DEFAULT_TABS: TabItem[] = [
  { id: ReceptionInitialTab.환자정보, label: "환자정보", visible: true },
  { id: ReceptionInitialTab.처방조회, label: "처방조회", visible: true },
  { id: ReceptionInitialTab.보험이력변경, label: "보험이력변경", visible: true },
  { id: ReceptionInitialTab.수납정보, label: "수납정보", visible: true },
  { id: ReceptionInitialTab.미수환불, label: "미수/환불", visible: true },
  { id: ReceptionInitialTab.출력센터, label: "출력센터", visible: true },
];

interface UseBoardPatientCoreControllerOptions {
  /** 최초 Reception 스냅샷 (외부에서 생성) */
  initialReception: Reception | null;
  /** Reception 을 식별할 ID (registrationId 등) */
  receptionId: string | null;
  /** UI 전체 disabled 여부 (라우트별로 계산해서 전달) */
  isDisabled?: boolean;
  /** 기본 탭 구성을 오버라이드하고 싶을 때 사용 */
  initialTabs?: TabItem[];
  /** 최초 활성 탭을 지정하고 싶을 때 사용 */
  initialActiveTab?: BoardPatientTabId;
  /**
   * Reception 이 변경될 때마다 store 나 외부 상태와 동기화할 콜백
   * - 예: reception-store.updateRegistration, tabs-store.updateOpenedReception 등
   */
  onSyncToStore?: (reception: Reception) => void;
}

export function useBoardPatientCoreController({
  initialReception,
  receptionId,
  isDisabled = false,
  initialTabs,
  initialActiveTab = ReceptionInitialTab.환자정보,
  onSyncToStore,
}: UseBoardPatientCoreControllerOptions) {
  const [reception, setReception] = useState<Reception | null>(
    initialReception
  );
  const [activeTab, setActiveTab] =
    useState<BoardPatientTabId>(initialActiveTab);
  const [tabs, setTabs] = useState<TabItem[]>(initialTabs ?? DEFAULT_TABS);

  // 사용자가 직접 변경한 경우에만 동기화하기 위한 플래그
  const isUserChangeRef = useRef(false);
  const onSyncToStoreRef = useRef(onSyncToStore);

  // onSyncToStore 최신 값 유지
  useEffect(() => {
    onSyncToStoreRef.current = onSyncToStore;
  }, [onSyncToStore]);

  // initialReception 이 바뀌면 내부 상태도 동기화 (동기화는 하지 않음)
  useEffect(() => {
    isUserChangeRef.current = false;
    setReception(initialReception);
  }, [initialReception]);

  const handleChangeReception = useCallback(
    (updates: Partial<Reception>) => {
      isUserChangeRef.current = true;
      setReception((prev) => {
        if (!prev) return prev;
        return mergeReception(prev, updates);
      });
    },
    []
  );

  // 사용자가 직접 변경한 경우에만 store와 동기화
  useEffect(() => {
    if (isUserChangeRef.current && reception && onSyncToStoreRef.current) {
      isUserChangeRef.current = false;
      onSyncToStoreRef.current(reception);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reception]);

  const handleTabChange = useCallback((tabId: BoardPatientTabId) => {
    setActiveTab(tabId);
  }, []);

  const handleTabVisibilityChange = useCallback(
    (tabId: string, visible: boolean) => {
      setTabs((prev) => {
        const next = prev.map((tab) =>
          tab.id === tabId ? { ...tab, visible } : tab
        );

        if (!visible && activeTab === (tabId as BoardPatientTabId)) {
          const firstVisible = next.find((tab) => tab.visible);
          if (firstVisible) {
            setActiveTab(firstVisible.id as BoardPatientTabId);
          }
        }

        return next;
      });
    },
    [activeTab]
  );

  return {
    uiProps: {
      reception,
      receptionId,
      isDisabled,
      tabs,
      activeTab,
      onChangeReceptionAction: handleChangeReception,
      onTabChangeAction: handleTabChange,
      onTabVisibilityChange: handleTabVisibilityChange,
    } as const,
  };
}


