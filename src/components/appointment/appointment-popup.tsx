"use client";

import React from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { Button } from "@/components/ui/button";
import { calculateAge } from "@/lib/patient-utils";
import { formatRrnNumber } from "@/lib/common-utils";
import AppointmentForm from "@/components/appointment/appointment-form";
import { useAppointmentPopupForm } from "@/hooks/appointment/actions/use-appointment-popup-form";
import type { AppointmentPatient } from "@/types/patient-types";

interface AppointmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  patientInfo?: AppointmentPatient | null;
  appointmentId?: number | string | null;
}

export default function AppointmentPopup({
  isOpen,
  onClose,
  mode,
  patientInfo,
  appointmentId,
}: AppointmentPopupProps) {
  const {
    selectedPatient,
    reservationRoom,
    reservationDoctor,
    reservationType,
    reservationTypeName,
    reservationDate,
    fromTime,
    toTime,
    reservationMemo,
    handleRoomChange,
    setReservationDoctor,
    setReservationType,
    setReservationDate,
    setTimeRange,
    handleToTimeChange,
    setReservationMemo,
    handleSubmit,
    appointmentRooms,
    appointmentTypes,
    doctors,
    selectedRoomConfig,
    isLoadingRooms,
    isLoadingTypes,
    isLoadingAppointment,
    forceConfirmState,
  } = useAppointmentPopupForm({
    mode,
    appointmentId,
    patientInfo,
    isOpen,
    onClose,
  });

  const patient = selectedPatient;

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      title={mode === "create" ? "예약 생성" : "예약 수정"}
      width="400px"
      height="auto"
      fitContent={true}
      alwaysCenter={true}
      closeOnOutsideClick={false}
      localStorageKey="appointment-popup"
    >
      <div className="flex flex-col">
        {/* 환자 정보 영역 */}
        {patient && (
          <div className="p-4 border-b">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {patient.patientNo && (
                  <div className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none">
                    {patient.patientNo}
                  </div>
                )}
                <span className="text-md font-bold text-[var(--gray-100)]">
                  {patient.name}
                </span>
                {(patient.gender || patient.age || patient.birthDate) && (
                  <span className="text-md font-bold text-[var(--gray-100)]">
                    ({patient.gender}{"/"}
                    {patient.age || calculateAge(patient.birthDate)})
                  </span>
                )}

              </div>
              <div className="text-sm text-gray-600">
                {patient.rrn && <span>{formatRrnNumber(patient.rrn)}</span>}
                {patient.rrn && patient.phone && (
                  <span className="mx-2">|</span>
                )}
                {patient.phone && <span>{patient.phone}</span>}
              </div>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoadingAppointment && (
          <div className="p-4 text-center text-gray-500">
            예약 정보를 불러오는 중...
          </div>
        )}

        {/* 예약 정보 폼 */}
        {!isLoadingAppointment && (
          <div className="p-4">
            <AppointmentForm
              reservationRoom={reservationRoom}
              reservationDoctor={reservationDoctor}
              reservationType={reservationType}
              reservationTypeName={reservationTypeName}
              reservationDate={reservationDate}
              fromTime={fromTime}
              toTime={toTime}
              reservationMemo={reservationMemo}
              onRoomChange={handleRoomChange}
              onDoctorChange={setReservationDoctor}
              onTypeChange={setReservationType}
              onDateChange={setReservationDate}
              onFromTimeChange={(value) => setTimeRange(value)}
              onToTimeChange={handleToTimeChange}
              onMemoChange={setReservationMemo}
              appointmentRooms={appointmentRooms}
              appointmentTypes={appointmentTypes}
              doctors={doctors}
              selectedRoomConfig={selectedRoomConfig}
              isLoadingRooms={isLoadingRooms}
              isLoadingTypes={isLoadingTypes}
              selectedId={mode === "edit" ? String(appointmentId || "") : null}
            />
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            className="bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            onClick={handleSubmit}
            disabled={isLoadingAppointment}
          >
            {mode === "create" ? "예약" : "수정"}
          </Button>
        </div>
      </div>

      {/* Force 확인 팝업 */}
      <MyPopupYesNo
        isOpen={forceConfirmState.isOpen}
        onCloseAction={forceConfirmState.onCancel}
        onConfirmAction={forceConfirmState.onConfirm}
        title="예약 확인"
        message={forceConfirmState.message}
        confirmText="확인"
        cancelText="취소"
      />
    </MyPopup>
  );
}
