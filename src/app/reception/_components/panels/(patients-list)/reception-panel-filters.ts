import type { Registration } from "@/types/registration-types";
import { 접수상태 } from "@/constants/common/common-enum";
import { PANEL_TYPE, type PanelTypeKey } from "@/constants/reception";

/**
 * 접수 패널별 "기본 분류" 필터 (단일 소스)
 *
 * - 역할: Registration을 "진료실 패널용" vs "수납실 패널용"으로 나누는 조건만 정의합니다.
 * - 사용처: room-panel(패널별로 넘길 데이터 분배), panel-container(panelSourceData 계산).
 * - 헤더 UI 필터(예약 상태, 진료실, 수납 상태 등)는 panel-container의 getFiltered* 에서만 적용됩니다.
 *
 * 필터 적용 순서 (유지보수 시 참고):
 * 1. 이 파일: 접수상태 기준 패널 분류 (진료 vs 수납)
 * 2. panel-container: docking-panel-header 선택값 기준 필터 (getFilteredAppointmentData 등)
 */

/** 진료실 패널에 표시할 접수인지 (수납대기/수납완료가 아닌 경우) */
export function isRegistrationForTreatmentPanel(reg: Registration): boolean {
  return (
    reg.status !== 접수상태.수납대기 && reg.status !== 접수상태.수납완료
  );
}

/** 수납실 패널에 표시할 접수인지 (수납대기 또는 수납완료) */
export function isRegistrationForPaymentPanel(reg: Registration): boolean {
  return (
    reg.status === 접수상태.수납대기 || reg.status === 접수상태.수납완료
  );
}

/**
 * 패널 타입에 맞게 접수 목록 필터 (APPOINTMENT는 사용하지 않음, 호출부에서 appointments 사용)
 */
export function filterRegistrationsForPanel(
  registrations: Registration[],
  panelType: PanelTypeKey
): Registration[] {
  if (panelType === PANEL_TYPE.TREATMENT) {
    return registrations.filter(isRegistrationForTreatmentPanel);
  }
  if (panelType === PANEL_TYPE.PAYMENT) {
    return registrations.filter(isRegistrationForPaymentPanel);
  }
  return [];
}
