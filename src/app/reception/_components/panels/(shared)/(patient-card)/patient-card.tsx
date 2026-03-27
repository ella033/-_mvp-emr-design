// components/PatientCard.tsx (한 파일로 모든 것 관리)
import { Card, CardContent } from "@/components/ui/card";
import clsx from "clsx";
import { formatDateTime, createReceptionDateTime, formatUTCtoKSTTime } from "@/lib/date-utils";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import type { Reception } from "@/types/common/reception-types";
import type { Patient } from "@/types/patient-types";
import React, { Fragment, useMemo, useState, useEffect, useCallback, useRef } from "react";
import type { Order } from "@/types/chart/order-types";
import { useReceiptDataForReception } from "@/hooks/payment/use-payment-receipt-data";
import { useReceptionTabsStore } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VitalSignMeasurement } from "@/types/vital/vital-sign-measurement-types";
import { useSelectedDateStore } from "@/store/reception/selected-date-store";
import {
  보험구분Label,
  AppointmentStatusLabel,
  AppointmentStatus,
  초재진Label,
  접수상태Label,
  접수상태,
  PaymentStatus,
  PaymentSource,
  보험구분상세Label,
  본인확인여부,
} from "@/constants/common/common-enum";
import {
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
  showIdYN,
} from "@/lib/registration-utils";
import { usePatientCardConfig } from "@/hooks/patient/use-patient-card-config";
import { useAppointmentTypes } from "@/hooks/api/use-appointment-types";
import DraggableWrapper from "./draggable-wrapper";
import type { ContextMenuItem } from "./draggable-wrapper";
import { RegistrationsService } from "@/services/registrations-service";
import { useToastHelpers } from "@/components/ui/toast";
import { usePatientCardContextMenu } from "@/hooks/reception/use-patient-card-context-menu";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { MyPopupMsg, MyPopupYesNo } from "@/components/yjg/my-pop-up";
import MyPopup from "@/components/yjg/my-pop-up";
import { formatDate } from "@/lib/date-utils";
import { useIdentityCertificate } from "@/hooks/reception/use-identity-certificate";
import { IdentityCertificateModal } from "@/components/reception/identity-certificate-modal";
import VitalMain from "@/components/vital/vital-main";
import {
  renderExternalPlatformIcon,
  getAppointmentStatusColor,
} from "@/lib/reservation-utils";
import type { CalcResultData } from "@/types/chart/calc-result-data";
import { usePatientCharts } from "@/hooks/patient/use-patient-charts";
import { PrescriptionBadges } from "@/app/reception/_components/panels/(shared)/reception-badge";
import { calcPaymentAmounts } from "@/lib/calc-result-data-util";

import { PANEL_TYPE } from "@/constants/reception";
import { ExaminationLabelPrintDialog } from "@/components/examination-label";
import { useAgentPresence } from "@/contexts/SocketContext";
import { PatientLabelPrintDialog } from "@/components/patient-label";
import { calculateAge, getAgeOrMonth, getGender } from "@/lib/patient-utils";
import type { Gender } from "@/lib/label-printer";
import { PaymentsServices } from "@/services/payments-services";
import QuickSendMessageForm from "@/app/crm/_components/message/quick-send-message-form";
import type { QuickMessageRecipient } from "@/app/crm/_components/message/quick-message-form";
import { useQuickSendEligibility } from "@/hooks/crm/use-quick-send-eligibility";
import { ChevronDown, ChevronUp } from "lucide-react";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { DdocDocIcon } from "@/components/custom-icons";
import { getAppointmentStatusIcon } from "@/lib/appointment-icon-util";

// PaymentData 타입 정의
interface PaymentData {
  totalMedicalFee: number;
  claimAmount: number;
  patientCopay: number;
  nonCovered: number;
  deductionTotal: number;
  cutPrice: number;
}


// calcResultData를 PaymentData로 변환하는 함수
// 본인부담금총액(post-절삭) 기준, 절삭차액은 cutPrice에 보존
const calculatePaymentData = (
  calcResultData: CalcResultData | null | undefined
): PaymentData => {
  if (!calcResultData) {
    return {
      totalMedicalFee: 0,
      claimAmount: 0,
      patientCopay: 0,
      nonCovered: 0,
      deductionTotal: 0,
      cutPrice: 0,
    };
  }

  const result = calcPaymentAmounts(calcResultData);

  return {
    totalMedicalFee: result.총진료비,
    claimAmount: result.공단부담금,
    patientCopay: result.본인부담금 - result.비급여총액,
    nonCovered: result.비급여총액,
    deductionTotal: 0,
    cutPrice: result.절삭차액,
  };
};

// 접수상태별 스타일 반환 함수
const getTreatmentStatusStyle = (status: number) => {
  switch (status) {
    case 접수상태.진료중:
      return {
        backgroundColor: "var(--blue-1)",
        color: "var(--info)",
        border: "none",
      };
    case 접수상태.대기:
      return {
        backgroundColor: "var(--bg-3)",
        color: "var(--gray-100)",
        border: "none",
      };
    case 접수상태.보류:
      return {
        backgroundColor: "var(--color-picker-Orange-4)",
        color: "var(--color-picker-Orange-1)",
        border: "none",
      };
    default:
      return {
        backgroundColor: "transparent",
        color: "var(--main-color)",
        border: "none",
      };
  }
};

interface PatientCardProps {
  registration?: Registration;
  appointment?: Appointment;
  /** 리스트 카드 표시용. 있으면 표시 로직에서 우선 사용, 없으면 내부 convert (하위 호환) */
  reception?: Reception;
  onCall?: () => void;
  className?: string;
  onCardClick?: () => void;
  selectedDate?: Date;
  hideIdentityBadge?: boolean;
  hideReceptionTime?: boolean;
  hideRightFacility?: boolean;
  footerLeftExtra?: React.ReactNode;

  // DnD 관련
  draggableId?: string;
  isDraggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (data: any, event: MouseEvent) => void;
  onDragMove?: (data: any, position: any) => void;
  onDragEnd?: (data: any, position: any, event: MouseEvent) => void;

  // ContextMenu 관련
  contextMenuItems?: ContextMenuItem[];
  onContextMenuAction?: (action: string, data: any) => void;
}

