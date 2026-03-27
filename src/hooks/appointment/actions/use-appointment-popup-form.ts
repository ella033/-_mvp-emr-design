import { useState, useEffect, useMemo, useCallback } from "react";
import { useUsersStore } from "@/store/users-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useUserStore } from "@/store/user-store";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import { AppointmentsService } from "@/services/appointments-service";
import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import { useToastHelpers } from "@/components/ui/toast";
import { AppointmentStatus } from "@/constants/common/common-enum";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import { convertToYYYYMMDD } from "@/lib/date-utils";
import { getGender } from "@/lib/patient-utils";
import { VALIDATE_MSG } from "@/constants/validate-constants";
import type { AppointmentPatient } from "@/types/patient-types";
import type { UpdateAppointmentRequest } from "@/types/appointments/appointments";

interface UseAppointmentPopupFormProps {
  mode: "create" | "edit";
  appointmentId?: number | string | null;
  patientInfo?: AppointmentPatient | null;
  isOpen: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function useAppointmentPopupForm({
  mode,
  appointmentId,
  patientInfo,
  isOpen,
  onSuccess,
  onClose,
}: UseAppointmentPopupFormProps) {
  const { getUsersByHospital } = useUsersStore();
  const { hospital } = useHospitalStore();
  const { user } = useUserStore();
  const { appointmentRooms, setAppointmentRooms } = useAppointmentRoomsStore();
  const toastHelpers = useToastHelpers();

  // ===== FORM STATE =====
  const [selectedPatient, setSelectedPatient] =
    useState<AppointmentPatient | null>(null);
  const [reservationRoom, setReservationRoom] = useState<string>("");
  const [reservationDoctor, setReservationDoctor] = useState<string>("");
  const [reservationType, setReservationType] = useState<string>("");
  const [reservationTypeName, setReservationTypeName] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [reservationMemo, setReservationMemo] = useState<string>("");

  // ===== DATA STATE =====
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false);
  const [originalAppointment, setOriginalAppointment] = useState<any>(null);

