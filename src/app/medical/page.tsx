"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import MyRcDock, { type MyRcDockHandle } from "@/components/ui/my-rc-dock/my-rc-dock";
import "@/styles/rc-dock.css";
import "@/components/yjg/common/style/my-style.css";
import PatientClinicMemo from "@/app/medical/_components/panels/patient-clinic-memo";
import AiPredictionsPanel from "@/app/medical/_components/panels/(ai-predictions)/ai-predictions-panel";
import { cn } from "@/components/yjg/common/util/ui-util";
import PatientInfoBar from "./_components/(patient-info-bar)/patient-info-bar";
import PatientSymptom from "./_components/panels/patient-symptom";
import MedicalPatientList, { type PatientListPosition } from "./_components/(medical-patient-list)/medical-patient-list";
import { getInitialPatientListPosition } from "./_components/(medical-patient-list)/medical-patient-list-header";
import PatientDiagnosisPrescription from "./_components/panels/(patient-diagnosis-prescription)/patient-diagnosis-prescription";
import EncounterHistory from "./_components/panels/(patient-history)/(encounter-history)/encounter-history";
import { MyButton } from "@/components/yjg/my-button";
import { SettingIcon } from "@/components/custom-icons";
import { PlusIcon } from "lucide-react";
import { MedicalUiProvider } from "./contexts/medical-ui-context";
import { useUIStore } from "@/store/ui-store";
import { useSettingsStore } from "@/store/settings-store";
import { useCreateOrUpdateSetting, useDeleteSetting } from "@/hooks/api/use-settings";
import OrderFixToggleButton from "@/components/disease-order/order/order-fix-toggle-button";
import MedicalBundle from "./_components/panels/(medical-bundle)/medical-bundle";

import MyPopup from "@/components/yjg/my-pop-up";
import MasterBundle from "../master-data/_components/(tabs)/(bundle)/master-bundle";
import BundleDetail from "../master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-detail";
import PatientMemo from "./_components/panels/patient-memo";
import { useMedicalUi } from "./contexts/medical-ui-context";
import { useEncounterStore } from "@/store/encounter-store";
import { useQuery } from "@tanstack/react-query";
import { PatientChatsService } from "@/services/patient-chats-service";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { BundlePriceType } from "@/constants/bundle-price-type";
import { convertToApiDisease } from "./_components/panels/(patient-diagnosis-prescription)/api-converter";
import { convertToApiOrder } from "./_components/panels/(patient-diagnosis-prescription)/api-converter";
import {
  convertApiDiseasesToBundleItemDiseases,
  convertUpsertManyOrdersToBundleItemOrders,
} from "./_components/panels/(patient-diagnosis-prescription)/encounter-to-bundle-initial";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

// 패널별 추가 버튼 핸들러 타입
type PanelExtraButtonHandlers = {
  onOpenBundleSetting: () => void;
  onAddBundle: () => void;
};

// 패널별 추가 버튼 설정 타입
type PanelExtraButton = (
  panel: any,
  handlers: PanelExtraButtonHandlers
) => React.ReactElement | null;

// 각 패널(탭) ID별로 추가 버튼을 설정할 수 있는 맵을 생성하는 함수
const createPanelExtraZone = (
  handlers: PanelExtraButtonHandlers
): Record<string, PanelExtraButton> => ({
  record: () => {
    return <RecordExtraZone />;
  },
  "bundle": () => {
    return (
      <MedicalBundleExtraZone
        onOpenBundleSetting={handlers.onOpenBundleSetting}
        onAddBundle={handlers.onAddBundle}
      />
    );
  },
});

function RecordExtraZone() {
  return (
    <div className="flex flex-row items-center gap-[2px]">
      <OrderFixToggleButton />
    </div>
  );
}

function MedicalBundleExtraZone({
  onOpenBundleSetting,
  onAddBundle,
}: {
  onOpenBundleSetting: () => void;
  onAddBundle: () => void;
}) {
  return (
    <div className="flex flex-row items-center gap-[2px]">
      <MyButton
        variant="ghost"
        size="icon"
        className="p-[3px]"
        tooltip="묶음처방 설정"
        onClick={onOpenBundleSetting}
      >
        <SettingIcon className="w-[14px] h-[14px]" />
      </MyButton>
      <MyButton
        variant="ghost"
        size="icon"
        className="p-[3px]"
        tooltip="현재 진단 및 처방을 묶음으로 추가합니다."
        onClick={onAddBundle}
      >
        <PlusIcon className="w-[14px] h-[14px]" />
      </MyButton>
    </div>
  );
}

