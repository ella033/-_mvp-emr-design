import { getAppointmentStatusIcon } from "@/lib/appointment-icon-util";
import { getAppointmentStatusColor } from "@/lib/reservation-utils";
import {
  AppointmentStatus,
  AppointmentStatusLabel,
} from "@/constants/common/common-enum";

/**
 * 예약 페이지에서 공통으로 사용되는 함수들을 제공하는 커스텀 훅
 */
export const useAppointmentPage = () => {
  const getStatusColor = (status: string) => getAppointmentStatusColor(status);

  /**
   * 예약 상태에 해당하는 아이콘 컴포넌트를 반환하는 함수
   * @param status - 예약 상태 enum 값
   * @returns 해당 상태의 React SVG 아이콘 컴포넌트
   */
  const getStatusIconComponent = (status: AppointmentStatus) => {
    return getAppointmentStatusIcon(status);
  };

  /**
   * 예약 상태 enum을 문자열로 변환하는 함수
   * @param status - 예약 상태 enum 값
   * @returns 상태 문자열
   */
  const getStatusKey = (status: AppointmentStatus) => {
    return AppointmentStatus[status as AppointmentStatus];
  };

  /**
   * 예약 상태에 해당하는 라벨을 반환하는 함수
   * @param status - 예약 상태 enum 값
   * @returns 상태 라벨 (한국어)
   */
  const getStatusLabel = (status: AppointmentStatus) => {
    return AppointmentStatusLabel[status as AppointmentStatus];
  };

  /**
   * 예약 상태 배지를 렌더링하기 위한 속성들을 반환하는 함수
   * @param status - 예약 상태 enum 값
   * @returns 배지 렌더링에 필요한 속성들
   */
  const getStatusBadgeProps = (status: AppointmentStatus) => {
    const statusKey = getStatusKey(status);
    const colorClasses = getStatusColor(statusKey);
    const StatusIcon = getStatusIconComponent(status);
    const label = getStatusLabel(status);

    return {
      statusKey,
      colorClasses,
      StatusIcon,
      label,
      className: `inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colorClasses}`,
    };
  };

  return {
    getStatusColor,
    getStatusIconComponent,
    getStatusKey,
    getStatusLabel,
    getStatusBadgeProps,
  };
};
