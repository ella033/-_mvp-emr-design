"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
// dnd-kit 제거됨 — 커스텀 PanelContentDnD 시스템 사용
import {
  type HeaderOptions,
} from "../(shared)/(custom-docking-panel)";
import { PanelTabExtra, type PanelTabExtraConfig, PanelTabExtraLeft, type PanelTabExtraLeftConfig } from "../(shared)/(custom-docking-panel)/panel-tab-extra";
import {
  getPanelMetadata,
  PANEL_BASE_CONFIGS,
  PANEL_TYPE,
  type PanelTypeKey,
} from "../(shared)/(custom-docking-panel)/custom-docking-panel-configs";
import { useFacilityStore } from "@/store/facility-store";
import {
  공간코드,
  PaymentStatus,
  접수상태,
} from "@/constants/common/common-enum";
import {
  filterRegistrationsForPanel,
} from "./reception-panel-filters";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import type { Reception } from "@/types/common/reception-types";
import type { Hospital } from "@/types/hospital-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import InsuranceHistoryPopup from "@/components/reception/board-patient/(insurance-info)/insurance-history-popup";
import AppointmentPopup from "@/components/appointment/appointment-popup";

// Patient Card 컴포넌트 import
import PatientCard from "../(shared)/(patient-card)/patient-card";
import type { ContextMenuItem } from "../(shared)/(patient-card)/draggable-wrapper";
import {
  createContextMenuItems,
  type PanelContextType,
  type ContextMenuActionData,
} from "../(shared)/(patient-card)/patient-card-context-menu";
import { usePatientCardContextMenu } from "@/hooks/reception/use-patient-card-context-menu";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import MyPopup from "@/components/yjg/my-pop-up";
import AppointmentCancelReasonModal from "./appointment-cancel-reason-modal";
import { ConsentRequestModal } from "@/components/consent/consent-request-modal";
import { RegistrationMemoModal } from "@/app/reception/_components/registration-memo-modal";
import { AppointmentMemoModal } from "@/app/reception/_components/appointment-memo-modal";
import VitalMain from "@/components/vital/vital-main";
import type { Facility } from "@/types/facility-types";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import NhicForm from "@/components/nhic-form/nhic-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegistrationMove } from "@/hooks/registration/use-registration-move";
import { useToastHelpers } from "@/components/ui/toast";
import { useDragHandlers } from "@/hooks/registration/use-drag-handlers";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import { useReceptionTabsStore } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import {
  buildAppointmentRegistrationId,
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
} from "@/lib/registration-utils";
import { useReceptionStore } from "@/store/common/reception-store";
/**
 * CustomPanelContainer
 *
 * 역할:
 * - 각 타입별 내부 데이터들을 UI적으로 관리
 * - 필터링, 정렬, 상태 관리
 * - 헤더 UI 및 컨텐츠 렌더링
 * - 기존 room-details.tsx와 유사한 역할
 * - docking-panel-configs.ts의 메타데이터 활용
 */

export interface DropPositionInfo {
  droppedItem: any;
  previousItem?: any;
  nextItem?: any;
  targetIndex: number;
}

interface PanelContainerProps {
  panelId: string;
  panelType: PanelTypeKey; // PanelTypeKey 사용
  data: any[]; // Registration[] | Appointment[]
  hospital?: Hospital;
  onPatientSelect?: (patient: any) => void;
  onDrop?: (info: DropPositionInfo) => void;
  theme?: "light" | "dark";
  isLoading?: boolean;
  /** 수납 패널 탭 분리 시 필터 (pending | completed) */
  paymentFilter?: "pending" | "completed";
}

