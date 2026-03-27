"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Calendar from "react-calendar";
import { Button } from "@/components/ui/button";
import { useUsersStore } from "@/store/users-store";
import type { UserManager } from "@/types/user-types";
import { useHospitalStore } from "@/store/hospital-store";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import { isDateInRange, isSameDate, isSameDay } from "@/lib/reservation-utils";
import { ReservationSettingsModal } from "../settings/reservation-settings";
import { Input } from "@/components/ui/input";
import "@/styles/react-calendar.css";
import {
  AppointmentStatus,
  AppointmentStatusLabel,
} from "@/constants/common/common-enum";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";

interface OptionsPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onFilterChange: (filters: {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  }) => void;
  weekRange?: { start: Date; end: Date };
  monthRange?: { start: Date; end: Date };
  viewType?: "day" | "week" | "month" | "list";
}

interface FilterOption {
  value: string | number;
  label: string;
}

export default function OptionsPanel({
  isCollapsed,
  onToggleCollapse,
  selectedDate: externalSelectedDate,
  onDateChange,
  onFilterChange,
  weekRange,
  monthRange,
  viewType = "day",
}: OptionsPanelProps) {
  const { getUsersByHospital } = useUsersStore();
  const { hospital } = useHospitalStore();
  const { appointmentRooms } = useAppointmentRoomsStore();
  const [selectedDate, setSelectedDate] = useState<Date>(
    externalSelectedDate || new Date()
  );
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(
    externalSelectedDate || new Date()
  );

  // 필터 선택 상태
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  // 예약상태는 enum number[]로 관리하며, 전체 선택 여부 별도 관리
  const [selectedStatusNumbers, setSelectedStatusNumbers] = useState<number[]>(
    []
  );
  const [isStatusAllSelected, setIsStatusAllSelected] = useState<boolean>(true);
  const [isRoomAllSelected, setIsRoomAllSelected] = useState<boolean>(true);
  const [isDoctorAllSelected, setIsDoctorAllSelected] = useState<boolean>(true);

  // 섹션 접기/펴기 상태
  const [isRoomSectionOpen, setIsRoomSectionOpen] = useState(false);
  const [isDoctorSectionOpen, setIsDoctorSectionOpen] = useState(false);
  const [isStatusSectionOpen, setIsStatusSectionOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 로컬 스토리지 키
  const FILTER_STORAGE_KEY = "reservation_filter_settings";
  const SECTION_STATE_KEY = "reservation_section_states";

  // 옵션 데이터를 useMemo로 메모이제이션
  const roomOptions = useMemo(
    (): FilterOption[] => [
      { value: "all", label: "전체" },
      ...(appointmentRooms?.map((room) => ({
        value: room.id.toString(),
        label: room.displayName || room.name,
      })) || []),
    ],
    [appointmentRooms]
  );

  const doctorOptions: FilterOption[] = [
    { value: "all", label: "전체" },
    ...(hospital?.id
      ? getUsersByHospital(hospital.id.toString()).map((user: UserManager) => ({
        value: user.id.toString(),
        label: user.name,
      }))
      : []),
  ];



  const statusOptions: FilterOption[] = [
    { value: "all", label: "전체" },
    ...Object.values(AppointmentStatus)
      .filter((v) => typeof v === "number")
      .map((v) => ({
        value: v as number,
        label: AppointmentStatusLabel[v as AppointmentStatus],
      })),
  ];
  const ALL_STATUS_NUMBERS = statusOptions
    .filter((o) => o.value !== "all")
    .map((o) => o.value) as number[];

  // 선택된 항목 수 계산 (전체 제외)
  // 사용되지 않는 함수들 제거
  // const getSelectedCount = (selected: string[]): number => {
  //   return selected.filter(item => item !== 'all').length;
  // };
  // 예약상태 선택 개수
  const getSelectedStatusCount = (): number => {
    return isStatusAllSelected ? 0 : selectedStatusNumbers.length;
  };
  // 예약실 선택 개수
  const getSelectedRoomCount = (): number => {
    return isRoomAllSelected ? 0 : selectedRooms.length;
  };
  // 진료의 선택 개수
  const getSelectedDoctorCount = (): number => {
    return isDoctorAllSelected ? 0 : selectedDoctors.length;
  };

  // 선택된 항목 수 표시 텍스트
  // 필터 저장 함수
  const saveFiltersToLocalStorage = (filters: {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  }) => {
    try {
      const filterData = {
        ...filters,
        savedAt: new Date().toISOString(),
      };
      safeLocalStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filterData));
    } catch (error) {
      console.error("필터 저장 실패:", error);
    }
  };

  // 섹션 상태 저장 함수
  const saveSectionStatesToLocalStorage = (states: {
    isRoomSectionOpen: boolean;
    isDoctorSectionOpen: boolean;
    isStatusSectionOpen: boolean;
  }) => {
    try {
      safeLocalStorage.setItem(SECTION_STATE_KEY, JSON.stringify(states));
    } catch (error) {
      console.error("섹션 상태 저장 실패:", error);
    }
  };

  // 필터 불러오기 함수
  const loadFiltersFromLocalStorage = (): {
    rooms: string[];
    doctors: string[];
    statuses: number[];
  } => {
    try {
      const savedData = safeLocalStorage.getItem(FILTER_STORAGE_KEY);
      if (savedData) {
        const filterData = JSON.parse(savedData);
        // 이전 버전 호환 처리: 문자열 상태코드 -> 숫자 enum으로 변환
        const statusMap: Record<string, number> = {
          request: AppointmentStatus.PENDING,
          reserved: AppointmentStatus.CONFIRMED,
          visited: AppointmentStatus.VISITED,
          noshow: AppointmentStatus.NOSHOW,
          cancelled: AppointmentStatus.CANCELED,
          canceled: AppointmentStatus.CANCELED,
        };
        let loadedStatuses: number[] = [];
        const rawStatuses = filterData.statuses;
        if (Array.isArray(rawStatuses)) {
          if (rawStatuses.length === 0) {
            loadedStatuses = [];
          } else if (typeof rawStatuses[0] === "number") {
            loadedStatuses = rawStatuses as number[];
          } else if (typeof rawStatuses[0] === "string") {
            const hasAll = (rawStatuses as string[]).includes("all");
            loadedStatuses = hasAll
              ? []
              : (rawStatuses as string[])
                .map((s) => statusMap[s])
                .filter((v): v is number => typeof v === "number");
          }
        }
        // 빈 배열(이전 ALL 표현) 또는 비정상 값은 ALL로 대체
        if (!loadedStatuses || loadedStatuses.length === 0) {
          loadedStatuses = [...ALL_STATUS_NUMBERS];
        }

        // rooms와 doctors 처리 - "all"이 포함되어 있으면 모든 옵션으로 변환
        let loadedRooms = filterData.rooms || [];
        let loadedDoctors = filterData.doctors || [];

        // "all"이 포함되어 있으면 모든 옵션으로 변환
        if (loadedRooms.includes("all")) {
          loadedRooms = roomOptions
            .filter((o) => o.value !== "all")
            .map((o) => o.value as string);
        }
        if (loadedDoctors.includes("all")) {
          loadedDoctors = doctorOptions
            .filter((o) => o.value !== "all")
            .map((o) => o.value as string);
        }

        return {
          rooms: loadedRooms,
          doctors: loadedDoctors,
          statuses: loadedStatuses,
        };
      }
    } catch (error) {
      console.error("필터 불러오기 실패:", error);
    }

    return {
      rooms: roomOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value as string),
      doctors: doctorOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value as string),
      statuses: [...ALL_STATUS_NUMBERS],
    };
  };

  // 섹션 상태 불러오기 함수
  const loadSectionStatesFromLocalStorage = (): {
    isRoomSectionOpen: boolean;
    isDoctorSectionOpen: boolean;
    isStatusSectionOpen: boolean;
  } => {
    try {
      const savedData = safeLocalStorage.getItem(SECTION_STATE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("섹션 상태 불러오기 실패:", error);
    }

    return {
      isRoomSectionOpen: false,
      isDoctorSectionOpen: false,
      isStatusSectionOpen: false,
    };
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    const defaultFilters = {
      rooms: roomOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value as string),
      doctors: doctorOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value as string),
      statuses: [...ALL_STATUS_NUMBERS] as number[],
    };

    setSelectedRooms(defaultFilters.rooms);
    setSelectedDoctors(defaultFilters.doctors);
    setSelectedStatusNumbers([...ALL_STATUS_NUMBERS]);
    setIsStatusAllSelected(true);
    setIsRoomAllSelected(true);
    setIsDoctorAllSelected(true);

    // 로컬 스토리지에 저장
    saveFiltersToLocalStorage(defaultFilters);

    // 부모 컴포넌트로 변경사항 전달 (함수인지 확인 후 호출)
    if (typeof onFilterChange === "function") {
      onFilterChange(defaultFilters);
    }
  };

  // 상태 체크박스 변경 핸들러 (예약상태 전용)
  const handleStatusCheckboxChange = (
    value: number | "all",
    isChecked: boolean
  ) => {
    let nextSelected: number[];

    if (value === "all") {
      if (isChecked) {
        nextSelected = [...ALL_STATUS_NUMBERS];
      } else {
        nextSelected = [];
      }
    } else {
      if (isStatusAllSelected) {
        // 전체 선택 상태에서 개별 항목 클릭 → 해당 항목만 단독 선택
        nextSelected = [value];
      } else if (selectedStatusNumbers.includes(value)) {
        // 이미 선택된 항목 클릭 → 해제 (마지막 1개 해제 시 전체로 복귀)
        nextSelected = selectedStatusNumbers.filter((v) => v !== value);
        if (nextSelected.length === 0) {
          nextSelected = [...ALL_STATUS_NUMBERS];
        }
      } else {
        // 미선택 항목 클릭 → 기존 선택에 추가
        nextSelected = [...selectedStatusNumbers, value];
      }
    }

    // 개별 조작 후 ALL과 동일해지면 ALL로 간주
    const isAllNow =
      nextSelected.length === ALL_STATUS_NUMBERS.length &&
      ALL_STATUS_NUMBERS.every((v) => nextSelected.includes(v));

    setSelectedStatusNumbers(nextSelected);
    setIsStatusAllSelected(isAllNow);

    const updatedFilters = {
      rooms: selectedRooms,
      doctors: selectedDoctors,
      statuses: nextSelected,
    };

    saveFiltersToLocalStorage(updatedFilters);
    if (typeof onFilterChange === "function") {
      onFilterChange(updatedFilters);
    }
  };

  // 체크박스 변경 핸들러 (방/의사 전용)
  const handleCheckboxChange = (
    type: "rooms" | "doctors",
    value: string,
    isChecked: boolean
  ) => {
    const currentIsAllSelected =
      type === "rooms" ? isRoomAllSelected : isDoctorAllSelected;
    const currentSelected =
      type === "rooms" ? [...selectedRooms] : [...selectedDoctors];
    const allOptions = (type === "rooms" ? roomOptions : doctorOptions)
      .filter((o) => o.value !== "all")
      .map((o) => o.value as string);

    let nextSelected: string[];

    if (value === "all") {
      if (isChecked) {
        nextSelected = [...allOptions];
      } else {
        nextSelected = [];
      }
    } else {
      if (currentIsAllSelected) {
        // 전체 선택 상태에서 개별 항목 클릭 → 해당 항목만 단독 선택
        nextSelected = [value];
      } else if (currentSelected.includes(value)) {
        // 이미 선택된 항목 클릭 → 해제 (마지막 1개 해제 시 전체로 복귀)
        nextSelected = currentSelected.filter((v) => v !== value);
        if (nextSelected.length === 0) {
          nextSelected = [...allOptions];
        }
      } else {
        // 미선택 항목 클릭 → 기존 선택에 추가
        nextSelected = [...currentSelected, value];
      }
    }

    // 개별 조작 후 ALL과 동일해지면 ALL로 간주
    const isAllNow =
      nextSelected.length === allOptions.length &&
      allOptions.every((v) => nextSelected.includes(v));

    if (type === "rooms") {
      setSelectedRooms(nextSelected);
      setIsRoomAllSelected(isAllNow);
    } else {
      setSelectedDoctors(nextSelected);
      setIsDoctorAllSelected(isAllNow);
    }

    const updatedFilters = {
      rooms: type === "rooms" ? nextSelected : selectedRooms,
      doctors: type === "doctors" ? nextSelected : selectedDoctors,
      statuses: selectedStatusNumbers,
    };

    saveFiltersToLocalStorage(updatedFilters);
    if (typeof onFilterChange === "function") {
      onFilterChange(updatedFilters);
    }
  };

  // 섹션 토글 핸들러 간소화
  const toggleSection = (section: "room" | "doctor" | "status") => {
    if (section === "room") {
      setIsRoomSectionOpen(!isRoomSectionOpen);
    } else if (section === "doctor") {
      setIsDoctorSectionOpen(!isDoctorSectionOpen);
    } else {
      setIsStatusSectionOpen(!isStatusSectionOpen);
    }

    // 상태 저장
    saveSectionStatesToLocalStorage({
      isRoomSectionOpen:
        section === "room" ? !isRoomSectionOpen : isRoomSectionOpen,
      isDoctorSectionOpen:
        section === "doctor" ? !isDoctorSectionOpen : isDoctorSectionOpen,
      isStatusSectionOpen:
        section === "status" ? !isStatusSectionOpen : isStatusSectionOpen,
    });
  };

  // 컴포넌트 마운트 시 저장된 필터 및 섹션 상태 불러오기
  useEffect(() => {
    // 데이터가 로딩되지 않았으면 대기
    if (!appointmentRooms || appointmentRooms.length === 0 || !hospital?.id) {
      return;
    }

    const savedFilters = loadFiltersFromLocalStorage();
    const savedSectionStates = loadSectionStatesFromLocalStorage();

    // 예약실 필터 설정 - "전체"가 선택되어 있으면 모든 옵션 선택
    let roomsToSet = savedFilters.rooms;
    let isRoomAllSelected = false;
    if (
      roomsToSet.length === 0 ||
      roomsToSet.includes("all") ||
      roomsToSet.length === roomOptions.filter((o) => o.value !== "all").length
    ) {
      roomsToSet = roomOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value as string);
      isRoomAllSelected = true;
    }

    // 진료의 필터 설정 - "전체"가 선택되어 있으면 모든 옵션 선택
    let doctorsToSet = savedFilters.doctors;
    let isDoctorAllSelected = false;
    if (
      doctorsToSet.length === 0 ||
      doctorsToSet.includes("all") ||
      doctorsToSet.length ===
      doctorOptions.filter((o) => o.value !== "all").length
    ) {
      doctorsToSet = doctorOptions
        .filter((o) => o.value !== "all")
        .map((o) => o.value as string);
      isDoctorAllSelected = true;
    }

    setSelectedRooms(roomsToSet);
    setSelectedDoctors(doctorsToSet);
    setSelectedStatusNumbers(savedFilters.statuses);
    setIsStatusAllSelected(
      savedFilters.statuses.length === ALL_STATUS_NUMBERS.length
    );
    setIsRoomAllSelected(isRoomAllSelected);
    setIsDoctorAllSelected(isDoctorAllSelected);

    setIsRoomSectionOpen(savedSectionStates.isRoomSectionOpen);
    setIsDoctorSectionOpen(savedSectionStates.isDoctorSectionOpen);
    setIsStatusSectionOpen(savedSectionStates.isStatusSectionOpen);

    // 부모 컴포넌트로 초기 필터값 전달 (함수인지 확인 후 호출)
    if (typeof onFilterChange === "function") {
      onFilterChange({
        rooms: roomsToSet,
        doctors: doctorsToSet,
        statuses: savedFilters.statuses,
      });
    }
  }, [appointmentRooms, hospital?.id, onFilterChange]); // 데이터 로딩 완료 후 실행

  // hospital이 변경될 때 진료의 필터 재설정
  useEffect(() => {
    if (hospital?.id) {
      const currentDoctorIds = getUsersByHospital(hospital.id.toString()).map(
        (user) => user.id.toString()
      );
      const validDoctors = selectedDoctors.filter(
        (doctorId) => doctorId === "all" || currentDoctorIds.includes(doctorId)
      );

      // 유효하지 않은 진료의가 있으면 전체로 초기화
      if (validDoctors.length !== selectedDoctors.length) {
        const newDoctors = validDoctors.length > 0 ? validDoctors : ["all"];
        setSelectedDoctors(newDoctors);

        // 업데이트된 필터 저장
        const updatedFilters = {
          rooms: selectedRooms,
          doctors: newDoctors,
          statuses: selectedStatusNumbers,
        };

        saveFiltersToLocalStorage(updatedFilters);

        // 함수인지 확인 후 호출
        if (typeof onFilterChange === "function") {
          onFilterChange(updatedFilters);
        }
      }
    }
  }, [hospital?.id]);

  const multiDaysStyles = `
  .react-calendar__tile.week-start {
    background-color: black !important;
    color: white !important;
    border-top-left-radius: 50% !important;
    border-bottom-left-radius: 50% !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  .react-calendar__tile.week-end {
    background-color: black !important;
    color: white !important;
    border-top-right-radius: 50% !important;
    border-bottom-right-radius: 50% !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
  }

  .react-calendar__tile.week-middle {
    background-color: #DDDDDD !important;
    color: #000000 !important;
    border-radius: 0 !important;
  }
`;

  // externalSelectedDate가 변경될 때 내부 selectedDate와 calendarViewDate 업데이트
  useEffect(() => {
    if (externalSelectedDate) {
      setSelectedDate(externalSelectedDate);
      setCalendarViewDate(externalSelectedDate);
    }
  }, [externalSelectedDate]);

  // 오늘 날짜인지 확인 (selectedDate와 externalSelectedDate 모두 고려)
  const isToday = useMemo(() => {
    const dateToCheck = selectedDate || externalSelectedDate;
    if (!dateToCheck) return false;
    const today = new Date();
    const result = isSameDay(dateToCheck, today);
    return result;
  }, [selectedDate, externalSelectedDate]);

  const handleDateChange = (value: any) => {
    const dateValue = Array.isArray(value) ? value[0] : value;

    if (dateValue instanceof Date) {
      setSelectedDate(dateValue);
      onDateChange(dateValue);
    }
  };

  const handleActiveStartDateChange = ({
    activeStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (activeStartDate) {
      setCalendarViewDate(activeStartDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange(today);
  };

  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return "";

    const classes = [];

    // daily-view가 아닌 경우에만 스타일 적용
    if (viewType !== "day") {
      // 주간 범위 체크 (weekly-view)
      if (
        viewType === "week" &&
        weekRange &&
        isDateInRange(date, weekRange.start, weekRange.end)
      ) {
        if (isSameDate(date, weekRange.start)) {
          classes.push("week-start"); // 주간 시작일
        } else if (isSameDate(date, weekRange.end)) {
          classes.push("week-end"); // 주간 종료일
        } else {
          classes.push("week-middle"); // 주간 중간일
        }
      }

      // 월간 범위 체크 (monthly-view)
      if (
        viewType === "month" &&
        monthRange &&
        isDateInRange(date, monthRange.start, monthRange.end)
      ) {
        if (isSameDate(date, monthRange.start)) {
          classes.push("week-start"); // 월간 시작일
        } else if (isSameDate(date, monthRange.end)) {
          classes.push("week-end"); // 월간 종료일
        } else {
          classes.push("week-middle"); // 월간 중간일
        }
      }
    }

    return classes.join(" ");
  };

  // 필터 섹션 렌더링 함수 제거 - 인라인으로 구현됨

  return (
    <div
      data-testid="reservation-options-panel"
      className={`bg-[var(--bg-main)] shadow-lg transition-all duration-300 relative h-full ${isCollapsed ? "w-16" : "w-[270px]"
        }`}
    >
      {!isCollapsed && (
        <div className="flex flex-col h-full">
          {/* 캘린더 */}
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {selectedDate?.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) || "날짜 선택"}
              </span>
              {!isToday && (
                <button
                  onClick={handleToday}
                  data-testid="reservation-calendar-today-button"
                  className="px-2 py-1 text-xs text-gray-500 whitespace-nowrap rounded-md border cursor-pointer hover:bg-gray-100"
                >
                  오늘
                </button>
              )}
            </div>
            <style>{multiDaysStyles}</style>
            <Calendar
              data-testid="reservation-calendar"
              onChange={handleDateChange}
              value={selectedDate}
              activeStartDate={calendarViewDate}
              onActiveStartDateChange={handleActiveStartDateChange}
              className="w-full border-0"
              locale="ko-KR"
              calendarType="gregory"
              formatDay={(locale, date) => date.getDate().toString()}
              tileClassName={getTileClassName}
            />
          </div>

          {/* 필터 섹션 */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-0">
              {/* 예약실 필터 */}
              <div className="border-b border-gray-200">
                {/* 섹션 헤더 */}
                <div
                  data-testid="reservation-room-filter-section"
                  className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-[var(--gray-700)]"
                  onClick={() => toggleSection("room")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-md font-medium text-[var(--gray-200)]">
                      예약실
                    </span>
                    {getSelectedRoomCount() > 0 && !isRoomAllSelected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-[var(--second-color)] bg-[var(--violet-1)] rounded-md">
                        {getSelectedRoomCount()}
                      </span>
                    )}
                  </div>
                  {isRoomSectionOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {/* 섹션 내용 */}
                {isRoomSectionOpen && (
                  <div className="px-4 pb-3">
                    <div className="space-y-2">
                      {roomOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer hover:bg-[var(--gray-700)] p-1 rounded"
                        >
                          <Input
                            type="checkbox"
                            checked={
                              option.value === "all"
                                ? isRoomAllSelected
                                : selectedRooms.includes(option.value as string)
                            }
                            onChange={(e) =>
                              handleCheckboxChange(
                                "rooms",
                                option.value as string,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-[var(--main-color)] border-gray-300 rounded focus:ring-[var(--main-color)]"
                          />
                          <span className="text-sm text-[var(--gray-300)]">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 진료의 필터 */}
              <div className="border-b border-gray-200">
                {/* 섹션 헤더 */}
                <div
                  data-testid="reservation-doctor-filter-section"
                  className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-[var(--gray-700)]"
                  onClick={() => toggleSection("doctor")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-md font-medium text-[var(--gray-200)]">
                      진료의
                    </span>
                    {getSelectedDoctorCount() > 0 && !isDoctorAllSelected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-[var(--second-color)] bg-[var(--violet-1)] rounded-md">
                        {getSelectedDoctorCount()}
                      </span>
                    )}
                  </div>
                  {isDoctorSectionOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {/* 섹션 내용 */}
                {isDoctorSectionOpen && (
                  <div className="px-4 pb-3">
                    <div className="space-y-2">
                      {doctorOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer hover:bg-[var(--gray-700)] p-1 rounded"
                        >
                          <Input
                            type="checkbox"
                            checked={
                              option.value === "all"
                                ? isDoctorAllSelected
                                : selectedDoctors.includes(
                                  option.value as string
                                )
                            }
                            onChange={(e) =>
                              handleCheckboxChange(
                                "doctors",
                                option.value as string,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-[var(--main-color)] border-gray-300 rounded focus:ring-[var(--main-color)]"
                          />
                          <span className="text-sm text-[var(--gray-300)]">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 예약상태 필터 */}
              <div className="border-b border-gray-200 last:border-b-0">
                {/* 섹션 헤더 */}
                <div
                  className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-[var(--gray-700)]"
                  onClick={() => toggleSection("status")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-md font-medium text-[var(--gray-200)]">
                      예약상태
                    </span>
                    {getSelectedStatusCount() > 0 && !isStatusAllSelected && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-[var(--second-color)] bg-[var(--violet-1)] rounded-md">
                        {getSelectedStatusCount()}
                      </span>
                    )}
                  </div>
                  {isStatusSectionOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {/* 섹션 내용 */}
                {isStatusSectionOpen && (
                  <div className="px-4 pb-3">
                    <div className="space-y-2">
                      {statusOptions.map((option) => (
                        <label
                          key={option.label + String(option.value)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-[var(--gray-700)] p-1 rounded"
                        >
                          <Input
                            type="checkbox"
                            checked={
                              option.value === "all"
                                ? isStatusAllSelected
                                : selectedStatusNumbers.includes(
                                  option.value as number
                                )
                            }
                            onChange={(e) =>
                              handleStatusCheckboxChange(
                                option.value as number | "all",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-[var(--main-color)] border-gray-300 rounded focus:ring-[var(--main-color)]"
                          />
                          <span className="text-sm text-[var(--gray-300)]">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 필터 초기화 버튼 */}
            <div className="p-4">
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 패널 제어 버튼들 */}
      {isCollapsed && (
        <div className="absolute top-6 left-3.5 flex flex-col">
          <div className="pb-6">
            <span>
              <img src="/reservation-calendar.svg" className="w-4 h-4" />
            </span>
          </div>
          <div className="pb-6">
            <span>
              <img src="/filter.svg" className="w-4 h-4" />
            </span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div>
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="w-10 h-10 p-0"
            >
              <Settings className="w-4 h-4 text-[var(--gray-300)]" />
            </Button>
          </div>
          <div className="absolute bottom-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              data-testid="reservation-panel-toggle-button"
              className="w-10 h-10 p-0"
            >
              {isCollapsed ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="absolute bottom-6 left-0.5 flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="w-10 h-10 p-0"
          >
            <Settings className="w-4 h-4 text-[var(--gray-300)]" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            data-testid="reservation-panel-toggle-button"
            className="w-10 h-10 p-0"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      <ReservationSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSettingsSaved={() => {
          // 설정 저장 후 페이지 새로고침
          window.location.reload();
        }}
      />
    </div>
  );
}