function PatientCard({
  registration,
  appointment,
  reception: receptionProp,
  onCall,
  className,
  hideIdentityBadge = false,
  hideReceptionTime = false,
  hideRightFacility = false,
  footerLeftExtra,
  draggableId,
  isDraggable = true,
  isDragging = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  contextMenuItems = [],
  onContextMenuAction,
}: PatientCardProps) {
  const {
    addOpenedReception,
    openedReceptions,
    setOpenedReceptionId,
    openedReceptionId,
    setReceptionDisabled,
    setInitialTab,
    paymentStatusFilter,
    updateOpenedReception,
  } = useReceptionTabsStore();

  const { getLatestReception } = usePatientReception();

  const { selectedDate } = useSelectedDateStore();
  // 경고 팝업 상태
  const [showWarningPopup, setShowWarningPopup] = useState(false);

  const identityCertificate = useIdentityCertificate({
    patientId: registration?.patient?.id,
  });

  // 컨텍스트 메뉴 훅 사용
  const {
    showCancelConfirm,
    handleContextMenuAction: handleMenuAction,
    handleCancelConfirm,
    handleCancelCancel,
  } = usePatientCardContextMenu();

  const { currentAgentId } = useAgentPresence();

  const [isExaminationLabelDialogOpen, setIsExaminationLabelDialogOpen] =
    useState(false);
  const [examinationLabelEncounterId, setExaminationLabelEncounterId] =
    useState<string | null>(null);
  const [examinationLabelDialogPatient, setExaminationLabelDialogPatient] = useState<{
    chartNumber: string;
    patientName: string;
    age: number;
    gender: Gender;
    birthDate: string;
    patientId?: number;
    /** 검사 조회 기준일 (YYYY-MM-DD). 없으면 모달에서 당일 사용 */
    date?: string;
  } | null>(null);

  const [isPatientLabelDialogOpen, setIsPatientLabelDialogOpen] = useState(false);
  const [patientLabelDialogPatient, setPatientLabelDialogPatient] = useState<{
    chartNumber: string;
    patientName: string;
    age: number;
    gender: Gender;
    birthDate: string;
  } | null>(null);

  // 빠른 문자 발송 팝업 상태
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [messageRecipients, setMessageRecipients] = useState<
    QuickMessageRecipient[]
  >([]);
  const { checkAndPrepareQuickSend, EligibilityAlert } =
    useQuickSendEligibility();

  const {
    warning: showWarning,
    error: showError,
  } = useToastHelpers();

  // 컨텍스트 메뉴 열림 상태 (배경색 변경용)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // 바이탈 팝업 상태 (로컬 상태로 관리)
  const [isVitalPopupOpen, setIsVitalPopupOpen] = useState(false);
  const [patientForVitalPopup, setPatientForVitalPopup] =
    useState<Patient | null>(null);

  // 바이탈 팝업 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenVitalPopup = (event: CustomEvent) => {
      const { patient, registrationId } = event.detail;

      // 현재 카드의 registration ID와 일치하는 경우에만 팝업 열기
      if (registration && registration.id === registrationId) {
        setPatientForVitalPopup(patient);
        setIsVitalPopupOpen(true);
      }
    };

    window.addEventListener("openVitalPopup", handleOpenVitalPopup as EventListener);

    return () => {
      window.removeEventListener("openVitalPopup", handleOpenVitalPopup as EventListener);
    };
  }, [registration]);

  // appointment가 있으면 appointment 우선, 없으면 registration 사용
  if (!appointment && !registration) {
    return null;
  }

  // 명확한 데이터 우선순위 설정
  // registration이 있고 roomPanel이 treatment 관련이면 registration 우선
  let data: Registration | Appointment;

  if (
    registration &&
    (registration.roomPanel === PANEL_TYPE.TREATMENT ||
      (registration.roomPanel &&
        registration.roomPanel.startsWith(PANEL_TYPE.TREATMENT)) ||
      registration.roomPanel === PANEL_TYPE.PAYMENT)
  ) {
    data = registration;
  } else if (appointment && !registration) {
    // appointment만 있는 경우
    data = appointment;
  } else if (registration && !appointment) {
    // registration만 있는 경우
    data = registration;
  } else if (appointment && registration) {
    // 둘 다 있지만 treatment가 아닌 경우 - appointment 우선
    data = appointment;
  } else {
    data = registration!;
  }

  const config = usePatientCardConfig(data);
  const { data: appointmentTypes } = useAppointmentTypes();

  // appointmentTypeId로 appointmentType 찾기
  const getAppointmentType = (appointmentTypeId?: number) => {
    if (!appointmentTypeId || !appointmentTypes) return null;
    return (
      appointmentTypes.find((type) => Number(type.id) === appointmentTypeId) ||
      null
    );
  };

  // Patient 정보 추출
  const patient = appointment ? appointment.patient : registration?.patient;
  if (!patient) {
    return null;
  }

  const patientIdentityOptional = useMemo(() => {
    if (!registration?.patient) return false;
    const fromPatient = (registration.patient as any)?.identityOptional;
    if (typeof fromPatient === "boolean") return fromPatient;
    const fromEligibility =
      registration?.eligibilityCheck?.parsedData?.["본인확인예외여부"]?.data === "Y";
    return Boolean(fromEligibility);
  }, [registration]);

  const identityVerifiedAtForModal = useMemo(() => {
    if (!registration?.patient?.identityVerifiedAt) return null;
    return formatDate(registration.patient.identityVerifiedAt as any, "-");
  }, [registration?.patient?.identityVerifiedAt]);

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCall?.();
  };

  // 문자 발송 대상자 삭제 핸들러
  const handleRecipientRemove = useCallback((id: number) => {
    setMessageRecipients((prev) =>
      prev.filter((recipient) => recipient.id !== id)
    );
  }, []);

  const identityCertificateModal = registration?.patient ? (
    <IdentityCertificateModal
      isOpen={identityCertificate.isOpen}
      onClose={identityCertificate.close}
      onConfirm={identityCertificate.handleConfirm}
      onCheck={identityCertificate.handleCheck}
      recentCheckDate={identityVerifiedAtForModal}
      identityOptional={patientIdentityOptional}
    />
  ) : null;

  // 진료중 환자 정보를 disabled 상태로 열기
  const handleOpenInTreatmentPatient = async () => {
    if (registration && receptionProp) {
      const reception = receptionProp;
      const existingReception = openedReceptions.find(
        (r) => r.originalRegistrationId === reception.originalRegistrationId
      );

      // roomPanel과 status에 따라 초기 탭 설정
      const initialTab = ReceptionService.getInitialTabByRoomPanelAndStatus(
        registration.roomPanel,
        registration.status
      );
      if (initialTab) {
        setInitialTab(initialTab);
      }

      const normalizedId = normalizeRegistrationId(
        reception.originalRegistrationId
      );

      if (existingReception) {
        // 이미 열려있는 reception이라도, /medical 저장전달로 최신 registration 값이 반영된 경우가 있으므로 동기화
        updateOpenedReception(normalizedId || REGISTRATION_ID_NEW, reception as any);
        setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
        // 기존 reception이 있으면 disabled 상태로 설정
        setReceptionDisabled(normalizedId || REGISTRATION_ID_NEW, true);
      } else {
        // 환자 상세 정보 조회 후 reception 업데이트
        try {
          const refetchedRegistration =
            await RegistrationsService.getRegistration(registration.id);
          const updatedReception =
            ReceptionService.convertRegistrationToReception(
              refetchedRegistration as Registration
            );

          // 다시 한 번 중복 체크 (비동기 작업 중 추가되었을 수 있음)
          const finalExistingReception = openedReceptions.find(
            (r) =>
              r.originalRegistrationId ===
              updatedReception.originalRegistrationId
          );

          // refetchedRegistration의 roomPanel과 status로 다시 탭 결정
          const finalInitialTab = ReceptionService.getInitialTabByRoomPanelAndStatus(
            refetchedRegistration.roomPanel,
            refetchedRegistration.status
          );
          if (finalInitialTab) {
            setInitialTab(finalInitialTab);
          }

          const normalizedUpdatedId = normalizeRegistrationId(
            updatedReception.originalRegistrationId
          );

          if (finalExistingReception) {
            setOpenedReceptionId(normalizedUpdatedId || REGISTRATION_ID_NEW);
            // 기존 reception이 있으면 disabled 상태로 설정
            setReceptionDisabled(
              normalizedUpdatedId || REGISTRATION_ID_NEW,
              true
            );
          } else {
            addOpenedReception({
              ...(updatedReception as any),
              originalRegistrationId: normalizedUpdatedId,
            });
            setOpenedReceptionId(normalizedUpdatedId || REGISTRATION_ID_NEW);
            // 새로 추가된 reception을 disabled 상태로 설정
            setReceptionDisabled(
              normalizedUpdatedId || REGISTRATION_ID_NEW,
              true
            );
          }
        } catch (error) {
          showError("환자 상세 정보 조회 실패", error as string);
        }
      }
    }
  };

  const handleDoubleClick = async () => {
    // 진료중 상태 확인
    if (registration && registration.status === 접수상태.진료중) {
      setShowWarningPopup(true);
      // 팝업에서 확인을 누르면 환자 정보를 열어주되 disabled 상태로 설정
      return;
    }

    if (appointment) {
      const reception = await getLatestReception(
        appointment.patient,
        false,
        createReceptionDateTime(selectedDate),
        appointment as Appointment
      );

      // null 체크 추가
      if (!reception) {
        return;
      }

      reception.receptionInfo.appointmentId = Number(appointment?.id);
      reception.patientBaseInfo.receptionMemo = stripHtmlTags(appointment?.memo || "") || "";

      // appointment인 경우 기본적으로 patientInfo 탭 설정
      const initialTab = ReceptionService.getInitialTabByRoomPanelAndStatus(
        PANEL_TYPE.APPOINTMENT,
        undefined
      );
      if (initialTab) {
        setInitialTab(initialTab);
      }

      const normalizedId = normalizeRegistrationId(
        reception.originalRegistrationId
      );
      const existingReception = openedReceptions.find(
        (r) =>
          r.originalRegistrationId === normalizedId &&
          r.patientBaseInfo.patientNo ===
          reception.patientBaseInfo.patientNo
      );
      if (existingReception) {
        // appointment 기반 reception도 최신 값으로 동기화(메모/appointmentId 등)
        updateOpenedReception(normalizedId || REGISTRATION_ID_NEW, reception as any);
        setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
      } else {
        addOpenedReception({
          ...(reception as any),
          originalRegistrationId: normalizedId,
        });
        setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
      }
    } else if (registration && receptionProp) {
      const reception = receptionProp;
      const normalizedId = normalizeRegistrationId(
        reception.originalRegistrationId
      );
      const existingReception = openedReceptions.find(
        (r) => r.originalRegistrationId === normalizedId
      );

      // roomPanel과 status에 따라 초기 탭 설정
      const initialTab = ReceptionService.getInitialTabByRoomPanelAndStatus(
        registration.roomPanel,
        registration.status
      );
      if (initialTab) {
        setInitialTab(initialTab);
      }

      if (existingReception) {
        // 이미 열려있는 reception이라도, /medical 저장전달로 최신 registration 값이 반영된 경우가 있으므로 동기화
        updateOpenedReception(normalizedId || REGISTRATION_ID_NEW, reception as any);
        setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
      } else {
        // 환자 상세 정보 조회 후 reception 업데이트
        try {
          const refetchedRegistration =
            await RegistrationsService.getRegistration(registration.id);
          const updatedReception =
            ReceptionService.convertRegistrationToReception(
              refetchedRegistration as Registration
            );

          // 다시 한 번 중복 체크 (비동기 작업 중 추가되었을 수 있음)
          const finalExistingReception = openedReceptions.find(
            (r) =>
              r.originalRegistrationId ===
              normalizeRegistrationId(updatedReception.originalRegistrationId)
          );

          // refetchedRegistration의 roomPanel과 status로 다시 탭 결정
          const finalInitialTab = ReceptionService.getInitialTabByRoomPanelAndStatus(
            refetchedRegistration.roomPanel,
            refetchedRegistration.status
          );
          if (finalInitialTab) {
            setInitialTab(finalInitialTab);
          }

          const normalizedUpdatedId = normalizeRegistrationId(
            updatedReception.originalRegistrationId
          );

          if (finalExistingReception) {
            setOpenedReceptionId(normalizedUpdatedId || REGISTRATION_ID_NEW);
          } else {
            addOpenedReception({
              ...(updatedReception as any),
              originalRegistrationId: normalizedUpdatedId,
            });
            setOpenedReceptionId(normalizedUpdatedId || REGISTRATION_ID_NEW);
          }
        } catch (error) {
          showError("환자 상세 정보 조회 실패", error as string);
        }
      }
    }
  };

  // 기본 컨텍스트 메뉴 아이템들 (패널에서 제공하지 않을 때만 사용)
  const defaultContextMenuItems: ContextMenuItem[] = [
    {
      id: "view-details",
      label: "환자 상세보기",
    },
    {
      id: "edit-registration",
      label: "접수 정보 수정",
    },
  ];

  const finalContextMenuItems =
    contextMenuItems.length > 0 ? contextMenuItems : defaultContextMenuItems;

  // 선택된 카드인지 확인
  const isSelected = useMemo(() => {
    if (registration) {
      return openedReceptionId === registration.id?.toString();
    }
    if (appointment) {
      return openedReceptionId === "a" + appointment.id?.toString();
    }
    return false;
  }, [openedReceptionId, registration, appointment]);

  // patientChartData를 컴포넌트 최상위에서 한 번만 조회 (전역 사용)
  const hasEncounters =
    registration?.encounters && registration.encounters.length > 0;
  const patientId =
    hasEncounters && registration?.patient?.id
      ? Number(registration.patient.id)
      : undefined;
  // 수납 단계(수납대기/수납완료)에서만 charts API 호출 — 처방 뱃지(검/주/증/메)에 orders[] 필요
  // 그 외 상태에서는 registration.encounters의 calcResultData로 충분.
  // 기획 변경사항 발생가능성 有
  const needsChartData = hasEncounters &&
    (registration?.status === 접수상태.수납대기 || registration?.status === 접수상태.수납완료);
  const { data: patientChartData } = usePatientCharts({ id: needsChartData ? (patientId ?? 0) : 0 });

  // receptionEncounter를 컴포넌트 최상위에서 한 번만 계산 (전역 사용)
  const receptionEncounter = useMemo(() => {
    if (!hasEncounters || !registration?.id || !patientChartData) {
      return null;
    }

    const patientChart = patientChartData?.pages?.[0];
    if (!patientChart) {
      return null;
    }

    // registrationId가 일치하는 encounter 찾기
    return (
      patientChart?.encounters?.find(
        (encounter: any) => encounter.registrationId === registration.id
      ) ?? null
    );
  }, [hasEncounters, registration?.id, patientChartData]);

  // ===== Receipt 조회 (card에서 추가수납/기수납 계산 기준) =====
  const receiptPatientId = useMemo(() => {
    if (!registration?.patientId) return null;
    return String(registration.patientId);
  }, [registration?.patientId]);

  const receiptEncounterId = useMemo(() => {
    // registration.encounters 중 최신 encounterDateTime 기준으로 사용
    const encounters = registration?.encounters ?? [];
    const idFromRegistration =
      PaymentsServices.getLatestEncounterId(encounters as any) ?? encounters[0]?.id ?? null;
    if (idFromRegistration) return String(idFromRegistration);
    const idFromChart = (receptionEncounter as any)?.id ?? null;
    return idFromChart ? String(idFromChart) : null;
  }, [registration?.encounters, receptionEncounter]);

  const shouldFetchReceiptDetailsForCard = useMemo(() => {
    if (config.bodyType !== PANEL_TYPE.PAYMENT) return false;
    if (!registration) return false;
    if ((registration as any)?.hasReceipt !== true) return false;
    if (!receiptPatientId || !receiptEncounterId) return false;
    return true;
  }, [config.bodyType, registration, receiptPatientId, receiptEncounterId]);

  const { receiptData: activeReceiptDetails } = useReceiptDataForReception({
    patientId: receiptPatientId,
    encounterId: receiptEncounterId,
    isPaymentCompleted: registration?.status === 접수상태.수납완료,
    shouldFetchReceipts: shouldFetchReceiptDetailsForCard,
  });


  // payment 정보 계산 (footer에서 사용)
  const paymentInfo = useMemo(() => {
    if (
      config.bodyType !== "payment" ||
      !registration ||
      (registration.status !== 접수상태.수납대기 &&
        registration.status !== 접수상태.수납완료)
    ) {
      return null;
    }

    const isViewingPaymentCompletedTab =
      paymentStatusFilter?.includes(PaymentStatus.COMPLETED.toString()) ?? false;
    const isViewingPaymentPendingTab =
      paymentStatusFilter?.includes(PaymentStatus.PENDING.toString()) ?? false;

    const viewMode: "pending" | "completed" = (() => {
      // 수납실은 보통 단일 탭 선택이지만, 혹시 다중 선택/초기 상태일 수 있어 fallback 포함
      if (isViewingPaymentCompletedTab && !isViewingPaymentPendingTab) return "completed";
      if (isViewingPaymentPendingTab && !isViewingPaymentCompletedTab) return "pending";
      return registration.status === 접수상태.수납완료 ? "completed" : "pending";
    })();

    let calcResultData: CalcResultData | null = null;
    if (
      registration.encounters &&
      Array.isArray(registration.encounters) &&
      registration.encounters.length > 0
    ) {
      const latestCalc = PaymentsServices.getLatestCalcResultDataFromEncounters(
        registration.encounters as any
      );
      if (latestCalc) {
        calcResultData = latestCalc;
      }
    }
    if (!calcResultData) {
      calcResultData = receptionEncounter?.calcResultData ?? null;
    }

    const paymentData = calculatePaymentData(calcResultData);

    const hasReceipt = (registration as any)?.hasReceipt === true;

    let paymentAmount: number;
    let paymentSources: { isCard: boolean; isCash: boolean } = {
      isCard: false,
      isCash: false,
    };
    let timeStr = "";
    const currentAmount = paymentData.patientCopay + paymentData.nonCovered;
    // 기수납(Receipts 합산) 기준으로 계산
    const hasActiveReceipts = activeReceiptDetails.length > 0;
    const paidPaymentData = hasActiveReceipts
      ? PaymentsServices.sumPaymentDataFromReceipts(activeReceiptDetails)
      : null;

    const alreadyPaidPatientCopay = paidPaymentData?.patientCopay ?? 0;
    const alreadyPaidNonCovered = paidPaymentData?.nonCovered ?? 0;
    const alreadyPaidAmount =
      // 결제 금액은 receipts.payments(paymentAmount) 합산이 가장 직관적
      activeReceiptDetails.reduce((acc, receipt) => {
        const payments = receipt.payments ?? [];
        return acc + payments.reduce((pAcc, p) => pAcc + (p?.paymentAmount ?? 0), 0);
      }, 0);

    // 라벨은 "추가수납"만 표시 (대기 탭 + hasReceipt)
    const showAdditionalLabel = viewMode === "pending" && hasReceipt;

    // 추가수납용 본/비 차감 계산: 기수납(totalAmount)을 본인부담 -> 비급여 순서로 차감
    const remainingPatientCopay = Math.max(
      0,
      paymentData.patientCopay - alreadyPaidPatientCopay
    );
    const remainingNonCovered = Math.max(
      0,
      paymentData.nonCovered - alreadyPaidNonCovered
    );
    const displayPaymentData = hasReceipt
      ? {
        ...paymentData,
        patientCopay: remainingPatientCopay,
        nonCovered: remainingNonCovered,
      }
      : paymentData;

    const registrationTotalAmount = Number(
      (registration as any)?.paymentInfo?.totalAmount ?? 0
    );
    const registrationPayments = Array.isArray(
      (registration as any)?.paymentInfo?.payments
    )
      ? (registration as any)?.paymentInfo?.payments
      : [];
    const registrationPaymentSources = registrationPayments.reduce(
      (acc: { isCard: boolean; isCash: boolean }, payment: any) => {
        const source = payment?.paymentSource;
        const amount = Number(payment?.amount ?? payment?.paymentAmount ?? 0);
        if (amount <= 0) return acc;
        if (source === PaymentSource.CARD || source === "CARD") {
          acc.isCard = true;
        }
        if (source === PaymentSource.CASH || source === "CASH") {
          acc.isCash = true;
        }
        return acc;
      },
      { isCard: false, isCash: false }
    );
    const hasRegistrationPaymentInfo =
      registrationPayments.length > 0 &&
      (registrationPaymentSources.isCard || registrationPaymentSources.isCash);

    if (viewMode === "completed" && hasReceipt && hasActiveReceipts) {
      // 완료 탭: receipts 기준 기수납 내역 표시
      paymentAmount = alreadyPaidAmount;
      const flatPayments = activeReceiptDetails.flatMap((r) => r.payments ?? []);
      const hasCard = flatPayments.some(
        (p) => p.paymentSource === PaymentSource.CARD && (p.paymentAmount ?? 0) > 0
      );
      const hasCash = flatPayments.some(
        (p) => p.paymentSource === PaymentSource.CASH && (p.paymentAmount ?? 0) > 0
      );
      paymentSources = { isCard: hasCard, isCash: hasCash };

      // 시간: receiptDate(가장 최신) 기반 HH:mm
      const lastReceiptDate = [...activeReceiptDetails]
        .map((r) => r.receiptDate)
        .filter(Boolean)
        .sort()
        .slice(-1)[0];
      if (lastReceiptDate) {
        const dt = new Date(lastReceiptDate);
        timeStr =
          dt.getHours().toString().padStart(2, "0") +
          ":" +
          dt.getMinutes().toString().padStart(2, "0");
      }
    } else {
      // 대기 탭
      // - hasReceipt=false: 기존처럼 현재 금액
      // - hasReceipt=true: 추가 수납분(현재 - 기수납)만 표시
      paymentAmount = hasReceipt
        ? Math.max(0, remainingPatientCopay + remainingNonCovered)
        : currentAmount;
    }

    // 완료 탭에서 receipt가 stale/부분 반영인 경우, registration 총액을 우선 표시
    if (
      viewMode === "completed" &&
      registrationTotalAmount > 0 &&
      (!hasActiveReceipts || paymentAmount < registrationTotalAmount)
    ) {
      paymentAmount = registrationTotalAmount;
      if (hasRegistrationPaymentInfo) {
        paymentSources = registrationPaymentSources;
      }
      if (!timeStr) {
        const lastPaymentTime = [...registrationPayments]
          .map((payment) => payment?.paymentCreateTime)
          .filter(Boolean)
          .sort()
          .slice(-1)[0];
        if (lastPaymentTime) {
          const dt = new Date(lastPaymentTime);
          timeStr =
            dt.getHours().toString().padStart(2, "0") +
            ":" +
            dt.getMinutes().toString().padStart(2, "0");
        }
      }
    }

    const 미수환불금액 = 0; // TODO: 미수환불금액 계산 로직 추가

    // paymentCreateTime 가져오기 (KST 변환용)
    let paymentCreateTime: string | null = null;
    if (viewMode === "completed") {
      const lastPaymentTime = [...registrationPayments]
        .map((payment) => payment?.paymentCreateTime)
        .filter(Boolean)
        .sort()
        .slice(-1)[0];
      if (lastPaymentTime) {
        paymentCreateTime = lastPaymentTime;
      }
    }

    return {
      timeStr,
      paymentData: displayPaymentData,
      paymentAmount,
      미수환불금액,
      paymentSources,
      isPaid: viewMode === "completed",
      hasPaymentInfo:
        viewMode === "completed" &&
        ((hasReceipt && hasActiveReceipts) || hasRegistrationPaymentInfo),
      viewLabel: showAdditionalLabel ? "추가수납" : "",
      paymentCreateTime,
    };
  }, [config.bodyType, registration, receptionEncounter, paymentStatusFilter, activeReceiptDetails]);

  const isCanceledAppointment =
    config.bodyType === "appointment" &&
    appointment?.status === AppointmentStatus.CANCELED;

  const cardContent = (
    <div className={clsx(isCanceledAppointment && "relative")}>
      {isCanceledAppointment && (
        <div
          className="absolute inset-0 rounded-none bg-[var(--bg-1)] opacity-50 pointer-events-none z-10"
          aria-hidden
        />
      )}
      <Card
        data-testid="reception-patient-card"
        data-panel-type={config.bodyType}
        data-patient-name={patient?.name ?? ""}
        data-registration-id={registration?.id ?? ""}
        data-selected={isSelected ? "true" : "false"}
        data-payment-state={paymentInfo ? (paymentInfo.isPaid ? "completed" : "pending") : ""}
        className={clsx(
          "pt-1 pb-1 shadow-none transition-all duration-300 cursor-pointer h-fit border-0 hover:bg-[var(--bg-3)] transition-colors rounded-none",
          isDragging ? "w-[500px] border border-[var(--gray-200)]" : "w-full min-w-70",
          !isDragging && isSelected && "border-l-[4px] border-l-[var(--second-color-2-2)] bg-[var(--bg-card)]",
          !isDragging && !isSelected && isContextMenuOpen && "bg-[var(--bg-card)]",
          className
        )}
        onDoubleClick={handleDoubleClick}
      >
        <CardContent className="flex flex-col gap-1 px-2 py-1.5">
          {/* Header */}
          <PatientCardHeader
            reception={receptionProp}
            patient={patient}
            config={config}
            appointment={appointment}
            registration={registration}
            hideIdentityBadge={hideIdentityBadge}
            onIdentityBadgeClick={identityCertificate.handleOpen}
            paymentInfo={paymentInfo}
            selectedDate={selectedDate}
          />

          {/* Body - panelType에 따른 내용 */}
          <PatientCardBodyWrapper
            config={config}
            appointment={appointment}
            registration={registration}
            reception={receptionProp}
            receptionEncounter={receptionEncounter}
            hasEncounters={hasEncounters ?? false}
            hideReceptionTime={hideReceptionTime}
            patient={patient}
            getAppointmentType={getAppointmentType}
            paymentInfo={paymentInfo}
          />

        </CardContent>
      </Card>
    </div>
  );

  const stableDraggableId = useMemo(() => {
    if (draggableId) return draggableId;
    const regBase = registration?.id ?? registration?.patientId;
    const apptBase = appointment?.id ?? appointment?.patientId;
    const fallback =
      regBase ??
      apptBase ??
      (patient?.id !== undefined ? `patient-${patient.id}` : undefined);
    return fallback ? String(fallback) : undefined;
  }, [draggableId, registration?.id, registration?.patientId, appointment?.id, appointment?.patientId, patient?.id]);

  // DraggableWrapper로 감싸거나 그냥 반환
  // isDraggable이 false여도 DraggableWrapper를 렌더링하여 contextMenu가 동작하도록 함
  // (disabled prop으로 드래그만 비활성화)
  if (stableDraggableId) {
    const handleContextMenuAction = async (action: string, data: any) => {
      const isPatientLabelPrintAction = action === "patient-label-print";
      const isExaminationLabelPrintAction = action === "examination-label-print";
      const isQuickMessageSendAction = action === "quick-message-send";

      if (isPatientLabelPrintAction) {
        const registrationFromMenu = data?.registration as Registration | undefined;
        const appointmentFromMenu = data?.appointment as Appointment | undefined;

        const labelPatient = mapToPatientLabelDialogPatient({
          registration: registrationFromMenu,
          appointment: appointmentFromMenu,
        });

        if (!labelPatient) {
          showWarning("환자 라벨 출력을 실행할 수 없습니다.");
          return;
        }

        setPatientLabelDialogPatient(labelPatient);
        setIsPatientLabelDialogOpen(true);
        return;
      }

      if (isExaminationLabelPrintAction) {
        const registrationFromMenu = data?.registration as Registration | undefined;
        const appointmentFromMenu = data?.appointment as Appointment | undefined;

        if (registrationFromMenu) {
          const labelPatient = mapToPatientLabelDialogPatient({
            registration: registrationFromMenu,
          });
          if (!labelPatient) {
            showWarning("검사 라벨 출력을 실행할 수 없습니다.");
            return;
          }

          void (async function openExaminationLabelDialog() {
            const encounterId =
              registrationFromMenu?.encounters?.[0]?.id ??
              (await RegistrationsService.getRegistration(registrationFromMenu.id))
                ?.encounters?.[0]?.id ??
              String(registrationFromMenu.id);

            const treatmentDate =
              registrationFromMenu.receptionDateTime?.slice(0, 10) ??
              registrationFromMenu.encounters?.[0]?.encounterDateTime?.slice(0, 10) ??
              new Date().toISOString().slice(0, 10);

            setExaminationLabelEncounterId(encounterId);
            setExaminationLabelDialogPatient({
              ...labelPatient,
              date: treatmentDate,
            });
            setIsExaminationLabelDialogOpen(true);
          })();
        } else if (appointmentFromMenu) {
          // 예약 카드: registration 없이 빈 검체 상태로 다이얼로그 열기
          const labelPatient = mapToPatientLabelDialogPatient({
            appointment: appointmentFromMenu,
          });
          if (!labelPatient) {
            showWarning("검사 라벨 출력을 실행할 수 없습니다.");
            return;
          }

          setExaminationLabelEncounterId("");
          setExaminationLabelDialogPatient({
            ...labelPatient,
            date: new Date().toISOString().slice(0, 10),
          });
          setIsExaminationLabelDialogOpen(true);
        } else {
          showWarning("검사 라벨 출력을 실행할 수 없습니다.");
        }

        return;
      }

      if (isQuickMessageSendAction) {
        const registrationFromMenu = data?.registration as Registration | undefined;
        const appointmentFromMenu = data?.appointment as Appointment | undefined;
        const menuPatient = appointmentFromMenu?.patient || registrationFromMenu?.patient;

        const patientId =
          (menuPatient as any)?.id ??
          (appointmentFromMenu as any)?.patientId ??
          (menuPatient as any)?.patientId ??
          undefined;
        const patientName = String((menuPatient as any)?.name ?? "");

        if (!patientId || !patientName) {
          showWarning("문자 발송을 실행할 수 없습니다.");
          return;
        }

        const recipients: QuickMessageRecipient[] = [
          { id: Number(patientId), name: patientName },
        ];
        await checkAndPrepareQuickSend(recipients, {
          onAllSendable: (r) => {
            setMessageRecipients(r);
            setIsQuickSendOpen(true);
          },
          onPartialSendable: (r) => {
            setMessageRecipients(r);
            setIsQuickSendOpen(true);
          },
          onNoneSendable: () => { },
        });
        return;
      }

      (onContextMenuAction || handleMenuAction)(action, data);
    };

    return (
      <>
        <DraggableWrapper
          id={stableDraggableId}
          data={{
            registration,
            appointment,
            reception: receptionProp,
            type: "patient-card",
            panelType: config.bodyType || PANEL_TYPE.TREATMENT,
          }}
          contextMenuItems={finalContextMenuItems}
          onContextMenuAction={handleContextMenuAction}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          disabled={!isDraggable}
          onContextMenuVisibilityChange={setIsContextMenuOpen}
        >
          {cardContent}
        </DraggableWrapper>

        {identityCertificateModal}

        {/* 검사 라벨 출력 팝업 */}
        {examinationLabelEncounterId != null && (
          <ExaminationLabelPrintDialog
            open={isExaminationLabelDialogOpen}
            onOpenChange={(nextOpen) => {
              setIsExaminationLabelDialogOpen(nextOpen);
              if (!nextOpen) {
                setExaminationLabelEncounterId(null);
                setExaminationLabelDialogPatient(null);
              }
            }}
            patient={examinationLabelDialogPatient}
            patientId={examinationLabelDialogPatient?.patientId}
            date={examinationLabelDialogPatient?.date}
            encounterId={examinationLabelEncounterId}
            printMode="api"
            agentId={currentAgentId ?? undefined}
          />
        )}

        {/* 환자 라벨 출력 팝업 */}
        {patientLabelDialogPatient && (
          <PatientLabelPrintDialog
            open={isPatientLabelDialogOpen}
            onOpenChange={(nextOpen) => {
              setIsPatientLabelDialogOpen(nextOpen);
              if (!nextOpen) {
                setPatientLabelDialogPatient(null);
              }
            }}
            patient={patientLabelDialogPatient}
            agentId={currentAgentId ?? undefined}
          />
        )}

        {/* 빠른 문자 발송 팝업 */}
        <QuickSendMessageForm
          isOpen={isQuickSendOpen}
          onClose={() => setIsQuickSendOpen(false)}
          recipients={messageRecipients}
          onRecipientRemove={handleRecipientRemove}
        />
        <EligibilityAlert />

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

        {/* 진료중 환자 경고 팝업 */}
        <MyPopupMsg
          isOpen={showWarningPopup}
          onCloseAction={() => setShowWarningPopup(false)}
          onConfirmAction={() => {
            setShowWarningPopup(false);
            // 진료중 환자 정보를 disabled 상태로 열기
            handleOpenInTreatmentPatient();
          }}
          title="경고"
          msgType="warning"
          message="진료중인 환자는 수정이 불가능합니다."
          confirmText="확인"
        />

        {/* 바이탈입력 팝업 */}
        {patientForVitalPopup && (
          <MyPopup
            isOpen={isVitalPopupOpen}
            onCloseAction={() => setIsVitalPopupOpen(false)}
            title="바이탈 기록"
            localStorageKey="reception-vital-popup"
            width="900px"
            height="700px"
            minWidth="600px"
            minHeight="600px"
            closeOnOutsideClick={false}
          >
            <VitalMain patient={patientForVitalPopup} />
          </MyPopup>
        )}
      </>
    );
  }

  return (
    <>
      {cardContent}
      {identityCertificateModal}

      {/* 빠른 문자 발송 팝업 */}
      <QuickSendMessageForm
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        recipients={messageRecipients}
        onRecipientRemove={handleRecipientRemove}
      />
      <EligibilityAlert />

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

      {/* 진료중 환자 경고 팝업 */}
      <MyPopupMsg
        isOpen={showWarningPopup}
        onCloseAction={() => setShowWarningPopup(false)}
        onConfirmAction={() => {
          setShowWarningPopup(false);
          // 진료중 환자 정보를 disabled 상태로 열기
          handleOpenInTreatmentPatient();
        }}
        title="경고"
        msgType="warning"
        message="진료중인 환자는 수정이 불가능합니다."
        confirmText="확인"
      />

      {/* 바이탈입력 팝업 */}
      {patientForVitalPopup && (
        <MyPopup
          isOpen={isVitalPopupOpen}
          onCloseAction={() => setIsVitalPopupOpen(false)}
          title="바이탈 기록"
          localStorageKey="reception-vital-popup"
          width="900px"
          height="700px"
          minWidth="600px"
          minHeight="600px"
          closeOnOutsideClick={false}
        >
          <VitalMain patient={patientForVitalPopup} />
        </MyPopup>
      )}
    </>
  );
}

