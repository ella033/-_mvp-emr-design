import type { ContextMenuItem } from "./draggable-wrapper";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import type { Reception } from "@/types/common/reception-types";
import {
  AppointmentStatus,
  PaymentStatus,
  접수상태,
} from "@/constants/common/common-enum";
import { PANEL_TYPE } from "@/constants/reception";


// ===== PANEL TYPE =====

export type PanelContextType =
  | "appointment"
  | "treatment"
  | "payment"
  | "default";

// ===== CONTEXT MENU ITEMS =====
/**
 * 예약실 전용 메뉴 아이템들
 */
export const APPOINTMENT_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "register-appointment",
    label: "접수",
  },
  {
    id: "edit-appointment",
    label: "예약 수정",
  },
  {
    id: "cancel-appointment",
    label: "예약 취소",
  },
  {
    id: "appointment-memo",
    label: "예약 메모",
  },
  {
    id: "revert-cancel",
    label: "취소 철회",
  },
  {
    id: "quick-message-send",
    label: "빠른 문자 발송"
  },
  {
    id: "patient-label-print",
    label: "환자 라벨 출력",
  },
  {
    id: "examination-label-print",
    label: "검사 라벨 출력",
  },
  {
    id: "health-check",
    label: "사전문진",
  }
];

/**
 * 진료실 전용 메뉴 아이템들
 */
export const TREATMENT_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "cancel-registration",
    label: "접수취소",
  },
  {
    id: "hold-treatment",
    label: "보류",
  },
  {
    id: "request-consent",
    label: "동의서 전송",
  },
  {
    id: "registration-memo",
    label: "접수메모",
  },
  {
    id: "vital-input",
    label: "바이탈입력",
  },
  {
    id: "patient-label-print",
    label: "환자 라벨 출력",
  },
  {
    id: "examination-label-print",
    label: "검사 라벨 출력",
  },
  {
    id: "add-registration",
    label: "추가 접수",
  },
  {
    id: "quick-message-send",
    label: "빠른 문자 발송"
  }
  /*
  {
    id: "vaccination-prescription",
    label: "예방접종처방",
  },
  */
];

/**
 * 수납실 전용 메뉴 아이템들
 */
export const PAYMENT_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "transfer-to-treatment",
    label: "진료대기로 이동",
  },
  {
    id: "cancel-payment",
    label: "수납취소",
  },
  {
    id: "create-appointment",
    label: "예약 생성"
  },
  {
    id: "patient-encounters",
    label: "처방조회",
  },
  {
    id: "insurance-history",
    label: "보험이력변경",
  },
  {
    id: "print-center",
    label: "출력센터",
  },
  {
    id: "prescription-print",
    label: "처방전 출력",
  },
  {
    id: "patient-label-print",
    label: "환자 라벨 출력",
  },
  {
    id: "examination-label-print",
    label: "검사 라벨 출력",
  },
  {
    id: "card-payment",
    label: "카드수납",
  },
  {
    id: "cash-payment",
    label: "현금수납",
  },
  {
    id: "add-registration",
    label: "추가 접수",
  },
  {
    id: "quick-message-send",
    label: "빠른 문자 발송"
  }
];

/**
 * 기본 메뉴 아이템들 (패널 정보가 없을 때)
 */
export const DEFAULT_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "edit-registration",
    label: "접수 정보 수정",
  },
];

// ===== MENU FACTORY FUNCTIONS =====

/**
 * 패널 타입에 따른 ContextMenu 아이템 생성
 * @param panelType 패널 타입
 * @param options 추가 옵션
 * @returns ContextMenuItem 배열
 */
export function createContextMenuItems(
  panelType: PanelContextType,
  options?: {
    showCallButton?: boolean;
    customItems?: ContextMenuItem[];
    appointment?: Appointment;
    registration?: Registration;
    headerOption?: PaymentStatus; // 수납실의 경우 PaymentStatus 전달 - 그외는 현재 미사용
  }
): ContextMenuItem[] {
  switch (panelType) {
    case PANEL_TYPE.APPOINTMENT:
      const appointmentItems = options?.appointment
        ? filterAppointmentMenuByStatus(
          APPOINTMENT_MENU_ITEMS,
          options.appointment
        )
        : APPOINTMENT_MENU_ITEMS;
      return [...appointmentItems, ...(options?.customItems || [])];

    case PANEL_TYPE.TREATMENT:
      const treatmentItems = options?.registration
        ? filterTreatmentMenuByStatus(
          TREATMENT_MENU_ITEMS,
          options.registration
        )
        : TREATMENT_MENU_ITEMS;
      return [...treatmentItems, ...(options?.customItems || [])];

    case PANEL_TYPE.PAYMENT:
      const paymentItems = options?.registration
        ? filterPaymentMenuByStatus(
          PAYMENT_MENU_ITEMS,
          options.registration,
          options.headerOption
        )
        : PAYMENT_MENU_ITEMS;
      return [...paymentItems, ...(options?.customItems || [])];

    case "default":
    default:
      return [...DEFAULT_MENU_ITEMS, ...(options?.customItems || [])];
  }
}

/**
 * appointment 상태에 따른 메뉴 아이템 처리 (disabled, visible 통합)
 * @param items 원본 메뉴 아이템들
 * @param appointment 예약 정보
 * @returns 처리된 메뉴 아이템들
 */
