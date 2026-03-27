import { useState, useEffect, useRef } from "react";
import VerbalOrderPopup from "../(payment-info)/verbal-pop-up/verbal-order-popup";
import type { ExternalReception } from "../types";
import type { Encounter } from "@/types/chart/encounter-types";
import { 접수상태 } from "@/constants/common/common-enum";
import { useScheduledOrdersByPatient } from "@/hooks/scheduled-order/use-scheduled-order";
import { formatDate } from "@/lib/date-utils";
import { useAlertBarHelpers, AlertBarContainerDirect } from "@/components/ui/alert-bar";

interface PatientInfoFooterProps {
  /** 등록 모드 여부 */
  isRegistrationMode: boolean;
  /** 비활성화 여부 */
  isDisabled?: boolean;
  /** 저장 상태 */
  saveStatus?: "idle" | "saving" | "saved" | "failed";
  /** 에러 메시지 */
  checkMsg?: string | null;
  /** 접수 데이터 */
  reception: ExternalReception | null;
  /** 접수 Encounter 데이터 */
  receptionEncounter: Encounter | null;
  /** 접수 취소 핸들러 */
  onCancelSubmit: () => void;
  /** 취소 핸들러 */
  onClear: () => void;
  /** 접수/수정 핸들러 */
  onCreateOrUpdate: (mode: "create" | "update") => void;
}

/**
 * 환자 정보 하단 액션 버튼 영역
 */
