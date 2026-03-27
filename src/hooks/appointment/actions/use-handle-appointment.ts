import { useState, useCallback } from "react";
import { useAppointmentStore } from "@/store/appointment-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { useDeleteAppointment } from "@/hooks/appointment/use-delete-appointment";
import { useUpdateAppointmentStatus } from "@/hooks/appointment/use-update-appointment-status";
import { useToastHelpers } from "@/components/ui/toast";
import {
  AppointmentStatus,
  AppointmentMoveErrorCode,
  APPOINTMENT_MOVE_ERROR_MESSAGES,
} from "@/constants/common/common-enum";
import type { Appointment } from "@/types/appointments/appointments";
import type { CreateAppointmentRequest } from "@/types/appointments/appointments";
import { AppointmentsService } from "@/services/appointments-service";

interface UseHandleAppointmentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Force 확인 팝업 상태 타입
interface ForceConfirmState {
  isOpen: boolean;
  message: string;
  appointmentData: any;
  onConfirm: () => void;
  onCancel: () => void;
}

// 예약 검증 에러 타입
enum AppointmentValidationError {
  VISITED_APPOINTMENT_CANNOT_UPDATE = "내원한 예약은 수정이 불가능합니다.",
  VISITED_APPOINTMENT_CANNOT_CANCEL = "내원한 예약은 취소가 불가능합니다.",
  VISITED_APPOINTMENT_CANNOT_DELETE = "내원한 예약은 삭제가 불가능합니다.",
}

