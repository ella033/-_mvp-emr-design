"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ListTimePicker from "@/components/ui/list-time-picker";
import InputDate from "@/components/ui/input-date";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";

interface AppointmentFormProps {
  // Form state
  reservationRoom: string;
  reservationDoctor: string;
  reservationType: string;
  reservationTypeName: string;
  reservationDate: string;
  fromTime: string;
  toTime: string;
  reservationMemo: string;

  // Change handlers
  onRoomChange: (value: string) => void;
  onDoctorChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onFromTimeChange: (value: string) => void;
  onToTimeChange: (value: string) => void;
  onMemoChange: (value: string) => void;

  // Data
  appointmentRooms: AppointmentRooms[];
  appointmentTypes: any[];
  doctors: { id: number; name: string }[];
  selectedRoomConfig: {
    beginTime: string;
    endTime: string;
    duration: number;
    isRoomSelected: boolean;
  };

  // Loading
  isLoadingRooms: boolean;
  isLoadingTypes: boolean;

  // Optional: for existing appointment type display
  selectedId?: string | null;
}

export default function AppointmentForm({
  reservationRoom,
  reservationDoctor,
  reservationType,
  reservationTypeName,
  reservationDate,
  fromTime,
  toTime,
  reservationMemo,
  onRoomChange,
  onDoctorChange,
  onTypeChange,
  onDateChange,
  onFromTimeChange,
  onToTimeChange,
  onMemoChange,
  appointmentRooms,
  appointmentTypes,
  doctors,
  selectedRoomConfig,
  isLoadingRooms,
  isLoadingTypes,
  selectedId,
}: AppointmentFormProps) {
  return (
    <div className="space-y-2 flex-1 flex flex-col" data-testid="reservation-appointment-form">
      <h3 className="text-lg font-semibold">예약 정보</h3>

      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-3">
          <label className="w-[60px] text-sm font-medium text-gray-700">
            예약실
          </label>
          <Select
            value={reservationRoom}
            onValueChange={(value: string | undefined) => {
              onRoomChange(value || "");
            }}
          >
            <SelectTrigger className="flex-1" data-testid="reservation-room-select">
              <SelectValue
                placeholder={isLoadingRooms ? "로딩 중..." : "예약실 선택"}
              />
            </SelectTrigger>
            <SelectContent>
              {appointmentRooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  {room.displayName || room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <label className="w-[60px] text-sm font-medium text-gray-700">
            진료의
          </label>
          <Select
            value={reservationDoctor || "none"}
            onValueChange={(value: string | undefined) => {
              onDoctorChange(value === "none" ? "" : value || "");
            }}
          >
            <SelectTrigger className="flex-1" data-testid="reservation-doctor-select">
              <SelectValue placeholder="선택안함" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">선택안함</SelectItem>
              {doctors.map((user) => (
                <SelectItem key={user.id} value={user.name.toString()}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="w-[60px] text-sm font-medium text-gray-700">
            예약유형
          </label>
          <Select
            value={reservationType || "none"}
            onValueChange={(value: string | undefined) => {
              onTypeChange(value === "none" ? "" : value || "");
            }}
          >
            <SelectTrigger className="flex-1" data-testid="reservation-type-select">
              <SelectValue
                placeholder={isLoadingTypes ? "로딩 중..." : "선택안함"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">선택안함</SelectItem>
              {/* 기존 예약의 예약유형이 삭제되었거나 예약실 변경으로 매칭되지 않는 경우: disabled 항목으로 표시 */}
              {selectedId &&
                reservationType &&
                reservationType !== "none" &&
                (() => {
                  const filteredTypes = appointmentTypes.filter(
                    (type) =>
                      !reservationRoom ||
                      !type.appointmentTypeRooms?.length ||
                      type.appointmentTypeRooms.some(
                        (room: any) =>
                          room.appointmentRoomId.toString() === reservationRoom
                      )
                  );
                  const isInFilteredList = filteredTypes.some(
                    (type) => type.id.toString() === reservationType
                  );
                  if (!isInFilteredList) {
                    const activeType = appointmentTypes.find(
                      (type) => type.id.toString() === reservationType
                    );
                    const displayName = activeType?.name || reservationTypeName;
                    if (displayName) {
                      return (
                        <SelectItem value={reservationType} disabled>
                          {displayName}
                        </SelectItem>
                      );
                    }
                  }
                  return null;
                })()}
              {appointmentTypes
                .filter(
                  (type) =>
                    !reservationRoom ||
                    !type.appointmentTypeRooms?.length ||
                    type.appointmentTypeRooms.some(
                      (room: any) =>
                        room.appointmentRoomId.toString() === reservationRoom
                    )
                )
                .map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <label className="w-[60px] text-sm font-medium text-gray-700">
            예약날짜
          </label>
          <div className="relative flex-1">
            <InputDate
              testId="reservation-date-input"
              value={reservationDate}
              onChange={(value: string) => {
                onDateChange(value);
              }}
              placeholder="날짜 선택"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="w-[60px] text-sm font-medium text-gray-700 flex-shrink-0">
          예약시간
        </label>
        <div className="flex items-center flex-1 gap-1">
          <div className="flex-1">
            <ListTimePicker
              value={fromTime}
              onChange={(value: string) => {
                onFromTimeChange(value);
              }}
              className="w-full"
              fromTime={selectedRoomConfig.beginTime}
              toTime={selectedRoomConfig.endTime}
              timeDuration={selectedRoomConfig.duration}
              disabled={!selectedRoomConfig.isRoomSelected}
            />
          </div>
          <span className="flex items-center justify-center text-gray-500">
            -
          </span>
          <div className="flex-1">
            <ListTimePicker
              value={toTime}
              onChange={(value: string) => {
                onToTimeChange(value);
              }}
              className="w-full"
              fromTime={fromTime || selectedRoomConfig.beginTime}
              toTime={selectedRoomConfig.endTime}
              timeDuration={selectedRoomConfig.duration}
              disabled={!selectedRoomConfig.isRoomSelected}
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <label className="w-[60px] text-sm font-medium text-gray-700 pt-2 flex-shrink-0">
          예약메모
        </label>
        <div
          className="relative text-sm text-[var(--main-color)] border rounded-md p-1 pb-7 w-full overflow-y-auto h-[150px]"
          style={{ outline: "none" }}
        >
          <MyTiptapEditor
            testId="reservation-memo-editor"
            templateCodeType={TemplateCodeType.예약메모}
            placeholder="예약 메모를 입력하세요"
            content={reservationMemo}
            onChange={onMemoChange}
            isUseImageUpload={false}
            isUseTemplate={true}
          />
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-b-md">
            <TemplateCodeQuickBar
              templateCodeType={TemplateCodeType.예약메모}
              onTemplateClickAction={(template: TemplateCode) => {
                onMemoChange(reservationMemo + template.content);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
