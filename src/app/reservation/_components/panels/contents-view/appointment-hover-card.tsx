import React from "react";
import { AppointmentStatus } from "@/constants/common/common-enum";
import { getGender } from "@/lib/patient-utils";
import { useAppointmentPage } from "@/hooks/appointment/use-appointment-page";
import { stripHtmlTags } from "@/utils/template-code-utils";

interface AppointmentHoverCardProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  appointment: {
    id: string;
    originalData?: any;
    start: Date;
    end: Date;
    color?: string;
    title?: string;
    memo?: string;
    patientId?: number;
  };
  style?: React.CSSProperties;
}

export const AppointmentHoverCard: React.FC<AppointmentHoverCardProps> = ({
  appointment,
  style = {},
}) => {
  const { originalData, start, end, color = "#3b82f6" } = appointment;
  // 환자 정보 추출
  const patientName =
    originalData?.patientName ||
    originalData?.patient?.name ||
    appointment.title ||
    "환자명 없음";
  const gender = originalData?.patient?.gender || originalData?.gender || "";
  const age = originalData?.patient?.age || originalData?.age || "";
  const memo =
    stripHtmlTags(originalData?.memo || "") || stripHtmlTags(appointment.memo || "") || "";
  const type =
    originalData?.appointmentType?.name || originalData?.appointmentType || "";
  const status = originalData?.status;
  const appointmentRoomName = originalData?.appointmentRoom?.name || "예약실";
  const appointmentStartTime = start;

  // 나이 계산 (생년월일이 있는 경우)
  let ageText = "";
  if (originalData?.patient?.birthDate) {
    let birthDate: Date;

    if (
      typeof originalData.patient.birthDate === "string" &&
      originalData.patient.birthDate.length === 8
    ) {
      const year = parseInt(originalData.patient.birthDate.slice(0, 4));
      const month = parseInt(originalData.patient.birthDate.slice(4, 6)) - 1;
      const day = parseInt(originalData.patient.birthDate.slice(6, 8));
      birthDate = new Date(year, month, day);
    } else {
      birthDate = new Date(originalData.patient.birthDate.toString());
    }

    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      ageText = `${calculatedAge}`;
    }
  } else if (age) {
    ageText = `${age}`;
  }

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일(${weekday})`;
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const { getStatusColor, getStatusIconComponent, getStatusKey, getStatusLabel } =
    useAppointmentPage();

  return (
    <div
      className="fixed bg-[var(--gray-300)] rounded-sm shadow-lg p-3 z-50 min-w-[250px]"
      style={style}
    >
      {/* 환자 정보 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[var(--bg-main)] font-medium text-sm">
          {patientName} {ageText && `(${getGender(gender, "ko")}/${ageText})`}
        </div>
        <span
          className={`inline-flex items-center px-1 py-0.5 rounded-sm text-xs ${getStatusColor(getStatusKey(status as AppointmentStatus))}`}
        >
          {getStatusLabel(status as AppointmentStatus) || status}
        </span>
      </div>

      {/* 예약 날짜/시간 */}
      <div className="flex items-center gap-2 mb-2">
        <img src="/icon/ic_line_calendar.svg" alt="달력" className="w-4 h-4" />
        <span className="text-sm text-[var(--gray-700)]">
          {formatDate(appointmentStartTime)} {formatTime(appointmentStartTime)}
        </span>
      </div>

      {/* 예약실 */}
      <div className="flex items-center gap-2 mb-2">
        <img
          src="/icon/ic_line_layout-dashboard.svg"
          alt="대시보드"
          className="w-4 h-4"
        />
        <span className="text-sm text-[var(--gray-700)]">
          {appointmentRoomName}
        </span>
      </div>

      {/* 상태 및 메모 */}
      <div className="flex items-center gap-2">
        <img src="/icon/ic_line_note.svg" alt="노트" className="w-4 h-4" />
        <div className="flex items-center gap-2">
          {type && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium ml-1 text-[var(--bg-main)]"
              style={{ backgroundColor: color }}
            >
              {type.substring(0, 1)}
            </span>
          )}
          {memo && (
            <span className="text-sm text-[var(--gray-700)]">{memo}</span>
          )}
        </div>
      </div>
    </div>
  );
};
