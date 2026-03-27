"use client";

import React, { useMemo, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import {
  DockWorkspace,
  type DockWorkspaceRef,
  type DockLayout,
  type DockLayoutSettingsConfig,
  type TabData,
  type PanelExtraRenderer,
  type LayoutNode,
  type PanelNode as PanelNodeType,
} from "@/components/dock-workspace";
import {
  type CustomPanelConfig,
  type PanelTypeKey,
  PANEL_TYPE,
  createCustomPanelConfigs,
  createCustomPanelConfigsFromPreset,
  PANEL_PRESETS,
  buildDefaultDockLayout,
} from "../(shared)/(custom-docking-panel)";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import CustomPanelContainer from "./custom-panel-container";
import PatientMemoPanel from "./patient-memo-panel";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import type { Hospital } from "@/types/hospital-types";
import { filterRegistrationsForPanel } from "./reception-panel-filters";
import { useReceptionTabsStore } from "@/store/common/reception-tabs-store";

/**
 * CustomRoomPanel
 *
 * 기존 room-panel.tsx의 커스텀 대체 버전.
 * CustomDockingPanel 래퍼를 거치지 않고 DockWorkspace를 직접 사용한다.
 */

// ===== Imperative Ref for layout settings =====

export interface CustomRoomPanelRef {
  resetLayout: () => void;
  isPaymentMerged: () => boolean;
  togglePaymentMerge: () => void;
}

interface CustomRoomPanelProps {
  // 패널 설정
  enabledPanels?: Partial<Record<PanelTypeKey, boolean>>;

  // 데이터
  registrations?: Registration[];
  appointments?: Appointment[];
  hospital?: Hospital;
  selectedDate?: Date;

  // 이벤트 핸들러
  onPatientSelect?: (patient: any) => void;
  onLayoutChange?: (layout: any) => void;
  onRequestDateChange?: (date: Date) => void;
  isLoadingData?: boolean;

  // UI 설정
  className?: string;
  theme?: "light" | "dark";

  // 고급 설정
  usePreset?: keyof typeof PANEL_PRESETS;
  customConfigs?: Partial<Record<PanelTypeKey, Partial<CustomPanelConfig>>>;
}

const RECEPTION_DOCK_LAYOUT_SETTINGS: DockLayoutSettingsConfig = {
  scope: "user",
  category: "layout",
  pageContext: "reception",
};

const DEFAULT_ENABLED_PANELS: Partial<Record<PanelTypeKey, boolean>> = {
  appointment: true,
  treatment: true,
  payment: true,
  chat: true,
};

// ===== Layout tree helpers =====

function findPanelWithTab(node: LayoutNode, tabId: string): PanelNodeType | null {
  if (node.type === "panel") {
    if (node.tabs.some((t) => t.id === tabId)) {
      return node;
    }
    return null;
  }
  for (const child of node.children) {
    const found = findPanelWithTab(child, tabId);
    if (found) return found;
  }
  return null;
}

const PAYMENT_PENDING_TAB_ID = "payment-panel-pending";
const PAYMENT_COMPLETED_TAB_ID = "payment-panel-completed";
const PAYMENT_MERGED_TAB_ID = "payment-panel-merged";

// ===== Chat Panel Content =====

function ChatPanelContent() {
  const openedReceptions = useReceptionTabsStore((s) => s.openedReceptions);
  const openedReceptionId = useReceptionTabsStore((s) => s.openedReceptionId);

  const activePatientId = useMemo(() => {
    if (!openedReceptionId) return null;
    const reception = openedReceptions.find(
      (r) => r.originalRegistrationId === openedReceptionId
    );
    return reception?.patientBaseInfo?.patientId ?? null;
  }, [openedReceptions, openedReceptionId]);

  if (!activePatientId) {
    return (
      <div className="flex h-full items-center justify-center bg-white text-sm text-[var(--gray-400)]">
        환자를 선택하면 메모가 표시됩니다.
      </div>
    );
  }

  return <PatientMemoPanel patientId={activePatientId} />;
}

// ===== Component =====

const CustomRoomPanelInner = forwardRef<CustomRoomPanelRef, CustomRoomPanelProps>(
  function CustomRoomPanelInner(
    {
      enabledPanels,
      registrations = [],
      appointments,
      hospital,
      onPatientSelect,
      onLayoutChange,
      isLoadingData = false,
      className = "",
      theme = "light",
      usePreset,
      customConfigs,
    },
    ref
  ) {
    const effectiveEnabledPanels = enabledPanels ?? DEFAULT_ENABLED_PANELS;
    const workspaceRef = useRef<DockWorkspaceRef>(null);

    // ===== PANEL CONFIGURATION =====

    const panels: CustomPanelConfig[] = useMemo(() => {
      if (usePreset) {
        return createCustomPanelConfigsFromPreset(usePreset, customConfigs);
      } else {
        return createCustomPanelConfigs(effectiveEnabledPanels, customConfigs);
      }
    }, [effectiveEnabledPanels, usePreset, customConfigs]);

    // ===== DEFAULT LAYOUT =====

    const defaultLayout = useMemo(() => buildDefaultDockLayout(panels), [panels]);

    // ===== IMPERATIVE HANDLE (layout settings) =====

    useImperativeHandle(
      ref,
      () => ({
        resetLayout: () => {
          workspaceRef.current?.resetLayout();
        },
        isPaymentMerged: () => {
          const layout = workspaceRef.current?.getCurrentLayout();
          if (!layout) return false;
          return findPanelWithTab(layout.dockbox, PAYMENT_MERGED_TAB_ID) !== null;
        },
        togglePaymentMerge: () => {
          const ws = workspaceRef.current;
          if (!ws) return;

          const layout = ws.getCurrentLayout();
          const isMerged = findPanelWithTab(layout.dockbox, PAYMENT_MERGED_TAB_ID) !== null;

          if (isMerged) {
            // 분리: 수납 탭 → 수납대기 + 수납완료 2개 탭
            const mergedPanel = findPanelWithTab(layout.dockbox, PAYMENT_MERGED_TAB_ID);
            if (!mergedPanel) return;
            // 먼저 분리 탭들을 추가한 후 병합 탭 제거 (패널이 빈 상태가 되지 않도록)
            ws.addTab(mergedPanel.id, {
              id: PAYMENT_PENDING_TAB_ID,
              title: "수납대기",
              closable: false,
              data: { panelType: "payment", paymentFilter: "pending" },
            });
            ws.addTab(mergedPanel.id, {
              id: PAYMENT_COMPLETED_TAB_ID,
              title: "수납완료",
              closable: false,
              data: { panelType: "payment", paymentFilter: "completed" },
            });
            ws.removeTab(mergedPanel.id, PAYMENT_MERGED_TAB_ID);
          } else {
            // 병합: 수납대기 + 수납완료 → 수납 탭 하나로
            const pendingPanel = findPanelWithTab(layout.dockbox, PAYMENT_PENDING_TAB_ID);
            if (!pendingPanel) return;
            // 먼저 병합 탭을 추가한 후 분리 탭들 제거
            ws.addTab(pendingPanel.id, {
              id: PAYMENT_MERGED_TAB_ID,
              title: "수납",
              closable: false,
              data: { panelType: "payment" },
            });
            ws.removeTab(pendingPanel.id, PAYMENT_PENDING_TAB_ID);
            // completedPanel은 같은 패널일 수도 다른 패널일 수도 있으므로 재검색
            const updatedLayout = ws.getCurrentLayout();
            const completedPanel = findPanelWithTab(updatedLayout.dockbox, PAYMENT_COMPLETED_TAB_ID);
            if (completedPanel) {
              ws.removeTab(completedPanel.id, PAYMENT_COMPLETED_TAB_ID);
            }
          }
        },
      }),
      []
    );

    // ===== DATA MANAGEMENT =====

    const finalRegistrations = useMemo(() => registrations || [], [registrations]);
    const finalAppointments = useMemo(() => appointments || [], [appointments]);

    // ===== PANEL CONTENTS =====
    // 필터 1단계: 접수상태 기준 패널 분류만 적용 (reception-panel-filters.ts).
    // 헤더 UI 필터(진료실/수납 상태 등)는 CustomPanelContainer 내부에서 적용됨.
    const panelContents = useMemo(() => {
      const contents: Record<string, React.ReactNode> = {};

      panels.forEach((panel) => {
        if (panel.type === PANEL_TYPE.APPOINTMENT) {
          const panelData = finalAppointments || [];
          contents[panel.id] = (
            <CustomPanelContainer
              key={panel.id}
              panelId={panel.id}
              panelType={PANEL_TYPE.APPOINTMENT}
              data={panelData}
              hospital={hospital}
              onPatientSelect={onPatientSelect}
              theme={theme}
              isLoading={isLoadingData}
            />
          );
        } else if (panel.type === PANEL_TYPE.TREATMENT) {
          const panelData = filterRegistrationsForPanel(
            finalRegistrations || [],
            PANEL_TYPE.TREATMENT
          );
          contents[panel.id] = (
            <CustomPanelContainer
              key={panel.id}
              panelId={panel.id}
              panelType={PANEL_TYPE.TREATMENT}
              data={panelData}
              hospital={hospital}
              onPatientSelect={onPatientSelect}
              theme={theme}
              isLoading={isLoadingData}
            />
          );
        } else if (panel.type === PANEL_TYPE.PAYMENT) {
          const panelData = filterRegistrationsForPanel(
            finalRegistrations || [],
            PANEL_TYPE.PAYMENT
          );
          const pendingTabId = `${panel.id}-pending`;
          const completedTabId = `${panel.id}-completed`;
          const mergedTabId = `${panel.id}-merged`;

          // 분리 탭: 수납대기 / 수납완료
          contents[pendingTabId] = (
            <CustomPanelContainer
              key={pendingTabId}
              panelId={pendingTabId}
              panelType={PANEL_TYPE.PAYMENT}
              data={panelData}
              hospital={hospital}
              onPatientSelect={onPatientSelect}
              theme={theme}
              isLoading={isLoadingData}
              paymentFilter="pending"
            />
          );
          contents[completedTabId] = (
            <CustomPanelContainer
              key={completedTabId}
              panelId={completedTabId}
              panelType={PANEL_TYPE.PAYMENT}
              data={panelData}
              hospital={hospital}
              onPatientSelect={onPatientSelect}
              theme={theme}
              isLoading={isLoadingData}
              paymentFilter="completed"
            />
          );
          // 병합 탭: 수납 (전체)
          contents[mergedTabId] = (
            <CustomPanelContainer
              key={mergedTabId}
              panelId={mergedTabId}
              panelType={PANEL_TYPE.PAYMENT}
              data={panelData}
              hospital={hospital}
              onPatientSelect={onPatientSelect}
              theme={theme}
              isLoading={isLoadingData}
            />
          );
        } else if (panel.type === PANEL_TYPE.CHAT) {
          contents[panel.id] = <ChatPanelContent key={panel.id} />;
        }
      });

      return contents;
    }, [
      panels,
      finalAppointments,
      finalRegistrations,
      hospital,
      onPatientSelect,
      theme,
      isLoadingData,
    ]);

    // ===== LOAD TAB (기존 CustomDockingPanel에서 병합) =====

    const panelContentsRef = useRef(panelContents);
    panelContentsRef.current = panelContents;

    const loadTab = useCallback(
      (tab: TabData) => {
        const content = panelContentsRef.current[tab.id];
        if (content) {
          return (
            <div
              className="h-full w-full"
              style={{
                backgroundColor: theme === "dark" ? "var(--bg-2)" : "var(--bg-base)",
                color: "var(--fg-main)",
              }}
              tabIndex={-1}
            >
              {content}
            </div>
          );
        }

        // Loading fallback
        return (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-2">
              <MyLoadingSpinner size="md" />
              <span className="text-sm text-gray-500">패널 로딩 중...</span>
            </div>
          </div>
        );
      },
      [theme]
    );

    // ===== PANEL EXTRA (탭바 우측 컨트롤 영역) =====
    // CustomPanelContainer가 createPortal로 이 영역에 컨트롤을 렌더링한다.

    const panelExtra: PanelExtraRenderer = useCallback(
      (_activeTab: TabData, _panelId: string) => {
        return <div data-panel-extra-portal className="flex items-center gap-2" />;
      },
      []
    );

    // ===== LAYOUT CHANGE =====

    const handleLayoutChange = useCallback(
      (layout: DockLayout) => {
        onLayoutChange?.(layout);
      },
      [onLayoutChange]
    );

    // ===== RENDER =====

    if (panels.length === 0) {
      return (
        <div className="flex justify-center items-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">활성화된 패널이 없습니다</p>
            <p className="mt-2 text-sm">enabledPanels 설정을 확인해주세요</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`h-full room-panel-container ${className}`} data-theme={theme}>
        <DockWorkspace
          ref={workspaceRef}
          defaultLayout={defaultLayout}
          loadTab={loadTab}
          panelExtra={panelExtra}
          onLayoutChange={handleLayoutChange}
          settingsConfig={RECEPTION_DOCK_LAYOUT_SETTINGS}
          enableAutoSave={true}
          theme={theme}
          className="h-full pt-0 p-2"
          floatable={false}
        />
      </div>
    );
  }
);

export const CustomRoomPanel = React.memo(CustomRoomPanelInner);

// ===== CONVENIENCE EXPORTS =====

export const CustomAppointmentRoomPanel: React.FC<
  Omit<CustomRoomPanelProps, "enabledPanels" | "usePreset">
> = (props) => <CustomRoomPanel {...props} usePreset="appointmentOnly" />;

export const CustomTreatmentRoomPanel: React.FC<
  Omit<CustomRoomPanelProps, "enabledPanels" | "usePreset">
> = (props) => <CustomRoomPanel {...props} usePreset="treatmentOnly" />;

export const CustomPaymentRoomPanel: React.FC<
  Omit<CustomRoomPanelProps, "enabledPanels" | "usePreset">
> = (props) => <CustomRoomPanel {...props} usePreset="paymentOnly" />;

export const CustomAllRoomPanels: React.FC<
  Omit<CustomRoomPanelProps, "enabledPanels" | "usePreset">
> = (props) => <CustomRoomPanel {...props} usePreset="all" />;

export default CustomRoomPanel;
