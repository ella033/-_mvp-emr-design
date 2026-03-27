"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AppointmentStatus, AppointmentStatusLabel } from "@/constants/common/common-enum";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { useAppointmentStore } from "@/store/appointment-store";
import { useToastHelpers } from "@/components/ui/toast";
import type { Appointment } from "@/types/appointments/appointments";
import type { AppointmentPatient } from "@/types/patient-types";

interface InfoFooterProps {
  selectedId: string | null;
  appointmentHistory: any[];
  selectedPatient: AppointmentPatient | null;
  onCancel: () => void;
  onCancelAppointment: () => void;
  onCreateAppointment: () => void;
  onUpdateAppointment?: () => void;
  onRefreshAppointmentHistory?: (patientId?: number) => Promise<void>;
}

export const InfoFooter: React.FC<InfoFooterProps> = ({
  selectedId,
  appointmentHistory,
  selectedPatient,
  onCancel,
  onCancelAppointment,
  onCreateAppointment,
  onUpdateAppointment,
  onRefreshAppointmentHistory,
}) => {
  const toastHelpers = useToastHelpers();
  const { setCopiedAppointment } = useAppointmentStore();
  const { handleAppointmentToRegistration } = usePatientReception();
  const { handleUpdateAppointment, handleMarkAsVisited } = useHandleAppointment(undefined, {
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
    },
  });

  // 현재 선택된 예약 정보 가져오기
  const currentAppointment = selectedId
    ? appointmentHistory.find((h) => h.id === selectedId)
    : null;
  const currentStatus = currentAppointment?.status || AppointmentStatus.PENDING;

  // 예약 상태 업데이트
  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      await handleUpdateAppointment(Number(appointmentId), {
        status: newStatus,
      });

      toastHelpers.success(
        `예약이 ${AppointmentStatusLabel[newStatus]}되었습니다.`
      );

      // 예약 내역 재갱신
      if (onRefreshAppointmentHistory && selectedPatient?.id) {
        await onRefreshAppointmentHistory(Number(selectedPatient.id));
      }

      window.dispatchEvent(new CustomEvent("appointmentCreated"));
    } catch (error) {
      console.error("예약 상태 업데이트 실패:", error);
      toastHelpers.error("예약 상태 업데이트에 실패했습니다.");
    }
  };

  // 예약 복사
  const handleCopyAppointment = () => {
    if (!currentAppointment) {
      toastHelpers.error("복사할 예약 정보가 없습니다.");
      return;
    }

    // 복사할 예약 데이터 저장
    setCopiedAppointment({
      ...currentAppointment,
    });
    toastHelpers.success("예약이 복사되었습니다.");
  };

  // 예약 -> 접수 전환
  const handleCheckIn = async () => {
    if (!currentAppointment) {
      return;
    }

    // 통합 함수 사용
    await handleAppointmentToRegistration(currentAppointment as Appointment, {
      receptionTime: new Date(),
      handleMarkAsVisited: async (appointmentId: number) => {
        await handleMarkAsVisited(appointmentId);
      },
      onNoReceptionHistory: () => {
        toastHelpers.error("기접수내역이 없어 접수전환을 할 수 없습니다.");
      },
      onRefresh: async () => {
        // 예약 내역 재갱신
        if (onRefreshAppointmentHistory && selectedPatient?.id) {
          await onRefreshAppointmentHistory(Number(selectedPatient.id));
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("refreshPatientsData", {
              detail: { type: "all" },
            })
          );
        }
      },
      onError: (error: Error) => {
        toastHelpers.error(error.message || "예약을 접수로 전환하는데 실패했습니다.");
      },
    });
  };

  // 예약생성단계: selectedId가 null이거나 예약 정보가 없는 경우
  // 예약취소 버튼 disabled, 예약 버튼 enabled
  if (selectedId === null || !currentAppointment) {
    return (
      <div className="p-4 border-t" data-testid="reservation-info-footer">
        <div className="flex gap-2">
          <Button variant="outline" className="p-2" onClick={onCancel} data-testid="reservation-cancel-button">
            <img src="/icon/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled
          >
            예약취소
          </Button>
          <Button className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90" onClick={onCreateAppointment} data-testid="reservation-create-button">
            예약
          </Button>
        </div>
      </div>
    );
  }

  // 예약상태: selectedId !== null && currentAppointment가 있는 경우
  // 예약 상태에 따라 다른 버튼 표시
  // CONFIRMED: 노쇼, 예약취소, 예약수정
  if (currentStatus === AppointmentStatus.CONFIRMED) {
    return (
      <div className="p-4 border-t" data-testid="reservation-info-footer">
        <div className="flex gap-2">
          <Button variant="outline" className="p-2" onClick={onCancel} data-testid="reservation-cancel-button">
            <img src="/icon/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            data-testid="reservation-noshow-button"
            onClick={() => {
              if (currentAppointment?.id) {
                updateAppointmentStatus(currentAppointment.id, AppointmentStatus.NOSHOW);
              }
            }}
          >
            노쇼
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            data-testid="reservation-cancel-appointment-button"
            onClick={onCancelAppointment}
          >
            예약취소
          </Button>
          <Button className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            data-testid="reservation-update-button"
            onClick={onUpdateAppointment || onCreateAppointment}>
            예약수정
          </Button>
        </div>
      </div>
    );
  }

  // PENDING: 예약취소, 예약확정
  if (currentStatus === AppointmentStatus.PENDING) {
    return (
      <div className="p-4 border-t" data-testid="reservation-info-footer">
        <div className="flex gap-2">
          <Button variant="outline" className="p-2" onClick={onCancel} data-testid="reservation-cancel-button">
            <img src="/icon/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            data-testid="reservation-cancel-appointment-button"
            onClick={onCancelAppointment}
          >
            예약취소
          </Button>
          <Button
            className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            data-testid="reservation-confirm-button"
            onClick={() => {
              if (currentAppointment?.id) {
                updateAppointmentStatus(currentAppointment.id, AppointmentStatus.CONFIRMED);
              }
            }}
          >
            예약확정
          </Button>
        </div>
      </div>
    );
  }

  // CANCELED: 취소철회
  if (currentStatus === AppointmentStatus.CANCELED) {
    return (
      <div className="p-4 border-t" data-testid="reservation-info-footer">
        <div className="flex gap-2">
          <Button variant="outline" className="p-2" onClick={onCancel} data-testid="reservation-cancel-button">
            <img src="/icon/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
          </Button>
          <Button
            className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            onClick={() => {
              if (currentAppointment?.id) {
                updateAppointmentStatus(currentAppointment.id, AppointmentStatus.CONFIRMED);
              }
            }}
          >
            취소철회
          </Button>
        </div>
      </div>
    );
  }

  // VISITED: 접수철회
  if (currentStatus === AppointmentStatus.VISITED) {
    return (
      <div className="p-4 border-t" data-testid="reservation-info-footer">
        <div className="flex gap-2">
          <Button variant="outline" className="p-2" onClick={onCancel} data-testid="reservation-cancel-button">
            <img src="/icon/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
          </Button>
          <Button
            className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            onClick={() => {
              if (currentAppointment?.id) {
                updateAppointmentStatus(currentAppointment.id, AppointmentStatus.CONFIRMED);
              }
            }}
          >
            접수철회
          </Button>
        </div>
      </div>
    );
  }

  // NOSHOW: 노쇼철회
  if (currentStatus === AppointmentStatus.NOSHOW) {
    return (
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" className="p-2" onClick={onCancel}>
            <img src="/icon/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
          </Button>
          <Button
            className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            onClick={() => {
              if (currentAppointment?.id) {
                updateAppointmentStatus(currentAppointment.id, AppointmentStatus.VISITED);
              }
            }}
          >
            노쇼철회
          </Button>
        </div>
      </div>
    );
  }

  // 기본 상태 (예약이 없는 경우)
  return (
      <div className="p-4 border-t" data-testid="reservation-info-footer">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} data-testid="reservation-cancel-button">
          <img src="/ic_line_refresh.svg" alt="취소" className="w-4 h-4" />
        </Button>
        <Button className="flex-1 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90" onClick={onCreateAppointment} data-testid="reservation-create-button">
          예약
        </Button>
      </div>
    </div>
  );
};