const CustomPanelContainer = React.forwardRef<any, PanelContainerProps>(
  (
    {
      panelId,
      panelType,
      data = [],
      hospital,
      onPatientSelect,
      onDrop,
      theme = "light",
      isLoading = false,
      paymentFilter,
    },
    ref
  ) => {
    const isReceptionInitialized = useReceptionStore((s) => s.isInitialized);
    const storeRegistrations = useReceptionStore((s) => s.registrations);
    const storeAppointments = useReceptionStore((s) => s.appointments);
    // ===== CUSTOM HOOKS (항상 같은 순서로 호출) =====
    const { getTreatmentFacilities } = useFacilityStore();
    // facilities 배열을 직접 구독하여 데이터 변경 시 리렌더링을 보장한다.
    // (getTreatmentFacilities는 Zustand 함수로 참조가 안정적이라 데이터 변경을 감지하지 못함)
    const facilities = useFacilityStore((s) => s.facilities);
    const registrationMoveMutation = useRegistrationMove();
    const { error: showError } = useToastHelpers();
    const {
      handleAppointmentToRegistration,
      showQualificationComparePopup,
      qualificationCompareData,
      handleQualificationCompareApplyPromise,
      handleQualificationCompareCancelPromise,
    } = usePatientReception();
    const { handleMarkAsVisited } = useHandleAppointment();
    const receptionTabsStore = useReceptionTabsStore();
    const {
      addOpenedReception,
      setOpenedReceptionId,
      openedReceptions,
      openedReceptionId,
      setPaymentStatusFilter,
    } = useReceptionTabsStore() as typeof receptionTabsStore & {
      setPaymentStatusFilter: (statuses: string[]) => void;
    };

    // 컨텍스트 메뉴 훅 사용 (handleCrossPanelDrop에서 사용하기 위해 먼저 호출)
    const {
      handleContextMenuAction: handleMenuAction,
      handleTransferToTreatment,
      showCancelConfirm,
      selectedRegistration,
      handleCancelConfirm,
      handleCancelCancel,
      showAppointmentCancelConfirm,
      selectedAppointment,
      confirmAppointmentCancel,
      handleAppointmentCancelCancel,
      showNoReceptionHistoryWarning,
      setShowNoReceptionHistoryWarning,
      showConsentRequestModal,
      consentRequestPatient,
      handleConsentRequestClose,
      handleConsentRequestSuccess,
      showRegistrationMemoModal,
      selectedRegistrationForMemo,
      handleRegistrationMemoClose,
      handleRegistrationMemoSuccess,
      showAppointmentMemoModal,
      selectedAppointmentForMemo,
      handleAppointmentMemoClose,
      handleAppointmentMemoSuccess,
      showVitalInputModal,
      vitalInputPatient,
      handleVitalInputClose,
      isInsuranceHistoryPopupOpen,
      insuranceHistoryRegistration,
      insuranceHistoryReception,
      handleInsuranceHistoryPopupClose,
      isAppointmentPopupOpen,
      appointmentPopupMode,
      appointmentPopupAppointmentId,
      appointmentPopupPatientInfo,
      handleAppointmentPopupClose,
      isCancelPaymentPopupOpen,
      cancelPaymentMessage,
      handleConfirmCancelPayment,
      closeCancelPaymentPopup,
      isHealthCheckOpen,
      healthCheckUrl,
      isHealthCheckIframeLoaded,
      setIsHealthCheckIframeLoaded,
      handleHealthCheckClose,
    } = usePatientCardContextMenu();

    // ===== STATE HOOKS =====
    // 드래그 상태 관리
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDraggingInPanel, setIsDraggingInPanel] = useState(false);
    const [draggedFromOtherPanel, setDraggedFromOtherPanel] = useState(false);
    const [draggedFromPanelType, setDraggedFromPanelType] = useState<
      string | null
    >(null);
    const [draggedFromPanelId, setDraggedFromPanelId] = useState<string | null>(
      null
    );
    const [draggedItemData, setDraggedItemData] = useState<any>(null); // 드래그 중인 아이템 데이터
    const [canAcceptDrop, setCanAcceptDrop] = useState(false);
    // 예약 -> 접수 전환 확인 팝업
    const [showConvertPopup, setShowConvertPopup] = useState(false);
    const [pendingConvertData, setPendingConvertData] = useState<any>(null);

    // ===== REF HOOKS =====
    const panelRef = useRef<HTMLDivElement>(null);
    const handleCrossPanelDropRef = useRef<any>(null); // handleCrossPanelDrop 함수 참조

    // ===== PORTAL TARGET (탭바 panelExtra 영역) =====
    const [portalTarget, setPortalTarget] = useState<Element | null>(null);
    const [portalTargetLeft, setPortalTargetLeft] = useState<Element | null>(null);

    // 포탈 타겟을 DOM에서 찾는 헬퍼
    const findPortalTargets = useCallback(() => {
      const panel = panelRef.current?.closest(".dock-panel");
      if (!panel) return;
      const target = panel.querySelector("[data-panel-extra-portal]");
      const targetLeft = panel.querySelector(`[data-tab-extra-left="${panelId}"]`);
      setPortalTarget(target ?? null);
      setPortalTargetLeft(targetLeft ?? null);
    }, [panelId]);

    // useLayoutEffect: DOM 커밋 직후(paint 전) 포탈 타겟 확보
    // 탭 분리→재합침 시 cleanupLayout이 box collapse하면서
    // React 키 계층이 변경되어 컴포넌트가 remount되므로
    // paint 전에 타겟을 찾아야 깜빡임 없이 포탈 렌더링 가능
    useLayoutEffect(() => {
      findPortalTargets();
    }, [findPortalTargets]);

    // MutationObserver: 탭이 추가/제거되면서 TabBar DOM이 변경될 때 포탈 타겟 갱신
    useEffect(() => {
      const panel = panelRef.current?.closest(".dock-panel");
      if (!panel) return;
      const observer = new MutationObserver(() => {
        findPortalTargets();
      });
      observer.observe(panel, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [findPortalTargets]);

    // ===== CONFIG METADATA =====
    const panelMetadata = useMemo(
      () => getPanelMetadata(panelType),
      [panelType]
    );
    const panelBaseConfig = useMemo(
      () => PANEL_BASE_CONFIGS[panelType],
      [panelType]
    );

    // ===== REF METHODS EXPOSURE =====
    React.useImperativeHandle(ref, () => ({
      // 드롭된 아이템의 ID를 받아서 앞뒤 정보를 반환
      getDropPositionInfo: (droppedItemId: string): DropPositionInfo | null => {
        // panelId 제거하고 실제 아이템 ID만 추출
        const actualItemId = droppedItemId.replace(`${panelId}-`, "");

        // filteredData에서 해당 아이템 찾기
        const targetIndex = filteredData.findIndex(
          (item: any) =>
            item.id?.toString() === actualItemId ||
            item.patientId?.toString() === actualItemId
        );

        if (targetIndex === -1) return null;

        const droppedItem = filteredData[targetIndex];
        const previousItem =
          targetIndex > 0 ? filteredData[targetIndex - 1] : undefined;
        const nextItem =
          targetIndex < filteredData.length - 1
            ? filteredData[targetIndex + 1]
            : undefined;

        return {
          droppedItem,
          previousItem,
          nextItem,
          targetIndex,
        };
      },
      // 현재 필터링된 데이터 가져오기
      getFilteredData: () => filteredData,
    }));

    // ===== STATE MANAGEMENT =====

    // 예약 패널 상태 (다중 선택 지원, 기본 전체 선택)
    const [appointmentStatus, setAppointmentStatus] = useState<string[]>([
      "all",
    ]);
    // 진료실 패널 상태
    const [treatmentRoomFilter, setTreatmentRoomFilter] = useState<string[]>(
      []
    );

    // 수납실 패널 상태 — paymentFilter prop이 있으면 해당 상태로 고정
    const [paymentStatus, setPaymentStatus] = useState<string[]>(() => {
      if (paymentFilter === "completed") {
        return [PaymentStatus.COMPLETED.toString()];
      }
      if (paymentFilter === "pending") {
        return [PaymentStatus.PENDING.toString()];
      }
      // 병합 모드 (paymentFilter 없음) → 전체 표시
      return [PaymentStatus.PENDING.toString(), PaymentStatus.COMPLETED.toString()];
    });

    // ===== DROPDOWN OPTIONS =====

    // 진료실 드롭다운 옵션
    // NOTE: facilities를 의존성에 포함하여 스토어 데이터 변경 시 콜백이 재생성되도록 한다.
    // getTreatmentFacilities만으로는 Zustand 함수 참조가 안정적이라 갱신이 누락될 수 있다.
    const getRoomDropdownOptions = useCallback(() => {
      try {
        const treatmentFacilities = getTreatmentFacilities(공간코드.진료);

        // facilities 데이터가 아직 로드되지 않았으면 빈 배열 반환
        if (!treatmentFacilities || treatmentFacilities.length === 0) {
          return [];
        }

        const filteredFacilities = treatmentFacilities.map(
          (facilityDetail: Facility) => ({
            key: facilityDetail.id.toString(),
            value: facilityDetail.name.toString(),
            label: facilityDetail.name,
          })
        );

        return filteredFacilities;
      } catch (error) {
        console.error("[PanelContainer] getRoomDropdownOptions 에러:", error);
        return [];
      }
    }, [getTreatmentFacilities, facilities]);

    // 예약 상태 드롭다운 옵션 (panel-configs의 statusTabs 사용)
    const getAppointmentStatusDropdownOptions = useCallback(() => {
      const metadata = getPanelMetadata(PANEL_TYPE.APPOINTMENT);
      const tabs = metadata.statusTabs ?? [];
      return tabs.map((tab) => ({
        key: tab.key.toString(),
        value: tab.key.toString(),
        label: tab.label,
      }));
    }, []);

    // 예약 패널 상태 localStorage 키 (헤더와 동일 규칙)
    const appointmentStatusStorageKey = useMemo(
      () => `docking-panel-status-${panelBaseConfig.name}`,
      [panelBaseConfig.name]
    );

    // ===== INITIALIZATION =====

    // 패널 간 이동 규칙 검증
    const isValidPanelTransition = useCallback(
      (
        source: string,
        target: PanelTypeKey,
        sourcePanelId?: string,
        targetPanelId?: string
      ): boolean => {
        // ============================================
        // 패널 간 이동 규칙 (엄격)
        // ============================================

        // ✅ 허용되는 이동:
        // 1. appointment → treatment (예약 → 접수 전환)
        if (source === PANEL_TYPE.APPOINTMENT && target === PANEL_TYPE.TREATMENT) {
          return true;
        }

        // 2. treatment → treatment (같은/다른 진료실)
        if (source === PANEL_TYPE.TREATMENT && target === PANEL_TYPE.TREATMENT) {
          return true;
        }

        // 3. payment → treatment (수납 → 진료 이동 허용)
        if (source === PANEL_TYPE.PAYMENT && target === PANEL_TYPE.TREATMENT) {
          return true;
        }

        // ❌ 허용되지 않는 이동:
        // 1. treatment → appointment (진료 → 예약 불가)
        // 2. appointment → payment (예약 → 수납 불가)
        // 3. payment → appointment (수납 → 예약 불가)
        // 4. treatment → payment (진료 → 수납 불가)
        // 5. payment → payment (수납 간 이동 불가)

        return false;
      },
      []
    );

    // calculateDropIndex는 전역 이벤트에서도 사용되므로 공통 훅의 것을 사용
    // (filteredData는 아래에서 정의되므로 나중에 초기화)

    // 예약 "전체 선택" 저장용 sentinel. config에 항목이 추가돼도 복원 시 현재 전체 키로 확장되도록 함.
    const APPOINTMENT_STORAGE_SENTINEL_ALL = "__all__";

    const getAppointmentStatusAllKeys = useCallback(() =>
      getAppointmentStatusDropdownOptions().map((opt) => opt.key),
      [getAppointmentStatusDropdownOptions]
    );

    const normalizeAppointmentStatusForStorage = useCallback(
      (status: string[]): string[] => {
        if (status.length === 0) return status;
        const allKeys = getAppointmentStatusAllKeys();
        const isAllSelected =
          status.includes("all") ||
          (status.length === allKeys.length && allKeys.every((k) => status.includes(k)));
        // 전체 선택이면 sentinel만 저장 → 나중에 config에 항목이 추가돼도 복원 시 현재 전체 키로 확장
        return isAllSelected ? [APPOINTMENT_STORAGE_SENTINEL_ALL] : status;
      },
      [getAppointmentStatusAllKeys]
    );

    const hasRestoredAppointmentStatus = useRef(false);
    useEffect(() => {
      if (panelType !== PANEL_TYPE.APPOINTMENT || hasRestoredAppointmentStatus.current) return;
      try {
        const options = getAppointmentStatusDropdownOptions();
        const allKeys = options.map((opt) => opt.key);
        const raw = localStorage.getItem(appointmentStatusStorageKey);
        if (raw) {
          let parsed: string[] = [];
          try {
            const arr = JSON.parse(raw);
            parsed = Array.isArray(arr)
              ? arr.map((x: unknown) => String(x)).filter(Boolean)
              : [];
          } catch {
            parsed = [];
          }
          // sentinel이면 현재 config 기준 전체 키로 복원 (추가된 항목 포함)
          if (
            parsed.length === 1 &&
            parsed[0] === APPOINTMENT_STORAGE_SENTINEL_ALL
          ) {
            hasRestoredAppointmentStatus.current = true;
            setAppointmentStatus(allKeys);
            return;
          }
          const validKeys = new Set(allKeys);
          const saved = parsed.filter((k) => validKeys.has(k));
          if (saved.length > 0) {
            hasRestoredAppointmentStatus.current = true;
            setAppointmentStatus(saved);
            return;
          }
        }
        hasRestoredAppointmentStatus.current = true;
        setAppointmentStatus(allKeys);
      } catch (e) {
        console.error("[PanelContainer] 예약 상태 localStorage 복원 실패:", e);
        hasRestoredAppointmentStatus.current = true;
      }
    }, [panelType, appointmentStatusStorageKey, getAppointmentStatusDropdownOptions]);

    useEffect(() => {
      if (panelType !== PANEL_TYPE.APPOINTMENT || !hasRestoredAppointmentStatus.current) return;
      try {
        if (appointmentStatus.length > 0) {
          const toSave = normalizeAppointmentStatusForStorage(appointmentStatus);
          localStorage.setItem(appointmentStatusStorageKey, JSON.stringify(toSave));
        }
      } catch (e) {
        console.error("[PanelContainer] 예약 상태 localStorage 저장 실패:", e);
      }
    }, [panelType, appointmentStatus, appointmentStatusStorageKey, normalizeAppointmentStatusForStorage]);

    // 옵션 데이터가 비동기로 늦게 도착할 수 있어, 패널/옵션 변경 시에도
    // "아직 선택값이 없는 경우"에 한해 전체 선택으로 보정한다.
    useEffect(() => {
      if (panelType === PANEL_TYPE.TREATMENT) {
        setTreatmentRoomFilter((prev) => {
          if (prev && prev.length > 0) return prev; // 이미 설정되어 있으면 유지
          const roomOptions = getRoomDropdownOptions();
          if (roomOptions.length > 0) {
            return roomOptions.map((opt) => opt.key);
          }
          return prev;
        });
      }
      if (panelType === PANEL_TYPE.APPOINTMENT) {
        setAppointmentStatus((prev) => {
          if (prev && prev.length > 0) return prev; // 이미 설정되어 있으면 유지
          return getAppointmentStatusDropdownOptions().map((opt) => opt.key); // 빈 선택 = 전체 선택(모든 항목 체크)
        });
      }
    }, [panelType, getRoomDropdownOptions, getAppointmentStatusDropdownOptions]);

    // 다른 패널에서 드래그 시작 감지
    // cardRefs는 useDragHandlers에서 가져오므로 나중에 정의됨
    // useEffect 내부에서 cardRefs를 사용할 때는 ref.current를 통해 접근
    const cardRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
      const handlePanelDragStart = (e: CustomEvent) => {
        const { sourcePanelId, sourcePanelType, draggedItem } = e.detail;

        // 다른 패널에서 드래그가 시작되었는지 확인
        if (sourcePanelId !== panelId) {
          setDraggedFromOtherPanel(true);
          setDraggedFromPanelType(sourcePanelType);
          setDraggedFromPanelId(sourcePanelId);
          setDraggedItemData(draggedItem); // 드래그 중인 아이템 저장
          setIsDraggingInPanel(false);

          // 이 패널이 드롭을 받을 수 있는지 확인
          const canDrop = isValidPanelTransition(
            sourcePanelType,
            panelType,
            sourcePanelId,
            panelId
          );
          setCanAcceptDrop(canDrop);
        }
      };

      const handlePanelDragEnd = () => {
        setDraggedFromOtherPanel(false);
        setDraggedFromPanelType(null);
        setDraggedFromPanelId(null);
        setDraggedItemData(null); // 드래그 아이템 데이터 초기화
        setCanAcceptDrop(false);
        setIsDraggingInPanel(false);
        setDragOverIndex(null);
      };

      // 전역 마우스 이동 이벤트로 드롭 위치 계산
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!panelRef.current) return;

        // 어떤 패널에서든 드래그 중인 경우 (자신 포함)
        const isAnyDragging = draggedFromOtherPanel || isDraggingInPanel;

        if (isAnyDragging) {
          const panelRect = panelRef.current.getBoundingClientRect();
          const isOverCurrentPanel =
            e.clientX >= panelRect.left &&
            e.clientX <= panelRect.right &&
            e.clientY >= panelRect.top &&
            e.clientY <= panelRect.bottom;

          if (isOverCurrentPanel) {
            // 자신의 패널에서 드래그 중이면서 자신 위에 있는 경우
            if (isDraggingInPanel && !draggedFromOtherPanel) {
              // appointment 패널은 내부 이동 불가능
              const canDropInOwnPanel = panelType !== PANEL_TYPE.APPOINTMENT;

              window.dispatchEvent(
                new CustomEvent("dragOverPanel", {
                  detail: {
                    panelId,
                    panelType,
                    canAcceptDrop: canDropInOwnPanel,
                  },
                })
              );

              // 드롭 가능한 경우에만 드롭 인덱스 계산
              // cardRefs는 useDragHandlers에서 가져오므로 ref를 통해 접근
              // useEffect 내부에서 직접 계산
              if (canDropInOwnPanel && cardRefsRef.current) {
                let closestIndex = 0;
                let minDistance = Infinity;
                cardRefsRef.current.forEach((element, key) => {
                  const rect = element.getBoundingClientRect();
                  const cardMiddle = rect.top + rect.height / 2;
                  const distance = Math.abs(e.clientY - cardMiddle);
                  if (distance < minDistance) {
                    minDistance = distance;
                    const index = parseInt(key);
                    closestIndex = e.clientY < cardMiddle ? index : index + 1;
                  }
                });
                // TREATMENT 패널: 진료중 카드 위로 드롭 불가
                const effectiveIndex = Math.max(closestIndex, treatingCountRef.current);
                setDragOverIndex(effectiveIndex);
              } else {
                setDragOverIndex(null);
              }
            } else {
              // 다른 패널에서 드래그해서 이 패널 위에 있는 경우
              window.dispatchEvent(
                new CustomEvent("dragOverPanel", {
                  detail: {
                    panelId,
                    panelType,
                    canAcceptDrop,
                  },
                })
              );

              // 드롭 가능한 경우에만 드롭 인덱스 계산
              // cardRefs는 useDragHandlers에서 가져오므로 ref를 통해 접근
              // useEffect 내부에서 직접 계산
              if (canAcceptDrop && cardRefsRef.current) {
                let closestIndex = 0;
                let minDistance = Infinity;
                cardRefsRef.current.forEach((element, key) => {
                  const rect = element.getBoundingClientRect();
                  const cardMiddle = rect.top + rect.height / 2;
                  const distance = Math.abs(e.clientY - cardMiddle);
                  if (distance < minDistance) {
                    minDistance = distance;
                    const index = parseInt(key);
                    closestIndex = e.clientY < cardMiddle ? index : index + 1;
                  }
                });
                // TREATMENT 패널: 진료중 카드 위로 드롭 불가
                const effectiveIndex = Math.max(closestIndex, treatingCountRef.current);
                setDragOverIndex(effectiveIndex);
              } else {
                setDragOverIndex(null);
              }
            }
          } else {
            // 패널 밖으로 나갔을 때 - 기본 상태로 리셋
            if (isDraggingInPanel && !draggedFromOtherPanel) {
              // 자신의 패널에서 드래그 중이면 다른 패널이 판단하도록
              window.dispatchEvent(
                new CustomEvent("dragOverPanel", {
                  detail: {
                    panelId: null,
                    panelType: null,
                    canAcceptDrop: true,
                  },
                })
              );
            }
            setDragOverIndex(null);
          }
        }
      };

      // 전역 마우스업 이벤트로 크로스 패널 드롭 처리
      const handleGlobalMouseUp = async (e: MouseEvent) => {
        // 다른 패널에서 드래그 중인 경우
        if (draggedFromOtherPanel && panelRef.current) {
          const panelRect = panelRef.current.getBoundingClientRect();
          const isOverCurrentPanel =
            e.clientX >= panelRect.left &&
            e.clientX <= panelRect.right &&
            e.clientY >= panelRect.top &&
            e.clientY <= panelRect.bottom;

          // 패널 위에서 드롭했지만 드롭이 불가능한 경우
          if (isOverCurrentPanel && !canAcceptDrop) {
            return;
          }

          // 패널 위에서 드롭했고, 드롭이 가능한 경우
          if (
            isOverCurrentPanel &&
            canAcceptDrop &&
            draggedItemData &&
            dragOverIndex !== null
          ) {
            // 크로스 패널 드롭 처리 (ref 사용)
            if (handleCrossPanelDropRef.current) {
              await handleCrossPanelDropRef.current(
                draggedItemData,
                draggedFromPanelType!,
                draggedFromPanelId!,
                dragOverIndex
              );
            }

            // 드롭 완료 후 전역 드래그 종료 이벤트 발생
            window.dispatchEvent(new CustomEvent("panelDragEnd"));

            // 드롭 완료 후 상태 초기화
            setDraggedFromOtherPanel(false);
            setDraggedFromPanelType(null);
            setDraggedFromPanelId(null);
            setDraggedItemData(null);
            setCanAcceptDrop(false);
            setDragOverIndex(null);
            setIsDraggingInPanel(false);
          }
        }
      };

      window.addEventListener("panelDragStart" as any, handlePanelDragStart);
      window.addEventListener("panelDragEnd" as any, handlePanelDragEnd);
      window.addEventListener("mousemove", handleGlobalMouseMove);
      // capture phase에서 먼저 실행하여 DraggableWrapper보다 우선순위 높임
      window.addEventListener("mouseup", handleGlobalMouseUp, true);

      return () => {
        window.removeEventListener(
          "panelDragStart" as any,
          handlePanelDragStart
        );
        window.removeEventListener("panelDragEnd" as any, handlePanelDragEnd);
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp, true);
      };
    }, [
      panelId,
      panelType,
      isDraggingInPanel,
      draggedFromOtherPanel,
      draggedFromPanelType,
      draggedFromPanelId,
      draggedItemData,
      canAcceptDrop,
      dragOverIndex,
      isValidPanelTransition,
      // cardRefs는 ref이므로 의존성 배열에 포함하지 않아도 됨
    ]);

    // ===== FILTERING LOGIC =====

    // 예약 패널 필터링
    const getFilteredAppointmentData = useCallback(
      (appointmentList: Appointment[]) => {
        let filtered = appointmentList;
        // 상태 필터링 (다중 선택, 진료실 필터와 동일: 빈 선택 = 전체)
        if (appointmentStatus.length === 0) {
          return filtered;
        }
        if (!appointmentStatus.includes("all")) {
          filtered = filtered.filter((appointment) =>
            appointmentStatus.includes(appointment.status.toString())
          );
        }
        return filtered;
      },
      [appointmentStatus]
    );

    // 진료실 패널 필터링
    const getFilteredTreatmentData = useCallback(
      (registrationList: Registration[]) => {
        let filtered = registrationList;

        // 진료실 옵션이 아직 없으면(초기 로딩) 필터를 적용하지 않는다.
        const roomOptions = getRoomDropdownOptions();
        if (roomOptions.length === 0) {
          return filtered;
        }

        const allKeys = roomOptions.map((opt) => opt.key);
        const validSelectedKeys = treatmentRoomFilter.filter((key) =>
          allKeys.includes(key)
        );

        // 유효한 선택값이 없으면(초기/옵션 변경 직후) 필터를 적용하지 않는다.
        if (validSelectedKeys.length === 0) {
          return filtered;
        }

        const isAllSelected =
          validSelectedKeys.length === allKeys.length &&
          allKeys.every((key) => validSelectedKeys.includes(key));

        if (!isAllSelected) {
          filtered = filtered.filter(
            (registration) =>
              registration.facilityId &&
              validSelectedKeys.includes(registration.facilityId.toString())
          );
        }

        return filtered;
      },
      [treatmentRoomFilter, getRoomDropdownOptions]
    );

    // 수납실 패널 필터링
    const getFilteredPaymentData = useCallback(
      (registrationList: Registration[]) => {
        let filtered = registrationList;

        // 상태 필터링 (다중 선택 지원)
        if (paymentStatus.length === 0) {
          return [];
        }
        if (!paymentStatus.includes("all")) {
          const wantsPending = paymentStatus.includes(
            PaymentStatus.PENDING.toString()
          );
          const wantsCompleted = paymentStatus.includes(
            PaymentStatus.COMPLETED.toString()
          );

          filtered = filtered.filter((registration) => {
            const status = registration.status?.toString() || "";
            const hasReceipt = (registration as any)?.hasReceipt === true;

            // 1) 대기: 수납대기(수납 이력 유무와 무관)
            if (wantsPending && status === 접수상태.수납대기.toString()) {
              return true;
            }

            // 2) 완료: 수납완료 + (수납대기이지만 hasReceipt가 true인 케이스도 포함)
            if (wantsCompleted) {
              if (status === 접수상태.수납완료.toString()) {
                return true;
              }
              if (status === 접수상태.수납대기.toString() && hasReceipt) {
                return true;
              }
            }

            return false;
          });
        }
        // 전체가 선택된 경우는 필터링하지 않음 (모든 상태 포함)

        return filtered;
      },
      [paymentStatus]
    );

    // ===== FILTERED DATA =====

    // 1단계: 접수상태 기준 패널 분류 (reception-panel-filters.ts 단일 소스)
    // 2단계: 헤더 필터는 아래 filteredData에서 getFiltered* 로 적용
    const panelSourceData = useMemo(() => {
      // store가 초기화되기 전에는 props 데이터를 fallback으로 사용
      if (!isReceptionInitialized) {
        return data || [];
      }

      // 초기화 후에는 store를 단일 소스로 사용
      // (소켓 이벤트로 store가 먼저 갱신되므로 props보다 최신 데이터 반영)
      if (panelType === PANEL_TYPE.APPOINTMENT) {
        return storeAppointments || [];
      }

      if (
        panelType === PANEL_TYPE.TREATMENT ||
        panelType === PANEL_TYPE.PAYMENT
      ) {
        return filterRegistrationsForPanel(
          storeRegistrations || [],
          panelType
        );
      }

      return [];
    }, [data, panelType, storeAppointments, storeRegistrations, isReceptionInitialized]);

    // 드래그 순서 변경 시 API 재조회 없이 즉시 반영하기 위한 optimistic override
    const [optimisticFilteredData, setOptimisticFilteredData] = useState<any[] | null>(null);
    // 이동 완료 시 하이라이트 효과를 위한 아이템 ID
    const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);

    // store 데이터가 변경되면 (소켓 등) optimistic override 해제
    useEffect(() => {
      setOptimisticFilteredData(null);
    }, [panelSourceData]);

    // 하이라이트 효과 자동 해제 (cardWaveEffect 1s × 2회 = 2s + 여유)
    useEffect(() => {
      if (!recentlyMovedId) return;
      const timer = setTimeout(() => setRecentlyMovedId(null), 2200);
      return () => clearTimeout(timer);
    }, [recentlyMovedId]);

    const baseFilteredData = useMemo(() => {
      if (panelType === PANEL_TYPE.APPOINTMENT) {
        return getFilteredAppointmentData(panelSourceData as Appointment[]);
      } else if (panelType === PANEL_TYPE.TREATMENT) {
        const filtered = getFilteredTreatmentData(panelSourceData as Registration[]);
        // 진료중(1) 항목을 최상단에 배치. 복수인 경우 treatingStartedAt ASC 정렬
        const treating = (filtered as Registration[])
          .filter((r) => r.status === 접수상태.진료중)
          .sort((a, b) => {
            if (!a.treatingStartedAt && !b.treatingStartedAt) return 0;
            if (!a.treatingStartedAt) return 1;
            if (!b.treatingStartedAt) return -1;
            return a.treatingStartedAt < b.treatingStartedAt ? -1 : 1;
          });
        const nonTreating = (filtered as Registration[]).filter(
          (r) => r.status !== 접수상태.진료중
        );
        return [...treating, ...nonTreating];
      } else if (panelType === PANEL_TYPE.PAYMENT) {
        return getFilteredPaymentData(panelSourceData as Registration[]);
      }
      return [];
    }, [
      panelType,
      panelSourceData,
      getFilteredAppointmentData,
      getFilteredTreatmentData,
      getFilteredPaymentData,
    ]);

    // optimistic 데이터가 있으면 우선 사용 (드래그 직후 즉시 반영)
    const filteredData = optimisticFilteredData ?? baseFilteredData;

    // TREATMENT 패널: 상단에 고정된 진료중 카드 수 (드롭 인덱스 최솟값으로 사용)
    const treatingCount = useMemo(() => {
      if (panelType !== PANEL_TYPE.TREATMENT) return 0;
      return (filteredData as Registration[]).filter(
        (r) => r.status === 접수상태.진료중
      ).length;
    }, [panelType, filteredData]);

    // useEffect/useDragHandlers 내 stale closure 없이 최신값 참조
    const treatingCountRef = useRef(0);
    treatingCountRef.current = treatingCount;

    // filteredData 기준으로 표시용 Reception 맵 생성 (소켓 등으로 filteredData 갱신 시 useMemo 재실행)
    const receptionByKey = useMemo(() => {
      const map = new Map<string, Reception>();
      if (panelType === PANEL_TYPE.APPOINTMENT) {
        (filteredData as Appointment[]).forEach((apt) => {
          const key = buildAppointmentRegistrationId(apt.id);
          map.set(key, ReceptionService.convertAppointmentToReception(apt));
        });
      } else {
        (filteredData as Registration[]).forEach((reg) => {
          const key = normalizeRegistrationId(reg.id);
          map.set(key, ReceptionService.convertRegistrationToReception(reg));
        });
      }
      return map;
    }, [filteredData, panelType]);

    // ===== TAB FOCUSED STATE (openedReceptionId 기반) =====
    // 각 탭은 독립적. TabBar의 해당 탭 요소에 직접 data-tab-focused를 설정한다.
    useEffect(() => {
      const panel = panelRef.current?.closest(".dock-panel") as HTMLElement | null;
      if (!panel) return;
      const tabEl = panel.querySelector(`[data-tab-id="${panelId}"]`) as HTMLElement | null;
      if (!tabEl) return;
      const isFocused = !!openedReceptionId && receptionByKey.has(openedReceptionId);
      if (isFocused) {
        tabEl.setAttribute("data-tab-focused", "true");
      } else {
        tabEl.removeAttribute("data-tab-focused");
      }
      // cleanup: unmount 시 attribute 제거 (탭 분리→재합침 시 stale 방지)
      return () => {
        tabEl.removeAttribute("data-tab-focused");
      };
    }, [openedReceptionId, receptionByKey, panelId]);

    // 공통 드래그 핸들러 훅 사용 (같은 패널 내 이동용)
    const { cardRefs, calculateDropIndex: calculateDropIndexFromHook, handleDragMove: handleDragMoveFromHook, createDragEndHandler: createDragEndHandlerForSamePanel, lastDragOverIndexRef } = useDragHandlers<HTMLDivElement>({
      dragOverIndex,
      setDragOverIndex,
      setIsDraggingInPanel,
      filteredData,
      containerRef: panelRef,
      onOptimisticReorder: setOptimisticFilteredData,
      onMoveHighlight: setRecentlyMovedId,
      // TREATMENT 패널: 진료중 카드 위로 드롭 불가 (진료중 카드 수만큼 상단 고정)
      minDropIndex: treatingCount,
    });

    // cardRefs를 cardRefsRef에 동기화 (useEffect에서 사용하기 위해)
    React.useEffect(() => {
      cardRefsRef.current = cardRefs.current;
    }, [cardRefs]);

    // calculateDropIndex는 전역 이벤트에서도 사용되므로 공통 훅의 것을 사용
    const calculateDropIndex = calculateDropIndexFromHook;

    // ===== EVENT HANDLERS =====

    const handleAppointmentStatusChange = useCallback((values: string[]) => {
      setAppointmentStatus(values);
    }, []);

    const handleTreatmentDropdownChange = useCallback((values: string[]) => {
      setTreatmentRoomFilter(values);
    }, []);

    const handlePatientSelect = useCallback(
      (patient: any) => {
        onPatientSelect?.(patient);
      },
      [panelType, onPatientSelect]
    );

    // 드래그 시작
    const handleDragStart = useCallback(
      (data: any, event: MouseEvent) => {
        setIsDraggingInPanel(true);
        setDraggedFromOtherPanel(false);

        // data가 { registration, appointment, type, panelType } 형태인 경우
        // 실제 registration 또는 appointment 객체를 추출
        //const draggedItem = data?.registration || data?.appointment || data;

        // 전역 이벤트로 드래그 시작 알림
        window.dispatchEvent(
          new CustomEvent("panelDragStart", {
            detail: {
              sourcePanelId: panelId,
              sourcePanelType: panelType,
              draggedItem: data,
            },
          })
        );
      },
      [panelId, panelType]
    );

    // 드래그 중 (공통 훅 사용)
    const handleDragMove = handleDragMoveFromHook;

    // 패널 간 이동 처리
    const handleCrossPanelDrop = useCallback(
      async (
        draggedItem: any,
        sourcePanelType: PanelTypeKey,
        sourcePanelId: string,
        targetIndex: number
      ) => {
        // 이동 규칙 검증
        if (
          !isValidPanelTransition(
            sourcePanelType,
            panelType,
            sourcePanelId,
            panelId
          )
        ) {
          const transitionName = {
            appointment: "예약",
            treatment: "진료",
            payment: "수납",
          };

          showError(
            `${transitionName[sourcePanelType as keyof typeof transitionName] || "알 수 없음"}에서 ` +
            `${transitionName[panelType as keyof typeof transitionName] || "알 수 없음"}(으)로 이동할 수 없습니다.`
          );
          return;
        }

        // 드롭 위치의 앞뒤 아이템 계산
        const previousItem =
          targetIndex > 0 ? filteredData[targetIndex - 1] : undefined;
        const nextItem =
          targetIndex < filteredData.length
            ? filteredData[targetIndex]
            : undefined;

        // 허용된 패널 간 이동 처리
        if (sourcePanelType === PANEL_TYPE.APPOINTMENT && panelType === PANEL_TYPE.TREATMENT) {
          // 예약을 접수로 전환 - 팝업 띄우기
          setPendingConvertData({
            draggedItem,
            previousItem,
            nextItem,
            targetIndex,
          });
          setShowConvertPopup(true);
        } else if (
          sourcePanelType === PANEL_TYPE.TREATMENT &&
          panelType === PANEL_TYPE.TREATMENT &&
          sourcePanelId !== panelId
        ) {
          // TODO 다른 진료실로 이동
          try {
            showError(
              "다른 진료실로 이동하는 API가 아직 구현되지 않았습니다. (TODO)"
            );

            // 성공 시 데이터 새로고침
            // if (typeof window !== 'undefined') {
            //   window.dispatchEvent(new CustomEvent('refreshPatientsData'));
            // }
          } catch (error: any) {
            console.error("[진료실 간 이동 실패]", error);
            const errorMessage =
              error?.data?.message ||
              error?.message ||
              "진료실 이동에 실패했습니다.";
            showError(errorMessage);
          }
        } else if (
          sourcePanelType === PANEL_TYPE.PAYMENT &&
          panelType === PANEL_TYPE.TREATMENT
        ) {
          setPendingConvertData({
            draggedItem,
            previousItem,
            nextItem,
            targetIndex,
          });
          // payment → treatment 이동 처리
          // draggedItem은 { registration, appointment, ... } 형태이므로 registration 추출
          const registration = draggedItem?.registration || draggedItem;
          if (!registration) {
            showError("접수 정보를 찾을 수 없습니다.");
            return;
          }
          await handleTransferToTreatment(registration);
        }
      },
      [
        panelType,
        panelId,
        filteredData,
        isValidPanelTransition,
        showError,
        handleTransferToTreatment,
      ]
    );

    // handleCrossPanelDrop ref 업데이트
    React.useEffect(() => {
      handleCrossPanelDropRef.current = handleCrossPanelDrop;
    }, [handleCrossPanelDrop]);

    // 패널 타입별 ContextMenu 아이템 생성 (분리된 유틸리티 사용)
    const getPanelSpecificContextMenu = useCallback(
      (
        registration?: Registration,
        appointment?: Appointment,
        headerOption?: PaymentStatus  // 수납실의 경우 PaymentStatus 전달 - 그외는 현재 미사용. todo 차후 확장가능
      ): ContextMenuItem[] => {
        return createContextMenuItems(panelType as PanelContextType, {
          registration,
          appointment,
          headerOption,
        });
      },
      [panelType]
    );

    // ContextMenu 핸들러 (우리가 만든 훅 사용)
    const handleContextMenuAction = useCallback(
      (action: string, data: any) => {
        const actionData: ContextMenuActionData = {
          registration: data.registration,
          appointment: data.appointment,
          panelType: panelType as PanelContextType,
          ...data,
        };

        // 우리가 만든 훅의 핸들러 사용
        handleMenuAction(action, actionData);
      },
      [panelType, handleMenuAction]
    );


    // 예약 -> 접수 전환 확인 (순차 처리)
    const handleConfirmConvert = async () => {
      if (!pendingConvertData) {
        setShowConvertPopup(false);
        return;
      }

      // MyPopupYesNo 팝업 닫기
      setShowConvertPopup(false);

      const { draggedItem } = pendingConvertData;
      const appointment = draggedItem?.appointment as Appointment;

      if (!appointment) {
        setPendingConvertData(null);
        return;
      }

      await handleAppointmentToRegistration(appointment, {
        receptionTime: ReceptionService.convertAppointmentToReception(appointment).receptionDateTime,
        handleMarkAsVisited: async (appointmentId: number) => {
          await handleMarkAsVisited(appointmentId);
        },
        onNewPatient: (reception: Reception) => {
          // newPatient인 경우: summary-info에 표시 (더블클릭과 동일)
          const existingReception = openedReceptions.find(
            (r) => r.originalRegistrationId === reception.originalRegistrationId
          );

          const normalizedId = normalizeRegistrationId(
            reception.originalRegistrationId
          );

          setShowNoReceptionHistoryWarning?.(true);
          setPendingConvertData(null);

          if (existingReception) {
            setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
          } else {
            addOpenedReception({
              ...(reception as any),
              originalRegistrationId: normalizedId,
            });
            setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
          }
        },
        onNoReceptionHistory: () => {
          setShowNoReceptionHistoryWarning?.(true);
          setPendingConvertData(null);
        },
        onRefresh: () => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("refreshPatientsData", {
                detail: { type: "all" }, // 예약과 접수 모두 새로고침
              })
            );
          }
        },
        onError: (error: Error) => {
          showError(error.message);
          setPendingConvertData(null);
        },
        onSuccess: () => {
          setPendingConvertData(null);
        },
      });
    };

    // 예약 -> 접수 전환 취소
    const handleCancelConvert = () => {
      setShowConvertPopup(false);
      setPendingConvertData(null);
    };

    // 공통 드래그 엔드 핸들러
    // React.memo로 인해 콜백이 stale할 수 있으므로 ref에서 최신 dragOverIndex를 읽음
    const createDragEndHandler = useCallback(
      (item: any, panelType: PanelTypeKey) => {
        return async (data: any, position: any, event: MouseEvent) => {
          // 전역 이벤트로 드래그 종료 알림
          const dragEndEvent = new CustomEvent("panelDragEnd", {
            detail: {
              targetPanelId: panelId,
              targetPanelType: panelType,
              draggedItem: item,
            },
          });
          window.dispatchEvent(dragEndEvent);

          setIsDraggingInPanel(false);

          const currentDragOverIndex = lastDragOverIndexRef.current;

          if (currentDragOverIndex === null) {
            setDragOverIndex(null);
            setDraggedFromOtherPanel(false);
            return;
          }

          // 다른 패널에서 드래그된 경우
          if (draggedFromOtherPanel && draggedFromPanelId) {
            await handleCrossPanelDrop(
              item,
              panelType,
              draggedFromPanelId,
              currentDragOverIndex
            );
            setDragOverIndex(null);
            setDraggedFromOtherPanel(false);
            return;
          }

          // 같은 패널 내 이동

          // appointment 패널 내부에서의 순서 변경은 허용하지 않음
          if (panelType === PANEL_TYPE.APPOINTMENT) {
            setDragOverIndex(null);
            return;
          }

          // 같은 패널 내 이동은 공통 훅의 핸들러 사용
          const samePanelHandler = createDragEndHandlerForSamePanel(item);
          await samePanelHandler(data, position, event);
        };
      },
      [
        draggedFromOtherPanel,
        draggedFromPanelId,
        filteredData,
        registrationMoveMutation,
        showError,
        handleCrossPanelDrop,
        panelId,
        panelType,
      ]
    );

    // ===== HEADER CONFIGURATION (CONFIG 기반) =====

    const headerOptions: HeaderOptions = useMemo(() => {
      // config에서 기본 설정 가져오기
      const baseOptions: HeaderOptions = {
        title: panelBaseConfig.name, // config에서 가져온 이름 사용
        showStatusTabs: panelType === PANEL_TYPE.PAYMENT,
        showDropdown: panelMetadata.hasDropdown,
        theme,
      };

      // 패널별 드롭다운 설정 (metadata 기반, 예약은 config statusTabs 사용)
      if (panelMetadata.hasDropdown) {
        if (panelType === PANEL_TYPE.APPOINTMENT) {
          baseOptions.dropdownConfig = {
            items: getAppointmentStatusDropdownOptions(),
            placeholder: `전체 예약 상태`,
            multiSelect: true,
            selectedValues: appointmentStatus,
            onValuesChange: handleAppointmentStatusChange,
          };
        } else if (panelType === PANEL_TYPE.TREATMENT) {
          baseOptions.dropdownConfig = {
            items: getRoomDropdownOptions(),
            placeholder: `전체 ${panelBaseConfig.name}`, // config 이름 활용
            multiSelect: true,
            selectedValues: treatmentRoomFilter,
            onValuesChange: handleTreatmentDropdownChange,
          };
        }
      }

      // 수납실 패널은 단일 선택 모드
      if (panelType === PANEL_TYPE.PAYMENT) {
        baseOptions.singleSelect = true;
      }

      return baseOptions;
    }, [
      panelType,
      theme,
      panelBaseConfig.name,
      panelMetadata.hasDropdown,
      getAppointmentStatusDropdownOptions,
      appointmentStatus,
      handleAppointmentStatusChange,
      getRoomDropdownOptions,
      treatmentRoomFilter,
      handleTreatmentDropdownChange,
    ]);

    // ===== RENDER HEADER → panelExtra 영역 (탭바 우측) =====
    // CustomDockingPanelHeader 대신 PanelTabExtra를 포탈로 렌더링

    const renderHeader = () => {
      const extraConfig: PanelTabExtraConfig = {};

      if (panelType === PANEL_TYPE.APPOINTMENT) {
        // 예약: 상태 드롭다운
        extraConfig.showDropdown = true;
        extraConfig.dropdownOptions = headerOptions.dropdownConfig?.items ?? [];
        extraConfig.dropdownPlaceholder = headerOptions.dropdownConfig?.placeholder ?? "전체 예약 상태";
        extraConfig.dropdownSelectedValues = appointmentStatus;
        extraConfig.onDropdownValuesChange = (values: string[]) => {
          handleAppointmentStatusChange(values);
        };
      } else if (panelType === PANEL_TYPE.TREATMENT) {
        // 진료실: 진료실 드롭다운
        extraConfig.showDropdown = true;
        extraConfig.dropdownOptions = headerOptions.dropdownConfig?.items ?? [];
        extraConfig.dropdownPlaceholder = headerOptions.dropdownConfig?.placeholder ?? "전체 진료실";
        extraConfig.dropdownSelectedValues = treatmentRoomFilter;
        extraConfig.onDropdownValuesChange = handleTreatmentDropdownChange;
      }

      return <PanelTabExtra config={extraConfig} />;
    };

    // ===== RENDER HEADER LEFT → panelExtraLeft 영역 (탭 이름 옆) =====
    const renderHeaderLeft = () => {
      const leftConfig: PanelTabExtraLeftConfig = {
        itemCount: filteredData.length,
      };
      return <PanelTabExtraLeft config={leftConfig} />;
    };

    // ===== RENDER CONTENT =====

    // rc-dock 탭 컨텐츠가 이전 props(isLoading=true)를 유지하는 케이스가 있어
    // 패널 로딩 판정은 store 초기화 상태만 기준으로 사용한다.
    const effectiveIsLoading = !isReceptionInitialized;

    const renderContent = () => {
      const hasIncomingData = Array.isArray(data) && data.length > 0;

      if (effectiveIsLoading && !hasIncomingData) {
        return (
          <div className="min-h-60">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <div className="flex justify-center items-center mt-4 text-sm text-gray-400">
              <div className="flex flex-col gap-2 items-center">
                <MyLoadingSpinner size="md" />
                <span>데이터 로딩 중...</span>
              </div>
            </div>
          </div>
        );
      }

      if (filteredData.length === 0) {
        return (
          <div className="flex justify-center items-center text-sm text-gray-400 min-h-60">
            <div className="text-center">
              <p>환자 없음</p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          {filteredData.map((item: any, index: number) => {
            const baseId = item.id || item.patientId || `idx-${index}`;
            const uniqueId = `${panelId}-${baseId}`;
            const isHighlighted = recentlyMovedId === baseId?.toString();

            if (panelType === PANEL_TYPE.APPOINTMENT) {
              return (
                <div
                  key={uniqueId}
                  ref={(el) => {
                    if (el) cardRefs.current.set(index.toString(), el);
                    else cardRefs.current.delete(index.toString());
                  }}
                >
                  {/* 드롭 인디케이터 - 해당 인덱스 앞에 표시 */}
                  {dragOverIndex === index &&
                    (isDraggingInPanel ||
                      (draggedFromOtherPanel && canAcceptDrop)) && (
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--info)] mr-2" />
                        <div className="flex-1 h-1 bg-[var(--info)] rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                  <PatientCard
                    appointment={item}
                    reception={receptionByKey.get(
                      buildAppointmentRegistrationId(item.id)
                    )}
                    onCardClick={() => handlePatientSelect(item)}
                    draggableId={uniqueId}
                    isDraggable={true}
                    className={isHighlighted ? "animate-blue-glow" : undefined}
                    contextMenuItems={getPanelSpecificContextMenu(
                      undefined,
                      item
                    )}
                    onContextMenuAction={handleContextMenuAction}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={createDragEndHandler(item, PANEL_TYPE.APPOINTMENT)}
                  />
                  {/* 카드 구분선 */}
                  {index < filteredData.length - 1 && (
                    <div className="h-[1px] bg-[var(--bg-3)]" />
                  )}
                  {/* 마지막 위치 드롭 인디케이터 */}
                  {dragOverIndex === filteredData.length &&
                    index === filteredData.length - 1 &&
                    (isDraggingInPanel ||
                      (draggedFromOtherPanel && canAcceptDrop)) && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--info)] mr-2" />
                        <div className="flex-1 h-1 bg-[var(--info)] rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                </div>
              );
            } else if (panelType === PANEL_TYPE.TREATMENT) {
              const isTreating = item.status === 접수상태.진료중;
              return (
                <div
                  key={uniqueId}
                  ref={(el) => {
                    if (el) cardRefs.current.set(index.toString(), el);
                    else cardRefs.current.delete(index.toString());
                  }}
                >
                  {/* 드롭 인디케이터 - 해당 인덱스 앞에 표시 (진료중 블록 위로는 표시 안 함) */}
                  {dragOverIndex === index &&
                    index >= treatingCount &&
                    (isDraggingInPanel ||
                      (draggedFromOtherPanel && canAcceptDrop)) && (
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--info)] mr-2" />
                        <div className="flex-1 h-1 bg-[var(--info)] rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                  <PatientCard
                    registration={item}
                    reception={receptionByKey.get(
                      normalizeRegistrationId(item.id)
                    )}
                    onCardClick={() => handlePatientSelect(item)}
                    draggableId={uniqueId}
                    isDraggable={!isTreating}
                    className={isHighlighted ? "animate-blue-glow" : undefined}
                    contextMenuItems={getPanelSpecificContextMenu(item)}
                    onContextMenuAction={handleContextMenuAction}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={createDragEndHandler(item, PANEL_TYPE.TREATMENT)}
                  />
                  {/* 카드 구분선 */}
                  {index < filteredData.length - 1 && (
                    <div className="h-[1px] bg-[var(--bg-3)]" />
                  )}
                  {/* 마지막 위치 드롭 인디케이터 */}
                  {dragOverIndex === filteredData.length &&
                    index === filteredData.length - 1 &&
                    (isDraggingInPanel ||
                      (draggedFromOtherPanel && canAcceptDrop)) && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--info)] mr-2" />
                        <div className="flex-1 h-1 bg-[var(--info)] rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                </div>
              );
            } else if (panelType === "payment") {
              return (
                <div
                  key={uniqueId}
                  ref={(el) => {
                    if (el) cardRefs.current.set(index.toString(), el);
                    else cardRefs.current.delete(index.toString());
                  }}
                >
                  {/* 드롭 인디케이터 - 해당 인덱스 앞에 표시 */}
                  {dragOverIndex === index &&
                    (isDraggingInPanel ||
                      (draggedFromOtherPanel && canAcceptDrop)) && (
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--info)] mr-2" />
                        <div className="flex-1 h-1 bg-[var(--info)] rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                  <PatientCard
                    registration={item}
                    reception={receptionByKey.get(
                      normalizeRegistrationId(item.id)
                    )}
                    onCardClick={() => handlePatientSelect(item)}
                    draggableId={uniqueId}
                    isDraggable={true}
                    className={isHighlighted ? "animate-blue-glow" : undefined}
                    contextMenuItems={getPanelSpecificContextMenu(
                      item,
                      undefined,
                      paymentStatus.includes(PaymentStatus.PENDING.toString())
                        ? PaymentStatus.PENDING
                        : PaymentStatus.COMPLETED
                    )}
                    onContextMenuAction={handleContextMenuAction}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={createDragEndHandler(item, PANEL_TYPE.PAYMENT)}
                  />
                  {/* 카드 구분선 */}
                  {index < filteredData.length - 1 && (
                    <div className="h-[1px] bg-[var(--bg-3)]" />
                  )}
                  {/* 마지막 위치 드롭 인디케이터 */}
                  {dragOverIndex === filteredData.length &&
                    index === filteredData.length - 1 &&
                    (isDraggingInPanel ||
                      (draggedFromOtherPanel && canAcceptDrop)) && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--info)] mr-2" />
                        <div className="flex-1 h-1 bg-[var(--info)] rounded-full shadow-lg animate-pulse" />
                      </div>
                    )}
                </div>
              );
            }

            // 다른 panelType의 경우 기본 처리
            return null;
          })}
        </div>
      );
    };

    // ===== MAIN RENDER =====

    return (
      <div
        ref={panelRef}
        className={`flex flex-col h-full transition-colors duration-150 ${draggedFromOtherPanel && canAcceptDrop && dragOverIndex !== null
          ? "ring-2 ring-[var(--violet-1)] bg-[var(--bg-main)]"
          : draggedFromOtherPanel && !canAcceptDrop
            ? "ring-2 ring-red-300 bg-red-50 opacity-60"
            : ""
          }`}
      >
        {/* 헤더 → 탭바 panelExtra 영역으로 portal */}
        {portalTarget && createPortal(renderHeader(), portalTarget)}
        {/* 좌측 헤더 → 탭바 panelExtraLeft 영역으로 portal */}
        {portalTargetLeft && createPortal(renderHeaderLeft(), portalTargetLeft)}

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-auto bg-[var(--bg-main)] relative">
          {renderContent()}

          {/* 이동 불가능 패널 오버레이 */}
          {((draggedFromOtherPanel && !canAcceptDrop) ||
            (isDraggingInPanel && panelType === "appointment")) && (
              <div className="absolute inset-0 bg-[var(--dim)]/25 flex items-center justify-center z-50"></div>
            )}
        </div>

        {/* 접수 취소 확인 팝업 */}
        <MyPopupYesNo
          isOpen={showCancelConfirm}
          onCloseAction={handleCancelCancel}
          onConfirmAction={handleCancelConfirm}
          title="접수 취소"
          message={`접수를 취소하시겠습니까?`}
          confirmText="취소"
          cancelText="닫기"
        />

        {/* 수납 취소 확인 팝업 */}
        <MyPopupYesNo
          isOpen={isCancelPaymentPopupOpen}
          onCloseAction={closeCancelPaymentPopup}
          onConfirmAction={handleConfirmCancelPayment}
          title="수납 취소"
          message={cancelPaymentMessage}
          confirmText="확인"
          cancelText="취소"
        />

        {/* 예약 취소 사유 모달 */}
        <AppointmentCancelReasonModal
          isOpen={showAppointmentCancelConfirm}
          appointment={selectedAppointment}
          onClose={handleAppointmentCancelCancel}
          onConfirm={confirmAppointmentCancel}
        />

        {/* 예약 -> 접수 전환 확인 팝업 */}
        <MyPopupYesNo
          isOpen={showConvertPopup}
          onCloseAction={handleCancelConvert}
          onConfirmAction={handleConfirmConvert}
          title="예약 접수 전환"
          message={`${pendingConvertData?.draggedItem?.appointment?.patient?.name || "-"}님을 접수하시겠습니까?`}
          confirmText="접수"
          cancelText="취소"
        />

        {/* 자격조회 비교 모드 팝업 */}
        <MyPopup
          isOpen={showQualificationComparePopup && !!qualificationCompareData}
          onCloseAction={handleQualificationCompareCancelPromise}
          title="자격조회 비교"
          width="800px"
          height="600px"
          closeOnOutsideClick={false}
        >
          <NhicForm
            isOpen={showQualificationComparePopup}
            onClose={handleQualificationCompareCancelPromise}
            onApply={handleQualificationCompareApplyPromise}
            onCancel={handleQualificationCompareCancelPromise}
            isCompareMode={true}
            parsedData={qualificationCompareData?.parsedData}
            rawData={null}
          />
        </MyPopup>

        {/* 기접수내역 없음 경고 팝업 */}
        <MyPopupMsg
          isOpen={showNoReceptionHistoryWarning || false}
          onCloseAction={() => setShowNoReceptionHistoryWarning?.(false)}
          title="예약접수"
          msgType="warning"
          message="기접수내역이 없어 접수 전환을 할 수 없습니다."
        />

        {/* 동의서 요청 모달 */}
        {consentRequestPatient && (
          <ConsentRequestModal
            isOpen={showConsentRequestModal}
            onClose={handleConsentRequestClose}
            patientId={consentRequestPatient.id}
            patientName={consentRequestPatient.name}
            onSuccess={handleConsentRequestSuccess}
          />
        )}

        {/* 접수메모 모달 */}
        {selectedRegistrationForMemo && (
          <RegistrationMemoModal
            isOpen={showRegistrationMemoModal}
            onClose={handleRegistrationMemoClose}
            registration={selectedRegistrationForMemo}
            onSuccess={handleRegistrationMemoSuccess}
          />
        )}

        {/* 예약메모 모달 */}
        {selectedAppointmentForMemo && (
          <AppointmentMemoModal
            isOpen={showAppointmentMemoModal}
            onClose={handleAppointmentMemoClose}
            appointment={selectedAppointmentForMemo}
            onSuccess={handleAppointmentMemoSuccess}
          />
        )}

        {/* 바이탈입력 팝업 */}
        {vitalInputPatient && (
          <MyPopup
            isOpen={showVitalInputModal}
            onCloseAction={handleVitalInputClose}
            title="바이탈 기록"
            localStorageKey="reception-vital-popup"
            width="900px"
            height="700px"
            minWidth="600px"
            minHeight="600px"
            closeOnOutsideClick={false}
          >
            <VitalMain patient={vitalInputPatient} onClose={handleVitalInputClose} />
          </MyPopup>
        )}

        {/* 보험이력변경 팝업 */}
        <InsuranceHistoryPopup
          isOpen={isInsuranceHistoryPopupOpen}
          onClose={handleInsuranceHistoryPopupClose}
          registration={insuranceHistoryRegistration}
          reception={insuranceHistoryReception}
        />

        {/* 예약 생성/수정 팝업 */}
        <AppointmentPopup
          isOpen={isAppointmentPopupOpen}
          onClose={handleAppointmentPopupClose}
          mode={appointmentPopupMode}
          patientInfo={appointmentPopupPatientInfo}
          appointmentId={appointmentPopupAppointmentId}
        />

        {/* 사전문진 모달 */}
        <MyPopup
          isOpen={isHealthCheckOpen}
          onCloseAction={handleHealthCheckClose}
          title="사전문진"
          width="800px"
          height="600px"
          closeOnOutsideClick={false}
        >
          {(!healthCheckUrl || !isHealthCheckIframeLoaded) && (
            <div className="absolute inset-0 p-5 flex flex-col gap-4 bg-[var(--card-bg)]">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-64 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-24 ml-4" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="flex-1 h-60 rounded-md" />
                <Skeleton className="flex-1 h-60 rounded-md" />
              </div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-16 w-full rounded-md" />
            </div>
          )}
          {healthCheckUrl && (
            <iframe
              src={healthCheckUrl}
              className={`w-full h-full border-0 ${isHealthCheckIframeLoaded ? "" : "invisible"}`}
              title="사전문진"
              onLoad={() => setIsHealthCheckIframeLoaded(true)}
            />
          )}
        </MyPopup>
      </div>
    );
  }
);

CustomPanelContainer.displayName = "CustomPanelContainer";

export default CustomPanelContainer;
