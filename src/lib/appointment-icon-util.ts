import React from "react";
import {
  AppointmentStatusCanceled,
  AppointmentStatusConfirmed,
  AppointmentStatusNoshow,
  AppointmentStatusPending,
  AppointmentStatusVisited,
} from "@/components/custom-icons";
import { AppointmentStatus } from "@/constants/common/common-enum";

const APPOINTMENT_STATUS_ICON_MAP: Record<
  AppointmentStatus,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  [AppointmentStatus.PENDING]: AppointmentStatusPending,
  [AppointmentStatus.CONFIRMED]: AppointmentStatusConfirmed,
  [AppointmentStatus.VISITED]: AppointmentStatusVisited,
  [AppointmentStatus.NOSHOW]: AppointmentStatusNoshow,
  [AppointmentStatus.CANCELED]: AppointmentStatusCanceled,
};

/**
 * 예약 상태에 해당하는 아이콘 컴포넌트를 반환
 * @param status - 예약 상태 enum 값
 * @returns 해당 상태의 React SVG 아이콘 컴포넌트
 */
export function getAppointmentStatusIcon(
  status: AppointmentStatus
): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  return APPOINTMENT_STATUS_ICON_MAP[status] ?? AppointmentStatusPending;
}
