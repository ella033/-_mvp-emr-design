import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { HospitalsService } from "@/services/hospitals-service";
import { useQueryClient } from "@tanstack/react-query";
import ListTimePicker from "@/components/ui/list-time-picker";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import CheckAppointmentRoomOperatingHoursWarningList from "./check-appointment-room-operating-hours-warning-list";
import {
  convertSchedulesToOperatingHoursData,
  convertOperatingHoursToSchedules,
  getRoomOperatingHourWarnings,
  parseTimeToMinutes,
  type ScheduleItem,
  type BreakTimes,
} from "@/services/reservation/settings/reservation-clinic-settings-service";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import { DayOfWeek } from "@/constants/common/common-enum";
import { WEEK_DAYS } from "@/constants/constants";

interface ScheduleComponentProps {
  schedule: ScheduleItem;
  onUpdate: (schedule: ScheduleItem) => void;
  onDelete: () => void;
  allSchedules?: ScheduleItem[];
}

const ScheduleComponent: React.FC<ScheduleComponentProps> = ({
  schedule,
  onUpdate,
  onDelete,
  allSchedules = [],
}) => {
  const handleDayToggle = (day: number) => {
    const isCurrentlySelected = schedule.clinicSchedule.dayOfWeek.includes(day);

    if (isCurrentlySelected) {
      const newDayOfWeek = schedule.clinicSchedule.dayOfWeek.filter(
        (d) => d !== day
      );
      onUpdate({
        ...schedule,
        clinicSchedule: {
          ...schedule.clinicSchedule,
          dayOfWeek: newDayOfWeek,
        },
      });

      if (newDayOfWeek.length === 0) {
        onDelete();
      }
    } else {
      const newDayOfWeek = [...schedule.clinicSchedule.dayOfWeek, day];
      onUpdate({
        ...schedule,
        clinicSchedule: {
          ...schedule.clinicSchedule,
          dayOfWeek: newDayOfWeek,
        },
      });
    }
  };

  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const addMinutesToTime = (time: string, minutesToAdd: number): string => {
    const total = timeToMinutes(time) + minutesToAdd;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const slotMin = schedule.clinicSchedule.timeSlotDuration ?? 15;

  const handleWorkTimeChange = (
    field: "startTime" | "endTime",
    value: string
  ) => {
    const currentStart = schedule.clinicSchedule.startTime;
    const currentEnd = schedule.clinicSchedule.endTime;

    let newStart = currentStart;
    let newEnd = currentEnd;

    if (field === "startTime") {
      newStart = value;
      if (timeToMinutes(value) >= timeToMinutes(currentEnd)) {
        newEnd = addMinutesToTime(value, slotMin);
      }
    } else {
      if (timeToMinutes(value) <= timeToMinutes(currentStart)) {
        newEnd = addMinutesToTime(currentStart, slotMin);
      } else {
        newEnd = value;
      }
    }

    onUpdate({
      ...schedule,
      clinicSchedule: {
        ...schedule.clinicSchedule,
        startTime: newStart,
        endTime: newEnd,
      },
    });
  };

  const addBreakTime = () => {
    const maxId =
      schedule.clinicSchedule.breakTimes.length > 0
        ? Math.max(...schedule.clinicSchedule.breakTimes.map((bt) => bt.id))
        : 0;

    const newBreakTime: BreakTimes = {
      id: maxId + 1,
      breakStart: "12:00",
      breakEnd: "13:00",
      breakName: "",
      sortOrder: maxId + 1,
      isActive: true,
    };
    onUpdate({
      ...schedule,
      clinicSchedule: {
        ...schedule.clinicSchedule,
        breakTimes: [...schedule.clinicSchedule.breakTimes, newBreakTime],
      },
    });
  };

  const updateBreakTime = (
    breakId: number,
    field: "breakStart" | "breakEnd",
    value: string
  ) => {
    const breakSlotMin = 15;
    const target = schedule.clinicSchedule.breakTimes.find(
      (bt) => bt.id === breakId
    );
    if (!target) return;

    const currentStart = target.breakStart;
    const currentEnd = target.breakEnd;

    let newStart = currentStart;
    let newEnd = currentEnd;

    if (field === "breakStart") {
      newStart = value;
      if (timeToMinutes(value) >= timeToMinutes(currentEnd)) {
        newEnd = addMinutesToTime(value, breakSlotMin);
      }
    } else {
      if (timeToMinutes(value) <= timeToMinutes(currentStart)) {
        newEnd = addMinutesToTime(currentStart, breakSlotMin);
      } else {
        newEnd = value;
      }
    }

    const updatedBreakTimes = schedule.clinicSchedule.breakTimes.map((bt) =>
      bt.id === breakId ? { ...bt, breakStart: newStart, breakEnd: newEnd } : bt
    );
    onUpdate({
      ...schedule,
      clinicSchedule: {
        ...schedule.clinicSchedule,
        breakTimes: updatedBreakTimes,
      },
    });
  };

  const removeBreakTime = (breakId: number) => {
    onUpdate({
      ...schedule,
      clinicSchedule: {
        ...schedule.clinicSchedule,
        breakTimes: schedule.clinicSchedule.breakTimes.filter(
          (bt) => bt.id !== breakId
        ),
      },
    });
  };

  return (
    <div className="p-4 mb-4">
      <div className="mb-4 flex items-center">
        <label className="w-24 text-sm text-[var(--main-color)]">요일</label>
        <div className="flex space-x-2">
          {WEEK_DAYS.map((day) => {
            const isUsedByOtherSchedule = allSchedules
              .filter((s) => s.id !== schedule.id)
              .some((s) => s.clinicSchedule.dayOfWeek.includes(day.key));

            const isSelectedInCurrentSchedule =
              schedule.clinicSchedule.dayOfWeek.includes(day.key);

            const isDisabled =
              isUsedByOtherSchedule && !isSelectedInCurrentSchedule;

            return (
              <button
                key={day.key}
                onClick={() => !isDisabled && handleDayToggle(day.key)}
                disabled={isDisabled}
                className={`
                  px-3 py-2 rounded border text-sm font-medium transition-colors
                  ${isSelectedInCurrentSchedule
                    ? "bg-[var(--violet-1)] text-[var(--main-color)] border-[var(--violet-1)]"
                    : isDisabled
                      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
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

      <div className="mb-4 flex items-center">
        <label className="w-24 text-sm text-[var(--main-color)]">
          진료시간
        </label>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <ListTimePicker
              value={schedule.clinicSchedule.startTime}
              onChange={(value) => handleWorkTimeChange("startTime", value)}
              fromTime="07:00"
              toTime="21:00"
            />
          </div>
          <span className="text-gray-500">~</span>
          <div className="relative">
            <ListTimePicker
              value={schedule.clinicSchedule.endTime}
              onChange={(value) => handleWorkTimeChange("endTime", value)}
              fromTime={schedule.clinicSchedule.startTime}
              toTime="21:00"
              timeDuration={slotMin}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-start">
        <label className="w-24 text-sm text-[var(--main-color)] pt-2">
          휴게시간
        </label>
        <div className="flex-1">
          {schedule.clinicSchedule.breakTimes.length > 0 ? (
            <div className="space-y-2">
              {schedule.clinicSchedule.breakTimes.map((breakTime) => (
                <div key={breakTime.id} className="flex items-center space-x-2">
                  <div className="relative">
                    <ListTimePicker
                      value={breakTime.breakStart}
                      onChange={(value) =>
                        updateBreakTime(breakTime.id, "breakStart", value)
                      }
                      fromTime="07:00"
                      toTime="21:00"
                    />
                  </div>
                  <span className="text-gray-500">~</span>
                  <div className="relative">
                    <ListTimePicker
                      value={breakTime.breakEnd}
                      onChange={(value) =>
                        updateBreakTime(breakTime.id, "breakEnd", value)
                      }
                      fromTime={breakTime.breakStart}
                      toTime="21:00"
                      timeDuration={15}
                    />
                  </div>
                  <button
                    onClick={() => removeBreakTime(breakTime.id)}
                    className="text-sm font-bold bg-[var(--bg-main)] border border-[var(--border-1)] text-[var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1)]"
                  >
                    - 삭제
                  </button>
                  <button
                    onClick={addBreakTime}
                    className="text-sm font-bold bg-[var(--bg-main)] border border-[var(--border-1)] text-[var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1)]"
                  >
                    + 추가
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <button
                  onClick={addBreakTime}
                  className="text-sm font-bold bg-[var(--bg-main)] border border-[var(--border-1)] text-[var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1)]"
                >
                  + 추가
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ScheduleTabProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  fetchHospitalData: () => Promise<void>;
  allHolidays: HolidayApplicationTypes[];
  setAllHolidays: (holidays: HolidayApplicationTypes[]) => void;
  appointmentRooms?: AppointmentRooms[];
}

export const ScheduleTab = forwardRef<
  { saveSchedule: () => Promise<boolean> },
  ScheduleTabProps
>(
  (
    {
      hospital,
      setHospital: _setHospital,
      hasChanges: _hasChanges,
      setHasChanges,
      toastHelpers,
      fetchHospitalData,
      allHolidays: _allHolidays,
      setAllHolidays: _setAllHolidays,
      appointmentRooms = [],
    },
    ref
  ) => {
    const queryClient = useQueryClient();
    const storeAppointmentRooms = useAppointmentRoomsStore(
      (s) => s.appointmentRooms
    );

    const effectiveAppointmentRooms =
      appointmentRooms.length > 0 ? appointmentRooms : storeAppointmentRooms;

    const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
    const [originalSchedules, setOriginalSchedules] = useState<ScheduleItem[]>(
      []
    );
    const [pendingOperatingHoursData, setPendingOperatingHoursData] = useState<
      any[]
    >([]);
    const [roomOperatingHoursWarnings, setRoomOperatingHoursWarnings] = useState<
      string[]
    >([]);
    const [
      showRoomOperatingHoursWarningPopup,
      setShowRoomOperatingHoursWarningPopup,
    ] = useState(false);
    const [showTimeValidationAlert, setShowTimeValidationAlert] =
      useState(false);
    const roomWarningPopupResolverRef = useRef<{
      resolve: (value: boolean) => void;
      reject: (reason?: any) => void;
    } | null>(null);

    void _setHospital;
    void _hasChanges;
    void _allHolidays;
    void _setAllHolidays;

    useEffect(() => {
      if (hospital?.operatingHours !== undefined) {
        const convertedSchedules = convertOperatingHoursToSchedules(
          hospital.operatingHours
        );
        setSchedules(convertedSchedules);
        setOriginalSchedules(convertedSchedules);
      }
    }, [hospital?.operatingHours]);

    useEffect(() => {
      const schedulesChanged =
        JSON.stringify(schedules) !== JSON.stringify(originalSchedules);
      setHasChanges(schedulesChanged);
    }, [schedules, originalSchedules, setHasChanges]);

    const addSchedule = () => {
      const usedDays = new Set<number>();
      schedules.forEach((schedule) => {
        schedule.clinicSchedule.dayOfWeek.forEach((day) => {
          usedDays.add(day);
        });
      });

      const allDays = [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
        DayOfWeek.SATURDAY,
        DayOfWeek.SUNDAY,
      ];

      const availableDays = allDays.filter((day) => !usedDays.has(day));

      if (availableDays.length === 0) {
        toastHelpers.error("모든 요일이 이미 등록되어 있습니다.");
        return;
      }

      const defaultDays =
        schedules.length === 0
          ? [
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
          ]
          : availableDays;

      const newSchedule: ScheduleItem = {
        id: `schedule_${Date.now()}`,
        clinicSchedule: {
          id: `clinic_${Date.now()}`,
          dayOfWeek: defaultDays,
          startTime: "09:00",
          endTime: "18:00",
          timeSlotDuration: 30,
          breakTimes: [
            {
              id: 1,
              breakStart: "12:00",
              breakEnd: "13:00",
              breakName: "",
              sortOrder: 0,
              isActive: true,
            },
          ],
        },
      };
      setSchedules([...schedules, newSchedule]);
    };

    const isValidScheduleTimes = (schedule: ScheduleItem): boolean => {
      const { startTime, endTime, breakTimes } = schedule.clinicSchedule;
      const start = parseTimeToMinutes(startTime);
      const end = parseTimeToMinutes(endTime);
      if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
        return false;
      }
      return breakTimes.every((bt) => {
        const bStart = parseTimeToMinutes(bt.breakStart);
        const bEnd = parseTimeToMinutes(bt.breakEnd);
        return !Number.isNaN(bStart) && !Number.isNaN(bEnd) && bStart < bEnd;
      });
    };

    const updateSchedule = (id: string, updatedSchedule: ScheduleItem) => {
      if (!isValidScheduleTimes(updatedSchedule)) {
        setShowTimeValidationAlert(true);
        return;
      }
      setSchedules(schedules.map((s) => (s.id === id ? updatedSchedule : s)));
    };

    const deleteSchedule = (id: string) => {
      setSchedules(schedules.filter((s) => s.id !== id));
    };

    const persistOperatingHours = async (operatingHoursData: any[]) => {
      try {
        if (!hospital?.id) {
          toastHelpers.error("병원 정보를 찾을 수 없습니다.");
          return;
        }
        await HospitalsService.syncOperatingHours(hospital.id, {
          operatingHours: operatingHoursData,
        });
        await fetchHospitalData();
        // react-query 기반 캐시 무효화 (진료시간 변경사항을 캘린더/병원 정보에 반영)
        await queryClient.invalidateQueries({
          queryKey: ["hospital", hospital.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["calendar", "hospital-schedule"],
        });
        toastHelpers.success("진료시간 설정이 저장되었습니다.");
        setPendingOperatingHoursData([]);
        setHasChanges(false);
      } catch (error) {
        console.error("Error saving schedule settings:", error);
        toastHelpers.error("진료시간 설정 저장에 실패했습니다.");
        return;
      }
    };

    const saveSchedule = async (): Promise<boolean> => {
      const allValid = schedules.every(isValidScheduleTimes);
      if (!allValid) {
        setShowTimeValidationAlert(true);
        return false;
      }

      try {
        const operatingHoursData =
          convertSchedulesToOperatingHoursData(schedules);

        const roomWarnings = getRoomOperatingHourWarnings(
          operatingHoursData,
          effectiveAppointmentRooms
        );

        if (roomWarnings.length > 0) {
          setRoomOperatingHoursWarnings(roomWarnings);
          setPendingOperatingHoursData(operatingHoursData);

          return new Promise<boolean>((resolve, reject) => {
            roomWarningPopupResolverRef.current = { resolve, reject };
            setShowRoomOperatingHoursWarningPopup(true);
          });
        }

        setPendingOperatingHoursData(operatingHoursData);
        await persistOperatingHours(operatingHoursData);
        return true;
      } catch (error) {
        console.error("Error saving schedule settings:", error);
        toastHelpers.error("진료시간 설정이 저장에 실패했습니다.");
        return false;
      }
    };

    const handleConfirmRoomWarnings = async () => {
      setShowRoomOperatingHoursWarningPopup(false);
      setRoomOperatingHoursWarnings([]);

      if (roomWarningPopupResolverRef.current) {
        roomWarningPopupResolverRef.current.resolve(true);
        roomWarningPopupResolverRef.current = null;
      }

      if (!pendingOperatingHoursData || pendingOperatingHoursData.length === 0) {
        return;
      }
      await persistOperatingHours(pendingOperatingHoursData);
    };

    const handleCloseRoomWarnings = () => {
      setShowRoomOperatingHoursWarningPopup(false);
      setRoomOperatingHoursWarnings([]);

      if (roomWarningPopupResolverRef.current) {
        roomWarningPopupResolverRef.current.resolve(false);
        roomWarningPopupResolverRef.current = null;
      }
    };

    useImperativeHandle(ref, () => ({
      saveSchedule,
    }));

    return (
      <div>
        {schedules.length > 0 &&
          schedules.map((schedule) => (
            <div key={schedule.id}>
              <ScheduleComponent
                schedule={schedule}
                onUpdate={(updated) => updateSchedule(schedule.id, updated)}
                onDelete={() => deleteSchedule(schedule.id)}
                allSchedules={schedules}
              />
              <div className="h-px bg-[var(--bg-4)] my-4"></div>
            </div>
          ))}
        <div className="flex pl-4">
          <button
            onClick={addSchedule}
            className="text-sm font-bold bg-[var(--violet-1)] text-[var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1-hover)]"
          >
            + 진료시간 추가
          </button>
        </div>
        <MyPopupYesNo
          isOpen={showRoomOperatingHoursWarningPopup}
          onCloseAction={handleCloseRoomWarnings}
          onConfirmAction={handleConfirmRoomWarnings}
          title="진료실 운영시간 확인"
          message={""}
          confirmText="계속 저장"
          cancelText="취소"
        >
          <CheckAppointmentRoomOperatingHoursWarningList
            rooms={roomOperatingHoursWarnings}
          />
        </MyPopupYesNo>
        <MyPopupYesNo
          isOpen={showTimeValidationAlert}
          onCloseAction={() => setShowTimeValidationAlert(false)}
          onConfirmAction={() => setShowTimeValidationAlert(false)}
          title="입력 오류"
          message="진료시간을 다시 설정해 주세요."
          confirmText="확인"
          cancelText=""
        />
      </div>
    );
  }
);


