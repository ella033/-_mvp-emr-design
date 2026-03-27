"use client";

import { useState } from "react";
import { ChevronDown, MoreVertical } from "lucide-react";
import {
  AppointmentStatus,
  AppointmentStatusLabel,
} from "@/constants/common/common-enum";
import { getAppointmentStatusColor } from "@/lib/reservation-utils";
import { DdocDocIcon } from "@/components/custom-icons";
import type { AppointmentWithHistory } from "@/types/appointments/appointment-history";

interface AppointmentHistoryCardProps {
  appointment: AppointmentWithHistory;
}

function formatAppointmentDate(date: Date): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const weekday = d.toLocaleDateString("ko-KR", { weekday: "short" });
  return `${yyyy}-${mm}-${dd} (${weekday})`;
}

function formatAppointmentTime(date: Date): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AppointmentHistoryCard({
  appointment,
}: AppointmentHistoryCardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const statusLabel = AppointmentStatusLabel[appointment.status];
  const statusColor = getAppointmentStatusColor(
    AppointmentStatus[appointment.status as AppointmentStatus] ?? ""
  );

  const roomName =
    appointment.appointmentRoom?.displayName ??
    appointment.appointmentRoom?.name ??
    "-";
  const doctorName = appointment.doctor?.name ?? "-";
  const typeName = appointment.appointmentType?.name ?? "-";
  const memo = appointment.memo || "-";
  const isDdocdoc = appointment.externalPlatform?.platformCode === "ddocdoc";
  const historyItems = appointment.appointmentHistory ?? [];

  return (
    <div className="rounded-md border border-[var(--gray-200)] bg-white p-3 shadow-sm">
      {/* 첫번째 줄: status, 예약일, 요일, 시간, 똑닥여부, moreInfo */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex shrink-0 items-center rounded-sm px-1.5 text-[12px] font-normal ${statusColor}`}
          >
            {statusLabel}
          </span>
          <span className="text-[13px] text-[var(--gray-700)]">
            {formatAppointmentDate(appointment.appointmentStartTime)}
          </span>
          <span className="text-[13px] font-medium text-[var(--gray-900)]">
            {formatAppointmentTime(appointment.appointmentStartTime)}
          </span>
          {isDdocdoc && (
            <DdocDocIcon className="h-4 w-4 shrink-0" aria-label="똑닥" />
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded p-0.5 hover:bg-[var(--gray-100)]"
        >
          <MoreVertical className="h-4 w-4 text-[var(--gray-400)]" />
        </button>
      </div>

      {/* 두번째 줄: 예약실 | 담당의 | 예약타입 | 메모 */}
      <div className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--gray-500)] truncate">
        <span>{roomName}</span>
        <span className="text-[var(--gray-300)]">|</span>
        <span>{doctorName}</span>
        <span className="text-[var(--gray-300)]">|</span>
        <span>{typeName}</span>
        <span className="text-[var(--gray-300)]">|</span>
        <span className="truncate">{memo}</span>
      </div>

      {/* 세번째 줄: 이력 요약 + chevron */}
      {historyItems.length > 0 && (
        <div className="mt-2 border-t border-[var(--gray-100)] pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--gray-500)]">
              {historyItems[0]?.description ?? "-"}
              <span className="ml-1 text-[var(--gray-400)]">
                이력 ({historyItems.length}건)
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className="shrink-0 rounded p-0.5 hover:bg-[var(--gray-100)]"
            >
              <ChevronDown
                className={`h-4 w-4 text-[var(--gray-400)] transition-transform duration-200 ${
                  isHistoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* 이력 상세 (펼침) */}
          {isHistoryOpen && (
            <div className="mt-2 space-y-1.5">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded bg-[var(--gray-50)] px-2 py-1.5 text-[11px] text-[var(--gray-600)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-[var(--gray-400)]">
                      {item.createdBy}
                    </span>
                  </div>
                  <p className="mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