// 드래그 중 불필요한 리렌더 방지를 위한 React.memo 적용
// 함수 prop(onDragStart, onDragMove, onDragEnd 등)은 DraggableWrapper의 callbacksRef 패턴으로
// 항상 최신 참조가 보장되므로 비교에서 제외
export default React.memo(PatientCard, (prevProps, nextProps) => {
  return (
    prevProps.registration === nextProps.registration &&
    prevProps.appointment === nextProps.appointment &&
    prevProps.reception === nextProps.reception &&
    prevProps.draggableId === nextProps.draggableId &&
    prevProps.isDraggable === nextProps.isDraggable &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.className === nextProps.className &&
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.footerLeftExtra === nextProps.footerLeftExtra
  );
});

// Header 컴포넌트
function PatientCardHeader({
  patient,
  reception,
  config,
  appointment,
  registration,
  hideIdentityBadge = false,
  onIdentityBadgeClick,
  paymentInfo,
  selectedDate,
}: {
  patient: any;
  reception?: Reception;
  config: ReturnType<typeof usePatientCardConfig>;
  appointment?: Appointment;
  registration?: Registration;
  hideIdentityBadge?: boolean;
  onIdentityBadgeClick?: (e: React.MouseEvent) => void;
  paymentInfo?: {
    timeStr: string;
    paymentData: PaymentData;
    paymentAmount: number;
    미수환불금액: number;
    paymentSources: { isCard: boolean; isCash: boolean };
    isPaid: boolean;
    hasPaymentInfo: boolean;
    viewLabel: string;
    paymentCreateTime?: string | null;
  } | null;
  selectedDate?: Date;
}) {
  const { isCheckNoneRegistration } = usePatientReception();

  // rrnView 앞 6자리 가져오기
  const rrnViewFront6 = patient?.rrnView?.slice(0, 6) || patient.birthDate?.slice(2, 8) || "";
  const genderText = patient?.gender ? getGender(patient.gender, "ko") : "";
  const ageText = patient?.birthDate ? getAgeOrMonth(patient.birthDate, "en") : "";

  // PAYMENT_TYPE 수납완료인 경우 납부방법표기와 금액을 타이틀 라인 오른쪽에 직접 배치
  const isPaymentCompleted = config.bodyType === PANEL_TYPE.PAYMENT && paymentInfo?.isPaid;

  // V/S 표시 여부
  const showVitalSignBadge = useMemo(() => {
    if (
      config.bodyType !== PANEL_TYPE.TREATMENT &&
      config.bodyType !== PANEL_TYPE.PAYMENT
    ) {
      return false;
    }

    if (reception?.patientBaseInfo?.isVitalToday) {
      return true;
    }
  }, [config.bodyType, reception?.patientBaseInfo?.isVitalToday]);

  return (
    <div className="flex flex-row flex-1 justify-between items-center">
      <div className="flex flex-row flex-wrap flex-1 gap-1 items-center">
        {/* 신환표시 */}
        {config.showNewPatientBadge && reception?.patientBaseInfo?.isNewPatient && (
          <div className="flex items-center justify-center rounded-[4px] px-[4px] py-[0.5px] bg-[var(--color-picker-Red-2)] ">
            <span className="text-white font-bold text-[10px]">N</span>
          </div>
        )}

        {/* 차트번호 */}
        {patient?.patientNo && (
          <div className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none">
            {patient.patientNo}
          </div>
        )}

        {/* 이름 */}
        {patient?.name && (
          <div className="text-[14px] font-bold">
            {patient.name}
          </div>
        )}

        {/* (성별/나이) */}
        {(genderText || ageText) && (
          <div className="flex gap-1 items-center text-[14px] font-bold">
            ({genderText}{genderText && ageText ? "/" : ""}{ageText})
          </div>
        )}

        {/* 주민등록번호 rrnView의 앞 6자리 - 수납완료가 아닐 때만 표시 */}
        {rrnViewFront6 && (
          <div className="text-[14px] font-bold">
            {rrnViewFront6}
          </div>
        )}

        {/* 똑닥여부 (외부 플랫폼 아이콘) */}
        {(() => {
          const platformCode =
            appointment?.externalPlatform?.platformCode ||
            registration?.appointment?.externalPlatform?.platformCode ||
            "";
          if (platformCode === "ddocdoc") {
            return <DdocDocIcon className="w-4 h-4 mr-1" aria-label="externalPlatform" />;
          }
          const iconSrc = renderExternalPlatformIcon(platformCode);
          return iconSrc ? (
            <img
              src={iconSrc}
              alt="externalPlatform"
              className="w-4 h-4 mr-1"
            />
          ) : null;
        })()}

        {/* 본인여부 - 미완료·예외일 때만 뱃지 표기, 미완료 시 --red-1/--red-2, 테두리 미표기 */}
        {registration?.patient &&
          !hideIdentityBadge &&
          (() => {
            const identityVerifiedAt = registration.patient.identityVerifiedAt;
            const eligibilityCheck = registration.eligibilityCheck;
            const patientIdentityOptional =
              typeof (registration.patient as any)?.identityOptional === "boolean"
                ? (registration.patient as any).identityOptional
                : registration?.eligibilityCheck?.parsedData?.["본인확인예외여부"]?.data === "Y";

            const idYNResult = showIdYN(
              identityVerifiedAt,
              eligibilityCheck?.parsedData?.["수진자주민등록번호"]?.data ?? null,
              Boolean(patientIdentityOptional)
            );

            // 미완료·예외일 때만 뱃지 표시 (완료 시 미표기)
            const showBadge =
              idYNResult.idYN === 본인확인여부.미완료;
            if (!showBadge) return null;

            const is미완료 = idYNResult.idYN === 본인확인여부.미완료;
            const styleToClassName = {
              backgroundColor: idYNResult.style.backgroundColor,
              color: idYNResult.style.color,
              ...(is미완료 ? { border: "none" } : { borderColor: idYNResult.style.borderColor }),
            };

            return (
              <button
                type="button"
                onClick={(e) => {
                  if (is미완료) onIdentityBadgeClick?.(e);
                }}
                className={clsx(
                  "text-[12px] rounded-sm px-1.5 py-0.4 cursor-pointer",
                  !is미완료 && "border"
                )}
                style={styleToClassName}
              >
                본인
              </button>
            );
          })()}
      </div>

      {/* 우측 상단 영역: V/S + 상태 뱃지 */}
      <div className="flex items-center gap-1">
        {/* V/S 표기: TREATMENT / PAYMENT 타입에서 당일 바이탈 있을 때 */}
        {showVitalSignBadge && (
          <span className="text-[13px]" style={{ color: "var(--cyan-2)" }}>
            V/S
          </span>
        )}

        <div className="flex flex-col items-end">
          {config.bodyType === PANEL_TYPE.APPOINTMENT && appointment && (
            <span
              className={`inline-flex items-center px-1.5 rounded-sm text-[12px] font-normal ${getAppointmentStatusColor(AppointmentStatus[appointment.status as AppointmentStatus])}`}
            >
              {AppointmentStatusLabel[appointment.status]}
            </span>
          )}
          {(config.bodyType === PANEL_TYPE.TREATMENT ||
            (config.bodyType === PANEL_TYPE.PAYMENT && !paymentInfo?.isPaid)) &&
            registration &&
            registration.status !== 접수상태.대기 && (
              <div
                className="text-[12px] font-semibold px-1.5 py-0.5 rounded-sm"
                style={getTreatmentStatusStyle(registration.status)}
              >
                {(registration.status === 접수상태.진료중 ||
                  registration.status === 접수상태.보류) &&
                  접수상태Label[registration.status]}
              </div>
            )}

          {/* PAYMENT_TYPE: 수납대기 - 납부할 금액 */}
          {config.bodyType === PANEL_TYPE.PAYMENT &&
            registration &&
            paymentInfo &&
            !paymentInfo.isPaid && (
              <div className="text-[13px] font-medium text-gray-900">
                {paymentInfo.paymentAmount.toLocaleString()}원
              </div>
            )}
        </div>
      </div>

      {/* PAYMENT_TYPE 수납완료: 타이틀 라인 오른쪽에 수납시간 + 납부방법표기 + 납부한 금액(영수액) 직접 배치 */}
      {isPaymentCompleted && paymentInfo && (
        <div className="flex gap-1 items-center ml-2">
          {/* 수납시간 (paymentCreateTime KST 변환) */}
          {paymentInfo.paymentCreateTime && (() => {
            try {
              const timeStr = formatUTCtoKSTTime(paymentInfo.paymentCreateTime, false);
              return timeStr ? (
                <span className="text-[13px] text-[var(--gray-200)]">{timeStr}</span>
              ) : null;
            } catch {
              return null;
            }
          })()}
          {paymentInfo.paymentSources.isCard && (
            <img
              src="/icon/ic_card_16.svg"
              alt="카드"
              className="w-4 h-4"
            />
          )}
          {paymentInfo.paymentSources.isCash && (
            <img
              src="/icon/ic_cash_16.svg"
              alt="현금"
              className="w-4 h-4"
            />
          )}
          <span className="text-[13px] font-medium text-gray-900">
            {paymentInfo.paymentAmount.toLocaleString()}원
          </span>
        </div>
      )}
    </div>
  );
}

