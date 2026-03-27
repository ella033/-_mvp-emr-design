import { useMemo, useState, useCallback, useEffect } from "react";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useDeleteRegistration } from "@/hooks/registration/use-delete-registration";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import { useToastHelpers } from "@/components/ui/toast";
import {
  useReceptionTabsStore,
  useSelectedDate,
} from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { PaymentSource, ReceptionInitialTab, 접수상태 } from "@/constants/common/common-enum";
import { usePayment } from "@/hooks/payment/use-payment";
import { PaymentsServices } from "@/services/payments-services";
import { usePrintService } from "@/hooks/document/use-print-service";
import type {
  Registration,
  UpdateRegistrationRequest,
} from "@/types/registration-types";
import type { ContextMenuActionData } from "@/app/reception/_components/panels/(shared)/(patient-card)/patient-card-context-menu";
import type { Appointment } from "@/types/appointments/appointments";
import type { Reception } from "@/types/common/reception-types";
import type { Patient } from "@/types/patient-types";
import {
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
  buildProvisionalRegistrationId,
} from "@/lib/registration-utils";
import { createReceptionDateTime } from "@/lib/date-utils";
import { PANEL_TYPE } from "@/constants/reception";
import type { Gender } from "@/lib/label-printer";
import { calculateAge, getGender } from "@/lib/patient-utils";
import type { AppointmentPatient } from "@/types/patient-types";
import { RegistrationsService } from "@/services/registrations-service";
import { DdocDocService } from "@/services/ddocdoc-service";
import type { QuickMessageRecipient } from "@/app/crm/_components/message/quick-message-form";
import type { ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";

type LabelDialogPatient = {
  chartNumber: string;
  patientName: string;
  age: number;
  gender: Gender;
  birthDate: string;
  patientId?: number;
};

type ExaminationLabelDialogPatient = LabelDialogPatient & {
  /** 검사 조회 기준일 (YYYY-MM-DD). 없으면 모달에서 당일 사용 */
  date?: string;
};

type ContextMenuUiStateSnapshot = {
  showCancelConfirm: boolean;
  selectedRegistration: Registration | null;
  showAppointmentCancelConfirm: boolean;
  selectedAppointment: Appointment | null;
  showNoReceptionHistoryWarning: boolean;
  showConsentRequestModal: boolean;
  consentRequestPatient: { id: number; name: string } | null;
  showRegistrationMemoModal: boolean;
  selectedRegistrationForMemo: Registration | null;
  showAppointmentMemoModal: boolean;
  selectedAppointmentForMemo: Appointment | null;
  showVitalInputModal: boolean;
  vitalInputPatient: Patient | null;
  isExaminationLabelDialogOpen: boolean;
  examinationLabelEncounterId: string | null;
  examinationLabelDialogPatient: ExaminationLabelDialogPatient | null;
  isPatientLabelDialogOpen: boolean;
  patientLabelDialogPatient: LabelDialogPatient | null;
  isQuickSendOpen: boolean;
  messageRecipients: QuickMessageRecipient[];
  isInsuranceHistoryPopupOpen: boolean;
  insuranceHistoryRegistration: Registration | null;
  insuranceHistoryReception: Reception | null;
  isAppointmentPopupOpen: boolean;
  appointmentPopupMode: "create" | "edit";
  appointmentPopupAppointmentId: number | string | null;
  appointmentPopupPatientInfo: import("@/types/patient-types").AppointmentPatient | null;
};

const contextMenuUiStateCache = new Map<string, ContextMenuUiStateSnapshot>();

const getDefaultContextMenuUiState = (): ContextMenuUiStateSnapshot => ({
  showCancelConfirm: false,
  selectedRegistration: null,
  showAppointmentCancelConfirm: false,
  selectedAppointment: null,
  showNoReceptionHistoryWarning: false,
  showConsentRequestModal: false,
  consentRequestPatient: null,
  showRegistrationMemoModal: false,
  selectedRegistrationForMemo: null,
  showAppointmentMemoModal: false,
  selectedAppointmentForMemo: null,
  showVitalInputModal: false,
  vitalInputPatient: null,
  isExaminationLabelDialogOpen: false,
  examinationLabelEncounterId: null,
  examinationLabelDialogPatient: null,
  isPatientLabelDialogOpen: false,
  patientLabelDialogPatient: null,
  isQuickSendOpen: false,
  messageRecipients: [],
  isInsuranceHistoryPopupOpen: false,
  insuranceHistoryRegistration: null,
  insuranceHistoryReception: null,
  isAppointmentPopupOpen: false,
  appointmentPopupMode: "create" as const,
  appointmentPopupAppointmentId: null,
  appointmentPopupPatientInfo: null,
});

export const usePatientCardContextMenu = (scopeKey = "default") => {
  const initialState =
    contextMenuUiStateCache.get(scopeKey) ?? getDefaultContextMenuUiState();

  //#region State
  const [showCancelConfirm, setShowCancelConfirm] = useState(
    initialState.showCancelConfirm
  );
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(initialState.selectedRegistration);
  const [showAppointmentCancelConfirm, setShowAppointmentCancelConfirm] =
    useState(initialState.showAppointmentCancelConfirm);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(initialState.selectedAppointment);
  const [showNoReceptionHistoryWarning, setShowNoReceptionHistoryWarning] =
    useState(initialState.showNoReceptionHistoryWarning);
  const [showConsentRequestModal, setShowConsentRequestModal] = useState(
    initialState.showConsentRequestModal
  );
  const [consentRequestPatient, setConsentRequestPatient] = useState<{
    id: number;
    name: string;
  } | null>(initialState.consentRequestPatient);
  const [showRegistrationMemoModal, setShowRegistrationMemoModal] = useState(
    initialState.showRegistrationMemoModal
  );
  const [selectedRegistrationForMemo, setSelectedRegistrationForMemo] =
    useState<Registration | null>(initialState.selectedRegistrationForMemo);
  const [showAppointmentMemoModal, setShowAppointmentMemoModal] = useState(
    initialState.showAppointmentMemoModal
  );
  const [selectedAppointmentForMemo, setSelectedAppointmentForMemo] =
    useState<Appointment | null>(initialState.selectedAppointmentForMemo);
  const [showVitalInputModal, setShowVitalInputModal] = useState(
    initialState.showVitalInputModal
  );
  const [vitalInputPatient, setVitalInputPatient] = useState<Patient | null>(
    initialState.vitalInputPatient
  );
  const [isExaminationLabelDialogOpen, setIsExaminationLabelDialogOpen] =
    useState(initialState.isExaminationLabelDialogOpen);
  const [examinationLabelEncounterId, setExaminationLabelEncounterId] =
    useState<string | null>(initialState.examinationLabelEncounterId);
  const [examinationLabelDialogPatient, setExaminationLabelDialogPatient] =
    useState<ExaminationLabelDialogPatient | null>(
      initialState.examinationLabelDialogPatient
    );
  const [isPatientLabelDialogOpen, setIsPatientLabelDialogOpen] = useState(
    initialState.isPatientLabelDialogOpen
  );
  const [patientLabelDialogPatient, setPatientLabelDialogPatient] =
    useState<LabelDialogPatient | null>(initialState.patientLabelDialogPatient);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(
    initialState.isQuickSendOpen
  );
  const [messageRecipients, setMessageRecipients] = useState<
    QuickMessageRecipient[]
  >(initialState.messageRecipients);
  const [isInsuranceHistoryPopupOpen, setIsInsuranceHistoryPopupOpen] =
    useState(initialState.isInsuranceHistoryPopupOpen);
  const [insuranceHistoryRegistration, setInsuranceHistoryRegistration] =
    useState<Registration | null>(initialState.insuranceHistoryRegistration);
  const [insuranceHistoryReception, setInsuranceHistoryReception] =
    useState<Reception | null>(initialState.insuranceHistoryReception);
  const [isAppointmentPopupOpen, setIsAppointmentPopupOpen] = useState(
    initialState.isAppointmentPopupOpen
  );
  const [appointmentPopupMode, setAppointmentPopupMode] = useState<
    "create" | "edit"
  >(initialState.appointmentPopupMode);
  const [appointmentPopupAppointmentId, setAppointmentPopupAppointmentId] =
    useState<number | string | null>(initialState.appointmentPopupAppointmentId);
  const [appointmentPopupPatientInfo, setAppointmentPopupPatientInfo] =
    useState<import("@/types/patient-types").AppointmentPatient | null>(
      initialState.appointmentPopupPatientInfo
    );

  // 사전문진 모달 (캐시하지 않음)
  const [isHealthCheckOpen, setIsHealthCheckOpen] = useState(false);
  const [healthCheckUrl, setHealthCheckUrl] = useState("");
  const [isHealthCheckIframeLoaded, setIsHealthCheckIframeLoaded] = useState(false);

  // 수납취소 팝업 (캐시하지 않음)
  const [isCancelPaymentPopupOpen, setIsCancelPaymentPopupOpen] = useState(false);
  const [cancelPaymentMessage, setCancelPaymentMessage] = useState("");
  const [pendingReceiptsForCancel, setPendingReceiptsForCancel] = useState<
    ReceiptDetailsResponse[] | null
  >(null);
  const [registrationForCancel, setRegistrationForCancel] = useState<Registration | null>(null);
  //#endregion

  useEffect(() => {
    contextMenuUiStateCache.set(scopeKey, {
      showCancelConfirm,
      selectedRegistration,
      showAppointmentCancelConfirm,
      selectedAppointment,
      showNoReceptionHistoryWarning,
      showConsentRequestModal,
      consentRequestPatient,
      showRegistrationMemoModal,
      selectedRegistrationForMemo,
      showAppointmentMemoModal,
      selectedAppointmentForMemo,
      showVitalInputModal,
      vitalInputPatient,
      isExaminationLabelDialogOpen,
      examinationLabelEncounterId,
      examinationLabelDialogPatient,
      isPatientLabelDialogOpen,
      patientLabelDialogPatient,
      isQuickSendOpen,
      messageRecipients,
      isInsuranceHistoryPopupOpen,
      insuranceHistoryRegistration,
      insuranceHistoryReception,
      isAppointmentPopupOpen,
      appointmentPopupMode,
      appointmentPopupAppointmentId,
      appointmentPopupPatientInfo,
    });
  }, [
    scopeKey,
    showCancelConfirm,
    selectedRegistration,
    showAppointmentCancelConfirm,
    selectedAppointment,
    showNoReceptionHistoryWarning,
    showConsentRequestModal,
    consentRequestPatient,
    showRegistrationMemoModal,
    selectedRegistrationForMemo,
    showAppointmentMemoModal,
    selectedAppointmentForMemo,
    showVitalInputModal,
    vitalInputPatient,
    isExaminationLabelDialogOpen,
    examinationLabelEncounterId,
    examinationLabelDialogPatient,
    isPatientLabelDialogOpen,
    patientLabelDialogPatient,
    isQuickSendOpen,
    messageRecipients,
    isInsuranceHistoryPopupOpen,
    insuranceHistoryRegistration,
    insuranceHistoryReception,
    isAppointmentPopupOpen,
    appointmentPopupMode,
    appointmentPopupAppointmentId,
    appointmentPopupPatientInfo,
  ]);

  //#region Dependencies
  const { success, warning, error: showError } = useToastHelpers();
  const { openPrescriptionPrintPopup, checkShouldPrintPrescription } = usePrintService();
  const {
    removeOpenedReception,
    addOpenedReception,
    setOpenedReceptionId,
    openedReceptions,
    setInitialTab,
  } = useReceptionTabsStore();
  const selectedDate = useSelectedDate();
  const {
    handleAppointmentToRegistration,
    getLatestReception,
  } = usePatientReception();

  // 리프레시 함수
  const refreshData = useCallback(() => {
    // 환자 데이터 새로고침 이벤트 발생 (예약과 접수 모두 새로고침)
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("refreshPatientsData", {
          detail: { type: "all" } // 예약과 접수 모두 새로고침
        }));
      }, 100);
    }
  }, []);

  // 독립적인 mutation들 (ClearProvider 의존성 없음)
  const updateRegistrationMutation = useUpdateRegistration({
    onSuccess: () => {
      // 기본 쿼리 무효화는 훅에서 처리됨
      refreshData();
    },
    onError: (error: Error) => {
      showError("상태 변경 실패", error.message);
    },
  });

  const deleteRegistrationMutation = useDeleteRegistration({
    onSuccess: () => {
      // 기본 쿼리 무효화는 훅에서 처리됨
      refreshData();
    },
  });

  const {
    handleCancelAppointment: cancelAppointmentStatus,
    handleRevertCancelAppointment: revertCancelAppointmentStatus,
    handleMarkAsVisited: markAsVisitedStatus,
  } = useHandleAppointment(undefined, {
    onSuccess: () => {
      refreshData();
    },
  });
  //#endregion

  //#region Print Actions
  /**
   * 처방전 출력
   * - 처방 내역이 없으면 건너뜀
   */
  const handlePrescriptionPrint = useCallback(
    async (registration: Registration) => {
      const encounterId = registration.encounters?.[0]?.id;
      if (!encounterId) {
        showError("처방전 출력 실패", "진료 내역을 찾을 수 없습니다.");
        return;
      }

      try {
        const shouldPrint = await checkShouldPrintPrescription(String(encounterId));
        if (!shouldPrint) {
          warning("원외처방 내역이 없습니다.");
          return;
        }
      } catch (err) {
        console.error("처방전 데이터 확인 실패:", err);
        showError(
          "처방전 미리보기 실패",
          err instanceof Error ? err.message : "알 수 없는 오류"
        );
        return;
      }

      // 즉시 출력이 아닌 미리보기(출력 팝업)로 전환
      openPrescriptionPrintPopup(String(encounterId));
    },
    [checkShouldPrintPrescription, openPrescriptionPrintPopup, showError, warning]
  );
  //#endregion

  //#region Treatment Actions
  /**
   * 진료 보류 처리
   */
  const handleHoldTreatment = useCallback(
    async (registration: Registration) => {
      try {
        const updateRegistration: UpdateRegistrationRequest = {
          status: 접수상태.보류,
        };
        await updateRegistrationMutation.mutateAsync({
          id: registration.id,
          data: updateRegistration,
        });
        success("진료가 보류되었습니다.");
      } catch (err) {
        showError(
          "보류 처리 실패",
          err instanceof Error ? err.message : "알 수 없는 오류"
        );
      }
    },
    [updateRegistrationMutation, showError, success]
  );

  /**
   * 진료 보류 취소 처리
   */
  const handleCancelHoldTreatment = useCallback(
    async (registration: Registration) => {
      try {
        const updateRegistration: UpdateRegistrationRequest = {
          status: 접수상태.대기,
        };
        await updateRegistrationMutation.mutateAsync({
          id: registration.id,
          data: updateRegistration,
        });
        success("보류가 취소되었습니다.");
      } catch (err) {
        showError(
          "보류 취소 실패",
          err instanceof Error ? err.message : "알 수 없는 오류"
        );
      }
    },
    [updateRegistrationMutation, showError, success]
  );

  /**
   * 접수 취소 처리: API 성공 후 탭 제거
   */
  const handleCancelRegistration = useCallback(
    async (registration: Registration) => {
      try {
        await deleteRegistrationMutation.mutateAsync(registration.id);

        removeOpenedReception(registration.id);
        success("접수가 취소되었습니다.");
      } catch (err: any) {
        console.error("접수 취소 실패:", err);
        showError("접수 취소 실패", err?.message || "알 수 없는 오류");
      }
    },
    [
      deleteRegistrationMutation,
      removeOpenedReception,
      showError,
      success,
    ]
  );
  //#endregion

  //#region Appointment Actions
  /**
   * 예약 접수 처리 (자격조회 포함)
   */
  const handleRegisterAppointment = useCallback(
    async (appointment: Appointment, reception?: Reception) => {
      const receptionTime =
        reception?.receptionDateTime ??
        ReceptionService.convertAppointmentToReception(appointment).receptionDateTime;
      await handleAppointmentToRegistration(appointment, {
        receptionTime,
        handleMarkAsVisited: async (appointmentId: number) => {
          await markAsVisitedStatus(appointmentId);
          // refreshData()는 useHandleAppointment의 onSuccess에서 호출됨
        },
        onNewPatient: (reception: Reception) => {
          // newPatient인 경우: summary-info에 표시 (더블클릭과 동일)
          const existingReception = openedReceptions.find(
            (r) => r.originalRegistrationId === reception.originalRegistrationId
          );

          const normalizedId = normalizeRegistrationId(
            reception.originalRegistrationId
          );

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
          setShowNoReceptionHistoryWarning(true);
        },
        onSuccessMessage: (message: string) => {
          success(message);
        },
        onError: (error: Error) => {
          showError("예약 접수 실패", error.message);
        },
      });
    },
    [
      handleAppointmentToRegistration,
      openedReceptions,
      setOpenedReceptionId,
      addOpenedReception,
      markAsVisitedStatus,
      success,
      showError,
      setShowNoReceptionHistoryWarning,
    ]
  );

  /**
   * 예약 수정 처리
   */
  const handleEditAppointment = useCallback(
    async (appointment: Appointment) => {
      if (!appointment) return;
      setAppointmentPopupMode("edit");
      setAppointmentPopupAppointmentId(appointment.id);
      setAppointmentPopupPatientInfo(null); // edit 모드에서는 API로 로드
      setIsAppointmentPopupOpen(true);
    },
    []
  );

  /**
   * 예약 생성 처리
   */
  const handleCreateAppointmentFromRegistration = useCallback(
    async (registration: Registration) => {
      if (!registration) return;

      const normalizedPatientId =
        registration.patientId ??
        registration.patient?.id ??
        undefined;

      if (!normalizedPatientId) {
        showError("예약 생성 실패", "환자 ID를 찾을 수 없습니다.");
        return;
      }

      const patient = registration.patient;
      const patientInfo: AppointmentPatient = {
        id: normalizedPatientId as number,
        name: (patient as any)?.name || "",
        rrn: (patient as any)?.rrn || "",
        phone: (patient as any)?.phone1 || (patient as any)?.phone2 || "",
        birthDate: (patient as any)?.birthDate || "",
        gender:
          typeof (patient as any)?.gender === "number"
            ? getGender((patient as any).gender, "ko")
            : "",
        patientNo: (patient as any)?.patientNo || 0,
      };

      setAppointmentPopupMode("create");
      setAppointmentPopupPatientInfo(patientInfo);
      setAppointmentPopupAppointmentId(null);
      setIsAppointmentPopupOpen(true);
    },
    [showError]
  );

  /**
   * 예약 취소 처리 (확인 팝업 표시)
   */
  const handleCancelAppointment = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentCancelConfirm(true);
  }, []);

  /**
   * 예약 취소 확인 처리 (모달에서 선택한 취소 사유를 API에 전달)
   */
  const confirmAppointmentCancel = useCallback(
    async (cancelMessage?: string) => {
      if (!selectedAppointment) return;

      try {
        // 예약 상태를 '취소'로 변경 (취소 사유 포함)
        if (selectedAppointment.id) {
          await cancelAppointmentStatus(
            selectedAppointment.id,
            cancelMessage
          );
        }
      } catch (err) {
        // handleCancelAppointment에서 이미 에러 메시지를 표시하므로 로그만 남김
        console.error("예약 취소 실패:", err);
      } finally {
        setShowAppointmentCancelConfirm(false);
        setSelectedAppointment(null);
      }
    },
    [selectedAppointment, cancelAppointmentStatus]
  );

  /**
   * 취소 철회 처리
   */
  const handleRevertCancel = useCallback(
    async (appointment: Appointment) => {
      try {
        // 예약 상태를 '예약'으로 변경
        if (appointment.id) {
          await revertCancelAppointmentStatus(appointment.id);
        }
      } catch (err) {
        console.error("취소 철회 실패:", err);
      }
    },
    [revertCancelAppointmentStatus]
  );

  /**
   * 사전문진 열기
   */
  const handleHealthCheck = useCallback(
    async (appointment: Appointment) => {
      setHealthCheckUrl("");
      setIsHealthCheckIframeLoaded(false);
      setIsHealthCheckOpen(true);
      try {
        const url = await DdocDocService.getHealthCheckUrl(String(appointment.id));
        setHealthCheckUrl(url);
      } catch (err) {
        console.error("사전문진 URL 조회 실패:", err);
        showError("사전문진 URL 조회에 실패했습니다.");
        setIsHealthCheckOpen(false);
      }
    },
    [showError]
  );

  const handleHealthCheckClose = useCallback(() => {
    setIsHealthCheckOpen(false);
    setHealthCheckUrl("");
    setIsHealthCheckIframeLoaded(false);
  }, []);
  //#endregion

  //#region Payment Actions
  const defaultPaymentData = useMemo(
    () => PaymentsServices.getDefaultPaymentData(),
    []
  );
  const emptyPaymentFormData = useMemo(
    () => PaymentsServices.getEmptyPaymentFormData(),
    []
  );

  const receptionForCancel = useMemo(
    () =>
      registrationForCancel
        ? ReceptionService.convertRegistrationToReception(registrationForCancel)
        : null,
    [registrationForCancel]
  );

  const { executePayment, cancelPayment, isLoading: isPaymentExecuting } = usePayment({
    registration: receptionForCancel ?? null,
    encounter: null,
    paymentFormData: emptyPaymentFormData,
    paymentData: defaultPaymentData,
    receiptData: null,
    onSuccess: () => {
      // 컨텍스트 메뉴에서 실행 시에도 목록이 즉시 갱신되도록 보강
      refreshData();
    },
  });

  /**
   * 진료대기 처리 (수납 → 진료 이동)
   */
  const handleTransferToTreatment = useCallback(
    async (registration: Registration | { id: string }) => {
      try {
        const registrationId = registration?.id;
        if (!registrationId) {
          showError("접수 ID가 없습니다.");
          return;
        }

        await updateRegistrationMutation.mutateAsync({
          id: String(registrationId),
          data: {
            status: 0,
            roomPanel: PANEL_TYPE.TREATMENT,
          },
        });

        // 성공 시 데이터 새로고침
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("refreshPatientsData", {
              detail: { type: "registrations" },
            })
          );
        }
      } catch (error: any) {
        console.error("[수납 → 진료 이동 실패]", error);
        const errorMessage =
          error?.data?.message ||
          error?.message ||
          "수납에서 진료로 이동에 실패했습니다.";
        showError(errorMessage);
      }
    },
    [updateRegistrationMutation, showError]
  );

  /**
   * 수납취소: 영수증 조회 후 확인 팝업 오픈 (use-payment-index와 동일 동작)
   */
  const handleCancelPayment = useCallback(
    async (registration: Registration) => {
      if (registration.status !== 접수상태.수납완료) {
        showError("수납 취소 실패", "수납완료 상태에서만 수납취소할 수 있습니다.");
        return;
      }
      const patientId = registration.patientId ? String(registration.patientId) : null;
      const encounterId =
        PaymentsServices.getLatestEncounterId(registration.encounters ?? []) ??
        registration.encounters?.[0]?.id ??
        null;
      if (!patientId || !encounterId) {
        showError("영수증 정보를 불러오는 데 실패했습니다.", "환자 또는 접수 정보가 부족합니다.");
        return;
      }
      let ensuredReceipts: ReceiptDetailsResponse[];
      try {
        ensuredReceipts = await PaymentsServices.getActiveReceiptDetails(patientId, encounterId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "영수증 정보를 불러오는 데 실패했습니다.";
        showError(message);
        return;
      }
      if (!ensuredReceipts || ensuredReceipts.length === 0) {
        warning(
          "영수증 정보가 없습니다.",
          "수납완료 상태이지만 활성 영수증이 조회되지 않아 수납취소를 진행할 수 없습니다."
        );
        return;
      }
      const hasTerminalCardPayment = ensuredReceipts.some(
        (receipt) => receipt.isTerminalCardPayment === true
      );
      const hasTerminalCashPayment = ensuredReceipts.some(
        (receipt) => receipt.isTerminalCashPayment === true
      );
      let message = "수납취소하시겠습니까?";
      if (hasTerminalCardPayment) {
        message = "수납취소 시 신용카드 승인도 취소 됩니다. 수납취소하시겠습니까?";
      } else if (hasTerminalCashPayment) {
        message = "수납취소 시 현금영수증 승인도 취소 됩니다. 수납취소하시겠습니까?";
      }
      setCancelPaymentMessage(message);
      setPendingReceiptsForCancel(ensuredReceipts);
      setRegistrationForCancel(registration);
      setIsCancelPaymentPopupOpen(true);
    },
    [showError, warning]
  );

  /**
   * 수납취소 확인 처리 (팝업에서 확인 클릭 시)
   */
  const handleConfirmCancelPayment = useCallback(async () => {
    if (!pendingReceiptsForCancel) {
      setIsCancelPaymentPopupOpen(false);
      setRegistrationForCancel(null);
      setPendingReceiptsForCancel(null);
      return;
    }
    const receiptsToCancel = pendingReceiptsForCancel;
    setIsCancelPaymentPopupOpen(false);
    setPendingReceiptsForCancel(null);
    setRegistrationForCancel(null);
    try {
      await cancelPayment("-", receiptsToCancel);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("refreshPatientsData", {
            detail: { type: "registrations" },
          })
        );
      }
    } catch (error) {
      console.error("[context-menu] handleConfirmCancelPayment error:", error);
    }
  }, [pendingReceiptsForCancel, cancelPayment]);

  /**
   * 수납취소 팝업 닫기
   */
  const closeCancelPaymentPopup = useCallback(() => {
    setIsCancelPaymentPopupOpen(false);
    setPendingReceiptsForCancel(null);
    setRegistrationForCancel(null);
  }, []);

  /**
   * 출력센터로 열기
   */
  const handleOpenPrintCenter = useCallback(
    async (registration: Registration, receptionFromProps?: Reception) => {
      try {
        const reception =
          receptionFromProps ??
          ReceptionService.convertRegistrationToReception(registration);
        setInitialTab(ReceptionInitialTab.출력센터);
        addOpenedReception(reception);
        const receptionId =
          reception.originalRegistrationId || REGISTRATION_ID_NEW;
        setOpenedReceptionId(receptionId);
      } catch (error: any) {
        console.error("출력센터 열기 실패:", error);
        showError(
          "출력센터 열기 실패",
          error?.message || "환자 정보를 불러오는 데 실패했습니다."
        );
      }
    },
    [addOpenedReception, setInitialTab, setOpenedReceptionId, showError]
  );

  /**
   * 처방조회로 열기
   */
  const handleOpenPatientEncounters = useCallback(
    async (registration: Registration, receptionFromProps?: Reception) => {
      try {
        const reception =
          receptionFromProps ??
          ReceptionService.convertRegistrationToReception(registration);
        setInitialTab(ReceptionInitialTab.처방조회);
        addOpenedReception(reception);
        const receptionId =
          reception.originalRegistrationId || REGISTRATION_ID_NEW;
        setOpenedReceptionId(receptionId);
      } catch (error: any) {
        console.error("처방조회 열기 실패:", error);
        showError(
          "처방조회 열기 실패",
          error?.message || "환자 정보를 불러오는 데 실패했습니다."
        );
      }
    },
    [addOpenedReception, setInitialTab, setOpenedReceptionId, showError]
  );

  /**
   * 추가 접수: 해당 환자의 최근 접수 내역 조회 후 탭으로 열기 (reception-search-bar의 openReceptionWithTab과 동일)
   */
  const handleAddRegistration = useCallback(
    async (registration: Registration, receptionFromProps?: Reception) => {
      const patient: Patient | null =
        registration.patient ??
        (receptionFromProps?.patientBaseInfo
          ? ({
              id: Number(receptionFromProps.patientBaseInfo.patientId),
              patientNo: receptionFromProps.patientBaseInfo.patientNo,
              name: receptionFromProps.patientBaseInfo.name,
              birthDate: receptionFromProps.patientBaseInfo.birthday,
            } as unknown as Patient)
          : null);
      if (!patient?.id) {
        showError(
          "환자 정보를 열 수 없습니다.",
          "환자 정보를 찾을 수 없습니다."
        );
        return;
      }
      try {
        const latestReception = await getLatestReception(patient, true);
        if (!latestReception) {
          showError(
            "환자 정보를 열 수 없습니다.",
            "최근 접수 내역이 없습니다."
          );
          return;
        }

        // 신규 접수로 열기: 임시 ID + 수납/영수증 초기화
        const provisionalId = buildProvisionalRegistrationId(
          `${patient.id}-${Date.now()}`
        );
        const receptionDateTime = createReceptionDateTime(selectedDate);

        // 추가접수 기준 접수의 status가 대기(0) 또는 진료중(1)이면 previousRegistrationId 설정
        const previousRegistrationId =
          registration.status === 접수상태.대기 ||
          registration.status === 접수상태.진료중
            ? String(registration.id)
            : null;

        const receptionToOpen = {
          ...latestReception,
          receptionDateTime,
          patientStatus: {
            ...latestReception.patientStatus,
            status: 접수상태.대기,
          },
          receptionInfo: {
            ...latestReception.receptionInfo,
            status: 접수상태.대기,
            encounters: null,
            paymentInfo: { totalAmount: 0, payments: [] },
            hasReceipt: false,
            previousRegistrationId,
          },
          originalRegistrationId: provisionalId,
        };

        setInitialTab(ReceptionInitialTab.환자정보);
        addOpenedReception(receptionToOpen);
        setOpenedReceptionId(provisionalId);
      } catch (err) {
        console.error("[context-menu] 추가 접수 탭 열기 실패:", err);
        showError(
          "환자 정보를 열 수 없습니다.",
          err instanceof Error ? err.message : "다시 시도해주세요."
        );
      }
    },
    [
      addOpenedReception,
      getLatestReception,
      selectedDate,
      setInitialTab,
      setOpenedReceptionId,
      showError,
    ]
  );

  /**
   * 보험이력변경으로 열기
   */
  const handleOpenInsuranceHistory = useCallback(
    async (registration: Registration, receptionFromProps?: Reception) => {
      try {
        const reception =
          receptionFromProps ??
          ReceptionService.convertRegistrationToReception(registration);
        setInsuranceHistoryRegistration(registration);
        setInsuranceHistoryReception(reception);
        setIsInsuranceHistoryPopupOpen(true);
      } catch (error: any) {
        console.error("보험이력변경 열기 실패:", error);
        showError(
          "보험이력변경 열기 실패",
          error?.message || "환자 정보를 불러오는 데 실패했습니다."
        );
      }
    },
    [showError]
  );

  const handleInsuranceHistoryPopupClose = useCallback(() => {
    setIsInsuranceHistoryPopupOpen(false);
    setInsuranceHistoryRegistration(null);
    setInsuranceHistoryReception(null);
  }, []);

  const handleAppointmentPopupClose = useCallback(() => {
    setIsAppointmentPopupOpen(false);
    setAppointmentPopupMode("create");
    setAppointmentPopupAppointmentId(null);
    setAppointmentPopupPatientInfo(null);
  }, []);

  /**
   * 카드수납 처리
   */
  const handleCardPayment = useCallback(
    async (registration: Registration) => {
      if (isPaymentExecuting) {
        showError("카드수납 실패", "수납 처리 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      try {
        const prepared = await PaymentsServices.preparePaymentExecution(
          registration,
          PaymentSource.CARD
        );
        await executePayment({
          registration: prepared.reception,
          encounter: prepared.encounter,
          paymentFormData: prepared.paymentFormData,
          paymentData: prepared.paymentData,
        });
      } catch (e: any) {
        showError(
          "카드수납 실패",
          e instanceof Error ? e.message : "카드수납 처리 중 오류가 발생했습니다."
        );
      }
    },
    [executePayment, isPaymentExecuting, showError]
  );

  /**
   * 현금수납 처리
   */
  const handleCashPayment = useCallback(
    async (registration: Registration) => {
      if (isPaymentExecuting) {
        showError("현금수납 실패", "수납 처리 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      try {
        const prepared = await PaymentsServices.preparePaymentExecution(
          registration,
          PaymentSource.CASH,
          true,
          true          
        );
        await executePayment({
          registration: prepared.reception,
          encounter: prepared.encounter,
          paymentFormData: prepared.paymentFormData,
          paymentData: prepared.paymentData,
        });
      } catch (e: any) {
        showError(
          "현금수납 실패",
          e instanceof Error ? e.message : "현금수납 처리 중 오류가 발생했습니다."
        );
      }
    },
    [executePayment, isPaymentExecuting, showError]
  );
  //#endregion

  //#region Other Actions
  /**
   * 동의서 요청 처리
   */
  const handleRequestConsent = useCallback(
    (registration: Registration) => {
      const patientId = registration.patientId ?? registration.patient?.id;
      const patientName = registration.patient?.name ?? "";

      if (!patientId) {
        showError("동의서 요청 실패", "환자 ID를 찾을 수 없습니다.");
        return;
      }

      setConsentRequestPatient({
        id: Number(patientId),
        name: patientName,
      });
      setShowConsentRequestModal(true);
    },
    [showError]
  );

  /**
   * 접수메모 처리
   */
  const handleRegistrationMemo = useCallback(
    (registration: Registration) => {
      setSelectedRegistrationForMemo(registration);
      setShowRegistrationMemoModal(true);
    },
    []
  );

  /**
   * 예약메모 처리
   */
  const handleAppointmentMemo = useCallback((appointment: Appointment) => {
    setSelectedAppointmentForMemo(appointment);
    setShowAppointmentMemoModal(true);
  }, []);

  /**
   * 환자 라벨 출력 처리
   */
  const handlePatientLabelPrint = useCallback(
    (registration?: Registration, appointment?: Appointment) => {
      const labelPatient = mapToLabelDialogPatient({ registration, appointment });

      if (!labelPatient) {
        warning("환자 라벨 출력을 실행할 수 없습니다.");
        return;
      }

      setPatientLabelDialogPatient(labelPatient);
      setIsPatientLabelDialogOpen(true);
    },
    [warning]
  );

  /**
   * 검사 라벨 출력 처리
   */
  const handleExaminationLabelPrint = useCallback(
    async (registration: Registration) => {
      const labelPatient = mapToLabelDialogPatient({ registration });
      if (!labelPatient) {
        warning("검사 라벨 출력을 실행할 수 없습니다.");
        return;
      }

      try {
        const encounterId =
          registration?.encounters?.[0]?.id ??
          (await RegistrationsService.getRegistration(registration.id))?.encounters?.[0]
            ?.id ??
          String(registration.id);

        const treatmentDate =
          registration.receptionDateTime?.slice(0, 10) ??
          registration.encounters?.[0]?.encounterDateTime?.slice(0, 10) ??
          new Date().toISOString().slice(0, 10);

        setExaminationLabelEncounterId(String(encounterId));
        setExaminationLabelDialogPatient({
          ...labelPatient,
          date: treatmentDate,
        });
        setIsExaminationLabelDialogOpen(true);
      } catch (err) {
        console.error("검사 라벨 출력 데이터 준비 실패:", err);
        warning("검사 라벨 출력을 실행할 수 없습니다.");
      }
    },
    [warning]
  );

  /**
   * 빠른 문자 발송 처리
   */
  const handleQuickMessageSend = useCallback(
    (appointment?: Appointment) => {
      const menuPatient = appointment?.patient;
      const patientId =
        (menuPatient as any)?.id ??
        (appointment as any)?.patientId ??
        (menuPatient as any)?.patientId ??
        undefined;
      const patientName = String((menuPatient as any)?.name ?? "");

      if (!patientId || !patientName) {
        warning("문자 발송을 실행할 수 없습니다.");
        return;
      }

      const recipients: QuickMessageRecipient[] = [
        { id: Number(patientId), name: patientName },
      ];
      setMessageRecipients(recipients);
      setIsQuickSendOpen(true);
    },
    [warning]
  );

  /**
   * 바이탈입력 처리
   */
  const handleVitalInput = useCallback(
    async (registration: Registration, receptionFromProps?: Reception) => {
      try {
        const reception =
          receptionFromProps ??
          ReceptionService.convertRegistrationToReception(registration);

        // Reception의 patientBaseInfo를 사용하여 Patient 객체 생성
        const base = reception?.patientBaseInfo;
        if (!base) {
          showError("바이탈입력 실패", "환자 정보를 찾을 수 없습니다.");
          return;
        }

        const patient: Patient = {
          id: Number(base.patientId) || 0,
          uuid: "",
          hospitalId: base.hospitalId ?? 0,
          loginId: null,
          password: null,
          name: base.name,
          rrn: base.rrn || "",
          rrnView: null,
          rrnHash: null,
          gender: base.gender ?? null,
          phone1: base.phone1,
          phone2: base.phone2 ?? null,
          address1: base.address,
          address2: base.address2,
          zipcode: base.zipcode,
          idNumber: base.idNumber ?? null,
          idType: base.idType ?? null,
          patientType: null,
          groupId: base.groupId ?? null,
          birthDate: base.birthday?.toISOString().split("T")[0] ?? null,
          chronicDisease: null,
          memo: base.patientMemo ?? null,
          symptom: null,
          clinicalMemo: base.clinicalMemo ?? null,
          visitRoute: null,
          recommender: base.recommender ?? null,
          doctorId: base.doctorId ?? null,
          isActive: base.isActive,
          isTemporary: false,
          receptionMemo: base.receptionMemo ?? "",
          lastEncounterDate: base.lastVisit ?? null,
          createId: 0,
          createDateTime: new Date().toISOString(),
          updateId: null,
          updateDateTime: null,
          consent: null,
          vitalSignMeasurements: [],
          fatherRrn: base.fatherRrn,
          identityVerifiedAt: base.identityVerifiedAt ?? null,
          eligibilityCheck: base.eligibilityCheck,
          nextAppointmentDateTime: base.nextAppointmentDateTime ?? null,
        };

        console.log('[use-patient-card-context-menu.ts] vitalInputPatient', patient);
        setVitalInputPatient(patient);
        setShowVitalInputModal(true);
      } catch (err) {
        console.error("바이탈입력 팝업 열기 실패:", err);
        showError(
          "바이탈입력 실패",
          err instanceof Error ? err.message : "알 수 없는 오류"
        );
      }
    },
    [showError]
  );

  /**
   * 예방접종처방 처리
   */
  const handleVaccinationPrescription = useCallback(
    async (_registration: Registration) => {
      // TODO: 예방접종처방 로직 구현
    },
    []
  );

  /**
   * 접수 정보 수정 처리
   */
  const handleEditRegistration = useCallback(
    async (_registration: Registration) => {
      // TODO: 접수 정보 수정 로직 구현
    },
    []
  );
  //#endregion

  //#region Main Action Handler
  /**
   * 컨텍스트 메뉴 액션 핸들러
   */
  const handleContextMenuAction = useCallback(
    (action: string, data: ContextMenuActionData) => {
      const { registration, appointment, reception: receptionFromData } = data;

      switch (action) {
        // 진료실 전용 액션
        case "hold-treatment":
          if (registration) handleHoldTreatment(registration);
          break;
        case "cancel-hold-treatment":
          if (registration) handleCancelHoldTreatment(registration);
          break;
        case "cancel-registration":
          if (registration) {
            setSelectedRegistration(registration);
            setShowCancelConfirm(true);
          }
          break;
        case "request-consent":
          if (registration) handleRequestConsent(registration);
          break;
        case "registration-memo":
          if (registration) handleRegistrationMemo(registration);
          break;
        case "appointment-memo":
          if (appointment) handleAppointmentMemo(appointment);
          break;
        case "vital-input":
          if (registration) handleVitalInput(registration, receptionFromData);
          break;
        case "patient-label-print":
          handlePatientLabelPrint(registration, appointment);
          break;
        case "examination-label-print":
          if (registration) handleExaminationLabelPrint(registration);
          break;
        case "add-registration":
          if (registration)
            handleAddRegistration(registration, receptionFromData);
          break;
        case "quick-message-send":
          handleQuickMessageSend(appointment);
          break;
        case "vaccination-prescription":
          if (registration) handleVaccinationPrescription(registration);
          break;

        // 예약실 전용 액션
        case "register-appointment":
          if (appointment) handleRegisterAppointment(appointment, receptionFromData);
          break;
        case "edit-appointment":
          if (appointment) handleEditAppointment(appointment);
          break;
        case "cancel-appointment":
          if (appointment) handleCancelAppointment(appointment);
          break;
        case "revert-cancel":
          if (appointment) handleRevertCancel(appointment);
          break;
        case "health-check":
          if (appointment) handleHealthCheck(appointment);
          break;

        // 수납실 전용 액션
        case "transfer-to-treatment":
          if (registration) handleTransferToTreatment(registration);
          break;
        case "cancel-payment":
          if (registration) handleCancelPayment(registration);
          break;
        case "create-appointment":
          if (registration) handleCreateAppointmentFromRegistration(registration);
          break;
        case "patient-encounters":
          if (registration) handleOpenPatientEncounters(registration, receptionFromData);
          break;
        case "insurance-history":
          if (registration) handleOpenInsuranceHistory(registration, receptionFromData);
          break;
        case "print-center":
          if (registration) handleOpenPrintCenter(registration, receptionFromData);
          break;
        case "card-payment":
          if (registration) handleCardPayment(registration);
          break;
        case "cash-payment":
          if (registration) handleCashPayment(registration);
          break;
        case "prescription-print":
          if (registration) handlePrescriptionPrint(registration);
          break;

        // 기본 액션
        case "edit-registration":
          if (registration) handleEditRegistration(registration);
          break;

        default:
          console.warn(`[ContextMenu] 알 수 없는 액션:`, action);
      }
    },
    [
      handleRegisterAppointment,
      handleEditAppointment,
      handleCreateAppointmentFromRegistration,
      handleCancelAppointment,
      handleRevertCancel,
      handleHealthCheck,
      handleRequestConsent,
      handleRegistrationMemo,
      handleAppointmentMemo,
      handleVitalInput,
      handlePatientLabelPrint,
      handleExaminationLabelPrint,
      handleAddRegistration,
      handleQuickMessageSend,
      handleVaccinationPrescription,
      handleTransferToTreatment,
      handleCancelPayment,
      handleOpenPatientEncounters,
      handleOpenInsuranceHistory,
      handleOpenPrintCenter,
      handleCardPayment,
      handleCashPayment,
      handlePrescriptionPrint,
      handleEditRegistration,
    ]
  );
  //#endregion

  //#region Confirmation Handlers
  /**
   * 접수취소 확인 처리
   */
  const handleCancelConfirm = useCallback(() => {
    if (selectedRegistration) {
      handleCancelRegistration(selectedRegistration);
    }
    setShowCancelConfirm(false);
    setSelectedRegistration(null);
  }, [selectedRegistration, handleCancelRegistration]);

  /**
   * 접수취소 취소 처리
   */
  const handleCancelCancel = useCallback(() => {
    setShowCancelConfirm(false);
    setSelectedRegistration(null);
  }, []);

  /**
   * 예약취소 취소 처리
   */
  const handleAppointmentCancelCancel = useCallback(() => {
    setShowAppointmentCancelConfirm(false);
    setSelectedAppointment(null);
  }, []);

  /**
   * 동의서 요청 모달 닫기
   */
  const handleConsentRequestClose = useCallback(() => {
    setShowConsentRequestModal(false);
    setConsentRequestPatient(null);
  }, []);

  /**
   * 접수메모 모달 닫기
   */
  const handleRegistrationMemoClose = useCallback(() => {
    setShowRegistrationMemoModal(false);
    setSelectedRegistrationForMemo(null);
  }, []);

  /**
   * 예약메모 모달 닫기
   */
  const handleAppointmentMemoClose = useCallback(() => {
    setShowAppointmentMemoModal(false);
    setSelectedAppointmentForMemo(null);
  }, []);

  /**
   * 동의서 요청 성공 처리
   */
  const handleConsentRequestSuccess = useCallback(() => {
    refreshData();
  }, [refreshData]);

  /**
   * 접수메모 저장 성공 처리
   */
  const handleRegistrationMemoSuccess = useCallback(() => {
    refreshData();
  }, [refreshData]);

  /**
   * 예약메모 저장 성공 처리
   */
  const handleAppointmentMemoSuccess = useCallback(() => {
    refreshData();
  }, [refreshData]);

  /**
   * 바이탈 입력 모달 닫기
   */
  const handleVitalInputClose = useCallback(() => {
    setShowVitalInputModal(false);
    setVitalInputPatient(null);
  }, []);

  const handleExaminationLabelDialogOpenChange = useCallback((nextOpen: boolean) => {
    setIsExaminationLabelDialogOpen(nextOpen);
    if (!nextOpen) {
      setExaminationLabelEncounterId(null);
      setExaminationLabelDialogPatient(null);
    }
  }, []);

  const handlePatientLabelDialogOpenChange = useCallback((nextOpen: boolean) => {
    setIsPatientLabelDialogOpen(nextOpen);
    if (!nextOpen) {
      setPatientLabelDialogPatient(null);
    }
  }, []);

  const handleQuickSendClose = useCallback(() => {
    setIsQuickSendOpen(false);
  }, []);

  const handleQuickMessageRecipientRemove = useCallback((id: number) => {
    setMessageRecipients((prev) =>
      prev.filter((recipient) => recipient.id !== id)
    );
  }, []);
  //#endregion

  return {
    // State
    showCancelConfirm,
    selectedRegistration,
    showAppointmentCancelConfirm,
    selectedAppointment,
    showNoReceptionHistoryWarning,
    setShowNoReceptionHistoryWarning,
    showConsentRequestModal,
    consentRequestPatient,
    showRegistrationMemoModal,
    selectedRegistrationForMemo,
    showAppointmentMemoModal,
    selectedAppointmentForMemo,
    showVitalInputModal,
    vitalInputPatient,
    isExaminationLabelDialogOpen,
    examinationLabelEncounterId,
    examinationLabelDialogPatient,
    isPatientLabelDialogOpen,
    patientLabelDialogPatient,
    isQuickSendOpen,
    messageRecipients,
    isInsuranceHistoryPopupOpen,
    insuranceHistoryRegistration,
    insuranceHistoryReception,
    isCancelPaymentPopupOpen,
    cancelPaymentMessage,
    handleConfirmCancelPayment,
    closeCancelPaymentPopup,

    // Handlers
    handleContextMenuAction,
    handleCancelConfirm,
    handleCancelCancel,
    confirmAppointmentCancel,
    handleAppointmentCancelCancel,
    handleTransferToTreatment,
    handleConsentRequestClose,
    handleConsentRequestSuccess,
    handleRegistrationMemoClose,
    handleRegistrationMemoSuccess,
    handleAppointmentMemoClose,
    handleAppointmentMemoSuccess,
    handleVitalInputClose,
    handleExaminationLabelDialogOpenChange,
    handlePatientLabelDialogOpenChange,
    handleQuickSendClose,
    handleQuickMessageRecipientRemove,
    handleInsuranceHistoryPopupClose,
    isAppointmentPopupOpen,
    appointmentPopupMode,
    appointmentPopupAppointmentId,
    appointmentPopupPatientInfo,
    handleAppointmentPopupClose,

    // 사전문진
    isHealthCheckOpen,
    healthCheckUrl,
    isHealthCheckIframeLoaded,
    setIsHealthCheckIframeLoaded,
    handleHealthCheckClose,
  };
};

function mapToLabelDialogPatient(params: {
  registration?: Registration;
  appointment?: Appointment;
}): LabelDialogPatient | null {
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
  if (gender === 2 || gender === "F") return "F";
  return "M";
}