function usePatientChatPinned(patientId: number | undefined | null) {
  return useQuery({
    queryKey: ["patient-chats", patientId ? Number(patientId) : null, "pinned"],
    queryFn: () => PatientChatsService.getPinnedMessages(Number(patientId)),
    enabled: !!patientId,
  });
}

/** 환자 메모 탭 제목: 핀된 채팅 메시지가 있으면 우측 상단에 작은 파란 점 표시 */
function PatientMemoTabTitle() {
  const selectedEncounter = useEncounterStore((s) => s.selectedEncounter);
  const patientId = selectedEncounter?.patientId;
  const { data: pinnedMessages } = usePatientChatPinned(patientId);
  const hasPinned = (pinnedMessages?.length ?? 0) > 0;
  return (
    <span className="relative inline-flex flex-row items-center">
      환자 메모
      {hasPinned && (
        <span
          className="absolute -top-[2px] -right-[4px] w-[6px] h-[6px] rounded-full bg-[var(--blue-2)] shrink-0"
          aria-hidden
        />
      )}
    </span>
  );
}

export default function MedicalPage() {
  return (
    <MedicalUiProvider>
      <MedicalPageContent />
    </MedicalUiProvider>
  );
}

// ─── 레이아웃 병합 유틸: 저장된 레이아웃에 신규 탭 자동 주입 ───

/** 레이아웃 트리에서 모든 탭 ID를 재귀적으로 수집 */
function collectTabIds(node: any): string[] {
  const ids: string[] = [];
  if (node?.tabs) {
    for (const tab of node.tabs) {
      if (tab?.id) ids.push(tab.id);
    }
  }
  if (node?.children) {
    for (const child of node.children) {
      ids.push(...collectTabIds(child));
    }
  }
  if (node?.dockbox) ids.push(...collectTabIds(node.dockbox));
  if (node?.floatbox) ids.push(...collectTabIds(node.floatbox));
  return ids;
}

/** defaultLayout에서 해당 tabId와 같은 패널(tabs 배열)에 있는 형제 탭 ID 목록 반환 */
function findSiblingTabIds(node: any, tabId: string): string[] {
  if (node?.tabs) {
    const ids = node.tabs.map((t: any) => t?.id).filter(Boolean);
    if (ids.includes(tabId)) {
      return ids.filter((id: string) => id !== tabId);
    }
  }
  for (const child of node?.children ?? []) {
    const result = findSiblingTabIds(child, tabId);
    if (result.length > 0) return result;
  }
  if (node?.dockbox) {
    const result = findSiblingTabIds(node.dockbox, tabId);
    if (result.length > 0) return result;
  }
  return [];
}

/** savedLayout 트리에서 targetTabId가 있는 패널의 tabs 배열에 newTab을 추가 */
function injectTabNextTo(node: any, targetTabId: string, newTab: { id: string }): boolean {
  if (node?.tabs) {
    if (node.tabs.some((t: any) => t?.id === targetTabId)) {
      node.tabs.push(newTab);
      return true;
    }
  }
  for (const child of node?.children ?? []) {
    if (injectTabNextTo(child, targetTabId, newTab)) return true;
  }
  if (node?.dockbox && injectTabNextTo(node.dockbox, targetTabId, newTab)) return true;
  if (node?.floatbox && injectTabNextTo(node.floatbox, targetTabId, newTab)) return true;
  return false;
}

/** 레이아웃 트리에서 처음 발견되는 tabs 배열에 탭 추가 (폴백용) */
function injectTabToFirstPanel(node: any, newTab: { id: string }): boolean {
  if (node?.dockbox) return injectTabToFirstPanel(node.dockbox, newTab);
  if (node?.tabs) {
    node.tabs.push(newTab);
    return true;
  }
  for (const child of node?.children ?? []) {
    if (injectTabToFirstPanel(child, newTab)) return true;
  }
  return false;
}

