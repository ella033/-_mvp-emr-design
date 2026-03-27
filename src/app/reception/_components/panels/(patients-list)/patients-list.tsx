"use client";

import React, { forwardRef } from "react";
import CustomRoomPanel, { type CustomRoomPanelRef } from "./custom-room-panel";
import type { Registration } from "@/types/registration-types";
import type { Appointment } from "@/types/appointments/appointments";
import type { Hospital } from "@/types/hospital-types";

/**
 * PatientsList
 *
 * 역할:
 * - CustomRoomPanel을 사용한 환자 목록 UI 렌더링
 * - 예약실, 진료실, 수납실 패널들을 통합 관리
 * - 최종 UI 렌더링 담당
 */

interface PatientsListProps {
  // 데이터 (selectedDate 기준으로 필터링된 데이터)
  registrations?: Registration[];
  appointments?: Appointment[];
  hospital?: Hospital;
  selectedDate?: Date;

  // 이벤트 핸들러
  onPatientSelect?: (patient: any) => void;
  onLayoutChange?: (layout: any) => void;
  onRequestDateChange?: (date: Date) => void;
  isLoadingData?: boolean;

  // UI 설정
  className?: string;
  theme?: "light" | "dark";
}

const PatientsList = React.memo(
  forwardRef<CustomRoomPanelRef, PatientsListProps>(function PatientsList(
    {
      registrations = [],
      appointments = [],
      hospital,
      selectedDate = new Date(),
      onPatientSelect,
      onLayoutChange,
      onRequestDateChange,
      isLoadingData = false,
      className = "",
      theme = "light",
    },
    ref
  ) {
    return (
      <div
        className={`patients-list-container h-full bg-[var(--bg-base)] ${className}`}
        data-testid="reception-patients-list"
      >
        {/* 조회일 기준 예약환자, 진료실 대기, 수납 대기 리스트 표기 */}
        <CustomRoomPanel
          ref={ref}
          usePreset="all"
          registrations={registrations}
          appointments={appointments}
          hospital={hospital}
          selectedDate={selectedDate}
          onPatientSelect={onPatientSelect}
          onLayoutChange={onLayoutChange}
          onRequestDateChange={onRequestDateChange}
          isLoadingData={isLoadingData}
          theme={theme}
          className="h-full"
        />
      </div>
    );
  })
);

export default PatientsList;
export type { CustomRoomPanelRef };
