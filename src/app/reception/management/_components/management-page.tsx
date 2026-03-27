"use client";

import React, { useRef, useMemo, useEffect } from "react";

import PatientsList, { type CustomRoomPanelRef } from "../../_components/panels/(patients-list)/patients-list";
import SummaryInfo from "../../_components/panels/(summary-info)/summary-info";
import PatientsListHeader from "../../_components/panels/(shared)/patients-list-header";
import MySplitPane from "@/components/yjg/my-split-pane";
import { MyPopupMsg, MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useManagementPage } from "@/hooks/registration/page/use-management-page";
import { useEncounterSocketListener } from "@/hooks/encounter/use-encounter-socket-listener";
import { formatUTCDateToKSTString } from "@/lib/date-utils";
import { useUIStore } from "@/store/ui-store";

/**
 * Reception Management Page
 *
 * 역할:
 * - 접수 페이지의 메인 레이아웃 및 데이터 관리
 * - 기본 데이터 조회: 예약리스트, 접수리스트, 병원정보, 사용자정보 등
 * - PatientsList: 조회일 기준 예약환자, 진료실 대기, 수납 대기 리스트 표기
 * - SummaryInfo: 환자 미선택시 현황판, 선택시 환자 상세정보, 신규환자 등록 폼
 */

const RECEPTION_MAIN_SPLIT_PANE_ID = "reception-main-split";

interface ReceptionPatientsHeaderProps {
  selectedDate?: Date;
  onRequestDateChange?: (date: Date) => void;
  layoutSettings?: {
    onResetLayout?: () => void;
    onTogglePaymentMerge?: () => void;
    getIsPaymentMerged?: () => boolean;
  };
}

const ReceptionPatientsHeader = React.memo(function ReceptionPatientsHeader({
  selectedDate,
  onRequestDateChange,
  layoutSettings,
}: ReceptionPatientsHeaderProps) {
  return (
    <PatientsListHeader
      selectedDate={selectedDate}
      onRequestDateChange={onRequestDateChange}
      layoutSettings={layoutSettings}
    />
  );
});

export function ReceptionPageContent() {
  const {
    hospital,
    selectedDate,
    showMaxReceptionsPopup,
    setShowMaxReceptionsPopup,
    isLoading,
    isAppointmentsLoading,
    isRegistrationsLoading,
    isPanelDataLoading,
    isDateChangeConfirmOpen,
    filteredData,
    handlePatientSelect,
    handleDateChange,
    handleCancelDateChange,
    handleDiscardDateChange,
    handleLayoutChange,
    pendingDateChange,
  } = useManagementPage();

  // encounter 관련 테이블(encounter, order, disease) 소켓 이벤트 수신 → store 갱신
  useEncounterSocketListener();

  // ===== LAYOUT SETTINGS =====
  const patientsListRef = useRef<CustomRoomPanelRef>(null);

  const layoutSettings = useMemo(() => ({
    onResetLayout: () => patientsListRef.current?.resetLayout(),
    onTogglePaymentMerge: () => patientsListRef.current?.togglePaymentMerge(),
    getIsPaymentMerged: () => patientsListRef.current?.isPaymentMerged() ?? true,
  }), []);

  // 레이아웃 초기화 트리거 감지 (top-menubar에서 호출 시)
  const layoutResetTrigger = useUIStore((state) => state.layoutResetTrigger);
  const prevLayoutResetTriggerRef = useRef(layoutResetTrigger);

  useEffect(() => {
    // 실제로 트리거 값이 변경되었을 때만 실행
    if (prevLayoutResetTriggerRef.current === layoutResetTrigger) {
      return;
    }
    prevLayoutResetTriggerRef.current = layoutResetTrigger;

    // 레이아웃 초기화: layoutSettings.onResetLayout 호출
    layoutSettings.onResetLayout?.();
  }, [layoutResetTrigger, layoutSettings]);

  // ===== RENDER =====

  if (
    (isLoading || isAppointmentsLoading || isRegistrationsLoading) &&
    !hospital
  ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-500 animate-spin"></div>
          <p className="text-lg font-medium">데이터 로딩 중...</p>
          <p className="mt-2 text-sm text-gray-500">
            병원 정보 및 환자 데이터를 불러오고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* PatientsListHeader를 DockingPanel 밖(상단)으로 끌어올림 */}
      <ReceptionPatientsHeader
        selectedDate={selectedDate}
        onRequestDateChange={handleDateChange}
        layoutSettings={layoutSettings}
      />
      <div className="flex-1 min-h-0">
        <MySplitPane
          splitPaneId={RECEPTION_MAIN_SPLIT_PANE_ID}
          testId="reception-main-split"
          isVertical={false}
          saveMode="px"
          panes={[
            <div key="summary-info" className="w-full h-full pl-2 pb-2 bg-[var(--bg-base)]">
              <SummaryInfo
                OnDateChange={handleDateChange}
                selectedDate={selectedDate}
                hospital={hospital}
              />
            </div>,
            <div key="patients-list" className="w-full h-full">
              <PatientsList
                ref={patientsListRef}
                registrations={filteredData.registrations}
                appointments={filteredData.appointments}
                hospital={hospital}
                selectedDate={selectedDate}
                onPatientSelect={handlePatientSelect}
                onLayoutChange={handleLayoutChange}
                onRequestDateChange={handleDateChange}
                isLoadingData={isPanelDataLoading}
                theme="light"
                className="h-full"
              />
            </div>,
          ]}
          // 저장된 레이아웃이 없을 때: SummaryInfo(좌) 700px "고정", 최소 560px, 최대 800px
          initialPaneSizesPx={[700, 0]}
          minPaneSizesPx={[560, 0]}
          maxPaneSizesPx={[800, 0]}
        />
      </div>

      {/* 최대 reception 개수 초과 팝업 */}
      <MyPopupMsg
        isOpen={showMaxReceptionsPopup}
        onCloseAction={() => setShowMaxReceptionsPopup(false)}
        title="알림"
        msgType="warning"
        message="최대 5명까지 환자를 열 수 있습니다"
      />
      <MyPopupYesNo
        isOpen={isDateChangeConfirmOpen}
        onCloseAction={handleCancelDateChange}
        onConfirmAction={handleDiscardDateChange}
        title="날짜 변경 확인"
        message={`날짜 변경 시 수정중인 정보는 저장되지 않습니다.\n그래도 ${formatUTCDateToKSTString(
          (pendingDateChange || selectedDate) as Date
        )}로 변경하시겠습니까?`}
        confirmText="예"
        cancelText="아니오"
      />
    </div>
  );
}