export function filterAppointmentMenuByStatus(
  items: ContextMenuItem[],
  appointment: Appointment
): ContextMenuItem[] {
  const status = appointment.status;

  return items.map((item) => {
    let visible: boolean | undefined = undefined;
    let disabled: boolean | undefined = undefined;

    // 사전문진: 똑닥 예약인 경우에만 표시
    if (item.id === "health-check") {
      const isDdocdoc = appointment.externalPlatform?.platformCode === "ddocdoc";
      visible = isDdocdoc;
      disabled = !isDdocdoc;
    }

    // 예약 취소 관련 메뉴 아이템 처리
    if (item.id === "cancel-appointment" || item.id === "revert-cancel") {
      const shouldShowCancel =
        status === AppointmentStatus.CONFIRMED && item.id === "cancel-appointment";
      const shouldShowRevert =
        status === AppointmentStatus.CANCELED && item.id === "revert-cancel";

      visible = shouldShowCancel || shouldShowRevert;
      // visible이 false면 disabled도 true (표시되지 않으면 클릭 불가)
      disabled = !visible;
    } else {
      // 그 외 메뉴 아이템의 disabled 상태 결정
      disabled = getAppointmentMenuItemDisabled(item.id, status);
      // visible은 기본값 (undefined = true)
    }

    return {
      ...item,
      ...(visible !== undefined && { visible }),
      ...(disabled !== undefined && { disabled }),
    };
  });
}

/**
 * registration 상태에 따른 진료실 메뉴 아이템 처리 (disabled, visible 통합)
 * @param items 원본 메뉴 아이템들
 * @param registration 접수 정보
 * @returns 처리된 메뉴 아이템들
 */
export function filterTreatmentMenuByStatus(
  items: ContextMenuItem[],
  registration: Registration
): ContextMenuItem[] {
  const status = registration.status;

  return items.map((item) => {
    let visible: boolean | undefined = undefined;
    let disabled: boolean | undefined = undefined;
    let id: string | undefined = undefined;
    let label: string | undefined = undefined;

    // 보류 관련 메뉴 아이템 동적 변경
    if (item.id === "hold-treatment") {
      const isHoldStatus = status === 접수상태.보류;
      id = isHoldStatus ? "cancel-hold-treatment" : "hold-treatment";
      label = isHoldStatus ? "보류취소" : "보류";
      // visible과 disabled는 기본값 (변경 없음)
    }

    // TODO: 진료실 메뉴 아이템의 disabled/visible 로직 추가 시 여기에 구현

    return {
      ...item,
      ...(id !== undefined && { id }),
      ...(label !== undefined && { label }),
      ...(visible !== undefined && { visible }),
      ...(disabled !== undefined && { disabled }),
    };
  });
}

/**
 * registration 상태에 따른 수납실 메뉴 아이템 처리 (disabled, visible 통합)
 * @param items 원본 메뉴 아이템들
 * @param registration 접수 정보
 * @param headerOption PaymentStatus (PENDING 또는 COMPLETED)
 * @returns 처리된 메뉴 아이템들
 */
export function filterPaymentMenuByStatus(
  items: ContextMenuItem[],
  registration: Registration,
  headerOption?: PaymentStatus
): ContextMenuItem[] {
  const status = registration.status;

  return items.map((item) => {
    let visible: boolean | undefined = undefined;
    let disabled: boolean | undefined = undefined;

    // 처방조회: status에 상관없이 항상 표시
    if (item.id === "patient-encounters") {
      visible = true;
      disabled = false;
    }

    // 보험이력변경: 수납대기 상태에서만 표시
    if (item.id === "insurance-history") {
      visible = status === 접수상태.수납대기;
      disabled = !visible;
    }

    // 카드수납, 현금수납 처리
    if (item.id === "card-payment" || item.id === "cash-payment") {
      visible =
        status === 접수상태.수납대기 &&
        headerOption === PaymentStatus.PENDING;
      // visible이 false면 disabled도 true (표시되지 않으면 클릭 불가)
      disabled = !visible;
    }

    if (item.id === "cancel-payment") {
      visible = status === 접수상태.수납완료;
      disabled = !visible;
    }

    if (item.id === "transfer-to-treatment") {
      visible = status === 접수상태.수납대기;
      disabled = !visible;
    }
    // TODO: 수납실 메뉴 아이템의 추가 disabled/visible 로직 추가 시 여기에 구현

    return {
      ...item,
      ...(visible !== undefined && { visible }),
      ...(disabled !== undefined && { disabled }),
    };
  });
}

/**
 * appointment 메뉴 아이템의 disabled 상태 결정
 * @param menuId 메뉴 아이템 ID
 * @param status 예약 상태
 * @returns 비활성화 여부
 */
function getAppointmentMenuItemDisabled(
  menuId: string,
  status: AppointmentStatus
): boolean {
  switch (menuId) {
    case "register-appointment":
      // 접수: 예약 확정 상태일 때만 활성화
      return status !== AppointmentStatus.CONFIRMED;

    case "edit-appointment":
      // 예약수정: 취소 및 내원된 상태가 아닐 때 활성화
      return (
        status === AppointmentStatus.CANCELED ||
        status === AppointmentStatus.VISITED
      );

    default:
      return false;
  }
}

// ===== ACTION HANDLERS =====

/**
 * ContextMenu 액션 타입 정의
 */
export interface ContextMenuActionData {
  registration?: Registration;
  appointment?: any; // Appointment 타입 (순환 참조 방지를 위해 any 사용)
  /** 리스트 카드에서 넘긴 표시용 Reception. 있으면 convert 없이 사용 */
  reception?: Reception;
  panelType: PanelContextType;
  [key: string]: any;
}