/**
 * 서버 저장 전: windowbox 탭을 dockbox로 병합하여 깨끗한 레이아웃 반환.
 * 브라우저 재시작 시 모든 탭이 dock 상태로 복원되도록 보장.
 */
function stripWindowboxForSave(layout: any, defaultLayout: any): any {
  if (!layout?.windowbox?.children?.length) return layout;

  const cleaned = JSON.parse(JSON.stringify(layout));
  // windowbox에서 탭 ID 수집
  const windowTabIds: string[] = [];
  for (const panel of cleaned.windowbox.children) {
    if (panel?.tabs) {
      for (const tab of panel.tabs) {
        if (tab?.id) windowTabIds.push(tab.id);
      }
    }
  }
  // windowbox 비우기
  cleaned.windowbox = { mode: "window", children: [] };

  // 수집된 탭을 dockbox에 형제 탭 옆으로 주입
  for (const tabId of windowTabIds) {
    const siblings = findSiblingTabIds(defaultLayout, tabId);
    let injected = false;
    for (const siblingId of siblings) {
      if (injectTabNextTo(cleaned, siblingId, { id: tabId })) {
        injected = true;
        break;
      }
    }
    if (!injected) {
      injectTabToFirstPanel(cleaned, { id: tabId });
    }
  }
  return cleaned;
}

/** savedLayout에 defaultLayout 대비 누락된 탭을 형제 탭 옆에 자동 병합 */
function mergeNewTabs(savedLayout: any, defaultLayout: any): any {
  const savedIds = new Set(collectTabIds(savedLayout));
  const defaultIds = collectTabIds(defaultLayout);
  const missingIds = defaultIds.filter((id) => !savedIds.has(id));

  if (missingIds.length === 0) return savedLayout;

  const merged = JSON.parse(JSON.stringify(savedLayout));

  for (const missingId of missingIds) {
    const siblings = findSiblingTabIds(defaultLayout, missingId);

    let injected = false;
    for (const siblingId of siblings) {
      if (savedIds.has(siblingId)) {
        if (injectTabNextTo(merged, siblingId, { id: missingId })) {
          injected = true;
          break;
        }
      }
    }

    if (!injected) {
      injectTabToFirstPanel(merged, { id: missingId });
    }
  }

  return merged;
}

/** savedLayout에서 defaultLayout에 없는(삭제된) 탭을 재귀적으로 제거 */
function stripRemovedTabs(savedLayout: any, defaultLayout: any): any {
  const validIds = new Set(collectTabIds(defaultLayout));
  const cleaned = JSON.parse(JSON.stringify(savedLayout));

  function cleanNode(node: any): boolean {
    if (node?.tabs) {
      node.tabs = node.tabs.filter((t: any) => t?.id && validIds.has(t.id));
      if (node.activeId && !validIds.has(node.activeId)) {
        node.activeId = node.tabs[0]?.id ?? undefined;
      }
    }
    if (node?.children) {
      node.children = node.children.filter((child: any) => {
        cleanNode(child);
        // 자식이 없고 탭도 없으면 제거
        const hasTabs = child.tabs && child.tabs.length > 0;
        const hasChildren = child.children && child.children.length > 0;
        return hasTabs || hasChildren;
      });
    }
    if (node?.dockbox) cleanNode(node.dockbox);
    if (node?.floatbox) cleanNode(node.floatbox);
    if (node?.windowbox) cleanNode(node.windowbox);
    return true;
  }

  cleanNode(cleaned);
  return cleaned;
}

// 기본 레이아웃 정의
const MEDICAL_DEFAULT_LAYOUT: any = {
  dockbox: {
    mode: "horizontal",
    children: [
      {
        mode: "vertical",
        size: 25,
        children: [
          {
            size: 20,
            tabs: [{ id: "memo" }],
          },
          {
            size: 80,
            tabs: [
              { id: "visit" }
            ],
          },
        ],
      },
      {
        mode: "vertical",
        size: 30,
        children: [
          {
            tabs: [{ id: "record" }],
          }
        ],
      },
      {
        size: 25,
        tabs: [{ id: "bundle" }],
      },
      {
        size: 20,
        mode: "vertical",
        children: [
          { tabs: [{ id: "clinic-memo" }, { id: "patient-memo" }] },
          { tabs: [{ id: "symptom" }] },
        ],
      },
    ],
  },
};

