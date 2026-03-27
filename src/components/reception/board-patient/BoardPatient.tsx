"use client";

import { useEffect, useMemo, useCallback } from "react";
import type { BoardPatientExternalProps, BoardPatientTabId } from "./types";
import { Tabs, type TabItem } from "@/app/reception/_components/widgets/tabs";
import { PatientInfo } from "./PatientInfo";
import ViewBasicInfo from "./(patient-info)/view-basic-info";
import { PatientEncounters } from "./PatientEncounters";
import { AppointmentHistory } from "./AppointmentHistory";
import { InsuranceHistory } from "./InsuranceHistory";
import { PaymentInfo } from "./PaymentInfo";
import { NotPaid } from "./NotPaid";
import { PrintCenter } from "./PrintCenter";
import MyPopup from "@/components/yjg/my-pop-up";
import NhicForm from "@/components/nhic-form/nhic-form";
import { ReceptionInitialTab } from "@/constants/common/common-enum";
import { useReceptionViewState } from "@/hooks/reception/use-reception-view-state";
import { BoardPatientRuntimeProvider } from "./board-patient-runtime-context";

/**
 * 공용 BoardPatient 컴포넌트
 * props로 전달된 데이터와 콜백만 사용
 */
export function BoardPatient(props: BoardPatientExternalProps) {
  const {
    dirtyController,
    reception,
    receptionId,
    isDisabled = false,
    initialTab = ReceptionInitialTab.환자정보,
    onTabChange,
    onReceptionChange,
    onSubmit,
    onOpenPaymentDetail,
    onPrint,
    checkMsg,
    saveStatus,
    showUnsavedChangesConfirm,
    onConfirmUnsavedChanges,
    onCancelUnsavedChanges,
    showDuplicateReceptionConfirm,
    onConfirmDuplicateReception,
    onCancelDuplicateReception,
    showQualificationComparePopup = false,
    qualificationCompareData,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,
  } = props;

  const { viewState, updateViewState } = useReceptionViewState({
    receptionId: receptionId ?? undefined,
  });

  const activeTab =
    (viewState.activeTab as BoardPatientTabId | null) ??
    initialTab ??
    ReceptionInitialTab.환자정보;

  useEffect(() => {
    if (initialTab) {
      updateViewState({ activeTab: initialTab });
      return;
    }

    if (!viewState.activeTab) {
      updateViewState({ activeTab: ReceptionInitialTab.환자정보 });
    }
  }, [initialTab, updateViewState, viewState.activeTab]);

  const baseTabs = useMemo<TabItem[]>(
    () => [
      { id: ReceptionInitialTab.환자정보, label: "접수정보", visible: true },
      { id: ReceptionInitialTab.처방조회, label: "처방조회", visible: true },
      {
        id: ReceptionInitialTab.수납정보,
        label: "수납정보",
        visible: true,
        testId: "reception-payment-info-tab",
      },
      { id: ReceptionInitialTab.미수환불, label: "미수/환불", visible: true },
      { id: ReceptionInitialTab.보험이력변경, label: "보험이력변경", visible: true },
      { id: ReceptionInitialTab.출력센터, label: "출력센터", visible: true },
      //{ id: ReceptionInitialTab.예약현황, label: "예약현황", visible: true },

    ],
    []
  );

  const tabConfig = useMemo(() => {
    return baseTabs.map((tab) => ({
      ...tab,
      visible: viewState.perTabVisible[tab.id as ReceptionInitialTab] ?? true,
    }));
  }, [baseTabs, viewState.perTabVisible]);

  const handleTabVisibility = useCallback(
    (tabId: string, visible: boolean) => {
      updateViewState({
        perTabVisible: {
          ...viewState.perTabVisible,
          [tabId]: visible,
        },
      });

      if (activeTab === tabId && !visible) {
        const firstVisibleTab = tabConfig.find(
          (tab) => tab.id !== tabId && tab.visible
        );
        if (firstVisibleTab) {
          updateViewState({
            activeTab: firstVisibleTab.id as BoardPatientTabId,
          });
          onTabChange?.(firstVisibleTab.id as BoardPatientTabId);
        }
      }
    },
    [activeTab, onTabChange, tabConfig, updateViewState, viewState.perTabVisible]
  );

  const handleTabChange = useCallback(
    (tabId: string) => {
      const tab = tabId as BoardPatientTabId;
      updateViewState({ activeTab: tab });
      onTabChange?.(tab);
    },
    [onTabChange, updateViewState]
  );

  const finalIsDisabled = useMemo(() => {
    if (isDisabled) return true;
    if (!reception) return false;
    return false;
  }, [isDisabled, reception]);

  const isNewPatient = useMemo(() => {
    if (!reception) return true;
    const patientNo = reception?.patientBaseInfo?.patientNo as
      | number
      | string
      | null
      | undefined;
    return !patientNo || patientNo === "" || patientNo === 0;
  }, [reception]);

  const showHeaderViewBasicInfo = !!reception && !isNewPatient;

  const renderContent = () => {
    switch (activeTab) {
      case ReceptionInitialTab.환자정보:
        return (
          <PatientInfo
            reception={reception}
            receptionId={receptionId ?? undefined}
            isDisabled={finalIsDisabled}
            onChange={onReceptionChange}
            onSubmit={onSubmit}
            layout={showHeaderViewBasicInfo ? "sectionsOnly" : "full"}
            checkMsg={checkMsg}
            saveStatus={saveStatus}
            showUnsavedChangesConfirm={showUnsavedChangesConfirm}
            onConfirmUnsavedChanges={onConfirmUnsavedChanges}
            onCancelUnsavedChanges={onCancelUnsavedChanges}
            showDuplicateReceptionConfirm={showDuplicateReceptionConfirm}
            onConfirmDuplicateReception={onConfirmDuplicateReception}
            onCancelDuplicateReception={onCancelDuplicateReception}
          />
        );
      case ReceptionInitialTab.처방조회:
        return (
          <PatientEncounters
            reception={reception}
            receptionId={receptionId ?? undefined}
          />
        );
      case ReceptionInitialTab.보험이력변경:
        return (
          <InsuranceHistory
            reception={reception}
            receptionId={receptionId ?? undefined}
            isDisabled={finalIsDisabled}
            onChange={onReceptionChange}
          />
        );
      case ReceptionInitialTab.수납정보:
        return (
          <PaymentInfo
            reception={reception}
            receptionId={receptionId ?? undefined}
            isDisabled={finalIsDisabled}
            onChange={onReceptionChange}
            onOpenDetail={onOpenPaymentDetail}
          />
        );
      case ReceptionInitialTab.미수환불:
        return (
          <NotPaid
            reception={reception}
            receptionId={receptionId ?? undefined}
            isDisabled={finalIsDisabled}
          />
        );
      case ReceptionInitialTab.예약현황:
        return (
          <AppointmentHistory
            reception={reception}
            receptionId={receptionId ?? undefined}
          />
        );
      // 출력센터는 PDF 캐시/생성 상태 유지를 위해 항상 마운트 (아래 JSX에서 별도 렌더링)
      default:
        return (
          <PatientInfo
            reception={reception}
            receptionId={receptionId ?? undefined}
            isDisabled={finalIsDisabled}
            onChange={onReceptionChange}
            onSubmit={onSubmit}
            layout={showHeaderViewBasicInfo ? "sectionsOnly" : "full"}
            checkMsg={checkMsg}
            saveStatus={saveStatus}
            showUnsavedChangesConfirm={showUnsavedChangesConfirm}
            onConfirmUnsavedChanges={onConfirmUnsavedChanges}
            onCancelUnsavedChanges={onCancelUnsavedChanges}
            showDuplicateReceptionConfirm={showDuplicateReceptionConfirm}
            onConfirmDuplicateReception={onConfirmDuplicateReception}
            onCancelDuplicateReception={onCancelDuplicateReception}
          />
        );
    }
  };

  return (
    <BoardPatientRuntimeProvider
      dirtyController={dirtyController}
    >
      <div className="flex flex-col h-full w-full">
        {/* 1) 신환(또는 reception 미존재)인 경우: 환자정보만 표시하고 최상위 탭은 숨김 */}
        {!isNewPatient && (
          <>
            {/* 2) 기존 환자: ViewBasicInfo를 모든 탭 최상단에 고정 */}
            {showHeaderViewBasicInfo && (
              <div className="shrink-0">
                <ViewBasicInfo
                  reception={reception}
                  receptionId={receptionId ?? undefined}
                  isDisabled={finalIsDisabled}
                  onUpdateReception={onReceptionChange}
                />
              </div>
            )}
            <div className="p-2 shrink-0">
              <Tabs
                tabs={tabConfig}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onVisibilityChange={handleTabVisibility}
                showSettings
              />
            </div>
          </>
        )}
        <div className="flex-1 flex min-h-0 min-w-[520px] p-1">
          {isNewPatient ? (
            <PatientInfo
              reception={reception}
              receptionId={receptionId ?? undefined}
              isDisabled={finalIsDisabled}
              onChange={onReceptionChange}
              onSubmit={onSubmit}
              layout="full"
              checkMsg={checkMsg}
              saveStatus={saveStatus}
              showUnsavedChangesConfirm={showUnsavedChangesConfirm}
              onConfirmUnsavedChanges={onConfirmUnsavedChanges}
              onCancelUnsavedChanges={onCancelUnsavedChanges}
              showDuplicateReceptionConfirm={showDuplicateReceptionConfirm}
              onConfirmDuplicateReception={onConfirmDuplicateReception}
              onCancelDuplicateReception={onCancelDuplicateReception}
            />
          ) : (
            <>
              {/* 출력센터: PDF 캐시와 생성 상태를 유지하기 위해 항상 마운트 (비활성 시 숨김)
                  ※ display:none을 쓰면 position:fixed인 HiddenRenderer도 레이아웃이 제거되어
                  DOM 캡처가 불가하므로, absolute + overflow-hidden으로 시각적으로만 숨김 */}
              <div
                className={activeTab === ReceptionInitialTab.출력센터
                  ? "w-full h-full"
                  : "absolute w-0 h-0 overflow-hidden pointer-events-none"}
              >
                <PrintCenter
                  reception={reception}
                  receptionId={receptionId ?? undefined}
                  onPrint={onPrint}
                  isActive={activeTab === ReceptionInitialTab.출력센터}
                />
              </div>
              {activeTab !== ReceptionInitialTab.출력센터 && renderContent()}
            </>
          )}
        </div>
      </div>

      {/* 자격조회 비교 모드 팝업 */}
      {showQualificationComparePopup && qualificationCompareData && (
        <MyPopup
          isOpen={showQualificationComparePopup && !!qualificationCompareData}
          onCloseAction={handleQualificationCompareCancelPromise || (() => { })}
          title="자격조회 비교"
          width="800px"
          height="600px"
          closeOnOutsideClick={false}
        >
          <NhicForm
            isOpen={showQualificationComparePopup}
            onClose={handleQualificationCompareCancelPromise || (() => { })}
            onApply={handleQualificationCompareApplyPromise || (() => { })}
            onCancel={handleQualificationCompareCancelPromise || (() => { })}
            isCompareMode={true}
            parsedData={qualificationCompareData.parsedData}
            rawData={null}
          />
        </MyPopup>
      )}
    </BoardPatientRuntimeProvider>
  );
}

