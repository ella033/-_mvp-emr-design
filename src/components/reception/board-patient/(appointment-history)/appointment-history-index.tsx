"use client";

import { useMemo } from "react";
import { useAppointmentHistoryByPatient } from "@/hooks/appointment/use-appointment-history-by-patient";
import type { ExternalReception } from "../types";
import AppointmentHistoryCard from "./appointment-history-card";

export interface AppointmentHistoryIndexProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
}

export default function AppointmentHistoryIndex({
  reception,
}: AppointmentHistoryIndexProps) {
  const patientId = useMemo(() => {
    const raw = reception?.patientBaseInfo?.patientId ?? "0";
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [reception?.patientBaseInfo?.patientId]);

  const { data: appointments, isLoading } =
    useAppointmentHistoryByPatient(patientId > 0 ? patientId : undefined);

  if (patientId <= 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[var(--gray-600)]">
        환자 정보를 불러오는 중...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[var(--gray-600)]">
        예약 현황을 불러오는 중...
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[var(--gray-600)]">
        예약 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-2 gap-2">
      {appointments.map((appointment) => (
        <AppointmentHistoryCard
          key={appointment.id}
          appointment={appointment}
        />
      ))}
    </div>
  );
}
