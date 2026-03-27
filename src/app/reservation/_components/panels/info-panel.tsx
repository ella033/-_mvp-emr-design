"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { ReceptionSearchBar } from "@/app/reception/_components";
import type { AppointmentRoomOperatingHours } from "@/types/appointments/appointment-room-operating-hours";
import type { AppointmentRoom } from "@/types/calendar-types";
import { useUsersStore } from "@/store/users-store";
import { useHospitalStore } from "@/store/hospital-store";
import { AppointmentStatus } from "@/constants/common/common-enum";
import type { AppointmentPatient } from "@/types/patient-types";
import { calculateAge, getGender, formatPhoneNumberRealtime } from "@/lib/patient-utils";
import { Badge } from "@/components/ui/badge";
import "@/styles/figma-colors.css";
import { formatBirthDate } from "@/lib/reservation-utils";
import { useAppointmentPage } from "@/hooks/appointment/use-appointment-page";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useInfoPanel } from "@/hooks/appointment/actions/use-info-panel";
import AppointmentCancelReasonModal from "@/app/reception/_components/panels/(patients-list)/appointment-cancel-reason-modal";
import { formatRrnNumber } from "@/lib/common-utils";
import { InfoFooter } from "./info-footer";
import AppointmentForm from "@/components/appointment/appointment-form";
import { stripHtmlTags } from "@/utils/template-code-utils";

interface InfoPanelProps {
  selectedDateTime?: {
    date: Date;
    time?: { hour: number; minute: number };
  };
  selectedTimeSlot?: {
    start: string;
    end: string;
    appointmentRoom?: AppointmentRoom;
  };
  operatingHours?: AppointmentRoomOperatingHours[] | null;
  onTimeSlotClick?: (
    date: Date,
    time: { start: string; end: string },
    appointmentRoom: AppointmentRoom
  ) => void;
  selectedAppointmentId?: string;
  initialPatientId?: string | number;
  resetReservationInfoTrigger?: number;
  onCancel?: () => void;
}

/** 생년월일 실시간 포맷 (YYYY-MM-DD) */
const formatBirthDateRealtime = (value: string): string => {
  const raw = value.replace(/[^0-9]/g, "").slice(0, 8);
  if (raw.length > 6) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
  } else if (raw.length > 4) {
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  return raw;
};

