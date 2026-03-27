import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useReceptionStore } from "@/store/common/reception-store";
import { useHospitalStore } from "@/store/hospital-store";
import { RegistrationsService } from "@/services/registrations-service";
import { AppointmentsService } from "@/services/appointments-service";
import { AppointmentStatus, 접수상태 } from "@/constants/common/common-enum";
import { convertKSTDateToUTCRange, isSameCalendarDay } from "@/lib/date-utils";
import MyCalendar from "@/components/yjg/my-calendar";
import MedicalPatientListHeader, { getInitialPatientStatusPinned } from "./medical-patient-list-header";
import MyDivideLine from "@/components/yjg/my-divide-line";
import { cn } from "@/lib/utils";
import MedicalPatientCardList from "./medical-patient-card-list";
import type { Registration } from "@/types/registration-types";


export type PatientListPosition = "left" | "right";

type TabType = {
  key: number;
  name: string;
  statusArr: number[];
};

const TAB_TYPE: TabType[] = [
  {
    key: 4,
    name: "예약",
    statusArr: [],
  },
  {
    key: 1,
    name: "대기",
    statusArr: [접수상태.대기, 접수상태.진료중],
  },
  {
    key: 2,
    name: "보류",
    statusArr: [접수상태.보류],
  },
  {
    key: 3,
    name: "수납",
    statusArr: [접수상태.수납대기, 접수상태.수납완료],
  },
];

const DEFAULT_TAB = TAB_TYPE.find((t) => t.key === 1)!;

export default function MedicalPatientList({
  setIsPatientStatusOpen,
  position,
  onPositionChangeAction,
}: {
  setIsPatientStatusOpen: (isPatientStatusOpen: boolean) => void;
  position: PatientListPosition;
  onPositionChangeAction: (position: PatientListPosition) => void;
}) {
  const [isPinned, setIsPinned] = useState<boolean>(() => getInitialPatientStatusPinned());
  const [selectedTab, setSelectedTab] = useState<TabType>(DEFAULT_TAB);

  const { registrations, setRegistrations, updateRegistration, appointments, setAppointments } = useReceptionStore();
  const { hospital } = useHospitalStore();

  // 달력 선택 날짜 (기본: 오늘)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  /** 당일이 아닌 날짜의 접수 목록 (소켓 갱신 제외, 로컬만 사용) */
  const [localRegistrations, setLocalRegistrations] = useState<Registration[]>([]);
  /** 당일이 아닌 날짜의 예약 목록 (소켓 갱신 제외, 로컬만 사용) */
  const [localAppointments, setLocalAppointments] = useState<any[]>([]);

  const isTodaySelected = useMemo(
    () => isSameCalendarDay(selectedDate, new Date()),
    [selectedDate]
  );
  const displayRegistrations = useMemo(
    () => (isTodaySelected ? registrations ?? [] : localRegistrations),
    [isTodaySelected, registrations, localRegistrations]
  );

  const handleUpdateRegistration = useCallback(
    (id: string, updates: Partial<Registration>) => {
      if (isTodaySelected) {
        updateRegistration(id, updates);
      } else {
        setLocalRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
        );
      }
    },
    [isTodaySelected, updateRegistration]
  );

  // 선택한 날짜에 따라 접수 목록 조회 (당일이면 store, 아니면 로컬만 갱신)
  useEffect(() => {
    if (!hospital?.id) return;
    let cancelled = false;
    const isToday = isSameCalendarDay(selectedDate, new Date());
    const load = async () => {
      try {
        const { beginUTC, endUTC } = convertKSTDateToUTCRange(selectedDate);
        const list = await RegistrationsService.getRegistrationsByHospital(
          hospital.id.toString(),
          beginUTC,
          endUTC
        );
        if (!cancelled) {
          if (isToday) setRegistrations(list || []);
          else setLocalRegistrations(list || []);
        }
      } catch (err) {
        if (!cancelled) console.error("[PatientStatusList] 접수 목록 조회 실패:", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, hospital?.id, setRegistrations]);

  // 예약 데이터 (오늘이면 store, 아니면 로컬)
  const displayAppointments = useMemo(
    () => (isTodaySelected ? appointments ?? [] : localAppointments),
    [isTodaySelected, appointments, localAppointments]
  );

  // 선택한 날짜에 따라 예약 목록 조회 (당일이면 store, 아니면 로컬만 갱신)
  useEffect(() => {
    if (!hospital?.id) return;
    let cancelled = false;
    const isToday = isSameCalendarDay(selectedDate, new Date());
    const load = async () => {
      try {
        const { beginUTC, endUTC } = convertKSTDateToUTCRange(selectedDate);
        const list = await AppointmentsService.getAppointmentsByHospital(
          hospital.id,
          beginUTC,
          endUTC
        );
        if (!cancelled) {
          if (isToday) setAppointments(list || []);
          else setLocalAppointments(list || []);
        }
      } catch (err) {
        if (!cancelled) console.error("[MedicalPatientList] 예약 목록 조회 실패:", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, hospital?.id, setAppointments]);

  /** patient가 있는 예약만 (탭 숫자·카드 리스트 공통) */
  const appointmentsWithPatient = useMemo(
    () => displayAppointments.filter((a) => a.patient != null && a.status === AppointmentStatus.CONFIRMED),
    [displayAppointments]
  );

  return (
    <div className="border-md border-[var(--border-1)] flex flex-col w-full h-full bg-[var(--bg-1)]">
      <MedicalPatientListHeader
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        position={position}
        onPositionChangeAction={onPositionChangeAction}
      />
      <MyCalendar
        size="sm"
        selectedDate={selectedDate}
        onDateSelectAction={setSelectedDate}
        className="w-full p-[8px] border-none rounded-none bg-[var(--bg-1)]"
      />
      <div className="flex items-center border-y border-[var(--border-1)] p-[6px]">
        {TAB_TYPE.map((tab, index) => (
          <React.Fragment key={tab.key}>
            <PatientStatusNavbarItem
              name={tab.name}
              count={
                tab.key === 4 // 예약 탭인 경우
                  ? appointmentsWithPatient.length
                  : displayRegistrations.filter((registration) =>
                    tab.statusArr.includes(registration.status)
                  ).length || 0
              }
              isSelected={selectedTab === tab}
              onClick={() => setSelectedTab(tab)}
            />
            {index < TAB_TYPE.length - 1 && (
              <MyDivideLine orientation="vertical" size="sm" className="h-[16px] mx-[6px]" />
            )}
          </React.Fragment>
        ))}
      </div>
      <MedicalPatientCardList
        registrations={displayRegistrations}
        onUpdateRegistrationAction={handleUpdateRegistration}
        selectedTab={selectedTab}
        selectedDate={selectedDate}
        appointments={appointmentsWithPatient}
        setIsPatientStatusOpenAction={setIsPatientStatusOpen}
        isPinned={isPinned}
        listPosition={position}
      />
    </div>
  );
}

function PatientStatusNavbarItem({
  name,
  count,
  isSelected,
  onClick,
}: {
  name: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[4px] flex-1 rounded-[5px] py-[4px] cursor-pointer",
        isSelected ? "bg-[var(--gray-white)]" : "bg-transparent"
      )}
      onClick={onClick}
    >
      <span className="text-[12px] text-[var(--gray-100)] font-[500]">{name}</span>
      <span className="text-[12px] text-[var(--second-color)] font-[700]">{count}</span>
    </div>
  );
}