export function PatientInfoFooter({
  isRegistrationMode,
  isDisabled,
  saveStatus = "idle",
  checkMsg,
  reception,
  receptionEncounter,
  onCancelSubmit,
  onClear,
  onCreateOrUpdate,
}: PatientInfoFooterProps) {
  const [isVerbalPopupOpen, setIsVerbalPopupOpen] = useState(false);
  const alertBarHelper = useAlertBarHelpers();
  // reception별로 dismiss 상태 관리
  const [dismissedReceptions, setDismissedReceptions] = useState<Set<string>>(new Set());

  // 함수 참조를 ref로 저장하여 무한 루프 방지
  const alertBarHelperRef = useRef(alertBarHelper);

  useEffect(() => {
    alertBarHelperRef.current = alertBarHelper;
  }, [alertBarHelper]);

  const handleOpenVerbalOrder = () => {
    setIsVerbalPopupOpen(true);
  };

  // 현재 reception의 originalRegistrationId
  const currentReceptionId = reception?.originalRegistrationId || null;
  const prevReceptionIdRef = useRef<string | null>(null);

  // scheduledOrders 조회
  const { data: scheduledOrders } = useScheduledOrdersByPatient(
    Number(reception?.patientBaseInfo.patientId) || -1,
    formatDate(new Date(), "-")
  );

  // reception이 변경되면 이전 reception의 alertBar 제거 및 상태 초기화
  useEffect(() => {
    const prevId = prevReceptionIdRef.current;

    // 이전 reception의 alertBar 제거 및 dismiss 상태 초기화
    if (prevId && prevId !== currentReceptionId) {
      alertBarHelperRef.current.removeAlertBar(prevId);
      // 이전 reception의 dismiss 상태 제거
      setDismissedReceptions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(prevId);
        return newSet;
      });
    }

    // 현재 receptionId로 업데이트
    prevReceptionIdRef.current = currentReceptionId;
  }, [currentReceptionId]);

  // scheduledOrders가 있으면 알림 표시 (reception별로 관리)
  useEffect(() => {
    if (!currentReceptionId) {
      // reception이 없으면 alertBar 제거
      alertBarHelperRef.current.removeAlertBar("");
      return;
    }

    const hasScheduledOrders = scheduledOrders && scheduledOrders.length > 0;
    const isDismissed = dismissedReceptions.has(currentReceptionId);

    // scheduledOrders가 있고 dismiss되지 않았으면 표시
    if (hasScheduledOrders && !isDismissed) {
      const icon = (
        <img
          src="/icon/ic_line_medical_report.svg"
          alt="예약처방"
          className="w-4 h-4"
        />
      );
      const content = <span>예약처방이 있습니다.</span>;

      // reception.originalRegistrationId를 alertBarId로 사용
      alertBarHelperRef.current.info(icon, content, {
        id: currentReceptionId,
        onClose: () => {
          // dismiss 상태에 추가
          setDismissedReceptions((prev) => new Set(prev).add(currentReceptionId));
          alertBarHelperRef.current.removeAlertBar(currentReceptionId);
        },
      });
    } else if (!hasScheduledOrders) {
      // scheduledOrders가 없으면 제거
      alertBarHelperRef.current.removeAlertBar(currentReceptionId);
    }
  }, [scheduledOrders?.length, currentReceptionId, dismissedReceptions]);

  // reception이 null이 되거나 제거되면 alertBar 초기화 및 dismiss 상태 초기화
  useEffect(() => {
    if (!reception) {
      const prevId = prevReceptionIdRef.current;
      if (prevId) {
        alertBarHelperRef.current.removeAlertBar(prevId);
        setDismissedReceptions((prev) => {
          const newSet = new Set(prev);
          newSet.delete(prevId);
          return newSet;
        });
      }
      prevReceptionIdRef.current = null;
    }
  }, [reception]);

  return (
    <>
      {/* 예약처방 알림 영역 */}
      <AlertBarContainerDirect />

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-1)]">
        {/* V/O 버튼 - 왼쪽 */}
        <button
          type="button"
          className={`px-3.5 py-1.5 text-sm border rounded bg-[var(--bg-main)] text-[var(--gray-100)] border-[var(--border-1)] 
            ${isDisabled || reception?.receptionInfo?.status === 접수상태.수납완료
              ? "cursor-default opacity-50"
              : "cursor-pointer hover:bg-[var(--bg-2)]"
            }`}
          disabled={isDisabled || reception?.receptionInfo?.status === 접수상태.수납완료}
          onClick={handleOpenVerbalOrder}
        >
          V/O
        </button>

        {/* 우측: 버튼들 */}
        <div className="flex items-center gap-2 justify-end ml-auto">
          {saveStatus !== "idle" ? (
            <div
              className="flex justify-center items-center"
              data-testid="reception-patient-save-status"
              data-status={saveStatus}
            >
              <div className={`text-base text-${saveStatus}`}></div>
            </div>
          ) : (
            <>
              {checkMsg && (
                <div className="flex items-center mr-2 text-base text-red-500 animate-shake">
                  {checkMsg}
                </div>
              )}
              {/* 취소 버튼 - !isRegistrationMode일 때만 표시 */}
              {!isRegistrationMode && (
                <button
                  type="button"
                  className={`px-3.5 py-1.5 text-sm border rounded bg-[var(--bg-main)] text-[var(--gray-100)] border-[var(--border-1)] 
                    ${isDisabled ? "cursor-default" : "cursor-pointer hover:bg-[var(--bg-2)]"
                    }`}
                  disabled={isDisabled}
                  onClick={onClear}
                >
                  취소
                </button>
              )}
              {/* 접수 취소 버튼 - !isRegistrationMode이고 수납대기/수납완료가 아닐 때만 표시 */}
              {!isRegistrationMode &&
                !receptionEncounter &&
                reception?.receptionInfo?.status !== 접수상태.수납대기 &&
                reception?.receptionInfo?.status !== 접수상태.수납완료 && (
                  <button
                    type="button"
                    className={`px-3.5 py-1.5 text-sm border rounded bg-[var(--main-color)] text-[var(--bg-main)] border-[var(--border-1)] 
                      ${isDisabled ? "cursor-default" : "cursor-pointer hover:bg-[var(--main-color-hover)]"
                      }`}
                    disabled={isDisabled}
                    onClick={onCancelSubmit}
                  >
                    접수 취소
                  </button>
                )}
              {/* 저장 버튼 - 항상 표시 */}
              <button
                type="button"
                data-testid="reception-patient-save-button"
                className={`px-3.5 py-1.5 text-sm border rounded bg-[var(--bg-main)] text-[var(--gray-100)] border-[var(--border-1)] 
                  ${isDisabled ? "cursor-default" : "cursor-pointer hover:bg-[var(--bg-2)]"
                  }`}
                disabled={isDisabled}
                onClick={() => onCreateOrUpdate("update")}
              >
                저장
              </button>
              {/* 접수 버튼 - isRegistrationMode일 때만 표시 */}
              {isRegistrationMode && (
                <button
                  type="button"
                  data-testid="reception-patient-register-button"
                  className={`px-3.5 py-1.5 text-sm rounded ${isDisabled ? "cursor-default" : "cursor-pointer"
                    }`}
                  style={{
                    backgroundColor: "var(--main-color)",
                    color: "white",
                  }}
                  disabled={isDisabled}
                  onClick={() => onCreateOrUpdate("create")}
                >
                  접수
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* V/O 팝업 */}

      <VerbalOrderPopup
        isOpen={isVerbalPopupOpen}
        onClose={() => setIsVerbalPopupOpen(false)}
        encounterId={receptionEncounter?.id || null}
        selectedReception={reception}
      />
    </>
  );
}