const PatientInfo: React.FC<{
  patient: {
    id: string;
    name: string;
    phone: string;
    birthDate: string;
  };
  isNewPatientMode?: boolean;
  onPatientInfoChange?: (
    field: "name" | "phone" | "birthDate",
    value: string
  ) => void;
}> = ({ patient, isNewPatientMode = false, onPatientInfoChange }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatPhoneNumberRealtime(e.target.value);
      onPatientInfoChange?.("phone", formattedValue);
    },
    [onPatientInfoChange]
  );

  const handleBirthDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatBirthDateRealtime(e.target.value);
      onPatientInfoChange?.("birthDate", formattedValue);
    },
    [onPatientInfoChange]
  );

  const handleDatePickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        onPatientInfoChange?.("birthDate", e.target.value);
      }
    },
    [onPatientInfoChange]
  );

  /** Enter 키로 다음 필드 이동 */
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        phoneInputRef.current?.focus();
      }
    },
    []
  );

  const handlePhoneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        birthDateInputRef.current?.focus();
      }
    },
    []
  );

  const focusRoomSelect = useCallback(() => {
    const roomTrigger = document.querySelector<HTMLElement>(
      '[data-appointment-form] [data-slot="select-trigger"]'
    );
    if (roomTrigger) {
      roomTrigger.focus();
      roomTrigger.click();
    }
  }, []);

  const handleBirthDateKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        focusRoomSelect();
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        focusRoomSelect();
      }
    },
    [focusRoomSelect]
  );

  return (
    <div className="p-4 border-b">
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
            환자명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={patient.name}
            disabled={!isNewPatientMode}
            onChange={(e) => onPatientInfoChange?.("name", e.target.value)}
            onKeyDown={handleNameKeyDown}
            className={`flex-1 border border-gray-300 rounded px-3 py-2 text-sm ${isNewPatientMode
              ? "bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              : "bg-gray-100 text-gray-600"
              }`}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <input
            ref={phoneInputRef}
            type="tel"
            value={patient.phone}
            disabled={!isNewPatientMode}
            placeholder="- 없이 입력"
            onChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            className={`flex-1 border border-gray-300 rounded px-3 py-2 text-sm ${isNewPatientMode
              ? "bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              : "bg-gray-100 text-gray-600"
              }`}
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
            생년월일
          </label>
          <div className="flex-1 relative">
            <input
              ref={birthDateInputRef}
              type="text"
              value={patient.birthDate}
              disabled={!isNewPatientMode}
              placeholder="YYYY-MM-DD"
              onChange={handleBirthDateChange}
              onKeyDown={handleBirthDateKeyDown}
              maxLength={10}
              className={`w-full border border-gray-300 rounded px-3 py-2 text-sm pr-9 ${isNewPatientMode
                ? "bg-[var(--bg-main)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                : "bg-gray-100 text-gray-600"
                }`}
            />
            {isNewPatientMode && (
              <>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={handleDatePickerChange}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  tabIndex={-1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SelectedPatientInfo: React.FC<{
  patient: AppointmentPatient;
  appointmentStatus?: string;
  appointmentDescription?: string;
}> = ({ patient }) => {
  const age = patient.age || calculateAge(patient.birthDate);

  const gender = patient.gender;
  const formattedBirthDate = formatBirthDate(patient.birthDate);
  const displayPhone = patient.phone || "";

  return (
    <div className="p-4 border-b">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none">
            {patient.patientNo}
          </div>
          <span className="text-md font-bold text-[var(--gray-100)]">
            {patient.name}
          </span>
          {gender && age && (
            <span className="text-md font-bold text-[var(--gray-100)]">
              ({gender}/{age})
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {patient.rrn && <span>{formatRrnNumber(patient.rrn)}</span>}
          {formattedBirthDate && displayPhone && (
            <span className="mx-2">|</span>
          )}
          {displayPhone && <span>{displayPhone}</span>}
        </div>
      </div>
    </div>
  );
};

export default function InfoPanel({
  selectedDateTime,
  selectedTimeSlot,
  operatingHours,
  onTimeSlotClick,
  selectedAppointmentId,
  initialPatientId,
  resetReservationInfoTrigger,
  onCancel,
}: InfoPanelProps) {
  const { getUsersByHospital } = useUsersStore();
  const { hospital } = useHospitalStore();

  // 커스텀 훅 사용
  const {
    // States
    selectedId,
    selectedPatient,
    setSelectedPatient,
    isNewPatientMode,
    setIsNewPatientMode,
    showSearchBar,
    setShowSearchBar,
    newPatientInfo,
    appointmentHistory,
    isLoadingHistory,
    selectedHistoryId,
    reservationRoom,
    setReservationRoom,
    reservationDoctor,
    setReservationDoctor,
    reservationType,
    setReservationType,
    reservationTypeName,
    reservationDate,
    setReservationDate,
    fromTime,
    toTime,
    setToTime,
    reservationMemo,
    setReservationMemo,
    appointmentTypes,
    isLoadingTypes,
    isLoadingRooms,
    showCancelConfirmPopup,
    setShowCancelConfirmPopup,

    // Computed values
    selectedRoomConfig,

    // From appointment hook
    forceConfirmState,

    // Data
    appointmentRooms,

    // Handlers
    handleNewPatientInfoChange,
    updateEndTimeByRoomDuration,
    setTimeRange,
    handlePatientSelect,
    handleCreateAppointment,
    handleCancelAppointment: handleCancelAppointmentAction,
    confirmCancelAppointment,
    handleCancel,
    handleHistoryCardClick,
    fetchAppointmentHistory,
    resetAllReservationInfo,
  } = useInfoPanel({
    selectedDateTime,
    selectedTimeSlot,
    operatingHours,
    onTimeSlotClick,
    selectedAppointmentId,
    initialPatientId,
    onCancel,
  });

  // 예약 생성 버튼 클릭 시 예약정보 초기화. 넘겨받은 예약일자가 있으면 해당 일자로 설정
  useEffect(() => {
    if (resetReservationInfoTrigger !== undefined && resetReservationInfoTrigger > 0) {
      if (selectedPatient && !selectedAppointmentId && !selectedHistoryId) {
        resetAllReservationInfo();
        if (selectedDateTime?.date) {
          const d = selectedDateTime.date;
          const dateString = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
          setReservationDate(dateString);
        }
      }
    }
  }, [resetReservationInfoTrigger, selectedPatient, selectedAppointmentId, selectedHistoryId, resetAllReservationInfo, selectedDateTime, setReservationDate]);

  // 예약내역카드 컴포넌트
  const AppointmentHistoryCard: React.FC<{
    appointment: any;
    isSelected: boolean;
  }> = ({ appointment, isSelected }) => {
    // 날짜 포맷팅 (YYYY/MM/DD)
    const formatDate = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const { getStatusColor, getStatusIconComponent, getStatusKey, getStatusLabel } =
      useAppointmentPage();

    return (
      <div
        className={`p-2 border rounded-lg cursor-pointer  hover:bg-gray-50 transition-colors  bg-[var(--bg-1)]
          ${isSelected ? "border-[var(--main-color)] border-2" : "border-[var(--bg-1)]"}`}
        data-testid="reservation-history-card"
        data-appointment-id={appointment.id}
        data-selected={isSelected ? "true" : "false"}
        onClick={() => handleHistoryCardClick(appointment)}
      >
        <div className="space-y-2">
          {/* 첫 번째 줄: 날짜, 예약실, 예약유형, 상태 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold">
                {formatDate(appointment.appointmentStartTime)}
              </span>
              <span className="inline-flex items-center px-1 py-1 text-xs font-medium text-[var(--gray-400)] ">
                {appointment.appointmentRoom?.name || "예약실"}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs ${getStatusColor(getStatusKey(appointment.status as AppointmentStatus))}`}
            >
              {appointment.description ||
                getStatusLabel(appointment.status as AppointmentStatus) ||
                appointment.status}
            </span>
          </div>

          {/* 두 번째 줄: 메모 */}
          <div className="flex items-center gap-2">
            <Badge
              style={{
                backgroundColor:
                  appointment.appointmentType?.colorCode || "#6B7280",
              }}
              className="text-white"
            >
              {appointment.appointmentType?.name || "-"}
            </Badge>
            <div className="text-sm text-gray-600">
              {stripHtmlTags(appointment.memo) || "　"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-[350px] bg-[var(--bg-main)] shadow-lg flex flex-col h-full overflow-x-hidden"
      data-testid="reservation-info-panel"
      data-selected-appointment-id={selectedId ?? ""}
      data-history-count={String(appointmentHistory.length)}
    >
      {/* Top Dock - 환자정보, 예약내역, 예약정보 */}
      <div className="flex flex-col">
        {/* 탑 헤더라인 */}
        <div className="pt-4 px-4 pb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">환자 정보</h3>
          <div className="flex gap-2">
            {/* 신환예약 버튼 - 특정 상태에서만 숨김 */}
            {!isNewPatientMode && !selectedPatient && !selectedId && (
              <button
                onClick={() => {
                  setIsNewPatientMode(true);
                  setSelectedPatient(null);
                }}
                data-testid="reservation-new-patient-button"
                className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50"
              >
                신환 예약
              </button>
            )}

            {/* Search 버튼 - 신환 모드이거나 환자가 선택된 경우 표시 */}
            {(isNewPatientMode || selectedPatient || selectedId) && (
              <button
                onClick={() => setShowSearchBar(!showSearchBar)}
                data-testid="reservation-search-toggle-button"
                className="p-1.5 rounded cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}

            {/* More Info 버튼 - 환자가 선택된 경우에만 표시 */}
            {(selectedPatient || selectedId) && (
              <button
                onClick={() => {
                  /* more info 로직 */
                }}
                className="p-1.5 rounded cursor-pointer"
              >
                <img src="/moreInfo.svg" alt="More Info" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SearchBar 영역 - 조건부 표시 */}
        {(() => {
          return showSearchBar;
        })() && (
            <div className="border-b" data-testid="reservation-patient-search">
              <div className="p-2 relative">
                <ReceptionSearchBar
                  widthClassName="w-full z-10"
                  onPatientSelect={handlePatientSelect}
                  disableDefaultBehavior={true}
                  hideQuickReception={true}
                />
              </div>
            </div>
          )}

        {/* 환자 검색 또는 환자 정보 */}
        <div>
          {selectedPatient ? (
            <SelectedPatientInfo
              patient={selectedPatient}
              appointmentStatus={
                selectedId
                  ? appointmentHistory.find((h) => h.id === selectedId)?.status
                  : undefined
              }
              appointmentDescription={
                selectedId
                  ? appointmentHistory.find((h) => h.id === selectedId)
                    ?.description
                  : undefined
              }
            />
          ) : isNewPatientMode ? (
            <PatientInfo
              patient={{
                id: "",
                name: newPatientInfo.name,
                phone: newPatientInfo.phone,
                birthDate: newPatientInfo.birthDate,
              }}
              isNewPatientMode={isNewPatientMode}
              onPatientInfoChange={handleNewPatientInfoChange}
            />
          ) : (
            <div className="border-b" data-testid="reservation-patient-search">
              <div className="p-2 relative">
                <ReceptionSearchBar
                  widthClassName="w-full z-10"
                  onPatientSelect={handlePatientSelect}
                  disableDefaultBehavior={true}
                  hideQuickReception={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* 예약 내역 히스토리 - 높이 275px 고정 */}
        <div className="flex flex-col p-4 h-[275px]  border-b border-gray-300" data-testid="reservation-history-list">
          <h3 className="text-lg font-semibold mb-4">예약 내역</h3>
          {isLoadingHistory ? (
            <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
              로딩 중...
            </div>
          ) : appointmentHistory.length === 0 ? (
            <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">
              예약 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-2 h-full overflow-y-auto">
              {appointmentHistory.map((appointment: any) => {
                const isSelected = selectedHistoryId
                  ? selectedHistoryId === appointment.id
                  : (selectedAppointmentId === appointment.id);
                return (
                  <AppointmentHistoryCard
                    key={appointment.id}
                    appointment={appointment}
                    isSelected={isSelected}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 예약 정보 폼 - flex-1로 남은 공간 차지 */}
        <div className="p-4 space-y-2 flex-1 flex flex-col" data-appointment-form data-testid="reservation-form">
          <AppointmentForm
            reservationRoom={reservationRoom}
            reservationDoctor={reservationDoctor}
            reservationType={reservationType}
            reservationTypeName={reservationTypeName}
            reservationDate={reservationDate}
            fromTime={fromTime}
            toTime={toTime}
            reservationMemo={reservationMemo}
            onRoomChange={(value) => {
              setReservationRoom(value);
              // 선택한 예약실의 담당 진료의 설정
              const selectedRoom = appointmentRooms.find(
                (room) => room.id.toString() === value
              );
              if (selectedRoom && selectedRoom.userId && hospital?.id) {
                const doctors = getUsersByHospital(hospital.id.toString());
                const assignedDoctor = doctors.find(
                  (doctor) => doctor.id === selectedRoom.userId
                );
                if (assignedDoctor) {
                  setReservationDoctor(assignedDoctor.name);
                }
              }
              // 예약실 변경 시 fromTime이 있으면 toTime 업데이트
              if (fromTime && value) {
                updateEndTimeByRoomDuration(fromTime, value);
              }
            }}
            onDoctorChange={setReservationDoctor}
            onTypeChange={setReservationType}
            onDateChange={setReservationDate}
            onFromTimeChange={(value) => setTimeRange(value)}
            onToTimeChange={(value) => {
              if (fromTime && value < fromTime) {
                setToTime(fromTime);
              } else {
                setToTime(value);
              }
            }}
            onMemoChange={setReservationMemo}
            appointmentRooms={appointmentRooms}
            appointmentTypes={appointmentTypes}
            doctors={hospital?.id ? getUsersByHospital(hospital.id.toString()) : []}
            selectedRoomConfig={selectedRoomConfig}
            isLoadingRooms={isLoadingRooms}
            isLoadingTypes={isLoadingTypes}
            selectedId={selectedId}
          />
        </div>
      </div>

      {/* Flexible Space - Top Dock과 Bottom Dock 사이의 여백 */}
      <div className="flex-1"></div>

      {/* Bottom Dock - Footer 버튼들 */}
      <InfoFooter
        selectedId={selectedId}
        appointmentHistory={appointmentHistory}
        selectedPatient={selectedPatient}
        onCancel={handleCancel}
        onCancelAppointment={handleCancelAppointmentAction}
        onCreateAppointment={handleCreateAppointment}
        onUpdateAppointment={handleCreateAppointment}
        onRefreshAppointmentHistory={fetchAppointmentHistory}
      />

      {/* Force 확인 팝업 (훅에서 자동 관리) */}
      <MyPopupYesNo
        isOpen={forceConfirmState.isOpen}
        onCloseAction={forceConfirmState.onCancel}
        onConfirmAction={forceConfirmState.onConfirm}
        title="예약 확인"
        message={forceConfirmState.message}
        confirmText="확인"
        cancelText="취소"
      />

      {/* 예약 취소 사유 모달 */}
      <AppointmentCancelReasonModal
        isOpen={showCancelConfirmPopup}
        appointment={
          selectedId
            ? appointmentHistory.find(
              (h: { id: string | number }) => String(h.id) === String(selectedId)
            ) ?? null
            : null
        }
        onClose={() => setShowCancelConfirmPopup(false)}
        onConfirm={confirmCancelAppointment}
      />
    </div>
  );
}