// 메모 텍스트가 ellipsis 처리된 경우에만 툴팁을 표시하는 컴포넌트
function MemoWithTooltip({ value, color }: { value: string; color?: string }) {
  const [isTruncated, setIsTruncated] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [value]);

  return (
    <Tooltip open={isTruncated ? undefined : false}>
      <TooltipTrigger asChild>
        <span
          ref={spanRef}
          className="min-w-0 flex-1 truncate"
          style={{ color: color || "inherit" }}
        >
          {value}
        </span>
      </TooltipTrigger>
      {isTruncated && value && (
        <TooltipContent side="bottom">
          <p className="max-w-[300px] break-words">{value}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}

// Body Wrapper 컴포넌트 (chevron 상태 관리)
function PatientCardBodyWrapper({
  config,
  appointment,
  registration,
  reception,
  receptionEncounter,
  hasEncounters,
  hideReceptionTime = false,
  patient,
  getAppointmentType,
  paymentInfo,
}: {
  config: ReturnType<typeof usePatientCardConfig>;
  appointment?: Appointment;
  registration?: Registration;
  reception?: Reception;
  receptionEncounter?: any;
  hasEncounters: boolean;
  hideReceptionTime?: boolean;
  patient?: Patient;
  getAppointmentType: (appointmentTypeId?: number) => any;
  paymentInfo?: {
    timeStr: string;
    paymentData: PaymentData;
    paymentAmount: number;
    미수환불금액: number;
    paymentSources: { isCard: boolean; isCash: boolean };
    isPaid: boolean;
    hasPaymentInfo: boolean;
    viewLabel: string;
    paymentCreateTime?: string | null;
  } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // PAYMENT: 처방 뱃지 (오른쪽 정렬)
  const paymentPrescriptionBadges = config.bodyType === PANEL_TYPE.PAYMENT && registration
    ? <PrescriptionBadges encounter={receptionEncounter} size="md" />
    : null;

  return (
    <div className="flex flex-row items-start gap-1">
      <div className="flex-1 min-w-0">
        <PatientCardBody
          config={config}
          appointment={appointment}
          registration={registration}
          reception={reception}
          receptionEncounter={receptionEncounter}
          hasEncounters={hasEncounters}
          hideReceptionTime={hideReceptionTime}
          patient={patient}
          isExpanded={isExpanded}
          getAppointmentType={getAppointmentType}
          paymentInfo={paymentInfo}
        />
        {/* 연락처 표시 (열림 상태일 때) */}
        {isExpanded && patient && (
          <div className="text-[13px] text-[var(--gray-200)] mt-1">
            {patient.phone1 || "연락처 없음"}
          </div>
        )}
      </div>
      {/* 오른쪽 중간영역: chevron */}
      {(config.bodyType === PANEL_TYPE.TREATMENT || config.bodyType === PANEL_TYPE.APPOINTMENT) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="flex items-center justify-center p-0.5 hover:bg-gray-100 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--gray-200)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--gray-200)]" />
          )}
        </button>
      )}
      {/* PAYMENT: 처방 뱃지 (오른쪽 정렬) */}
      {paymentPrescriptionBadges}
    </div>
  );
}

