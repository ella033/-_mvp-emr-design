import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import Calendar from "react-calendar";
import { Appointment } from "@/types/appointments/appointments";
import type { AppointmentRoomOperatingHours } from "@/types/appointments/appointment-room-operating-hours";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useUsersStore } from "@/store/users-store";
import { useHospitalStore } from "@/store/hospital-store";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import type { AppointmentTypes } from "@/types/appointments/appointment-types";
import type { Patient } from "@/types/patient-types";
import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";
import type { DoctorType } from "@/types/doctor-type";

// 타입 정의
interface PatientInfo {
  id?: string;
  name: string;
  phone: string;
  birthDate: string;
}

interface ReservationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "new" | "existing"; // 신환 예약 또는 기존 환자 예약
  patientData?: PatientInfo; // 기존 환자 데이터 (검색을 통해 들어온 경우)
  reservationData?: Appointment; // 기존 예약 데이터 (수정하는 경우)
  operatingHours?: AppointmentRoomOperatingHours[] | null; // 운영 시간 설정
  onSave: (appointment: Appointment) => void;
  onCancel?: (reservationId: number) => void;
}

export const AppointmentNewPatient: React.FC<ReservationPopupProps> = ({
  isOpen,
  onClose,
  mode,
  patientData,
  reservationData,
  operatingHours,
  onSave,
  onCancel,
}) => {
  const { getUsersByHospital } = useUsersStore();
  const { hospital } = useHospitalStore();

  // 선택된 roomId에 따라 해당하는 operatingHours 찾기
  const getOperatingHoursByRoomId = (roomId: number) => {
    if (!operatingHours || operatingHours.length === 0) return null;
    return operatingHours.find((oh) => oh.appointmentRoomId === roomId) || null;
  };
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    phone: "",
    birthDate: "",
  });

  const [appointment, setAppointment] = useState<Partial<Appointment>>({
    hospitalId: 1,
    appointmentRoomId: 1,
    patientId: 0,
    appointmentTypeId: 1,
    appointmentStartTime: new Date(),
    appointmentEndTime: new Date(),
    status: 1,
    memo: "",
    platform: 1,
    isSimplePatient: false,
    excludeAutoMessage: false,
  });

  // UI용 상태 (info-panel과 동일한 구조)
  const [reservationRoom, setReservationRoom] = useState<string>("room1");
  const [reservationDoctor, setReservationDoctor] = useState<string>("");
  const [reservationType, setReservationType] = useState<string>("");
  const [reservationDate, setReservationDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [reservationMemo, setReservationMemo] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // 샘플 예약 히스토리 (실제로는 API에서 가져올 데이터)
  const [reservationHistory, setReservationHistory] = useState<Appointment[]>(
    []
  );

  // 컴포넌트 마운트/업데이트 시 데이터 설정
  useEffect(() => {
    if (isOpen) {
      if (mode === "new") {
        // 신환 예약 - 초기값 설정
        setPatientInfo({
          name: "",
          phone: "",
          birthDate: "",
        });
        setAppointment({
          hospitalId: 1,
          appointmentRoomId: 1,
          patientId: 0,
          appointmentTypeId: 1,
          appointmentStartTime: new Date(),
          appointmentEndTime: new Date(),
          status: 1,
          memo: "",
          platform: 1,
          isSimplePatient: false,
          excludeAutoMessage: false,
        });
      } else if (mode === "existing" && patientData) {
        // 기존 환자 예약 - 환자 데이터 설정
        setPatientInfo(patientData);

        if (reservationData) {
          // 기존 예약 수정
          setAppointment(reservationData);
        } else {
          // 새 예약 생성
          setAppointment({
            hospitalId: 1,
            appointmentRoomId: 1,
            patientId: 0,
            appointmentTypeId: 1,
            appointmentStartTime: new Date(),
            appointmentEndTime: new Date(),
            status: 1,
            memo: "",
            platform: 1,
            isSimplePatient: false,
            excludeAutoMessage: false,
          });
        }
      }
    }
  }, [isOpen, mode, patientData, reservationData]);

  // appointment 데이터가 변경될 때 UI 상태 동기화
  useEffect(() => {
    if (appointment) {
      // 예약실 설정
      setReservationRoom(`room${appointment.appointmentRoomId || 1}`);

      // 예약유형 설정
      const typeMap: { [key: number]: string } = {
        1: "consultation",
        2: "treatment",
        3: "checkup",
        4: "general",
      };
      setReservationType(
        typeMap[appointment.appointmentTypeId || 1] || "consultation"
      );

      // 예약날짜 설정 - 로컬 시간대 유지
      if (appointment.appointmentStartTime) {
        const date = new Date(appointment.appointmentStartTime);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        setReservationDate(`${year}-${month}-${day}`);
      }

      // 예약시간 설정
      if (appointment.appointmentStartTime) {
        const date = new Date(appointment.appointmentStartTime);
        setFromTime(
          `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
        );
      }

      // 종료시간 설정
      if (appointment.appointmentEndTime) {
        const endDate = new Date(appointment.appointmentEndTime);
        const endTimeString = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
        setToTime(endTimeString);
      }

      // 메모 설정
      setReservationMemo(appointment.memo || "");
    }
  }, [appointment]);

  if (!isOpen) return null;

  const handlePatientInfoChange = (field: keyof PatientInfo, value: string) => {
    setPatientInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAppointmentChange = (field: keyof Appointment, value: any) => {
    setAppointment((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // UI 상태 변경 핸들러들
  const handleRoomChange = (value: string) => {
    setReservationRoom(value);
    const roomId = parseInt(value.replace("room", ""));
    if (!isNaN(roomId)) {
      handleAppointmentChange("appointmentRoomId", roomId);
    }

    // 예약실 변경 시 fromTime이 있으면 toTime 업데이트
    if (fromTime) {
      const currentOperatingHours = getOperatingHoursByRoomId(roomId);

      if (currentOperatingHours?.timeSlotDuration) {
        const [hours, minutes] = fromTime.split(":").map(Number);
        const startDateTime = new Date();
        startDateTime.setHours(hours || 0, minutes || 0);

        const durationMinutes = currentOperatingHours.timeSlotDuration;
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

        const endHours = endDateTime.getHours().toString().padStart(2, "0");
        const endMinutes = endDateTime.getMinutes().toString().padStart(2, "0");
        const endTimeString = `${endHours}:${endMinutes}`;

        setToTime(endTimeString);
        // appointmentEndTime을 Date 객체로 설정
        const newEndDateTime = new Date();
        newEndDateTime.setHours(
          newEndDateTime.getHours(),
          newEndDateTime.getMinutes() + durationMinutes
        );
        handleAppointmentChange("appointmentEndTime", newEndDateTime);
      }
    }
  };

  const handleTypeChange = (value: string) => {
    setReservationType(value);
    const typeMap: { [key: string]: number } = {
      consultation: 1,
      treatment: 2,
      checkup: 3,
      general: 4,
    };
    const typeId = typeMap[value];
    if (typeId) {
      handleAppointmentChange("appointmentTypeId", typeId);
    }
  };

  const handleDateChange = (value: string) => {
    setReservationDate(value);
    if (value) {
      // 로컬 시간대 유지하여 Date 객체 생성
      const [year, month, day] = value.split("-").map(Number);
      if (year && month && day) {
        const newDateTime = new Date(year, month - 1, day); // month는 0-based
        if (appointment.appointmentStartTime) {
          const currentTime = new Date(appointment.appointmentStartTime);
          newDateTime.setHours(
            currentTime.getHours(),
            currentTime.getMinutes()
          );
        }
        handleAppointmentChange("appointmentStartTime", newDateTime);
      }
    }
  };

  const handleFromTimeChange = (value: string) => {
    setFromTime(value);
    if (value && appointment.appointmentStartTime) {
      const [hours, minutes] = value.split(":").map(Number);
      const newDateTime = new Date(appointment.appointmentStartTime);
      newDateTime.setHours(hours || 0, minutes || 0);
      handleAppointmentChange("appointmentStartTime", newDateTime);

      // 선택된 예약실의 operatingHours를 사용하여 종료 시간 자동 설정
      if (reservationRoom) {
        const roomId = parseInt(reservationRoom.replace("room", ""));
        const currentOperatingHours = getOperatingHoursByRoomId(roomId);

        if (currentOperatingHours?.timeSlotDuration) {
          const durationMinutes = currentOperatingHours.timeSlotDuration;
          const endDateTime = new Date(newDateTime);
          endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

          const endHours = endDateTime.getHours();
          const endMinutes = endDateTime.getMinutes();
          const endTimeString = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

          setToTime(endTimeString);
          // appointmentEndTime을 Date 객체로 설정
          const newEndDateTime = new Date();
          newEndDateTime.setHours(endHours, endMinutes, 0, 0);
          handleAppointmentChange("appointmentEndTime", newEndDateTime);
        }
      }
    }
  };

  const handleToTimeChange = (value: string) => {
    setToTime(value);
    if (value) {
      // appointmentEndTime을 Date 객체로 설정
      const [hours, minutes] = value.split(":").map(Number);
      const endDateTime = new Date();
      endDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      handleAppointmentChange("appointmentEndTime", endDateTime);
    }
  };

  const handleMemoChange = (value: string) => {
    setReservationMemo(value);
    handleAppointmentChange("memo", value);
  };

  const handleDoctorChange = (value: string) => {
    setReservationDoctor(value);
    const doctorId = parseInt(value);
    if (!isNaN(doctorId)) {
      handleAppointmentChange("patientId", doctorId);
    }
  };

  const handleSave = () => {
    // 유효성 검사
    if (!patientInfo.name.trim()) {
      alert("환자명을 입력해주세요.");
      return;
    }
    if (!patientInfo.phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }
    if (!appointment.appointmentStartTime) {
      alert("예약 날짜와 시간을 선택해주세요.");
      return;
    }

    // Appointment 객체 생성
    const fullAppointment = {
      id: 0, // 새 예약이므로 0
      hospitalId: appointment.hospitalId || 1,
      appointmentRoomId: appointment.appointmentRoomId || 1,
      patientId: appointment.patientId || 0,
      appointmentTypeId: appointment.appointmentTypeId || 1,
      appointmentStartTime: appointment.appointmentStartTime || new Date(),
      appointmentEndTime: appointment.appointmentEndTime || new Date(),
      status: appointment.status || 1,
      memo: appointment.memo || "",
      platform: appointment.platform || 1,
      isSimplePatient: appointment.isSimplePatient || false,
      excludeAutoMessage: appointment.excludeAutoMessage || false,
      doctorId: 0, // 기본값
      receptionistId: 0, // 기본값
      temporaryPatient: mode === "new" && patientInfo.name && patientInfo.phone
        ? {
          name: patientInfo.name,
          phone1: patientInfo.phone,
          birthDate: patientInfo.birthDate || "",
        }
        : null,
      createId: 0, // 기본값
      createDateTime: new Date(),
      updateId: null,
      updateDateTime: null,
      appointmentType: appointment.appointmentType || {} as AppointmentTypes,
      patient: appointment.patient || {} as Patient,
      doctor: appointment.doctor || {} as DoctorType,
      appointmentRoom: appointment.appointmentRoom || {} as AppointmentRooms,
      externalPlatform: appointment.externalPlatform || null,
    } as Appointment;
    onSave(fullAppointment);
    onClose();
  };
  const handleCancelReservation = () => {
    if (reservationData) {
      setShowCancelConfirm(true);
    }
  };

  const handleCancelConfirm = () => {
    if (reservationData) {
      onCancel && onCancel(reservationData.id);
      setShowCancelConfirm(false);
      onClose();
    }
  };

  const handleCancelCancel = () => {
    setShowCancelConfirm(false);
  };

  const getStatusBadge = (status: number) => {
    const statusConfig = {
      1: { label: "예약", className: "bg-blue-100 text-blue-800" },
      2: { label: "완료", className: "bg-green-100 text-green-800" },
      3: { label: "취소", className: "bg-red-100 text-red-800" },
      4: { label: "노쇼", className: "bg-gray-100 text-gray-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig[1];
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[370px] h-[880px] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-end p-2 ">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="pb-4 space-y-6 pt-0 pl-6 pr-6">
          {/* 환자 정보 */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">환자 정보</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
                  환자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={patientInfo.name}
                  onChange={(e) =>
                    handlePatientInfoChange("name", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="환자명을 입력하세요"
                  disabled={mode === "existing"}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={patientInfo.phone}
                  onChange={(e) =>
                    handlePatientInfoChange("phone", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="전화번호를 입력하세요"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
                  생년월일
                </label>
                <input
                  type="date"
                  value={patientInfo.birthDate}
                  onChange={(e) =>
                    handlePatientInfoChange("birthDate", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 예약 히스토리 */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">예약 내역</h3>
            </div>

            <div className="border border-gray-200 rounded max-h-40 overflow-y-auto">
              {reservationHistory.length > 0 ? (
                reservationHistory.map((history) => (
                  <div
                    key={history.id}
                    className="p-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">
                            {history.appointmentStartTime.toLocaleDateString()}{" "}
                            {history.appointmentStartTime.toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          {getStatusBadge(history.status)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {history.temporaryPatient?.name} · {history.temporaryPatient?.phone1}
                          {history.memo && ` · ${history.memo}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500 text-sm">
                  예약 내역이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 예약 정보 폼 */}
          <div className="space-y-4">
            <h3 className="text-md font-semibold">예약 정보</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="w-[60px] text-sm font-medium text-gray-700">
                  예약실
                </label>
                <Select
                  value={reservationRoom}
                  onValueChange={handleRoomChange}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="예약실 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room1">예약실 1</SelectItem>
                    <SelectItem value="room2">예약실 2</SelectItem>
                    <SelectItem value="room3">예약실 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-[60px] text-sm font-medium text-gray-700">
                  진료의
                </label>
                <Select
                  value={reservationDoctor}
                  onValueChange={handleDoctorChange}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="진료의 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospital?.id &&
                      getUsersByHospital(hospital.id.toString()).map((user) => (
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
                  value={reservationType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="예약유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">상담</SelectItem>
                    <SelectItem value="treatment">치료</SelectItem>
                    <SelectItem value="checkup">검진</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <label className="w-[60px] text-sm font-medium text-gray-700">
                  예약날짜
                </label>
                <div className="relative flex-1">
                  <Input
                    value={reservationDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleDateChange(e.target.value)
                    }
                    placeholder="날짜 선택"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    readOnly
                  />
                  {showDatePicker && (
                    <div className="absolute top-full w-[250px] right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg p-3">
                      <Calendar
                        className="w-full border-0 "
                        tileClassName="text-sm p-2"
                        formatShortWeekday={(locale, date) =>
                          ["일", "월", "화", "수", "목", "금", "토"][
                          date.getDay()
                          ] || "일"
                        }
                        formatDay={(locale, date) => date.getDate().toString()}
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            // 로컬 시간대 유지
                            const year = value.getFullYear();
                            const month = (value.getMonth() + 1)
                              .toString()
                              .padStart(2, "0");
                            const day = value
                              .getDate()
                              .toString()
                              .padStart(2, "0");
                            handleDateChange(`${year}-${month}-${day}`);
                            setShowDatePicker(false);
                          }
                        }}
                        value={
                          reservationDate
                            ? new Date(reservationDate)
                            : undefined
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-[125px] text-sm font-medium text-gray-700">
                예약시간
              </label>
              <div className="flex gap-3 flex-1">
                <Input
                  type="time"
                  value={fromTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleFromTimeChange(e.target.value)
                  }
                  className="w-[115px]"
                />
                <span className="flex items-center text-gray-500">~</span>
                <Input
                  type="time"
                  value={toTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleToTimeChange(e.target.value)
                  }
                  className="w-[115px]"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <label className="w-[60px] text-sm font-medium text-gray-700 pt-2">
                예약내용
              </label>
              <textarea
                value={reservationMemo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleMemoChange(e.target.value)
                }
                placeholder="예약 내용을 입력하세요"
                rows={4}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-2 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCancelReservation}
                disabled={mode !== "existing" || !reservationData}
                className={`flex-1 px-4 py-2 border rounded ${mode === "existing" && reservationData
                  ? "text-red-600 border-red-300 hover:bg-red-50"
                  : "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                  }`}
              >
                예약취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                예약
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 취소 확인 팝업 */}
      <MyPopupYesNo
        isOpen={showCancelConfirm}
        onCloseAction={handleCancelCancel}
        onConfirmAction={handleCancelConfirm}
        title="예약 취소 확인"
        message="정말 예약을 취소하시겠습니까?"
        confirmText="취소"
        cancelText="돌아가기"
      />
    </div>
  );
};
