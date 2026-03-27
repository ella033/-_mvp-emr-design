import { useState, useEffect } from "react";
import { InfoIcon } from "lucide-react";
import type { UserManager } from "@/types/user-types";
import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import {
  type AppointmentRoomOperatingHoursBase,
  type CreateAppointmentRoomOperatingHourRequest,
} from "@/types/appointments/appointment-room-operating-hours";
import { useHospitalStore } from "@/store/hospital-store";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import { DayOfWeek } from "@/constants/common/common-enum";
import { DAY_OF_WEEK_MAP, WEEK_DAYS } from "@/constants/constants";
import type {
  CreateAppointmentRoomRequest,
  UpdateAppointmentRoomRequest,
} from "@/types/appointments/appointment-rooms";
import ListTimePicker from "@/components/ui/list-time-picker";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { MyTooltip } from "@/components/yjg/my-tooltip";

interface RoomFormData {
  // AppointmentRooms의 모든 필드
  id?: number;
  hospitalId: number;
  facilityId: number | null;
  userId: number;
  name: string;
  displayName: string;
  colorCode: string;
  defaultDurationMinutes: number;
  sortOrder: number;
  isVirtual: boolean;
  isActive: boolean;
  description: string;
  timeSlotDuration: number;
  maxAppointmentsPerSlot: number;
  bufferTimeMinutes: number;
  allowOverlap: boolean;

  // UI용 필드 (폼에서 사용)
  startDate: string; // 진료시작일
  endDate: string; // 진료종료일
  workingDays: number[]; // 선택된 요일들 (0: 일요일, 1: 월요일, 2: 화요일, 3: 수요일, 4: 목요일, 5: 금요일, 6: 토요일)
  workingTimes: { [key: number]: { fromTime: string; toTime: string } }; // 각 요일별 시간
  lunchTimes: { [key: number]: { fromTime: string; toTime: string } }; // 각 요일별 점심시간

  // 외부 플랫폼 설정 (UI용)
  externalPlatforms: {
    ddocdoc: boolean;
    naver: boolean;
  };
}

