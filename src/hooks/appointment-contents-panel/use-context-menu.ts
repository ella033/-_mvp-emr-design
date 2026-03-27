import { useState, useEffect } from "react";
import React from "react";
import { SlotClosuresService } from "@/services/slot-closures-service";
import { useAppointmentStore } from "@/store/appointment-store";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import type { AppointmentRoom } from "@/types/calendar-types";
import type { CreateAppointmentRequest } from "@/types/appointments/appointments";
import { AppointmentStatus } from "@/constants/common/common-enum";
import { useUserStore } from "@/store/user-store";
import { convertToYYYYMMDD } from "@/lib/date-utils";
import { MyPopupMsg } from "@/components/yjg/my-pop-up";
import { useToastHelpers } from "@/components/ui/toast";

export const useContextMenu = (
  appointmentRoom: AppointmentRoom,
  timeSlotLogic: any,
  viewType?: "daily" | "weekly" | "monthly"
) => {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    hour: number;
    minute: number;
  } | null>(null);

  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    message: string;
    msgType: "error" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    message: "",
    msgType: "error",
  });

  const { copiedAppointment } = useAppointmentStore();
  const { handleCreateAppointment } = useHandleAppointment(undefined, {
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
    },
  });
  const { user } = useUserStore();
  const { success } = useToastHelpers();

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleContextMenu = (
    e: React.MouseEvent,
    hour: number,
    minute: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      hour,
      minute,
    });
  };

  const handleCreateSlotClosure = async (
    currentDate: Date,
    onDateChange?: (date: Date) => void
  ) => {
    if (!contextMenu || !currentDate) return;

    try {
      const { hour, minute } = contextMenu;
      const currentOH = timeSlotLogic.getCurrentOperatingHours(currentDate);
      const timeInterval = currentOH?.timeSlotDuration || 15;

      const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const endMinute = minute + timeInterval;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const endMinuteFinal = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinuteFinal.toString().padStart(2, "0")}`;

      await SlotClosuresService.createSlotClosure({
        appointmentRoomId: appointmentRoom.id,
        closureDate: currentDate,
        startTime,
        endTime,
        closureType: 1,
        reason: "수동 마감",
      });

      success("예약 마감이 생성되었습니다.");
      window.dispatchEvent(new CustomEvent("slotClosureCreated"));
      onDateChange?.(currentDate);
    } catch (error) {
      console.error("예약 마감 생성 실패:", error);
      setPopupState({
        isOpen: true,
        message: "예약 마감 생성에 실패했습니다.",
        msgType: "error",
      });
    }

    setContextMenu(null);
  };

  const handleCancelSlotClosure = async (
    currentDate: Date,
    onDateChange?: (date: Date) => void
  ) => {
    if (!contextMenu || !currentDate) return;

    try {
      const { hour, minute } = contextMenu;
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const currentClosures = timeSlotLogic.getCurrentClosures(currentDate);
      const targetClosure = currentClosures.find((closure: any) => {
        return timeString >= closure.startTime && timeString < closure.endTime;
      });

      if (!targetClosure) {
        setPopupState({
          isOpen: true,
          message: "취소할 마감 정보를 찾을 수 없습니다.",
          msgType: "error",
        });
        return;
      }

      await SlotClosuresService.deleteSlotClosure(targetClosure.id);
      success("예약 마감이 취소되었습니다.");
      window.dispatchEvent(new CustomEvent("slotClosureDeleted"));
      onDateChange?.(currentDate);
    } catch (error) {
      console.error("예약 마감 취소 실패:", error);
      setPopupState({
        isOpen: true,
        message: "예약 마감 취소에 실패했습니다.",
        msgType: "error",
      });
    }

    setContextMenu(null);
  };

  const handlePasteAppointment = async (currentDate: Date) => {
    if (!contextMenu || !currentDate || !copiedAppointment) return;

    try {
      const { hour, minute } = contextMenu;
      const currentOH = timeSlotLogic.getCurrentOperatingHours(currentDate);
      const timeInterval = currentOH?.timeSlotDuration || 15;

      // 시작 시간과 종료 시간 계산
      const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const endMinute = minute + timeInterval;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const endMinuteFinal = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinuteFinal.toString().padStart(2, "0")}`;

      // 날짜 문자열 생성 (YYYY-MM-DD)
      const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}-${currentDate.getDate().toString().padStart(2, "0")}`;

      // 예약 생성 데이터 구성
      const createData: CreateAppointmentRequest = {
        hospitalId: copiedAppointment.hospitalId,
        patientId: copiedAppointment.patientId,
        appointmentTypeId: Number(copiedAppointment.appointmentTypeId),
        status: AppointmentStatus.CONFIRMED,
        memo: copiedAppointment.memo,
        platform: copiedAppointment.platform || 1,
        isSimplePatient: copiedAppointment.isSimplePatient,
        excludeAutoMessage: copiedAppointment.excludeAutoMessage,
        receptionistId: user.id,
        temporaryPatient:
          copiedAppointment.isSimplePatient &&
            copiedAppointment.temporaryPatient
            ? {
              name: copiedAppointment.temporaryPatient?.name || "",
              phone1: copiedAppointment.temporaryPatient?.phone1 || "",
              birthDate: convertToYYYYMMDD(
                copiedAppointment.temporaryPatient?.birthDate || ""
              ),
            }
            : null,
        appointmentStartTime: new Date(`${dateString}T${startTime}:00`),
        appointmentEndTime: new Date(`${dateString}T${endTime}:00`),
        appointmentRoomId:
          viewType === "daily"
            ? appointmentRoom.id
            : copiedAppointment.appointmentRoomId,
        doctorId:
          viewType === "daily"
            ? (appointmentRoom.userId ?? null)
            : copiedAppointment.doctorId,
      };

      await handleCreateAppointment(createData);
    } catch (error: any) {
      console.error("예약 붙여넣기 실패:", error);
    }

    setContextMenu(null);
  };

  // 복사된 예약이 있고 동일한 view type인지 확인
  const hasCopiedAppointment =
    copiedAppointment && copiedAppointment.viewType === viewType;

  const handleClosePopup = () => {
    setPopupState({ isOpen: false, message: "", msgType: "error" });
  };

  return {
    contextMenu,
    setContextMenu,
    handleContextMenu,
    handleCreateSlotClosure,
    handleCancelSlotClosure,
    handlePasteAppointment,
    hasCopiedAppointment,
    popup: popupState.msgType === "error" && popupState.isOpen
      ? React.createElement(MyPopupMsg, {
        isOpen: popupState.isOpen,
        onCloseAction: handleClosePopup,
        title: "알림",
        msgType: "error",
        message: popupState.message,
      })
      : null,
  };
};
