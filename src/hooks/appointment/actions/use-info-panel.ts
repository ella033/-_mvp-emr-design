import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useUserStore } from "@/store/user-store";
import { useUsersStore } from "@/store/users-store";
import { useHospitalStore } from "@/store/hospital-store";
import { AppointmentsService } from "@/services/appointments-service";
import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import { PatientsService } from "@/services/patients-service";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import { useToastHelpers } from "@/components/ui/toast";
import { AppointmentStatus } from "@/constants/common/common-enum";
import type { AppointmentPatient } from "@/types/patient-types";
import { getGender, calculateAge, isValidPhoneNumber } from "@/lib/patient-utils";
import { formatBirthDate } from "@/lib/reservation-utils";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import type { AppointmentRoomOperatingHours } from "@/types/appointments/appointment-room-operating-hours";
import type { AppointmentRoom } from "@/types/calendar-types";
import type { UpdateAppointmentRequest } from "@/types/appointments/appointments";
import { convertToYYYYMMDD } from "@/lib/date-utils";
import { useHospitalHolidays } from "@/hooks/api/use-holidays";
import { VALIDATE_MSG } from "@/constants/validate-constants";

interface UseInfoPanelProps {
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
  onCancel?: () => void;
}

export function useInfoPanel({
  selectedDateTime,
  selectedTimeSlot,
  operatingHours: _operatingHours,
  onTimeSlotClick,
  selectedAppointmentId,
  initialPatientId,
  onCancel: onCancelCallback,
}: UseInfoPanelProps) {
  const { getUsersByHospital } = useUsersStore();
  const { hospital } = useHospitalStore();
  const { user } = useUserStore();
  const { appointmentRooms, setAppointmentRooms } = useAppointmentRoomsStore();
  const toastHelpers = useToastHelpers();
  const initialPatientIdRef = useRef<number | null>(null);
  const lastFetchedAppointmentIdRef = useRef<string | null>(null);

  // ===== STATE =====
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] =
    useState<AppointmentPatient | null>(null);
  const [isNewPatientMode, setIsNewPatientMode] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [newPatientInfo, setNewPatientInfo] = useState({
    name: "",
    phone: "",
    birthDate: "",
  });

  // 예약내역 상태
  const [appointmentHistory, setAppointmentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  );

  // 예약 정보 상태
  const [reservationRoom, setReservationRoom] = useState<string>("");
  const [reservationDoctor, setReservationDoctor] = useState<string>("");
  const [reservationDoctorId, setReservationDoctorId] = useState<string>("");
  const [reservationType, setReservationType] = useState<string>("");
  const [reservationTypeName, setReservationTypeName] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [reservationMemo, setReservationMemo] = useState<string>("");
  const [isLoadingAppointment, setIsLoadingAppointment] =
    useState<boolean>(false);

  // 데이터 로딩 상태
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // 공휴일 데이터 상태
  const hospitalHolidaysQuery = useHospitalHolidays({ enabled: !!hospital?.id });
  const hospitalHolidays: HolidayApplicationTypes[] =
    hospitalHolidaysQuery.data ?? [];

  // 예약 취소 확인 팝업 상태
  const [showCancelConfirmPopup, setShowCancelConfirmPopup] = useState(false);

  // ===== COMPUTED VALUES =====

  // 선택된 예약실의 운영시간 및 duration 설정
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

  // 활성화 상태
  const isPanelEnabled = !!selectedPatient || isNewPatientMode;
  const isCreatingNewAppointment =
    !!selectedTimeSlot ||
    (!!selectedDateTime && !selectedPatient && !isNewPatientMode);
  const isPatientInfoEnabled = !!selectedPatient || isNewPatientMode;
  const isReservationHistoryEnabled = !!selectedPatient || isNewPatientMode;
  const isReservationInfoEnabled =
    !!selectedPatient ||
    isNewPatientMode ||
    !!selectedTimeSlot ||
    isCreatingNewAppointment;
  const isFooterEnabled = !!selectedPatient || isNewPatientMode;

  // ===== APPOINTMENT HOOK =====
  const {
    handleCreateAppointment: createAppointmentWithHook,
    handleUpdateAppointment: updateAppointmentWithHook,
    handleCancelAppointment: cancelAppointment,
    forceConfirmState,
    validateAppointmentUpdate,
  } = useHandleAppointment(undefined, {
    onSuccess: () => {
      handleCancel();
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
    },
  });

  // ===== UTILITY FUNCTIONS =====

  // 날짜를 YYYY-MM-DD 형식으로 포맷
  const formatDateToString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // 날짜를 HH:MM 형식으로 포맷
  const formatTimeToString = useCallback((date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }, []);

  // 생년월일 파싱 (YYYYMMDD -> YYYY-MM-DD)
  const parseBirthDate = useCallback((birthDateStr: string): string => {
    if (!birthDateStr || birthDateStr.length !== 8) return "";

    try {
      const formatted = `${birthDateStr.slice(0, 4)}-${birthDateStr.slice(4, 6)}-${birthDateStr.slice(6, 8)}`;
      const birthDateObj = new Date(formatted);
      if (!isNaN(birthDateObj.getTime())) {
        return birthDateObj.toISOString().split("T")[0] || "";
      }
    } catch (error) {
      console.error("Invalid birthDate:", birthDateStr);
    }
    return "";
  }, []);

  // 의사 찾기
  const findDoctorByName = useCallback(
    (doctorName: string) => {
      if (!hospital?.id) return null;
      const users = getUsersByHospital(hospital.id.toString());
      return users.find((user) => user.name === doctorName);
    },
    [hospital?.id, getUsersByHospital]
  );

  // 환자 정보 변환
  const convertToPatientInfo = useCallback(
    (patient: any): AppointmentPatient => {
      let birthDate = "";
      if (patient.birthDate) {
        if (patient.birthDate.length === 8) {
          birthDate = parseBirthDate(patient.birthDate);
        } else {
          birthDate = patient.birthDate;
        }
      }

      return {
        id: patient.id,
        patientNo: patient.patientNo,
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
    [parseBirthDate]
  );

  // ===== HANDLERS =====

  // 신환 모드일 때 환자 정보 입력 핸들러
  const handleNewPatientInfoChange = useCallback(
    (field: "name" | "phone" | "birthDate", value: string) => {
      setNewPatientInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // 예약 정보 초기화 함수
  const resetReservationInfo = useCallback(() => {
    setReservationRoom("");
    setReservationDoctor("");
    setReservationDoctorId("");
    setReservationType("");
    setReservationTypeName("");
    setReservationMemo("");
    setReservationDate("");
  }, []);

  // 예약 정보 완전 초기화 함수 (예약날짜, 예약시간 포함)
  // selectedId를 null로 설정하여 info-panel과 info-footer가 리렌더링되도록 함
  // selectedPatient는 유지하여 환자 정보는 그대로 표시
  const resetAllReservationInfo = useCallback(() => {
    setReservationRoom("");
    setReservationDoctor("");
    setReservationDoctorId("");
    setReservationType("");
    setReservationTypeName("");
    setReservationDate("");
    setFromTime("");
    setToTime("");
    setReservationMemo("");
    setSelectedId(null);
  }, []);

  // 예약실 변경 시 종료 시간 자동 업데이트
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
          const endTimeString = `${endHours}:${endMinutes}`;

          setToTime(endTimeString);
        }
      }
    },
    [appointmentRooms]
  );

  // 시간 설정 함수
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
        const endTimeString = `${endHour.toString().padStart(2, "0")}:${(minutes || 0).toString().padStart(2, "0")}`;
        setToTime(endTimeString);
      }
    },
    [reservationRoom, updateEndTimeByRoomDuration]
  );

  // 예약내역 가져오기 함수
  const fetchAppointmentHistory = useCallback(async (patientId?: number) => {
    const targetPatientId = patientId || selectedPatient?.id;
    if (!targetPatientId) return;

    setIsLoadingHistory(true);
    try {
      const now = new Date();
      const beginDate = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      )
        .toISOString()
        .split("T")[0];
      const endDate = new Date(
        now.getFullYear() + 1,
        now.getMonth(),
        now.getDate()
      )
        .toISOString()
        .split("T")[0];

      const appointments = await AppointmentsService.getAppointmentsByPatient(
        targetPatientId,
        beginDate || "",
        endDate || ""
      );

      const sortedAppointments = appointments.sort((a: any, b: any) => {
        const dateA = new Date(a.appointmentStartTime);
        const dateB = new Date(b.appointmentStartTime);
        return dateB.getTime() - dateA.getTime();
      });

      setAppointmentHistory(sortedAppointments);
    } catch (error) {
      console.error("예약내역 조회 실패:", error);
      setAppointmentHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [selectedPatient?.id]);

  // SearchBar에서 환자 선택 시 환자 정보 조회
  const handlePatientSelect = useCallback(
    async (patient: any) => {
      if (patient && patient.id) {
        try {
          if (showSearchBar) {
            setSelectedId(null);
            resetReservationInfo();
            setReservationDate("");
            setFromTime("");
            setToTime("");
            setAppointmentHistory([]);
            setSelectedHistoryId(null);
          }

          const patientData: AppointmentPatient = {
            id: patient.id,
            patientNo: patient.patientNo,
            name: patient.name || "",
            rrn: patient.rrn || "",
            phone: patient.phone1 || patient.phone2 || patient.phone || "",
            birthDate: formatBirthDate(patient.birthDate || "") || "",
            gender: getGender(Number(patient.gender), "ko"),
            age: patient.age || undefined,
          };

          setSelectedPatient(patientData);
          setIsNewPatientMode(false);
          setShowSearchBar(false);
        } catch (error) {
          console.error("환자 정보 조회 실패:", error);
          toastHelpers.error("환자 정보 조회에 실패했습니다.");
        }
      } else {
        console.warn("patient 정보가 없거나 id가 없음:", patient);
      }
    },
    [showSearchBar, resetReservationInfo, toastHelpers]
  );

  useEffect(() => {
    if (!initialPatientId) {
      initialPatientIdRef.current = null;
      return;
    }

    const patientIdNumber = Number(initialPatientId);
    if (
      Number.isNaN(patientIdNumber) ||
      patientIdNumber <= 0
    ) {
      initialPatientIdRef.current = null;
      return;
    }

    // 이미 같은 initialPatientId로 처리한 경우 스킵
    if (initialPatientIdRef.current === patientIdNumber) {
      return;
    }

    // 이미 같은 환자가 로드된 경우 스킵 (타입 변환을 통해 정확한 비교)
    if (selectedPatient?.id && Number(selectedPatient.id) === patientIdNumber) {
      initialPatientIdRef.current = patientIdNumber;
      return;
    }

    let isCancelled = false;
    initialPatientIdRef.current = patientIdNumber;

    const loadPatient = async () => {
      try {
        const patient = await PatientsService.getPatient(patientIdNumber);
        if (isCancelled) {
          return;
        }

        // initialPatientId로 호출되는 경우 직접 환자 정보 설정
        const patientData: AppointmentPatient = {
          id: patient.id,
          patientNo: patient.patientNo || 0,
          name: patient.name || "",
          rrn: patient.rrn || "",
          phone: patient.phone1 || patient.phone2 || "",
          birthDate: formatBirthDate(patient.birthDate || "") || "",
          gender: getGender(Number(patient.gender), "ko"),
          age: patient.birthDate ? calculateAge(patient.birthDate) : undefined,
        };

        setSelectedPatient(patientData);
        setIsNewPatientMode(false);
        setShowSearchBar(false);

        // 예약내역도 자동으로 가져오기 (patient.id를 직접 전달)
        // fetchAppointmentHistory는 selectedPatient?.id가 변경되면 자동으로 호출되므로
        // 여기서는 직접 호출하지 않아도 됨
      } catch (error) {
        if (!isCancelled) {
          console.error("[useInfoPanel] 환자 정보 조회 실패:", error);
          toastHelpers.error("환자 정보를 불러오지 못했습니다.");
        }
        initialPatientIdRef.current = null;
      }
    };

    loadPatient();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId]);

  // 예약실 데이터 가져오기
  const fetchReservationRooms = useCallback(async () => {
    if (!hospital?.id) return;

    setIsLoadingRooms(true);
    try {
      const roomsData = await AppointmentRoomsService.getAppointmentRooms();
      setAppointmentRooms(roomsData);
      /*
            if (roomsData.length > 0 && !reservationRoom) {
              const firstRoom = roomsData[0];
              setReservationRoom(firstRoom.id.toString());
      
              // 첫번째 예약실의 담당 진료의 설정
              if (firstRoom.userId) {
                const doctors = getUsersByHospital(hospital.id.toString());
                const assignedDoctor = doctors.find(
                  (doctor) => doctor.id === firstRoom.userId
                );
      
                if (assignedDoctor) {
                  setReservationDoctorId(assignedDoctor.id.toString());
                  setReservationDoctor(assignedDoctor.name);
                }
              }
            }
            */
    } catch (error) {
      console.error("Error fetching reservation rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [hospital?.id, reservationRoom, setAppointmentRooms, getUsersByHospital]);

  // 예약유형 데이터 가져오기
  const fetchAppointmentTypes = useCallback(async () => {
    if (!hospital?.id) return;

    setIsLoadingTypes(true);
    try {
      const typesData = await AppointmentTypesService.getAppointmentTypes();
      setAppointmentTypes(typesData);

    } catch (error) {
      console.error("Error fetching appointment types:", error);
    } finally {
      setIsLoadingTypes(false);
    }
  }, [hospital?.id, reservationType]);

  // 예약 상세 정보 조회
  const fetchAppointmentDetails = useCallback(
    async (appointmentId: string) => {
      setIsLoadingAppointment(true);
      try {
        const appointment = (await AppointmentsService.getAppointment(
          Number(appointmentId)
        )) as any;
        if (appointment) {
          // 환자 정보 설정
          if (appointment.patient) {
            const patientInfo = convertToPatientInfo(appointment.patient);
            setSelectedPatient(patientInfo);
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
    [toastHelpers, convertToPatientInfo, formatDateToString, formatTimeToString]
  );

  // 예약 변경사항 감지 함수
  const detectAppointmentChanges = useCallback(
    (
      originalAppointment: any,
      currentRoomId: number,
      currentTypeId: number | null,
      currentDoctorId: number | null,
      currentMemo: string,
      appointmentStartDate: Date,
      appointmentEndDate: Date,
      selectedPatient: AppointmentPatient
    ): Partial<UpdateAppointmentRequest> => {
      const updateData: Partial<UpdateAppointmentRequest> = {};
      
      // 휴게시간 검증을 위하여 hospitalId, appointmentRoomId는 필수 포함
      updateData.hospitalId = hospital.id;
      updateData.appointmentRoomId = currentRoomId;

      const originalTypeId = originalAppointment.appointmentTypeId
        ? Number(originalAppointment.appointmentTypeId)
        : undefined;
      if (originalTypeId !== currentTypeId) {
        if (currentTypeId !== undefined) {
          updateData.appointmentTypeId = currentTypeId;
        } else {
          // 빈값으로 설정하려는 경우 null로 설정
          updateData.appointmentTypeId = null as any;
        }
      }

      if (originalAppointment.patient.name !== selectedPatient.name) {
        updateData.temporaryPatient = {
          name: selectedPatient.name,
          phone1: selectedPatient.phone,
          birthDate: convertToYYYYMMDD(selectedPatient.birthDate),
        };
      }

      if (originalAppointment.patient.phone1 !== selectedPatient.phone) {
        updateData.temporaryPatient = {
          name: selectedPatient.name,
          phone1: selectedPatient.phone,
          birthDate: convertToYYYYMMDD(selectedPatient.birthDate),
        };
      }

      const originalStartTime = originalAppointment.appointmentStartTime
        ? new Date(originalAppointment.appointmentStartTime).getTime()
        : 0;
      const currentStartTime = appointmentStartDate.getTime();
      if (originalStartTime !== currentStartTime) {
        updateData.appointmentStartTime = appointmentStartDate;
      }

      const originalEndTime = originalAppointment.appointmentEndTime
        ? new Date(originalAppointment.appointmentEndTime).getTime()
        : 0;
      const currentEndTime = appointmentEndDate.getTime();
      if (originalEndTime !== currentEndTime) {
        updateData.appointmentEndTime = appointmentEndDate;
      }

      const originalDoctorId = originalAppointment.doctorId
        ? Number(originalAppointment.doctorId)
        : null;
      if (originalDoctorId !== currentDoctorId) {
        if (currentDoctorId !== null) {
          updateData.doctorId = currentDoctorId;
        } else {
          // 빈값으로 설정하려는 경우 null로 설정
          updateData.doctorId = null as any;
        }
      }
      if (originalAppointment.memo !== currentMemo) {
        updateData.memo = currentMemo;
      }

      return updateData;
    },
    []
  );

  // 생년월일 유효성 검증
  const isValidBirthDate = useCallback((dateStr: string): boolean => {
    if (!dateStr) return true; // 빈값은 허용 (필수 아님)
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    const [, yearStr, monthStr, dayStr] = match;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }, []);

  // 예약 검증 함수
  const validateAppointment = useCallback((): boolean => {
    if (!selectedPatient) {
      toastHelpers.error(VALIDATE_MSG.APPOINTMENT.PATIENT_REQUIRED);
      return false;
    }

    if (!selectedPatient && !selectedId) {
      toastHelpers.error(VALIDATE_MSG.APPOINTMENT.APPOINTMENT_INFO_REQUIRED);
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
    selectedId,
    reservationDate,
    fromTime,
    toTime,
    reservationRoom,
    appointmentRooms,
    toastHelpers,
  ]);

  // 예약 버튼 클릭 시 예약 생성 또는 수정
  const handleCreateAppointment = useCallback(async () => {
    // 시작/종료 시간 계산 (공통 로직)
    const calculateAppointmentTimes = () => {
      const startDate = new Date(reservationDate);
      const [hours, minutes] = fromTime.split(":").map(Number);
      startDate.setHours(hours || 0, minutes || 0, 0, 0);

      const endDate = new Date(reservationDate);
      const [endHours, endMinutes] = toTime.split(":").map(Number);
      endDate.setHours(endHours || 0, endMinutes || 0, 0, 0);

      return { startDate, endDate };
    };

    const { startDate: appointmentStartDate, endDate: appointmentEndDate } =
      calculateAppointmentTimes();
    const selectedDoctor = findDoctorByName(reservationDoctor);

    // 간이신환 모드일 때 검증 후 예약 생성
    if (isNewPatientMode) {
      if (!newPatientInfo.name?.trim()) {
        toastHelpers.error(VALIDATE_MSG.APPOINTMENT.NAME_REQUIRED);
        return;
      }
      if (!newPatientInfo.phone?.trim()) {
        toastHelpers.error(VALIDATE_MSG.APPOINTMENT.PHONE_REQUIRED);
        return;
      }
      if (!isValidPhoneNumber(newPatientInfo.phone)) {
        toastHelpers.error(VALIDATE_MSG.APPOINTMENT.PHONE_INVALID);
        return;
      }
      if (newPatientInfo.birthDate && !isValidBirthDate(newPatientInfo.birthDate)) {
        toastHelpers.error(VALIDATE_MSG.APPOINTMENT.BIRTHDATE_INVALID);
        return;
      }

      const appointmentData: any = {
        hospitalId: hospital.id,
        appointmentRoomId: Number(reservationRoom),
        patientId: 0,
        appointmentStartTime: appointmentStartDate,
        appointmentEndTime: appointmentEndDate,
        status: AppointmentStatus.CONFIRMED,
        memo: reservationMemo,
        platform: 1,
        isSimplePatient: true,
        excludeAutoMessage: false,
        receptionistId: user.id,
        temporaryPatient: {
          name: newPatientInfo.name,
          phone1: newPatientInfo.phone,
          birthDate: convertToYYYYMMDD(newPatientInfo.birthDate),
        },
      };

      // 예약유형이 선택된 경우에만 추가
      if (reservationType) {
        appointmentData.appointmentTypeId = Number(reservationType);
      }

      // 진료의가 선택된 경우에만 추가
      const doctorIdValue = selectedDoctor?.id;
      if (doctorIdValue) {
        appointmentData.doctorId = Number(doctorIdValue);
      }

      try {
        await createAppointmentWithHook(appointmentData);
        return;
      } catch (error: any) {
        return;
      }
    }

    // 예약 검증
    if (!validateAppointment()) {
      return;
    }

    // 검증 통과 후 selectedPatient는 null이 아님을 보장
    if (!selectedPatient) {
      return;
    }

    const appointmentData: any = {
      hospitalId: hospital.id,
      appointmentRoomId: Number(reservationRoom),
      patientId: Number(selectedPatient.id),
      appointmentStartTime: appointmentStartDate,
      appointmentEndTime: appointmentEndDate,
      status: AppointmentStatus.CONFIRMED,
      platform: 1,
      isSimplePatient: false,
      excludeAutoMessage: false,
      receptionistId: user.id,
      temporaryPatient: null,
      memo: reservationMemo,
    };

    // 예약유형이 선택된 경우에만 추가
    if (reservationType) {
      appointmentData.appointmentTypeId = Number(reservationType);
    }

    // 진료의가 선택된 경우에만 추가
    const doctorIdValue = selectedDoctor?.id;
    if (doctorIdValue) {
      appointmentData.doctorId = Number(doctorIdValue);
    }

    try {
      const originalAppointment = selectedId
        ? await AppointmentsService.getAppointment(Number(selectedId))
        : null;
      if (selectedId && originalAppointment) {
        const currentRoomId = Number(reservationRoom);
        const currentTypeId = Number(reservationType) || null;
        const doctorIdValue = selectedDoctor?.id || null;
        const currentDoctorId = doctorIdValue ? Number(doctorIdValue) : null;
        const currentMemo = reservationMemo;

        const updateData = detectAppointmentChanges(
          originalAppointment,
          currentRoomId,
          currentTypeId,
          currentDoctorId,
          currentMemo,
          appointmentStartDate,
          appointmentEndDate,
          selectedPatient
        );

        if (Object.keys(updateData).length > 0) {
          const validation = await validateAppointmentUpdate(
            Number(selectedId)
          );
          if (!validation.isValid) {
            toastHelpers.error(
              validation.error || "예약을 수정할 수 없습니다."
            );
            return;
          }
          await updateAppointmentWithHook(Number(selectedId), updateData);
        } else {
          toastHelpers.info("변경사항이 없습니다.");
        }
      } else {
        await createAppointmentWithHook(appointmentData);
      }
    } catch (error: any) {
      // 에러는 훅에서 처리됨
    }
  }, [
    isNewPatientMode,
    reservationDate,
    fromTime,
    toTime,
    hospital,
    reservationDoctor,
    reservationRoom,
    reservationType,
    reservationMemo,
    reservationDoctorId,
    user,
    newPatientInfo,
    selectedPatient,
    selectedId,
    appointmentRooms,
    findDoctorByName,
    createAppointmentWithHook,
    updateAppointmentWithHook,
    detectAppointmentChanges,
    toastHelpers,
    validateAppointmentUpdate,
    validateAppointment,
    isValidBirthDate,
  ]);

  // 예약 취소 버튼 클릭 시 확인 팝업 표시
  const handleCancelAppointment = useCallback(() => {
    if (!selectedId) {
      toastHelpers.error("취소할 예약이 선택되지 않았습니다.");
      return;
    }
    setShowCancelConfirmPopup(true);
  }, [selectedId, toastHelpers]);

  // 예약 취소 확인 처리 (취소 사유 포함)
  const confirmCancelAppointment = useCallback(
    async (reason: string) => {
      if (!selectedId) return;

      try {
        await cancelAppointment(Number(selectedId), reason);
        setSelectedId(null);
      } catch (error: any) {
        const errorMessage =
          error?.data?.message || error?.message || "예약 취소에 실패했습니다.";
        toastHelpers.error(errorMessage);
        setSelectedId(null);
      } finally {
        setShowCancelConfirmPopup(false);
      }
    },
    [selectedId, cancelAppointment, toastHelpers]
  );

  // 취소 버튼 클릭 시 모든 상태 초기화
  const handleCancel = useCallback(() => {
    setSelectedPatient(null);
    setIsNewPatientMode(false);
    setNewPatientInfo({
      name: "",
      phone: "",
      birthDate: "",
    });
    resetReservationInfo();
    setFromTime("");
    setToTime("");
    setShowDatePicker(false);
    setSelectedId(null);
    setShowSearchBar(false);
    setSelectedHistoryId(null);
    setAppointmentHistory([]);
    lastFetchedAppointmentIdRef.current = null;
    // 상위 컴포넌트에 취소 알림 (selectedAppointmentId, initialPatientId 초기화를 위해)
    onCancelCallback?.();
  }, [resetReservationInfo, onCancelCallback]);

  // 예약내역 카드 클릭 시 상세 정보 표시
  const handleHistoryCardClick = useCallback(
    (appointment: any) => {
      if (!appointment) return;
      // selectedHistoryId를 먼저 설정하여 fetchAppointmentDetails가 호출되지 않도록 함
      setSelectedHistoryId(appointment.id);

      // 예약 정보를 먼저 설정한 후 selectedId 설정
      if (appointment.patient) {
        const patientData = convertToPatientInfo(appointment.patient);
        setSelectedPatient(patientData);
        setIsNewPatientMode(false);
        setNewPatientInfo({
          name: appointment.patient.name || "",
          phone: patientData.phone,
          birthDate: appointment.patient.birthDate || "",
        });
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

      // 모든 정보를 설정한 후 selectedId 설정 (이렇게 하면 fetchAppointmentDetails가 호출되지 않음)
      setSelectedId(appointment.id);
    },
    [convertToPatientInfo, formatDateToString, formatTimeToString]
  );

  // ===== EFFECTS =====

  // 컴포넌트 마운트 시 예약실 및 예약유형 데이터 가져오기
  useEffect(() => {
    fetchReservationRooms();
    fetchAppointmentTypes();
  }, [hospital?.id]);

  // selectedDateTime이 변경될 때 폼 필드 업데이트
  // 기존 예약을 조회/수정 중인 경우 (selectedId가 있는 경우) selectedDateTime으로 덮어쓰지 않음
  useEffect(() => {
    if (selectedId) return;

    if (selectedDateTime) {
      const year = selectedDateTime.date.getFullYear();
      const month = (selectedDateTime.date.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const day = selectedDateTime.date.getDate().toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      setReservationDate(dateString);

      if (onTimeSlotClick) {
        if (selectedDateTime.time) {
          const timeString = `${selectedDateTime.time.hour.toString().padStart(2, "0")}:${selectedDateTime.time.minute.toString().padStart(2, "0")}`;
          setTimeRange(timeString);
        }
      }
      if (!selectedPatient) {
        resetReservationInfo();
        // resetReservationInfo()가 reservationDate를 초기화하므로 다시 설정
        setReservationDate(dateString);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateTime, selectedPatient, onTimeSlotClick, selectedId]);

  // selectedTimeSlot이 변경될 때 시간 설정 및 예약실/진료의 설정
  // 기존 예약을 조회/수정 중인 경우 (selectedId가 있는 경우) selectedTimeSlot으로 덮어쓰지 않음
  useEffect(() => {
    if (selectedId) return;

    if (selectedTimeSlot) {
      const startTimeString = selectedTimeSlot.start;
      const endTimeString = selectedTimeSlot.end;
      setTimeRange(startTimeString, endTimeString);

      if (selectedDateTime) {
        const year = selectedDateTime.date.getFullYear();
        const month = (selectedDateTime.date.getMonth() + 1)
          .toString()
          .padStart(2, "0");
        const day = selectedDateTime.date.getDate().toString().padStart(2, "0");
        setReservationDate(`${year}-${month}-${day}`);
      }

      if (selectedTimeSlot.appointmentRoom) {
        const room = selectedTimeSlot.appointmentRoom;
        setReservationRoom(room.id.toString());

        // 선택된 예약실에 담당 진료의(userId)가 있으면 진료의 필드에 설정
        if (room.userId != null && hospital?.id) {
          const doctors = getUsersByHospital(hospital.id.toString());
          const assignedDoctor = doctors.find(
            (doctor) => doctor.id === room.userId
          );
          if (assignedDoctor) {
            setReservationDoctor(assignedDoctor.name);
            setReservationDoctorId(assignedDoctor.id.toString());
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimeSlot, selectedDateTime, hospital?.id, getUsersByHospital, selectedId]);

  // selectedAppointmentId prop이 변경될 때 내부 상태 업데이트 및 예약 상세 조회
  useEffect(() => {
    setSelectedId(selectedAppointmentId || null);

    if (selectedAppointmentId) {
      // selectedAppointmentId가 변경되면 항상 상세 정보를 조회 (ref로 중복 방지)
      if (lastFetchedAppointmentIdRef.current !== selectedAppointmentId) {
        lastFetchedAppointmentIdRef.current = selectedAppointmentId;
        fetchAppointmentDetails(selectedAppointmentId);
      }

      // appointmentHistory에서 시각적 선택 표시를 위해 selectedHistoryId 동기화
      const existsInHistory = appointmentHistory.some(
        (appointment: any) => appointment.id === selectedAppointmentId
      );
      if (existsInHistory) {
        setSelectedHistoryId(selectedAppointmentId);
      } else {
        setSelectedHistoryId(null);
      }
    } else {
      lastFetchedAppointmentIdRef.current = null;
      setSelectedHistoryId(null);
    }
  }, [selectedAppointmentId, appointmentHistory]);

  // selectedId가 변경될 때 예약 정보 조회
  // - handleHistoryCardClick에서 이미 정보를 설정한 경우 (selectedHistoryId === selectedId) 스킵
  // - selectedAppointmentId에서 온 경우도 위의 effect에서 이미 처리하므로 스킵
  useEffect(() => {
    if (
      selectedId &&
      selectedId !== selectedAppointmentId &&
      (!selectedHistoryId || selectedHistoryId !== selectedId)
    ) {
      fetchAppointmentDetails(selectedId);
    }
  }, [selectedId, selectedHistoryId, selectedAppointmentId]);

  // 환자가 선택될 때 예약내역 가져오기
  useEffect(() => {
    if (selectedPatient?.id) {
      fetchAppointmentHistory();
    } else {
      setAppointmentHistory([]);
      setSelectedHistoryId(null);
    }
  }, [selectedPatient?.id]);

  useEffect(() => {
    if (selectedPatient) {
      setShowSearchBar(false);
    }
  }, [selectedPatient, isNewPatientMode]);

  useEffect(() => {
    if (selectedId) {
      setShowSearchBar(false);
    }
  }, [selectedId]);

  // ===== RETURN =====
  return {
    // States
    showDatePicker,
    setShowDatePicker,
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
    isLoadingAppointment,
    appointmentTypes,
    isLoadingTypes,
    isLoadingRooms,
    hospitalHolidays,
    showCancelConfirmPopup,
    setShowCancelConfirmPopup,

    // Computed values
    selectedRoomConfig,
    isPanelEnabled,
    isCreatingNewAppointment,
    isPatientInfoEnabled,
    isReservationHistoryEnabled,
    isReservationInfoEnabled,
    isFooterEnabled,

    // From appointment hook
    forceConfirmState,

    // Data
    appointmentRooms,

    // Handlers
    handleNewPatientInfoChange,
    resetReservationInfo,
    resetAllReservationInfo,
    updateEndTimeByRoomDuration,
    setTimeRange,
    fetchAppointmentHistory,
    handlePatientSelect,
    handleCreateAppointment,
    handleCancelAppointment,
    confirmCancelAppointment,
    handleCancel,
    handleHistoryCardClick,
  };
}