  // ===== APPOINTMENT HOOK =====
  const {
    handleCreateAppointment: createAppointmentWithHook,
    handleUpdateAppointment: updateAppointmentWithHook,
    forceConfirmState,
    validateAppointmentUpdate,
  } = useHandleAppointment(undefined, {
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
      window.dispatchEvent(
        new CustomEvent("refreshPatientsData", {
          detail: { type: "all" },
        })
      );
      onSuccess?.();
      onClose?.();
    },
  });

  // ===== COMPUTED VALUES =====
  const selectedRoomConfig = useMemo(() => {
    if (!reservationRoom || !reservationDate) {
      return {
        beginTime: "08:00",
        endTime: "21:00",
        duration: 30,
        isRoomSelected: false,
      };
    }

    const selectedDate = new Date(reservationDate);
    const dayOfWeek = selectedDate.getDay();
    const selectedRoom = appointmentRooms.find(
      (room) => room.id.toString() === reservationRoom
    );
    const roomOperatingHours = selectedRoom?.operatingHours?.find(
      (d) => d.dayOfWeek === dayOfWeek
    );

    return {
      beginTime: roomOperatingHours?.startTime || "08:00",
      endTime: roomOperatingHours?.endTime || "21:00",
      duration: selectedRoom?.timeSlotDuration || 30,
      isRoomSelected: true,
    };
  }, [appointmentRooms, reservationRoom, reservationDate]);

  const doctors = useMemo(() => {
    if (!hospital?.id) return [];
    return getUsersByHospital(hospital.id.toString());
  }, [hospital?.id, getUsersByHospital]);

  // ===== UTILITY FUNCTIONS =====
  const formatDateToString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formatTimeToString = useCallback((date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  const convertToPatientInfo = useCallback(
    (patient: any): AppointmentPatient => {
      let birthDate = "";
      if (patient.birthDate) {
        if (patient.birthDate.length === 8) {
          const formatted = `${patient.birthDate.slice(0, 4)}-${patient.birthDate.slice(4, 6)}-${patient.birthDate.slice(6, 8)}`;
          const birthDateObj = new Date(formatted);
          if (!isNaN(birthDateObj.getTime())) {
            birthDate = birthDateObj.toISOString().split("T")[0] || "";
          }
        } else {
          birthDate = patient.birthDate;
        }
      }

      return {
        id: patient.id,
        patientNo: patient.patientNo || 0,
        name: String(patient.name || ""),
        rrn: String(patient.rrn || ""),
        phone: String(patient.phone1 || patient.phone2 || patient.phone || ""),
        birthDate: birthDate,
        gender:
          typeof patient.gender === "number"
            ? getGender(patient.gender, "ko")
            : patient.gender || "",
        age: patient.age,
      };
    },
    []
  );

  const findDoctorByName = useCallback(
    (doctorName: string) => {
      if (!hospital?.id) return null;
      const users = getUsersByHospital(hospital.id.toString());
      return users.find((user) => user.name === doctorName);
    },
    [hospital?.id, getUsersByHospital]
  );

  // ===== HANDLERS =====
  const updateEndTimeByRoomDuration = useCallback(
    (startTime: string, roomId: string) => {
      if (startTime && roomId) {
        const selectedRoom = appointmentRooms.find(
          (room) => room.id.toString() === roomId
        );
        if (selectedRoom?.timeSlotDuration) {
          const [hours, minutes] = startTime.split(":").map(Number);
          const startDateTime = new Date();
          startDateTime.setHours(hours || 0, minutes || 0);

          const durationMinutes = selectedRoom.timeSlotDuration;
          const endDateTime = new Date(startDateTime);
          endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

          const endHours = endDateTime.getHours().toString().padStart(2, "0");
          const endMinutes = endDateTime
            .getMinutes()
            .toString()
            .padStart(2, "0");
          setToTime(`${endHours}:${endMinutes}`);
        }
      }
    },
    [appointmentRooms]
  );

  const setTimeRange = useCallback(
    (startTime: string, endTime?: string) => {
      setFromTime(startTime);
      if (endTime) {
        setToTime(endTime);
      } else if (reservationRoom) {
        updateEndTimeByRoomDuration(startTime, reservationRoom);
      } else {
        const [hours, minutes] = startTime.split(":").map(Number);
        const endHour = (hours || 0) + 1;
        setToTime(
          `${endHour.toString().padStart(2, "0")}:${(minutes || 0).toString().padStart(2, "0")}`
        );
      }
    },
    [reservationRoom, updateEndTimeByRoomDuration]
  );

  const handleRoomChange = useCallback(
    (value: string) => {
      setReservationRoom(value);
      // 선택한 예약실의 담당 진료의 설정
      const selectedRoom = appointmentRooms.find(
        (room) => room.id.toString() === value
      );
      if (selectedRoom && selectedRoom.userId && hospital?.id) {
        const users = getUsersByHospital(hospital.id.toString());
        const assignedDoctor = users.find(
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
    },
    [appointmentRooms, hospital?.id, getUsersByHospital, fromTime, updateEndTimeByRoomDuration]
  );

  const handleToTimeChange = useCallback(
    (value: string) => {
      if (fromTime && value < fromTime) {
        setToTime(fromTime);
      } else {
        setToTime(value);
      }
    },
    [fromTime]
  );

  // ===== VALIDATION =====
  const validateAppointment = useCallback((): boolean => {
    if (!selectedPatient) {
      toastHelpers.error(VALIDATE_MSG.APPOINTMENT.PATIENT_REQUIRED);
      return false;
    }

    if (!reservationDate || !fromTime || !toTime) {
      toastHelpers.error(VALIDATE_MSG.APPOINTMENT.TIME_REQUIRED);
      return false;
    }

    const selectedRoom = appointmentRooms.find(
      (room) => room.id.toString() === reservationRoom
    );
    if (!selectedRoom) {
      toastHelpers.error(VALIDATE_MSG.APPOINTMENT.ROOM_REQUIRED);
      return false;
    }

    return true;
  }, [
    selectedPatient,
    reservationDate,
    fromTime,
    toTime,
    reservationRoom,
    appointmentRooms,
    toastHelpers,
  ]);

  // ===== CHANGE DETECTION =====
  const detectAppointmentChanges = useCallback(
    (
      original: any,
      currentRoomId: number,
      currentTypeId: number | null,
      currentDoctorId: number | null,
      currentMemo: string,
      appointmentStartDate: Date,
      appointmentEndDate: Date,
      patient: AppointmentPatient
    ): Partial<UpdateAppointmentRequest> => {
      const updateData: Partial<UpdateAppointmentRequest> = {};

      // 휴게시간 검증을 위하여 hospitalId, appointmentRoomId는 필수 포함
      updateData.hospitalId = hospital?.id;
      updateData.appointmentRoomId = currentRoomId;

      const originalTypeId = original.appointmentTypeId
        ? Number(original.appointmentTypeId)
        : undefined;
      if (originalTypeId !== currentTypeId) {
        if (currentTypeId !== undefined) {
          updateData.appointmentTypeId = currentTypeId;
        } else {
          updateData.appointmentTypeId = null as any;
        }
      }

      if (original.patient?.name !== patient.name || original.patient?.phone1 !== patient.phone) {
        updateData.temporaryPatient = {
          name: patient.name,
          phone1: patient.phone,
          birthDate: convertToYYYYMMDD(patient.birthDate),
        };
      }

      const originalStartTime = original.appointmentStartTime
        ? new Date(original.appointmentStartTime).getTime()
        : 0;
      if (originalStartTime !== appointmentStartDate.getTime()) {
        updateData.appointmentStartTime = appointmentStartDate;
      }

      const originalEndTime = original.appointmentEndTime
        ? new Date(original.appointmentEndTime).getTime()
        : 0;
      if (originalEndTime !== appointmentEndDate.getTime()) {
        updateData.appointmentEndTime = appointmentEndDate;
      }

      const originalDoctorId = original.doctorId
        ? Number(original.doctorId)
        : null;
      if (originalDoctorId !== currentDoctorId) {
        if (currentDoctorId !== null) {
          updateData.doctorId = currentDoctorId;
        } else {
          updateData.doctorId = null as any;
        }
      }

      if (original.memo !== currentMemo) {
        updateData.memo = currentMemo;
      }

      return updateData;
    },
    [hospital?.id]
  );

  // ===== SUBMIT =====
  const handleSubmit = useCallback(async () => {
    if (!validateAppointment()) return;
    if (!selectedPatient) return;

    const startDate = new Date(reservationDate);
    const [hours, minutes] = fromTime.split(":").map(Number);
    startDate.setHours(hours || 0, minutes || 0, 0, 0);

    const endDate = new Date(reservationDate);
    const [endHours, endMinutes] = toTime.split(":").map(Number);
    endDate.setHours(endHours || 0, endMinutes || 0, 0, 0);

    const selectedDoctor = findDoctorByName(reservationDoctor);
    const doctorIdValue = selectedDoctor?.id;

    try {
      if (mode === "edit" && appointmentId && originalAppointment) {
        // 수정 모드
        const currentRoomId = Number(reservationRoom);
        const currentTypeId = Number(reservationType) || null;
        const currentDoctorId = doctorIdValue ? Number(doctorIdValue) : null;

        const updateData = detectAppointmentChanges(
          originalAppointment,
          currentRoomId,
          currentTypeId,
          currentDoctorId,
          reservationMemo,
          startDate,
          endDate,
          selectedPatient
        );

        if (Object.keys(updateData).length > 0) {
          const validation = await validateAppointmentUpdate(
            Number(appointmentId)
          );
          if (!validation.isValid) {
            toastHelpers.error(
              validation.error || "예약을 수정할 수 없습니다."
            );
            return;
          }
          await updateAppointmentWithHook(Number(appointmentId), updateData);
        } else {
          toastHelpers.info("변경사항이 없습니다.");
        }
      } else {
        // 생성 모드
        const appointmentData: any = {
          hospitalId: hospital?.id,
          appointmentRoomId: Number(reservationRoom),
          patientId: Number(selectedPatient.id),
          appointmentStartTime: startDate,
          appointmentEndTime: endDate,
          status: AppointmentStatus.CONFIRMED,
          platform: 1,
          isSimplePatient: false,
          excludeAutoMessage: false,
          receptionistId: user?.id,
          temporaryPatient: null,
          memo: reservationMemo,
        };

        if (reservationType) {
          appointmentData.appointmentTypeId = Number(reservationType);
        }
        if (doctorIdValue) {
          appointmentData.doctorId = Number(doctorIdValue);
        }

        await createAppointmentWithHook(appointmentData);
      }
    } catch (error: any) {
      // 에러는 useHandleAppointment 훅에서 처리
    }
  }, [
    mode,
    appointmentId,
    originalAppointment,
    selectedPatient,
    reservationDate,
    fromTime,
    toTime,
    reservationRoom,
    reservationType,
    reservationDoctor,
    reservationMemo,
    hospital?.id,
    user?.id,
    validateAppointment,
    findDoctorByName,
    detectAppointmentChanges,
    createAppointmentWithHook,
    updateAppointmentWithHook,
    validateAppointmentUpdate,
    toastHelpers,
  ]);

  // ===== DATA FETCHING =====
  const fetchRoomsAndTypes = useCallback(async () => {
    if (!hospital?.id) return;

    setIsLoadingRooms(true);
    setIsLoadingTypes(true);
    try {
      const [roomsData, typesData] = await Promise.all([
        appointmentRooms.length > 0
          ? Promise.resolve(appointmentRooms)
          : AppointmentRoomsService.getAppointmentRooms(),
        AppointmentTypesService.getAppointmentTypes(),
      ]);
      if (roomsData !== appointmentRooms) {
        setAppointmentRooms(roomsData);
      }
      setAppointmentTypes(typesData);
    } catch (error) {
      console.error("Error fetching rooms/types:", error);
    } finally {
      setIsLoadingRooms(false);
      setIsLoadingTypes(false);
    }
  }, [hospital?.id, appointmentRooms, setAppointmentRooms]);

  const fetchAppointmentDetails = useCallback(
    async (id: number | string) => {
      setIsLoadingAppointment(true);
      try {
        const appointment = await AppointmentsService.getAppointment(Number(id));
        if (appointment) {
          setOriginalAppointment(appointment);

          // 환자 정보 설정
          if (appointment.patient) {
            const patientData = convertToPatientInfo(appointment.patient);
            setSelectedPatient(patientData);
          }

          setReservationRoom(appointment.appointmentRoomId?.toString() || "");
          setReservationDoctor(appointment.doctor?.name || "");
          setReservationType(appointment.appointmentTypeId?.toString() || "");
          setReservationTypeName(appointment.appointmentType?.name || "");

          if (appointment.appointmentStartTime) {
            const appointmentDate = new Date(appointment.appointmentStartTime);
            setReservationDate(formatDateToString(appointmentDate));
            setFromTime(formatTimeToString(appointmentDate));
          }

          if (appointment.appointmentEndTime) {
            const endDate = new Date(appointment.appointmentEndTime);
            setToTime(formatTimeToString(endDate));
          }

          setReservationMemo(appointment.memo || "");
        }
      } catch (error) {
        toastHelpers.error("예약 내역 조회에 실패했습니다.");
      } finally {
        setIsLoadingAppointment(false);
      }
    },
    [convertToPatientInfo, formatDateToString, formatTimeToString, toastHelpers]
  );

  // ===== EFFECTS =====

  // 팝업 열릴 때 초기화 및 데이터 로드
  useEffect(() => {
    if (!isOpen) {
      // 팝업 닫히면 폼 초기화
      setReservationRoom("");
      setReservationDoctor("");
      setReservationType("");
      setReservationTypeName("");
      setReservationDate("");
      setFromTime("");
      setToTime("");
      setReservationMemo("");
      setSelectedPatient(null);
      setOriginalAppointment(null);
      return;
    }

    // 팝업 열릴 때 rooms/types 로드
    fetchRoomsAndTypes();

    if (mode === "create" && patientInfo) {
      setSelectedPatient(patientInfo);
    } else if (mode === "edit" && appointmentId) {
      fetchAppointmentDetails(appointmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return {
    // Patient
    selectedPatient,

    // Form state
    reservationRoom,
    reservationDoctor,
    reservationType,
    reservationTypeName,
    reservationDate,
    fromTime,
    toTime,
    reservationMemo,

    // Handlers
    handleRoomChange,
    setReservationDoctor,
    setReservationType,
    setReservationDate,
    setTimeRange,
    handleToTimeChange,
    setReservationMemo,
    handleSubmit,

    // Data
    appointmentRooms,
    appointmentTypes,
    doctors,
    selectedRoomConfig,

    // Loading
    isLoadingRooms,
    isLoadingTypes,
    isLoadingAppointment,

    // Force confirm
    forceConfirmState,
  };
}