//TODO - receptionEncounter에 대해 확인 필요 /store냐 API로 조회냐..
function PatientCardBody({
  config,
  appointment,
  registration,
  reception: receptionFromParent,
  receptionEncounter,
  hasEncounters,
  hideReceptionTime = false,
  patient,
  isExpanded = false,
  getAppointmentType,
  paymentInfo,
}: {
  config: ReturnType<typeof usePatientCardConfig>;
  appointment?: Appointment;
  registration?: Registration;
  reception?: Reception;
  receptionEncounter?: any;
  hasEncounters: boolean;
  hideReceptionTime?: boolean;
  patient?: Patient;
  isExpanded?: boolean;
  getAppointmentType: (appointmentTypeId?: number) => any;
  paymentInfo?: {
    timeStr: string;
    paymentData: PaymentData;
    paymentAmount: number;
    미수환불금액: number;
    paymentSources: { isCard: boolean; isCash: boolean };
    isPaid: boolean;
    hasPaymentInfo: boolean;
    viewLabel: string;
    paymentCreateTime?: string | null;
  } | null;
}) {
  // TREATMENT_TYPE: 첫 번째 줄 아이템 생성 (접수시간 | 초재진여부 | 환자보험구분 | 접수메모)
  const getTreatmentFirstLineItems = (reception: any, registration: Registration) => {
    const receptionTime = registration.receptionDateTime
      ? new Date(registration.receptionDateTime)
      : new Date();
    const timeStr = `${receptionTime.getHours().toString().padStart(2, "0")}:${receptionTime.getMinutes().toString().padStart(2, "0")}`;

    const items = [
      hideReceptionTime ? null : { value: timeStr, color: "var(--gray-200)" },
      {
        value:
          초재진Label[
          reception.receptionInfo.receptionType as keyof typeof 초재진Label
          ],
        color: "var(--gray-200)",
      },
      {
        value:
          보험구분상세Label[
          reception.insuranceInfo
            .uDeptDetail as keyof typeof 보험구분상세Label
          ] || "",
        color: "var(--blue-2)",
      },
      {
        value: registration.memo || "",
        color: "var(--gray-200)",
        isMemo: true,
      },
    ].filter(Boolean) as Array<{ value: string; color?: string; isMemo?: boolean }>;

    return items;
  };


  // APPOINTMENT_TYPE: 첫 번째 줄 아이템 생성 (예약시간 | 예약실 | 예약타입)
  const getAppointmentFirstLineItems = (appointment: Appointment) => {
    const startTime = new Date(appointment.appointmentStartTime);
    const timeStr = `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`;

    const appointmentType = getAppointmentType(appointment.appointmentTypeId ?? undefined);
    const appointmentTypeName = appointmentType?.name || "";
    const appointmentTypeColor = appointmentType?.colorCode || "";

    return [
      { value: timeStr, color: "var(--gray-200)" },
      { value: appointment.appointmentRoom?.name || "", color: "var(--gray-200)" },
      { value: appointmentTypeName, color: appointmentTypeColor, isAppointmentType: true },
      { value: stripHtmlTags(appointment.memo || ""), color: "var(--gray-200)", isMemo: true },
    ].filter((item) => item.value && item.value.trim() !== "");
  };

  // 첫 번째 줄 렌더링
  const renderFirstLine = (items: Array<{ value: string; color?: string; isAppointmentType?: boolean; isMemo?: boolean }>) => {
    return (
      <div className="flex gap-1 items-center text-[12px] min-w-0 overflow-hidden">
        {items.map((item, idx) => (
          <Fragment key={idx}>
            {item.isAppointmentType ? (
              <span
                className="shrink-0 text-[11px] font-medium"
                style={{ color: item.color || "inherit" }}
              >
                {item.value}
              </span>
            ) : item.isMemo ? (
              <MemoWithTooltip value={item.value} color={item.color} />
            ) : (
              <span className="shrink-0" style={{ color: item.color || "inherit" }}>
                {item.value}
              </span>
            )}
            {idx < items.length - 1 && items[idx + 1]?.value && <span className="shrink-0 text-gray-300">|</span>}
          </Fragment>
        ))}
      </div>
    );
  };

  // 두 번째 줄 렌더링
  const renderSecondLine = (items: Array<{ value: string; color?: string }>) => {
    return (
      <div className="flex gap-1 items-center text-[12px]">
        {items.map((item, idx) => (
          <Fragment key={idx}>
            <span style={{ color: item.color || "inherit" }}>{item.value}</span>
            {idx < items.length - 1 && <span className="text-gray-300">|</span>}
          </Fragment>
        ))}
      </div>
    );
  };

  // TREATMENT_TYPE 화면
  if (config.bodyType === PANEL_TYPE.TREATMENT && registration) {
    const reception = receptionFromParent;
    if (!reception) return null;
    const firstLineItems = getTreatmentFirstLineItems(reception, registration);

    return (
      <div className="flex flex-col gap-1">
        {renderFirstLine(firstLineItems)}
      </div>
    );
  }

  // APPOINTMENT_TYPE 화면
  if (config.bodyType === PANEL_TYPE.APPOINTMENT && appointment) {
    const firstLineItems = getAppointmentFirstLineItems(appointment);

    return (
      <div className="flex flex-col gap-1">
        {renderFirstLine(firstLineItems)}
      </div>
    );
  }

  // PAYMENT_TYPE 화면 - TREATMENT와 동일하게 표기
  if (config.bodyType === PANEL_TYPE.PAYMENT && registration) {
    const reception = receptionFromParent;
    if (!reception) return null;
    const firstLineItems = getTreatmentFirstLineItems(reception, registration);

    return (
      <div className="flex flex-col gap-1">
        {renderFirstLine(firstLineItems)}
      </div>
    );
  }

  // 접수 화면 (기본) - 이 부분은 사용되지 않을 수 있음
  if (!registration || !receptionFromParent) return null;

  const reception = receptionFromParent;
  const vitalSigns = reception?.bioMeasurementsInfo?.vital || [];
  const vitalSignComponents: React.ReactNode[] = [];

  let btMeasurement: any;
  let bpsMeasurement: any;
  let bpdMeasurement: any;

  for (const measurement of vitalSigns) {
    switch (measurement.itemId) {
      case 1: // 체온
        btMeasurement = measurement;
        break;
      case 2: // 혈압(수축기)
        bpsMeasurement = measurement;
        break;
      case 3: // 혈압(이완기)
        bpdMeasurement = measurement;
        break;
    }
  }

  if (btMeasurement) {
    vitalSignComponents.push(
      <VitalSignValue key="BT" vitalSignMeasurement={btMeasurement} />
    );
  }

  if (bpsMeasurement && bpdMeasurement) {
    vitalSignComponents.push(
      <VitalSignBloodPressure
        key="BP"
        bpsMeasurement={bpsMeasurement}
        bpdMeasurement={bpdMeasurement}
      />
    );
  }

  const hasVitalSigns = vitalSignComponents.length > 0;

  return (
    <div className="flex gap-1 items-center text-sm flex-wrap max-w-[300px]">
      <span>{보험구분Label[reception?.insuranceInfo?.uDept as keyof typeof 보험구분Label] || ""}</span>
      {config.showVitalSigns && hasVitalSigns && <span> | </span>}
      {config.showVitalSigns && (
        <div className="flex gap-1 items-center">
          {vitalSignComponents.map((component, index) => (
            <Fragment key={index}>
              {component}
              {index < vitalSignComponents.length - 1 && <span> | </span>}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// 유틸 컴포넌트들 (같은 파일 내에)
const VitalSignValue = ({
  vitalSignMeasurement,
}: {
  vitalSignMeasurement: VitalSignMeasurement;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span>
          {vitalSignMeasurement.value}
          {vitalSignMeasurement.vitalSignItem?.unit}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <table>
          <tbody>
            <tr>
              <td className="p-1 text-xs font-bold">
                {vitalSignMeasurement.vitalSignItem?.name}
              </td>
            </tr>
            <tr>
              <td className="p-1 text-xs">
                {formatDateTime(vitalSignMeasurement.measurementDateTime, true)}
              </td>
            </tr>
            {vitalSignMeasurement.memo && (
              <tr>
                <td className="p-1 text-xs">{vitalSignMeasurement.memo}</td>
              </tr>
            )}
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  );
};

const VitalSignBloodPressure = ({
  bpsMeasurement,
  bpdMeasurement,
}: {
  bpsMeasurement: VitalSignMeasurement;
  bpdMeasurement: VitalSignMeasurement;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger>
        <span>
          {bpsMeasurement.value}/{bpdMeasurement.value}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <table>
          <tbody>
            <tr>
              <td className="p-1 text-xs font-bold">
                {bpsMeasurement.vitalSignItem?.name}
              </td>
              <td className="p-1 text-xs font-bold">
                {bpdMeasurement.vitalSignItem?.name}
              </td>
            </tr>
            <tr>
              <td className="p-1 text-xs">
                {formatDateTime(bpsMeasurement.measurementDateTime, true)}
              </td>
              <td className="p-1 text-xs">
                {formatDateTime(bpdMeasurement.measurementDateTime, true)}
              </td>
            </tr>
            {(bpsMeasurement.memo || bpdMeasurement.memo) && (
              <tr>
                <td className="p-1 text-xs">{bpsMeasurement.memo}</td>
                <td className="p-1 text-xs">{bpdMeasurement.memo}</td>
              </tr>
            )}
          </tbody>
        </table>
      </TooltipContent>
    </Tooltip>
  );
};

function mapToPatientLabelDialogPatient(params: {
  registration?: Registration;
  appointment?: Appointment;
}):
  | {
    chartNumber: string;
    patientName: string;
    age: number;
    gender: Gender;
    birthDate: string;
    patientId?: number;
  }
  | null {
  const patient = params.registration?.patient ?? params.appointment?.patient;
  if (!patient) return null;

  const birthDate = String((patient as any).birthDate ?? "");
  if (!birthDate) return null;

  const age = calculateAge(birthDate) ?? 0;
  const gender = mapNumericGenderToGender((patient as any).gender);
  const chartNumber = String((patient as any).patientNo ?? (patient as any).id ?? "");
  const patientName = String((patient as any).name ?? "");
  const patientId = typeof (patient as any).id === "number" ? (patient as any).id : undefined;

  if (!chartNumber || !patientName) return null;

  return {
    chartNumber,
    patientName,
    age,
    gender,
    birthDate,
    ...(patientId != null && { patientId }),
  };
}

function mapNumericGenderToGender(gender: number | string | null | undefined): Gender {
  // Patient.gender: number(1=M,2=F), AppointmentPatient.gender: string("M"/"F")
  if (gender === 2 || gender === "F") return "F";
  return "M";
}