export const AddReservationRooms: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  roomData?: RoomFormData;
  doctors: UserManager[];
  operatingHours?: any[];
  onSave: (data: RoomFormData) => void;
  onDelete?: (id: number) => void;
}> = ({
  isOpen,
  onClose,
  isEdit = false,
  roomData,
  doctors,
  operatingHours,
  onSave,
  onDelete,
}) => {
    const { hospital } = useHospitalStore();
    const { setAppointmentRooms } = useAppointmentRoomsStore();

    const today = new Date();
    const maxYear = new Date("9999-12-31");

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const parseDate = (dateValue: any): string => {
      if (!dateValue) return "";
      if (typeof dateValue === "string") {
        // 이미 YYYY-MM-DD 형식인 경우
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // 9999-12-31이면 빈값으로 반환
          if (dateValue === "9999-12-31") {
            return "";
          }
          return dateValue;
        }
        // 다른 형식인 경우 Date 객체로 변환 시도
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            const formatted = formatDate(date);
            // 9999-12-31이면 빈값으로 반환
            if (formatted === "9999-12-31") {
              return "";
            }
            return formatted;
          }
        } catch (e) {
          console.warn("Date parsing failed:", dateValue);
        }
      }
      return "";
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showValidationAlert, setShowValidationAlert] = useState(false);
    const [showSaveErrorAlert, setShowSaveErrorAlert] = useState(false);
    const [showDeleteErrorAlert, setShowDeleteErrorAlert] = useState(false);
    const [showNoRoomAlert, setShowNoRoomAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [formData, setFormData] = useState<RoomFormData>({
      // AppointmentRooms의 모든 필드
      id: roomData?.id || 0,
      hospitalId: hospital?.id || 0,
      facilityId: null,
      userId: 0,
      name: "",
      displayName: "",
      colorCode: "",
      defaultDurationMinutes: 15,
      sortOrder: 1,
      isVirtual: true,
      isActive: true,
      description: "",
      timeSlotDuration: 15,
      maxAppointmentsPerSlot: 3,
      bufferTimeMinutes: 0,
      allowOverlap: false,

      // UI용 필드
      startDate: formatDate(today),
      endDate: "", // 빈값으로 초기화 (저장 시 9999-12-31로 설정)
      workingDays: [],
      workingTimes: {},
      lunchTimes: {},
      externalPlatforms: {
        ddocdoc: false,
        naver: false,
      },
    });

    const intervalOptions = [10, 15, 20, 30, 60];
    const maxReservationOptions = [1, 2, 3, 4, 5];
    void DayOfWeek;

    useEffect(() => {
      if (isOpen) {
        if (isEdit && roomData) {
          // roomData의 모든 필드가 정의된 값을 가지도록 보장
          setFormData({
            // AppointmentRooms의 모든 필드
            id: roomData.id || 0,
            hospitalId: roomData.hospitalId || hospital?.id || 0,
            facilityId: roomData.facilityId || null,
            userId: roomData.userId || 0,
            name: roomData.name || "",
            displayName: roomData.displayName || "",
            colorCode: roomData.colorCode || "",
            defaultDurationMinutes: roomData.defaultDurationMinutes || 15,
            sortOrder: roomData.sortOrder || 1,
            isVirtual: roomData.isVirtual ?? true,
            isActive: roomData.isActive ?? true,
            description: roomData.description || "",
            timeSlotDuration: roomData.timeSlotDuration || 15,
            maxAppointmentsPerSlot: roomData.maxAppointmentsPerSlot || 3,
            bufferTimeMinutes: roomData.bufferTimeMinutes || 0,
            allowOverlap: roomData.allowOverlap ?? false,

            // UI용 필드
            startDate: parseDate(roomData.startDate),
            endDate: parseDate(roomData.endDate),
            workingDays: roomData.workingDays || [],
            workingTimes: roomData.workingTimes
              ? Object.keys(roomData.workingTimes).reduce(
                (acc, day) => {
                  const dayNum = parseInt(day);
                  acc[dayNum] = {
                    fromTime:
                      roomData.workingTimes[dayNum]?.fromTime || "09:00",
                    toTime: roomData.workingTimes[dayNum]?.toTime || "18:00",
                  };
                  return acc;
                },
                {} as { [key: number]: { fromTime: string; toTime: string } }
              )
              : {},
            lunchTimes: roomData.lunchTimes || {},
            externalPlatforms: (() => {
              const ep = roomData.externalPlatforms;
              if (ep && typeof ep === "object" && !Array.isArray(ep)) {
                return {
                  ddocdoc: ep.ddocdoc ?? false,
                  naver: ep.naver ?? false,
                };
              }
              const list = (roomData as any).externalPlatforms;
              if (Array.isArray(list)) {
                const codes = list
                  .map((p: { platformCode?: string }) => p?.platformCode)
                  .filter(Boolean);
                return {
                  ddocdoc: codes.includes("ddocdoc"),
                  naver: codes.includes("naver"),
                };
              }
              return { ddocdoc: false, naver: false };
            })(),
          });
        } else {
          // 신규 생성 시 hospital.operatingHours를 기반으로 기본값 설정
          let defaultWorkingDays: number[] = [];
          let defaultWorkingTimes: {
            [key: number]: { fromTime: string; toTime: string };
          } = {};
          let defaultTimeSlotDuration = 15;
          if (operatingHours && operatingHours.length > 0) {
            // operatingHours에서 요일과 시간 정보 추출
            defaultWorkingDays = [
              ...new Set(operatingHours.map((oh) => oh.dayOfWeek)),
            ];
            operatingHours.forEach((oh) => {
              defaultWorkingTimes[oh.dayOfWeek] = {
                fromTime: oh.startTime || "07:00",
                toTime: oh.endTime || "21:00",
              };
              // operatingHours의 timeSlotDuration은 무시하고 항상 15 사용
            });
          }

          setFormData({
            // AppointmentRooms의 모든 필드
            hospitalId: hospital?.id || 0,
            facilityId: null,
            userId: 0,
            name: "",
            displayName: "",
            colorCode: "",
            defaultDurationMinutes: 15,
            sortOrder: 1,
            isVirtual: true,
            isActive: true,
            description: "",
            timeSlotDuration: defaultTimeSlotDuration,
            maxAppointmentsPerSlot: 3,
            bufferTimeMinutes: 0,
            allowOverlap: false,

            // UI용 필드
            startDate: formatDate(today),
            endDate: "", // 빈값으로 초기화 (저장 시 9999-12-31로 설정)
            workingDays: defaultWorkingDays,
            workingTimes: defaultWorkingTimes,
            lunchTimes: {},
            externalPlatforms: {
              ddocdoc: false,
              naver: false,
            },
          });
        }
      }
    }, [isOpen, isEdit, roomData, hospital?.id, operatingHours]);

    const handleDayChange = (day: number, checked: boolean) => {
      let newWorkingDays;
      let newWorkingTimes = { ...formData.workingTimes };

      if (checked) {
        newWorkingDays = [...formData.workingDays, day];
        const existingTime = operatingHours?.find((oh) => oh.dayOfWeek === day);
        newWorkingTimes[day] = existingTime
          ? {
            fromTime: existingTime.startTime || "07:00",
            toTime: existingTime.endTime || "21:00",
          }
          : { fromTime: "07:00", toTime: "21:00" };
      } else {
        newWorkingDays = formData.workingDays.filter((d) => d !== day);
        // 제거된 요일의 시간 설정 삭제
        delete newWorkingTimes[day];
      }

      setFormData({
        ...formData,
        workingDays: newWorkingDays,
        workingTimes: newWorkingTimes,
      });
    };

    // "HH:mm" 문자열을 분 단위로 변환
    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(":").map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };
    // 분에 duration을 더해 "HH:mm" 반환
    const addMinutesToTime = (time: string, minutesToAdd: number): string => {
      const total = timeToMinutes(time) + minutesToAdd;
      const h = Math.floor(total / 60) % 24;
      const m = total % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    const handleTimeChange = (
      day: number,
      field: "fromTime" | "toTime",
      value: string
    ) => {
      const currentFrom =
        formData.workingTimes[day]?.fromTime || "07:00";
      const currentTo = formData.workingTimes[day]?.toTime || "21:00";
      const slotMin = formData.timeSlotDuration;

      let newFrom = currentFrom;
      let newTo = currentTo;

      if (field === "fromTime") {
        newFrom = value;
        // fromTime 변경 시 toTime이 fromTime 이하가 되면 toTime을 fromTime + 1슬롯으로
        if (timeToMinutes(value) >= timeToMinutes(currentTo)) {
          newTo = addMinutesToTime(value, slotMin);
        }
      } else {
        // toTime은 fromTime보다 항상 커야 함
        if (timeToMinutes(value) <= timeToMinutes(currentFrom)) {
          newTo = addMinutesToTime(currentFrom, slotMin);
        } else {
          newTo = value;
        }
      }

      setFormData({
        ...formData,
        workingTimes: {
          ...formData.workingTimes,
          [day]: {
            fromTime: newFrom,
            toTime: newTo,
          },
        },
      });
    };

    const handleSave = async () => {
      // 유효성 검사
      if (!formData.name.trim()) {
        setAlertMessage("예약실명을 입력해주세요.");
        setShowValidationAlert(true);
        return;
      }
      if (!formData.startDate) {
        setAlertMessage("진료시작일을 입력해주세요.");
        setShowValidationAlert(true);
        return;
      }

      if (formData.workingDays.length === 0) {
        setAlertMessage("진료 요일을 선택해주세요.");
        setShowValidationAlert(true);
        return;
      }

      const hasInvalidTime = formData.workingDays.some((day) => {
        const from = formData.workingTimes[day]?.fromTime ?? "07:00";
        const to = formData.workingTimes[day]?.toTime ?? "21:00";
        return timeToMinutes(from) >= timeToMinutes(to);
      });
      if (hasInvalidTime) {
        setAlertMessage("진료시간을 다시 설정해 주세요.");
        setShowValidationAlert(true);
        return;
      }

      try {
        let roomId: number;

        if (isEdit && formData.id !== 0) {
          // 수정: UpdateAppointmentRoomWithOperatingHoursRequest 사용
          const operatingHoursData: AppointmentRoomOperatingHoursBase[] =
            formData.workingDays.map((day) => {
              return {
                dayOfWeek: day,
                startTime: formData.workingTimes[day]?.fromTime || "09:00",
                endTime: formData.workingTimes[day]?.toTime || "18:00",
                timeSlotDuration: formData.timeSlotDuration,
                isActive: true,
                breakTimes: [],
              };
            });

          // 진료종료일이 빈값이면 9999-12-31로 설정
          const endDateValue = formData.endDate || formatDate(maxYear);

          const externalPlatformCodes = [
            ...(formData.externalPlatforms.ddocdoc ? ["ddocdoc"] : []),
            ...(formData.externalPlatforms.naver ? ["naver"] : []),
          ];

          const updateData: UpdateAppointmentRoomRequest = {
            hospitalId: formData.hospitalId,
            facilityId: formData.facilityId,
            name: formData.name,
            displayName: formData.displayName,
            colorCode: formData.colorCode,
            defaultDurationMinutes: formData.defaultDurationMinutes,
            sortOrder: formData.sortOrder,
            isVirtual: formData.isVirtual,
            isActive: formData.isActive,
            description: formData.description,
            timeSlotDuration: formData.timeSlotDuration,
            maxAppointmentsPerSlot: formData.maxAppointmentsPerSlot,
            bufferTimeMinutes: formData.bufferTimeMinutes,
            allowOverlap: formData.allowOverlap,
            operationStartDate: new Date(formData.startDate),
            operationEndDate: new Date(endDateValue),
            operatingHours: operatingHoursData,
            externalPlatformCodes,
          };

          // 진료의가 0이 아니면 userId 포함 (선택사항)

          updateData.userId = formData.userId ? formData.userId : null;
          console.log('[addReservationRooms] updateData:', updateData);

          const updatedRoom = await AppointmentRoomsService.updateAppointmentRoom(
            formData.id!,
            updateData
          );

          roomId = updatedRoom.id;

          // Store 업데이트: 기존 예약실 목록에서 해당 예약실을 제거하고 업데이트된 목록으로 교체
          const currentRooms =
            await AppointmentRoomsService.getAppointmentRooms();
          setAppointmentRooms(currentRooms);
        } else {
          // 신규 생성: createAppointmentRoomWithOperatingHours 사용
          const operatingHoursData: CreateAppointmentRoomOperatingHourRequest[] =
            formData.workingDays.map((day) => {
              return {
                dayOfWeek: day,
                startTime: formData.workingTimes[day]?.fromTime || "09:00",
                endTime: formData.workingTimes[day]?.toTime || "18:00",
                timeSlotDuration: formData.timeSlotDuration,
                isActive: true,
                breakTimes: [],
              };
            });

          // 진료종료일이 빈값이면 9999-12-31로 설정
          const endDateValue = formData.endDate || formatDate(maxYear);

          const externalPlatformCodes = [
            ...(formData.externalPlatforms.ddocdoc ? ["ddocdoc"] : []),
            ...(formData.externalPlatforms.naver ? ["naver"] : []),
          ];

          const createData: CreateAppointmentRoomRequest = {
            hospitalId: formData.hospitalId,
            facilityId: formData.facilityId,
            userId: formData.userId ? formData.userId : null,
            name: formData.name,
            displayName: formData.displayName,
            colorCode: formData.colorCode,
            defaultDurationMinutes: formData.defaultDurationMinutes,
            sortOrder: formData.sortOrder,
            isVirtual: formData.isVirtual,
            isActive: formData.isActive,
            description: formData.description,
            timeSlotDuration: formData.timeSlotDuration,
            maxAppointmentsPerSlot: formData.maxAppointmentsPerSlot,
            bufferTimeMinutes: formData.bufferTimeMinutes,
            allowOverlap: formData.allowOverlap,
            operationStartDate: new Date(formData.startDate),
            operationEndDate: new Date(endDateValue),
            operatingHours: operatingHoursData,
            externalPlatformCodes,
          };

          const createdRoom =
            await AppointmentRoomsService.createAppointmentRoom(createData);
          roomId = createdRoom.id;
          console.log("예약실 생성 완료:", createdRoom);

          // Store 업데이트: 새로운 예약실 목록을 가져와서 store에 설정
          const currentRooms =
            await AppointmentRoomsService.getAppointmentRooms();
          setAppointmentRooms(currentRooms);
        }

        onSave(formData);
        onClose();
      } catch (error) {
        console.error("예약실 저장 실패:", error);
        setAlertMessage("예약실 저장에 실패했습니다.");
        setShowSaveErrorAlert(true);
      }
    };

    const handleDelete = async () => {
      if (!formData.id) {
        setAlertMessage("삭제할 예약실이 없습니다.");
        setShowNoRoomAlert(true);
        return;
      }

      setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
      try {
        await AppointmentRoomsService.deleteAppointmentRoom(formData.id!);
        const currentRooms = await AppointmentRoomsService.getAppointmentRooms();
        setAppointmentRooms(currentRooms);

        if (onDelete) {
          onDelete(formData.id!);
        }
        setShowDeleteConfirm(false);
        onClose();
      } catch (error) {
        console.error("예약실 삭제 실패:", error);
        setAlertMessage("예약실 삭제에 실패했습니다.");
        setShowDeleteErrorAlert(true);
      }
    };

    const handleDeleteCancel = () => {
      setShowDeleteConfirm(false);
    };

    const handleValidationAlertClose = () => {
      setShowValidationAlert(false);
    };

    const handleSaveErrorAlertClose = () => {
      setShowSaveErrorAlert(false);
    };

    const handleDeleteErrorAlertClose = () => {
      setShowDeleteErrorAlert(false);
    };

    const handleNoRoomAlertClose = () => {
      setShowNoRoomAlert(false);
    };

    return (
      <>
        {/* 콘텐츠 */}
        <div className="p-6 space-y-6 overflow-y-auto w-[550px]" style={{ maxHeight: "calc(80vh - 120px)" }}>
          {/* 첫 번째 div */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예약실명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    displayName: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="예약실명을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                진료의
              </label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={0}>진료의를 선택하세요</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 두 번째 div */}
          <div className="space-y-4">
            {/* 진료기간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  진료시작일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  진료종료일
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* 진료 요일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                진료 요일 <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                {WEEK_DAYS.map((day) => {
                  const isSelected = formData.workingDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => handleDayChange(day.key, !isSelected)}
                      className={`
                        px-3 py-2 rounded border text-sm font-medium transition-colors
                        ${isSelected
                          ? "bg-[var(--violet-1)] text-[var(--main-color)] border-[var(--violet-1)]"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-[var(--violet-1-hover)] hover:text-[var(--main-color)] hover:border-[var(--violet-1-hover)]"
                        }
                      `}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 진료 시간 */}
            {formData.workingDays.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  진료 시간 <span className="text-red-500">*</span>
                </label>
                <div
                  className="border border-gray-300 rounded p-4 space-y-3 overflow-y-auto"
                  style={{ height: "280px" }}
                >
                  {formData.workingDays
                    .sort((a, b) => {
                      const aIndex = WEEK_DAYS.findIndex((d) => d.key === a);
                      const bIndex = WEEK_DAYS.findIndex((d) => d.key === b);
                      return aIndex - bIndex;
                    })
                    .map((day) => {
                      const dayLabel = WEEK_DAYS.find(
                        (d) => d.key === day
                      )?.label;
                      return (
                        <div key={day} className="flex items-center space-x-3">
                          <span className="w-6 text-sm font-medium">
                            {dayLabel}
                          </span>
                          <ListTimePicker
                            className="w-[100px]"
                            value={
                              formData.workingTimes[day]?.fromTime || "09:00"
                            }
                            onChange={(value) =>
                              handleTimeChange(day, "fromTime", value)
                            }
                            fromTime="07:00"
                            toTime="21:00"
                            usePortal
                          />
                          <span className="text-gray-500">~</span>
                          <ListTimePicker
                            className="w-[100px]"
                            value={
                              formData.workingTimes[day]?.toTime || "18:00"
                            }
                            onChange={(value) =>
                              handleTimeChange(day, "toTime", value)
                            }
                            fromTime={
                              formData.workingTimes[day]?.fromTime || "07:00"
                            }
                            toTime="21:00"
                            timeDuration={formData.timeSlotDuration}
                            usePortal
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 예약 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예약 간격 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.timeSlotDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      timeSlotDuration: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {intervalOptions.map((interval) => (
                    <option key={interval} value={interval}>
                      {interval}분
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  예약 건수 <span className="text-red-500">*</span>
                  <MyTooltip content="예약 간격당 최대 예약 건수를 선택하세요">
                    <InfoIcon className="h-4 w-4 text-gray-500 cursor-help" />
                  </MyTooltip>
                </label>
                <select
                  value={formData.maxAppointmentsPerSlot}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAppointmentsPerSlot: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  {maxReservationOptions.map((count) => (
                    <option key={count} value={count}>
                      {count}건
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 외부 플랫폼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">
                외부 플랫폼 예약사용
              </label>
              <div className="flex space-x-6">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">똑닥</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.externalPlatforms.ddocdoc}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          externalPlatforms: {
                            ...formData.externalPlatforms,
                            ddocdoc: e.target.checked,
                          },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none  peer-focus:ring-[var(--main-color)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--main-color)]"></div>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">네이버</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.externalPlatforms.naver}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          externalPlatforms: {
                            ...formData.externalPlatforms,
                            naver: e.target.checked,
                          },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-[var(--main-color)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--main-color)]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-2 pb-0 border-t border-[var(--border-secondary)]">
          <div>
            {isEdit && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-[var(--main-color)] border border-[var(--border-1)] rounded hover:bg-red-50"
              >
                삭제
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-6 py-1 text-[var(--main-color)] border border-[var(--border-1)] rounded hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-1 bg-[var(--main-color)] text-white rounded hover:bg-[var(--main-color-hover)]"
            >
              저장
            </button>
          </div>
        </div>

        {/* 삭제 확인 팝업 */}
        <MyPopupYesNo
          isOpen={showDeleteConfirm}
          onCloseAction={handleDeleteCancel}
          onConfirmAction={handleDeleteConfirm}
          title="예약실 삭제 확인"
          message="정말 삭제하시겠습니까?"
          confirmText="삭제"
          cancelText="취소"
        />

        {/* 유효성 검사 알럿 */}
        <MyPopupYesNo
          isOpen={showValidationAlert}
          onCloseAction={handleValidationAlertClose}
          onConfirmAction={handleValidationAlertClose}
          title="입력 오류"
          message={alertMessage}
          confirmText="확인"
          cancelText=""
        />

        {/* 저장 실패 알럿 */}
        <MyPopupYesNo
          isOpen={showSaveErrorAlert}
          onCloseAction={handleSaveErrorAlertClose}
          onConfirmAction={handleSaveErrorAlertClose}
          title="저장 실패"
          message={alertMessage}
          confirmText="확인"
          cancelText=""
        />

        {/* 삭제 실패 알럿 */}
        <MyPopupYesNo
          isOpen={showDeleteErrorAlert}
          onCloseAction={handleDeleteErrorAlertClose}
          onConfirmAction={handleDeleteErrorAlertClose}
          title="삭제 실패"
          message={alertMessage}
          confirmText="확인"
          cancelText=""
        />

        {/* 예약실 없음 알럿 */}
        <MyPopupYesNo
          isOpen={showNoRoomAlert}
          onCloseAction={handleNoRoomAlertClose}
          onConfirmAction={handleNoRoomAlertClose}
          title="알림"
          message={alertMessage}
          confirmText="확인"
          cancelText=""
        />
      </>
    );
  };