export function useHandleAppointment(
  appointment?: Appointment,
  options?: UseHandleAppointmentOptions
) {
  const { appointments, setAppointments } = useAppointmentStore();
  const useReceptionStoreState = useReceptionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToastHelpers();

  // Force 확인 팝업 상태
  const [forceConfirmState, setForceConfirmState] = useState<ForceConfirmState>(
    {
      isOpen: false,
      message: "",
      appointmentData: null,
      onConfirm: () => { },
      onCancel: () => { },
    }
  );

  const { mutateAsync: deleteAppointment } = useDeleteAppointment();
  const { mutateAsync: updateAppointmentStatus } = useUpdateAppointmentStatus();

  // 예약 수정 가능 여부 검증 (별도 함수)
  const validateAppointmentUpdate = useCallback(
    async (
      appointmentId: number
    ): Promise<{ isValid: boolean; error?: string }> => {
      try {
        const currentAppointment =
          await AppointmentsService.getAppointment(appointmentId);

        // 내원 상태인 경우 수정 불가
        if (currentAppointment.status === AppointmentStatus.VISITED) {
          return {
            isValid: false,
            error: AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_UPDATE,
          };
        }

        return { isValid: true };
      } catch (error: any) {
        return {
          isValid: false,
          error: error?.message || "예약 정보를 확인할 수 없습니다.",
        };
      }
    },
    []
  );

  // 예약 생성
  const handleCreateAppointment = useCallback(
    async (data: CreateAppointmentRequest) => {
      setIsSubmitting(true);
      try {
        const result = await AppointmentsService.createAppointment(data);

        // 생성된 예약 정보 조회하여 store에 반영
        const createdAppointment = await AppointmentsService.getAppointment(
          result.id
        );

        // appointmentStore에 추가
        const updatedAppointments = [...(appointments || []), createdAppointment];
        setAppointments(updatedAppointments);

        // receptionStore에 추가 (개별 추가 + 전체 동기화)
        useReceptionStoreState.addAppointment(createdAppointment);
        useReceptionStoreState.setAppointments(updatedAppointments);

        success("예약이 생성되었습니다.");
        options?.onSuccess?.();
        return result;
      } catch (error: any) {
        const errorCode = error?.data?.errorCode;

        // errorCode 검증이 필요한 에러
        if (
          errorCode &&
          Object.values(AppointmentMoveErrorCode).includes(errorCode)
        ) {
          const errorMessage =
            APPOINTMENT_MOVE_ERROR_MESSAGES[
            errorCode as AppointmentMoveErrorCode
            ] ||
            error?.data?.message ||
            "예약 생성에 실패했습니다.";

          // Force 확인 팝업 표시
          return new Promise((resolve, reject) => {
            setForceConfirmState({
              isOpen: true,
              message: `${errorMessage}\n예약을 생성하시겠습니까?`,
              appointmentData: { ...data, force: true },
              onConfirm: async () => {
                setForceConfirmState((prev) => ({ ...prev, isOpen: false }));
                try {
                  const result = await AppointmentsService.createAppointment({
                    ...data,
                    force: true,
                  });

                  // 생성된 예약 정보 조회하여 store에 반영
                  const createdAppointment = await AppointmentsService.getAppointment(
                    result.id
                  );

                  // appointmentStore에 추가
                  const updatedAppointments = [...(appointments || []), createdAppointment];
                  setAppointments(updatedAppointments);

                  // receptionStore에 추가 (개별 추가 + 전체 동기화)
                  useReceptionStoreState.addAppointment(createdAppointment);
                  useReceptionStoreState.setAppointments(updatedAppointments);

                  success("예약이 생성되었습니다.");
                  options?.onSuccess?.();
                  resolve(result);
                } catch (retryError: any) {
                  const errorMessage =
                    retryError?.data?.message ||
                    retryError?.message ||
                    "예약 생성에 실패했습니다.";
                  showError(errorMessage);
                  options?.onError?.(retryError as Error);
                  reject(retryError);
                } finally {
                  setIsSubmitting(false);
                }
              },
              onCancel: () => {
                setForceConfirmState((prev) => ({ ...prev, isOpen: false }));
                setIsSubmitting(false);
                reject(new Error("사용자가 취소했습니다"));
              },
            });
          });
        }

        // 일반 에러 처리
        const errorMessage =
          error?.data?.message || error?.message || "예약 생성에 실패했습니다.";
        showError(errorMessage);
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [appointments, setAppointments, useReceptionStoreState, success, showError, options]
  );

  // 예약 삭제
  const handleDeleteAppointment = useCallback(
    async (appointmentId?: number) => {
      setIsSubmitting(true);
      try {
        const id = appointmentId || appointment?.id;
        if (!id) throw new Error("예약 정보를 찾을 수 없습니다");

        // 예약 삭제 전 검증: 현재 예약 정보 조회
        const currentAppointment = await AppointmentsService.getAppointment(
          Number(id)
        );

        // 내원 상태인 경우 삭제 불가
        if (currentAppointment.status === AppointmentStatus.VISITED) {
          showError(
            AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_DELETE
          );
          setIsSubmitting(false);
          throw new Error(
            AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_DELETE
          );
        }

        await deleteAppointment(Number(id));

        // appointmentStore에서 삭제
        const updatedAppointments = appointments?.filter(
          (a: Appointment) => a.id !== id
        );
        setAppointments(updatedAppointments || []);

        // receptionStore에서 삭제 (개별 삭제 + 전체 동기화)
        useReceptionStoreState.removeAppointment(String(id));
        useReceptionStoreState.setAppointments(updatedAppointments || []);

        success("예약이 삭제되었습니다.");
        options?.onSuccess?.();
      } catch (error: any) {
        // 검증 에러인 경우 그대로 throw
        if (
          error.message ===
          AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_DELETE
        ) {
          throw error;
        }

        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      appointment,
      appointments,
      deleteAppointment,
      setAppointments,
      useReceptionStoreState,
      success,
      showError,
      options,
    ]
  );

  // 예약 수정
  const handleUpdateAppointment = useCallback(
    async (appointmentId: number, updateData: any) => {
      setIsSubmitting(true);
      try {
        const result = await AppointmentsService.updateAppointment(
          appointmentId,
          updateData
        );

        // appointmentStore의 현재 상태를 가져와서 업데이트
        // store의 appointments가 없거나 최신이 아닐 수 있으므로 항상 현재 상태를 가져옴
        const currentAppointments = appointments || [];
        const appointmentIndex = currentAppointments.findIndex(
          (apt: any) => Number(apt.id) === appointmentId
        );

        let updatedAppointments: any[];
        if (appointmentIndex >= 0) {
          // 기존 예약이 있으면 업데이트
          updatedAppointments = currentAppointments.map((apt: any) =>
            Number(apt.id) === appointmentId ? result : apt
          );
        } else {
          // 기존 예약이 없으면 추가
          updatedAppointments = [...currentAppointments, result];
        }

        // appointmentStore에 업데이트
        setAppointments(updatedAppointments);
        // receptionStore에 업데이트 (개별 업데이트 + 전체 동기화)
        useReceptionStoreState.updateAppointment(String(appointmentId), result);
        useReceptionStoreState.setAppointments(updatedAppointments);
        options?.onSuccess?.();
        return result;
      } catch (error: any) {
        const errorCode = error?.data?.errorCode;

        // errorCode 검증이 필요한 에러
        if (
          errorCode &&
          Object.values(AppointmentMoveErrorCode).includes(errorCode)
        ) {
          const errorMessage =
            APPOINTMENT_MOVE_ERROR_MESSAGES[
            errorCode as AppointmentMoveErrorCode
            ] ||
            error?.data?.message ||
            "예약 수정에 실패했습니다.";

          // Force 확인 팝업 표시
          return new Promise((resolve, reject) => {
            setForceConfirmState({
              isOpen: true,
              message: `${errorMessage}\n예약을 수정하시겠습니까?`,
              appointmentData: { ...updateData, force: true },
              onConfirm: async () => {
                setForceConfirmState((prev) => ({ ...prev, isOpen: false }));
                try {
                  const result = await AppointmentsService.updateAppointment(
                    appointmentId,
                    { ...updateData, force: true }
                  );

                  // appointmentStore의 현재 상태를 가져와서 업데이트
                  const currentAppointments = appointments || [];
                  const appointmentIndex = currentAppointments.findIndex(
                    (apt: any) => Number(apt.id) === appointmentId
                  );

                  let updatedAppointments: any[];
                  if (appointmentIndex >= 0) {
                    // 기존 예약이 있으면 업데이트
                    updatedAppointments = currentAppointments.map((apt: any) =>
                      Number(apt.id) === appointmentId ? result : apt
                    );
                  } else {
                    // 기존 예약이 없으면 추가
                    updatedAppointments = [...currentAppointments, result];
                  }

                  // appointmentStore에 업데이트
                  setAppointments(updatedAppointments);

                  // receptionStore에 업데이트 (개별 업데이트 + 전체 동기화)
                  useReceptionStoreState.updateAppointment(String(appointmentId), result);
                  useReceptionStoreState.setAppointments(updatedAppointments);

                  success("예약이 수정되었습니다.");
                  options?.onSuccess?.();
                  resolve(result);
                } catch (retryError: any) {
                  const errorMessage =
                    retryError?.data?.message ||
                    retryError?.message ||
                    "예약 수정에 실패했습니다.";
                  showError(errorMessage);
                  options?.onError?.(retryError as Error);
                  reject(retryError);
                } finally {
                  setIsSubmitting(false);
                }
              },
              onCancel: () => {
                setForceConfirmState((prev) => ({ ...prev, isOpen: false }));
                setIsSubmitting(false);
                reject(new Error("사용자가 취소했습니다"));
              },
            });
          });
        }

        // 일반 에러 처리
        const errorMessage =
          error?.data?.message || error?.message || "예약 수정에 실패했습니다.";
        showError(errorMessage);
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [appointments, setAppointments, useReceptionStoreState, success, showError, options]
  );

  // 예약 상태 변경 (취소)
  const handleCancelAppointment = useCallback(
    async (appointmentId?: number, cancelMessage?: string) => {
      setIsSubmitting(true);
      try {
        const id = appointmentId || appointment?.id;
        if (!id) throw new Error("예약 정보를 찾을 수 없습니다");

        // 예약 취소 전 검증: 현재 예약 정보 조회
        const currentAppointment = await AppointmentsService.getAppointment(
          Number(id)
        );

        // 내원 상태인 경우 취소 불가
        if (currentAppointment.status === AppointmentStatus.VISITED) {
          showError(
            AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_CANCEL
          );
          setIsSubmitting(false);
          throw new Error(
            AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_CANCEL
          );
        }

        await AppointmentsService.cancelAppointment(Number(id), cancelMessage);

        // 취소된 예약 정보 조회하여 store에 반영
        const cancelledAppointment = await AppointmentsService.getAppointment(
          Number(id)
        );

        // appointmentStore에 업데이트
        const updatedAppointments = appointments?.map((apt: any) =>
          Number(apt.id) === Number(id) ? cancelledAppointment : apt
        ) || [cancelledAppointment];
        setAppointments(updatedAppointments);

        // receptionStore에 업데이트 (개별 업데이트 + 전체 동기화)
        useReceptionStoreState.updateAppointment(String(id), cancelledAppointment);
        useReceptionStoreState.setAppointments(updatedAppointments);

        success("예약이 취소되었습니다.");
        options?.onSuccess?.();
      } catch (error: any) {
        // 검증 에러인 경우 그대로 throw
        if (
          error.message ===
          AppointmentValidationError.VISITED_APPOINTMENT_CANNOT_CANCEL
        ) {
          throw error;
        }

        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [appointment, appointments, setAppointments, useReceptionStoreState, success, showError, options]
  );

  // 예약 취소 철회 (예약 상태로 복구)
  const handleRevertCancelAppointment = useCallback(
    async (appointmentId?: number) => {
      setIsSubmitting(true);
      try {
        const id = appointmentId || appointment?.id;
        if (!id) throw new Error("예약 정보를 찾을 수 없습니다");

        const result = await updateAppointmentStatus({
          id: Number(id),
          status: AppointmentStatus.CONFIRMED,
        });


        // appointmentStore의 현재 상태를 가져와서 업데이트
        const currentAppointments = appointments || [];
        const appointmentIndex = currentAppointments.findIndex(
          (apt: any) => Number(apt.id) === Number(id)
        );

        let updatedAppointments: any[];
        if (appointmentIndex >= 0) {
          // 기존 예약이 있으면 업데이트
          updatedAppointments = currentAppointments.map((apt: any) =>
            Number(apt.id) === Number(id) ? result : apt
          );
        } else {
          // 기존 예약이 없으면 추가
          updatedAppointments = [...currentAppointments, result];
        }

        // appointmentStore에 업데이트
        setAppointments(updatedAppointments);

        // receptionStore에 업데이트 (개별 업데이트 + 전체 동기화)
        useReceptionStoreState.updateAppointment(String(id), result);
        useReceptionStoreState.setAppointments(updatedAppointments);

        options?.onSuccess?.();
      } catch (error: any) {
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [appointment, appointments, setAppointments, useReceptionStoreState, updateAppointmentStatus, options]
  );

  // 예약 상태를 내원으로 변경
  const handleMarkAsVisited = useCallback(
    async (appointmentId?: number) => {
      setIsSubmitting(true);
      try {
        const id = appointmentId || appointment?.id;
        if (!id) throw new Error("예약 정보를 찾을 수 없습니다");

        const result = await updateAppointmentStatus({
          id: Number(id),
          status: AppointmentStatus.VISITED,
        });

        // appointmentStore의 현재 상태를 가져와서 업데이트
        const currentAppointments = appointments || [];
        const appointmentIndex = currentAppointments.findIndex(
          (apt: any) => Number(apt.id) === Number(id)
        );

        let updatedAppointments: any[];
        if (appointmentIndex >= 0) {
          // 기존 예약이 있으면 업데이트
          updatedAppointments = currentAppointments.map((apt: any) =>
            Number(apt.id) === Number(id) ? result : apt
          );
        } else {
          // 기존 예약이 없으면 추가
          updatedAppointments = [...currentAppointments, result];
        }

        // appointmentStore에 업데이트
        setAppointments(updatedAppointments);

        // receptionStore에 업데이트 (개별 업데이트 + 전체 동기화)
        useReceptionStoreState.updateAppointment(String(id), result);
        useReceptionStoreState.setAppointments(updatedAppointments);

        options?.onSuccess?.();
      } catch (error: any) {
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [appointment, appointments, setAppointments, useReceptionStoreState, updateAppointmentStatus, options]
  );

  return {
    // 생성/수정/삭제
    handleCreateAppointment,
    handleUpdateAppointment,
    handleDeleteAppointment,

    // 상태 변경
    handleCancelAppointment,
    handleRevertCancelAppointment,
    handleMarkAsVisited,

    // 검증
    validateAppointmentUpdate,

    // Force 확인 팝업 state
    forceConfirmState,

    // 상태
    isSubmitting,
  };
}