// 레이아웃 설정 상수
const LAYOUT_SETTINGS = {
  scope: "user" as const,
  category: "layout",
  pageContext: "medical",
};

function MedicalPageContent() {
  const [isBundlePopupOpen, setIsBundlePopupOpen] = useState(false);
  const [isAddBundlePopupOpen, setIsAddBundlePopupOpen] = useState(false);
  const [addBundleInitialBundle, setAddBundleInitialBundle] = useState<Bundle | null>(null);
  const [isPatientStatusOpen, setIsPatientStatusOpen] = useState(true);
  const { diagnosisPrescriptionGridSnapshotRef, focusTabRef } = useMedicalUi();
  const { warning, success } = useToastHelpers();
  const queryClient = useQueryClient();
  const [patientListPosition, setPatientListPosition] =
    useState<PatientListPosition>(() => getInitialPatientListPosition());
  const dockRef = useRef<MyRcDockHandle>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingLayoutRef = useRef<any>(null);
  const layoutInitializedRef = useRef(false);
  const lastSavedLayoutHashRef = useRef<string | null>(null);

  // Settings store
  const isSettingsLoaded = useSettingsStore((state) => state.isLoaded);
  const getSettingsByCategoryAndPageContext = useSettingsStore(
    (state) => state.getSettingsByCategoryAndPageContext
  );
  const updateSettingLocally = useSettingsStore(
    (state) => state.updateSettingLocally
  );

  // 레이아웃 저장/삭제 mutation
  const { mutate: saveLayoutToServer } = useCreateOrUpdateSetting();
  const { mutate: deleteLayoutFromServer } = useDeleteSetting();

  // 저장된 레이아웃 가져오기
  const savedLayoutSetting = getSettingsByCategoryAndPageContext(
    LAYOUT_SETTINGS.category,
    LAYOUT_SETTINGS.pageContext
  );
  const savedLayout = savedLayoutSetting?.settings?.dockLayout;

  // Settings 로드 완료 후 저장된 레이아웃 적용
  useEffect(() => {
    if (isSettingsLoaded && !layoutInitializedRef.current) {
      layoutInitializedRef.current = true;

      if (savedLayout && dockRef.current) {
        try {
          // 저장된 레이아웃에서 삭제된 탭 제거 후, 신규 탭 자동 병합
          const strippedLayout = stripRemovedTabs(savedLayout, MEDICAL_DEFAULT_LAYOUT);
          const layoutToLoad = mergeNewTabs(strippedLayout, MEDICAL_DEFAULT_LAYOUT);
          try {
            lastSavedLayoutHashRef.current = JSON.stringify(layoutToLoad);
          } catch {
            lastSavedLayoutHashRef.current = null;
          }
          // 병합된 레이아웃 적용
          dockRef.current.loadLayout(layoutToLoad);
        } catch (error) {
          console.error("[MedicalPage] 레이아웃 불러오기 실패, 설정 삭제 후 기본 레이아웃 적용:", error);
          // 불러오기 실패 시 설정 삭제
          deleteLayoutFromServer({
            scope: LAYOUT_SETTINGS.scope,
            category: LAYOUT_SETTINGS.category,
            pageContext: LAYOUT_SETTINGS.pageContext,
          });
          // 기본 레이아웃 적용
          dockRef.current.loadLayout(MEDICAL_DEFAULT_LAYOUT);
        }
      }

      // 저장된 환자 현황 위치 적용
      const savedPosition = getInitialPatientListPosition();
      setPatientListPosition(savedPosition);
    }
  }, [isSettingsLoaded, savedLayout, deleteLayoutFromServer]);

  // focusTabRef: dockRef를 이용하여 특정 탭을 활성화하는 함수 등록
  useEffect(() => {
    focusTabRef.current = (tabId: string) => {
      if (!dockRef.current) return;
      const tab = dockRef.current.find(tabId);
      if (tab) {
        dockRef.current.updateTab(tabId, tab, true);
      }
    };
    return () => {
      focusTabRef.current = null;
    };
  }, [focusTabRef]);

  // 레이아웃 변경 핸들러 (debounce 적용, 서버에만 저장)
  const handleLayoutChange = useCallback(
    (newLayout: any) => {
      if (!newLayout) return;
      if (!layoutInitializedRef.current) return;

      let nextLayoutHash: string | null = null;
      try {
        nextLayoutHash = JSON.stringify(newLayout);
      } catch {
        nextLayoutHash = null;
      }
      if (
        nextLayoutHash &&
        nextLayoutHash === lastSavedLayoutHashRef.current
      ) {
        return;
      }

      // 기존 타이머 클리어
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // pending 데이터 저장 (unmount 시 flush 용)
      pendingLayoutRef.current = newLayout;

      // 500ms debounce 후 서버에 저장
      saveTimeoutRef.current = setTimeout(() => {
        // windowbox 탭을 dockbox로 병합하여 저장 (브라우저 재시작 시 모든 탭이 dock 상태로 복원)
        const layoutToSave = stripWindowboxForSave(newLayout, MEDICAL_DEFAULT_LAYOUT);
        const saveHash = JSON.stringify(layoutToSave);
        lastSavedLayoutHashRef.current = saveHash;
        const settingPayload = {
          scope: LAYOUT_SETTINGS.scope,
          category: LAYOUT_SETTINGS.category,
          pageContext: LAYOUT_SETTINGS.pageContext,
          settings: { dockLayout: layoutToSave },
        };
        saveLayoutToServer(settingPayload);
        // Zustand store도 즉시 업데이트 (페이지 이동 후 복귀 시 최신 데이터 사용)
        updateSettingLocally(settingPayload);
        pendingLayoutRef.current = null;
      }, 500);
    },
    [saveLayoutToServer, updateSettingLocally]
  );

  // 레이아웃 초기화 (설정 삭제)
  const resetLayout = useCallback(() => {
    // 서버에서 레이아웃 설정 삭제
    deleteLayoutFromServer({
      scope: LAYOUT_SETTINGS.scope,
      category: LAYOUT_SETTINGS.category,
      pageContext: LAYOUT_SETTINGS.pageContext
    });
    // DockLayout에 기본 레이아웃 적용
    if (dockRef.current) {
      try {
        lastSavedLayoutHashRef.current = JSON.stringify(MEDICAL_DEFAULT_LAYOUT);
      } catch {
        lastSavedLayoutHashRef.current = null;
      }
      dockRef.current.loadLayout(MEDICAL_DEFAULT_LAYOUT);
    }
  }, [deleteLayoutFromServer]);

  // 컴포넌트 언마운트 시 타이머 정리 + pending save flush
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 페이지 이동 시 미저장 레이아웃이 있으면 즉시 저장
      if (pendingLayoutRef.current) {
        const layoutToSave = stripWindowboxForSave(
          pendingLayoutRef.current,
          MEDICAL_DEFAULT_LAYOUT
        );
        const settingPayload = {
          scope: LAYOUT_SETTINGS.scope,
          category: LAYOUT_SETTINGS.category,
          pageContext: LAYOUT_SETTINGS.pageContext,
          settings: { dockLayout: layoutToSave },
        };
        saveLayoutToServer(settingPayload);
        updateSettingLocally(settingPayload);
        pendingLayoutRef.current = null;
      }
    };
  }, [saveLayoutToServer, updateSettingLocally]);

  // 레이아웃 초기화 트리거 감지
  const layoutResetTrigger = useUIStore((state) => state.layoutResetTrigger);
  const prevLayoutResetTriggerRef = useRef(layoutResetTrigger);

  useEffect(() => {
    // 실제로 트리거 값이 변경되었을 때만 실행
    if (prevLayoutResetTriggerRef.current === layoutResetTrigger) {
      return;
    }
    prevLayoutResetTriggerRef.current = layoutResetTrigger;

    // 레이아웃 초기화: 기본 레이아웃으로 리로드 및 설정 삭제
    resetLayout();
  }, [layoutResetTrigger, resetLayout]);

  const saveTab = (tabData: any) => {
    const saved: any = {
      id: tabData?.id || "unknown",
    };
    // group 속성도 저장
    if (tabData?.group) {
      saved.group = tabData.group;
    }
    return saved;
  };

  const loadTab = (savedTab: any) => {
    if (!savedTab) return null;
    let id = typeof savedTab === "object" ? savedTab.id : savedTab;
    // 모든 탭에 default 그룹을 명시적으로 설정
    const baseTab = { group: "default" };

    switch (id) {
      case "symptom":
        return {
          ...baseTab,
          id: "symptom",
          title: "증상",
          content: <PatientSymptom />,
        };
      case "clinic-memo":
        return {
          ...baseTab,
          id: "clinic-memo",
          title: "임상 메모",
          content: <PatientClinicMemo />,
        };
      case "patient-memo":
        return {
          ...baseTab,
          id: "patient-memo",
          title: <PatientMemoTabTitle />,
          content: <PatientMemo />,
        };
      case "memo":
        return {
          ...baseTab,
          id: "memo",
          title: "환자 진료이력 요약",
          content: <AiPredictionsPanel />,
        };
      case "visit":
        return {
          ...baseTab,
          id: "visit",
          title: "내원이력",
          content: <EncounterHistory />,
        };
      case "record":
        return {
          ...baseTab,
          id: "record",
          title: "진단 및 처방",
          content: <PatientDiagnosisPrescription />,
        };
      case "bundle":
        return {
          ...baseTab,
          id: "bundle",
          title: "묶음처방",
          content: <MedicalBundle />,
        }

      default:
        return null;
    }
  };

  // 현재 진단/처방·증상으로 신규 묶음 초기값 생성 후 팝업 오픈 (증상은 클릭 시점의 작성 중인 내용 사용)
  // 처방 데이터는 묶음(package) 헤더를 제거하고, 묶음 안의 항목만 일반 처방으로 포함
  const handleAddBundle = useCallback(() => {
    const snapshot = diagnosisPrescriptionGridSnapshotRef.current?.() ?? null;
    if (!snapshot) {
      warning("진단 및 처방 데이터를 불러올 수 없습니다.");
      return;
    }
    const diseaseData = convertToApiDisease(snapshot.diagnosisGridData);
    const packageRowKeys = new Set(
      snapshot.prescriptionGridData
        .filter((row) => row.type === "package")
        .map((row) => row.rowKey)
    );
    const prescriptionWithoutPackages = snapshot.prescriptionGridData
      .filter((row) => row.type !== "package")
      .map((row) => {
        const wasPackageChild = packageRowKeys.has(row.parentRowKey ?? "");
        const isFixedItem = row.type === "fixed-item";
        if (!wasPackageChild && !isFixedItem) return row;
        return {
          ...row,
          ...(wasPackageChild && { parentRowKey: null }),
          ...(isFixedItem && { type: "item" as const }),
        };
      });
    const orderData = convertToApiOrder(prescriptionWithoutPackages);

    if (diseaseData.length === 0 && orderData.length === 0) {
      warning("진단 또는 처방 데이터를 먼저 입력해주세요.");
      return;
    }
    const currentSymptom = useEncounterStore.getState().draftSymptom ?? "";
    const initialBundle: Bundle = {
      code: "",
      name: "",
      isActive: true,
      priceType: BundlePriceType.단가합산,
      price: undefined,
      receiptPrintLocation: 0,
      isShowBundleName: true,
      isVerbal: false,
      isClaim: true,
      symptom: currentSymptom,
      bundleItemDiseases: convertApiDiseasesToBundleItemDiseases(diseaseData),
      bundleItemOrders: convertUpsertManyOrdersToBundleItemOrders(orderData),
      parentRelations: [],
      childRelations: [],
    };
    setAddBundleInitialBundle(initialBundle);
    setIsAddBundlePopupOpen(true);
  }, [diagnosisPrescriptionGridSnapshotRef, warning]);

  // 패널별 추가 버튼 핸들러 생성
  const panelExtraButtonHandlers: PanelExtraButtonHandlers = useMemo(() => ({
    onOpenBundleSetting: () => setIsBundlePopupOpen(true),
    onAddBundle: handleAddBundle,
  }), [handleAddBundle]);

  // 패널별 추가 버튼 맵 생성
  const panelExtraButtons = useMemo(() => createPanelExtraZone(panelExtraButtonHandlers), [panelExtraButtonHandlers]);

  // 모든 패널에 Ellipsis 버튼과 패널별 추가 버튼을 표시하는 groups 설정
  const groups = useMemo(() => ({
    default: {
      panelExtra: (panel: any): React.ReactElement => {
        const activeTabId = panel.activeId;
        const extraButton = panelExtraButtons[activeTabId]?.(
          panel,
          panelExtraButtonHandlers
        );

        return (
          <div className="flex items-center gap-[2px]">
            {extraButton}
          </div>
        );
      },
    },
  }), [panelExtraButtons, panelExtraButtonHandlers]);

  const PatientStatusPanel = (
    <div
      className={cn(
        "overflow-hidden",
        patientListPosition === "left"
          ? isPatientStatusOpen
            ? "slide-in-left"
            : "slide-out-left"
          : isPatientStatusOpen
            ? "slide-in-right"
            : "slide-out-right"
      )}
    >
      <MedicalPatientList
        setIsPatientStatusOpen={setIsPatientStatusOpen}
        position={patientListPosition}
        onPositionChangeAction={setPatientListPosition}
      />
    </div>
  );

  return (
    <div className="bg-[var(--gray-white)] flex-1 min-h-0 flex min-w-[1230px] my-scroll layout-transition relative">
      {/* 로딩 오버레이 */}
      {!isSettingsLoaded && (
        <div className="absolute inset-0 z-50 bg-[var(--bg-3)]/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[var(--text-3)]">
            <div className="w-6 h-6 rounded-full border-2 border-current animate-spin border-t-transparent" />
            <span className="text-sm">레이아웃을 불러오는 중입니다...</span>
          </div>
        </div>
      )}
      {/* 왼쪽 위치일 때 PatientStatusList */}
      {patientListPosition === "left" && PatientStatusPanel}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden",
          patientListPosition === "left"
            ? "border-l border-[var(--border-1)]"
            : "border-r border-[var(--border-1)]"
        )}
      >
        <PatientInfoBar
          isPatientStatusOpen={isPatientStatusOpen}
          setIsPatientStatusOpen={setIsPatientStatusOpen}
          patientListPosition={patientListPosition}
        />
        <div className="flex-1 px-[6px] pb-[6px]">
          <MyRcDock
            ref={dockRef}
            defaultLayout={MEDICAL_DEFAULT_LAYOUT}
            saveTab={saveTab}
            loadTab={loadTab as any}
            groups={groups}
            onLayoutChange={handleLayoutChange}
          />
        </div>
      </div>

      <MyPopup
        title="묶음 설정"
        width="90vw"
        height="90vh"
        minWidth="900px"
        minHeight="600px"
        isOpen={isBundlePopupOpen}
        onCloseAction={() => setIsBundlePopupOpen(false)}
        localStorageKey="bundle-prescription-popup"
      >
        <MasterBundle />
      </MyPopup>

      <MyPopup
        title="신규 묶음 등록"
        width="70vw"
        height="70vh"
        minWidth="900px"
        minHeight="600px"
        isOpen={isAddBundlePopupOpen}
        onCloseAction={() => {
          setIsAddBundlePopupOpen(false);
          setAddBundleInitialBundle(null);
        }}
        localStorageKey="medical-add-bundle-popup"
      >
        {addBundleInitialBundle && (
          <BundleDetail
            selectedBundleId={0}
            initialBundle={addBundleInitialBundle}
            showBundleGrid={false}
            hideNewCreateButton={true}
            onSaveSuccess={() => {
              success("묶음 저장 완료");
              queryClient.invalidateQueries({ queryKey: ["bundle-items"] });
              setTimeout(() => {
                setIsAddBundlePopupOpen(false);
                setAddBundleInitialBundle(null);
              }, 500);
            }}
          />
        )}
      </MyPopup>

      {/* 오른쪽 위치일 때 PatientStatusList */}
      {patientListPosition === "right" && PatientStatusPanel}
    </div>
  );
}
