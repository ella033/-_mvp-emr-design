import { CashApprovalMethod, ReceptionInitialTab } from "@/constants/common/common-enum";

/**
 * 탭별 UI 상태 정의
 * - 도메인 데이터(Reception)와 분리된, 화면 상 편집/선택 상태를 표현
 */
export interface PatientInfoViewState {
  dirty: boolean;
  validationErrors: string[];
  lastUpdatedAt: number | null;
}

export interface PatientChartViewState {
  activeEncounterId: string | null;
  lastViewedAt: number | null;
}

export interface InsuranceHistoryViewState {
  dateRange: { from: string; to: string };
  selectedRegistrationIds: string[];
  isLoading: boolean;
}

export interface PaymentInfoViewState {
  // 차감내역 관련
  adjustmentValues: {
    discount: number;
    healthMaintenanceFee: number;
    grantAmount: number;
    adjustments: { id?: string; label?: string; amount?: number }[];
  };

  // 영수증 메모
  receiptMemo: string;

  // 영수액
  receivedAmount: string;

  // 프린트 옵션
  printPrescription: boolean;
  printReceipt: boolean;
  printStatement: boolean;

  // 결제수단 관련
  isCardChecked: boolean;
  isCashChecked: boolean;
  installment: string;
  cardAmount: string;
  cashAmount: string;
  transferAmount: string;
  isCashReceiptChecked: boolean;
  cashReceiptAmount: string;
  approvalMethod: CashApprovalMethod | "";
  approvalNumber: string;
  isTerminal: boolean;
  cardApprovalNumber: string;
}

export interface NotPaidViewState {
  selectedIds: string[];
  filters: Record<string, string | number | boolean | null>;
}

export interface AppointmentHistoryViewState {
  selectedAppointmentId: number | null;
}

export interface PrintCenterViewState {
  selectedPrintType: string | null;
  lastPrintedAt: string | null;
}

export type TabStateByTab = {
  [ReceptionInitialTab.환자정보]: PatientInfoViewState;
  [ReceptionInitialTab.처방조회]: PatientChartViewState;
  [ReceptionInitialTab.보험이력변경]: InsuranceHistoryViewState;
  [ReceptionInitialTab.수납정보]: PaymentInfoViewState;
  [ReceptionInitialTab.미수환불]: NotPaidViewState;
  [ReceptionInitialTab.출력센터]: PrintCenterViewState;
  [ReceptionInitialTab.예약현황]: AppointmentHistoryViewState;
};

export interface ReceptionViewState {
  activeTab: ReceptionInitialTab | null;
  perTabDirty: Partial<Record<ReceptionInitialTab, boolean>>;
  perTabDisabled: Partial<Record<ReceptionInitialTab, boolean>>;
  perTabVisible: Partial<Record<ReceptionInitialTab, boolean>>;

  patientInfo: PatientInfoViewState;
  patientChart: PatientChartViewState;
  insuranceHistory: InsuranceHistoryViewState;
  paymentInfo: PaymentInfoViewState;
  notPaid: NotPaidViewState;
  appointmentHistory: AppointmentHistoryViewState;
  printCenter: PrintCenterViewState;
}

export const createInitialPatientInfoViewState = (): PatientInfoViewState => ({
  dirty: false,
  validationErrors: [],
  lastUpdatedAt: null,
});

const getInitialInsuranceDateRange = (): { from: string; to: string } => {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const format = (date: Date) => date.toISOString().split("T")[0] ?? "";
  return { from: format(oneWeekAgo), to: format(today) };
};

export const createInitialInsuranceHistoryViewState =
  (): InsuranceHistoryViewState => ({
    dateRange: getInitialInsuranceDateRange(),
    selectedRegistrationIds: [],
    isLoading: false,
  });

export const createInitialPaymentInfoViewState = (): PaymentInfoViewState => ({
  adjustmentValues: {
    discount: 0,
    healthMaintenanceFee: 0,
    grantAmount: 0,
    adjustments: [],
  },
  receiptMemo: "",
  receivedAmount: "",
  printPrescription: false,
  printReceipt: false,
  printStatement: false,
  isCardChecked: false,
  isCashChecked: false,
  installment: "일시불",
  cardAmount: "",
  cashAmount: "",
  transferAmount: "",
  isCashReceiptChecked: false,
  cashReceiptAmount: "",
  approvalMethod: "",
  approvalNumber: "",
  isTerminal: true,
  cardApprovalNumber: "",
});

export const createInitialNotPaidViewState = (): NotPaidViewState => ({
  selectedIds: [],
  filters: {},
});

export const createInitialAppointmentHistoryViewState = (): AppointmentHistoryViewState => ({
  selectedAppointmentId: null,
});

export const createInitialPrintCenterViewState = (): PrintCenterViewState => ({
  selectedPrintType: null,
  lastPrintedAt: null,
});

export const createInitialPatientChartViewState = (): PatientChartViewState => ({
  activeEncounterId: null,
  lastViewedAt: null,
});

export const createInitialReceptionViewState = (
  activeTab: ReceptionInitialTab | null = null
): ReceptionViewState => ({
  activeTab,
  perTabDirty: {},
  perTabDisabled: {},
  perTabVisible: {
    [ReceptionInitialTab.환자정보]: true,
    [ReceptionInitialTab.처방조회]: true,
    [ReceptionInitialTab.보험이력변경]: true,
    [ReceptionInitialTab.수납정보]: true,
    [ReceptionInitialTab.미수환불]: true,
    [ReceptionInitialTab.예약현황]: true,
    [ReceptionInitialTab.출력센터]: true,
  },
  patientInfo: createInitialPatientInfoViewState(),
  patientChart: createInitialPatientChartViewState(),
  insuranceHistory: createInitialInsuranceHistoryViewState(),
  paymentInfo: createInitialPaymentInfoViewState(),
  notPaid: createInitialNotPaidViewState(),
  appointmentHistory: createInitialAppointmentHistoryViewState(),
  printCenter: createInitialPrintCenterViewState(),
});

