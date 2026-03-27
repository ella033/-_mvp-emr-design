import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { HolidayRecurrenceType, HolidayRecurrenceWeek, HolidayRecurrenceWeekMonthlyLabel } from "@/constants/common/common-enum";
import { WEEK_DAYS } from "@/constants/constants";
import { useCheckHolidayConflicts } from "@/hooks/appointment/use-check-conflicts-appointments";
import { HolidayApplicationsService } from "@/services/holiday-applications-service";
import { HolidayMastersService } from "@/services/holiday-masters-service";
import { HospitalsService } from "@/services/hospitals-service";
import type {
  HolidayApplicationTypes,
  SyncHospitalHolidaysRequest,
  CheckHolidayConflictsAppointment,
} from "@/types/common/holiday-applications-types";
import type { HolidayMasterTypesResponse } from "@/types/common/holiday-master-types";

type ToastHelpers = {
  success: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info?: (...args: any[]) => void;
};

type RegularRow = {
  id: number;
  recurrenceWeek: HolidayRecurrenceWeek;
  selectedDays: number[];
};

type TemporaryRow = {
  id: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
  holidayName: string;
};

export function useHolidayTab(params: {
  hospital: any;
  setHospital: (hospital: any) => void;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: ToastHelpers;
  allHolidays: HolidayApplicationTypes[];
  setAllHolidays: (holidays: HolidayApplicationTypes[]) => void;
}) {
  const { hospital, setHospital, setHasChanges, toastHelpers, allHolidays, setAllHolidays } = params;

  const queryClient = useQueryClient();
  const allHolidaysRef = useRef<HolidayApplicationTypes[]>(allHolidays);

  const [holidayMasters, setHolidayMasters] = useState<HolidayMasterTypesResponse[]>([]);

  // origin: 최초 로드/저장 성공 후 서버가 준 holidayApplications (정규화된 배열)
  const [originApplications, setOriginApplications] = useState<HolidayApplicationTypes[]>([]);

  // UI state 1) 공휴일(holidayMasterId!=null) 선택 상태
  const [selectedHolidayMasterIds, setSelectedHolidayMasterIds] = useState<number[]>([]);

  // UI state 2) 정기 휴무일 rows (recurrenceType != 0)
  const [regularHolidays, setRegularHolidays] = useState<RegularRow[]>([]);

  // UI state 3) 임시 휴무일 rows (holidayMasterId=null && recurrenceType=0)
  const [temporaryHolidays, setTemporaryHolidays] = useState<TemporaryRow[]>([]);

  /**
   * 임시 휴무일 잠김 상태는 "서버로부터 조회해온 최초 데이터" 기준으로만 적용한다.
   * (로컬 수정/추가로 잠김이 즉시 반영되면 안 됨)
   */
  const [lockedTemporaryRowIds, setLockedTemporaryRowIds] = useState<Set<number>>(
    () => new Set<number>()
  );

  const [holidayConflicts, setHolidayConflicts] = useState<CheckHolidayConflictsAppointment[]>([]);
  const [showHolidayConflictPopup, setShowHolidayConflictPopup] = useState(false);
  const [pendingHolidayData, setPendingHolidayData] = useState<SyncHospitalHolidaysRequest[]>([]);

  const normalizeApplications = useCallback((value: any): HolidayApplicationTypes[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.holidayApplications)) return value.holidayApplications;
    if (Array.isArray(value?.holidays)) return value.holidays;
    return [];
  }, []);

  const createEmptyTemporaryRow = useCallback((): TemporaryRow => {
    return { id: Date.now(), startDate: null, endDate: null, holidayName: "" };
  }, []);

  const toDateOnlyKey = useCallback((value: string | Date | null | undefined): number | null => {
    if (!value) return null;
    const d = typeof value === "string" ? new Date(value) : value;
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }, []);

  const todayKey = useMemo(() => {
    const now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }, []);

  const toKstDateOnlyKey = useCallback((value: string | Date | null | undefined): number | null => {
    if (!value) return null;
    const d = typeof value === "string" ? new Date(value) : value;
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);

    const y = Number(parts.find((p) => p.type === "year")?.value ?? "");
    const m = Number(parts.find((p) => p.type === "month")?.value ?? "");
    const day = Number(parts.find((p) => p.type === "day")?.value ?? "");
    if (!y || !m || !day) return null;
    return y * 10000 + m * 100 + day;
  }, []);

  const todayKeyKst = useMemo(() => {
    return toKstDateOnlyKey(new Date()) ?? todayKey;
  }, [toKstDateOnlyKey, todayKey]);

  const extractLockedTemporaryRowIds = useCallback(
    (applications: HolidayApplicationTypes[]): Set<number> => {
      const set = new Set<number>();
      for (const h of applications) {
        if (h.holidayMasterId !== null) continue;
        const recurrenceType = h.recurrenceType ?? HolidayRecurrenceType.없음;
        if (recurrenceType !== HolidayRecurrenceType.없음) continue; // 임시만

        const startKey = toKstDateOnlyKey(h.startDate as any);
        if (startKey !== null && startKey < todayKeyKst) set.add(h.id);
      }
      return set;
    },
    [toKstDateOnlyKey, todayKeyKst]
  );

  const isTemporaryLocked = useCallback(
    (row: TemporaryRow): boolean => {
      return lockedTemporaryRowIds.has(row.id);
    },
    [lockedTemporaryRowIds]
  );

  const extractSelectedMasterIds = useCallback((applications: HolidayApplicationTypes[]): number[] => {
    const set = new Set<number>();
    for (const h of applications) {
      if (h.holidayMasterId !== null && h.isActive) set.add(h.holidayMasterId);
    }
    return [...set.values()].sort((a, b) => a - b);
  }, []);

  const extractRegularRows = useCallback((applications: HolidayApplicationTypes[]): RegularRow[] => {
    const map = new Map<number, { recurrenceWeek: HolidayRecurrenceWeek; selectedDays: number[] }>();
    for (const h of applications) {
      const recurrenceType = h.recurrenceType ?? HolidayRecurrenceType.없음;
      if (h.holidayMasterId !== null) continue;
      if (recurrenceType === HolidayRecurrenceType.없음) continue;
      if (!h.recurrenceWeek) continue;
      if (h.recurrenceDayOfWeek === null || h.recurrenceDayOfWeek === undefined) continue;

      const key = Number(h.recurrenceWeek);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          recurrenceWeek: h.recurrenceWeek,
          selectedDays: [h.recurrenceDayOfWeek as any],
        });
      } else if (!existing.selectedDays.includes(h.recurrenceDayOfWeek as any)) {
        existing.selectedDays.push(h.recurrenceDayOfWeek as any);
      }
    }

    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([week, v]) => ({
        id: week,
        recurrenceWeek: v.recurrenceWeek,
        selectedDays: v.selectedDays.sort((a, b) => a - b),
      }));
  }, []);

  const extractTemporaryRows = useCallback((applications: HolidayApplicationTypes[]): TemporaryRow[] => {
    const rows = applications
      .filter(
        (h) =>
          h.holidayMasterId === null &&
          (h.recurrenceType ?? HolidayRecurrenceType.없음) === HolidayRecurrenceType.없음
      )
      .map((h) => ({
        id: h.id ?? Date.now(),
        startDate: h.startDate as any,
        endDate: h.endDate as any,
        holidayName: h.holidayName ?? "",
      }));

    // startDate desc 정렬 (startDate 없는 항목은 마지막)
    return [...rows].sort((a, b) => {
      const ak = toDateOnlyKey(a.startDate);
      const bk = toDateOnlyKey(b.startDate);
      if (ak === null && bk === null) return b.id - a.id;
      if (ak === null) return 1;
      if (bk === null) return -1;
      return bk - ak;
    });
  }, [toDateOnlyKey]);

  const holidayMasterNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of holidayMasters) map.set(m.id, m.holidayName);
    return map;
  }, [holidayMasters]);

  const selectedMasterIdSet = useMemo(() => {
    return new Set<number>(selectedHolidayMasterIds);
  }, [selectedHolidayMasterIds]);

  const masterApplications = useMemo((): HolidayApplicationTypes[] => {
    const hospitalId = hospital?.id || 0;
    return selectedHolidayMasterIds.map((masterId) => ({
      id: -masterId,
      hospitalId,
      appointmentRoomId: null,
      holidayMasterId: masterId,
      startDate: null,
      endDate: null,
      holidayName: holidayMasterNameById.get(masterId) ?? "",
      isActive: true,
      recurrenceType: HolidayRecurrenceType.없음,
    })) as HolidayApplicationTypes[];
  }, [holidayMasterNameById, hospital?.id, selectedHolidayMasterIds]);

  const regularApplications = useMemo((): HolidayApplicationTypes[] => {
    const hospitalId = hospital?.id || 0;
    const result: HolidayApplicationTypes[] = [];
    for (const row of regularHolidays) {
      if (!row.selectedDays || row.selectedDays.length === 0) continue;
      const weekLabel = HolidayRecurrenceWeekMonthlyLabel[row.recurrenceWeek];
      const dayLabels = WEEK_DAYS.filter((d) => row.selectedDays.includes(d.key))
        .map((d) => d.label)
        .join("");
      const holidayName = `${weekLabel} ${dayLabels}`.trim();

      for (const dayKey of row.selectedDays) {
        result.push({
          id: -row.id * 10 - dayKey,
          hospitalId,
          appointmentRoomId: null,
          holidayMasterId: null,
          startDate: null,
          endDate: null,
          holidayName,
          isActive: true,
          recurrenceType: HolidayRecurrenceType.매월,
          recurrenceWeek: row.recurrenceWeek,
          recurrenceDayOfWeek: dayKey as any,
        } as HolidayApplicationTypes);
      }
    }
    return result;
  }, [hospital?.id, regularHolidays]);

  const temporaryApplications = useMemo((): HolidayApplicationTypes[] => {
    const hospitalId = hospital?.id || 0;
    const sorted = [...temporaryHolidays].sort((a, b) => {
      const ak = toDateOnlyKey(a.startDate);
      const bk = toDateOnlyKey(b.startDate);
      if (ak === null && bk === null) return b.id - a.id;
      if (ak === null) return 1;
      if (bk === null) return -1;
      return bk - ak; // desc
    });

    return sorted.map((row) => ({
      id: row.id,
      hospitalId,
      appointmentRoomId: null,
      holidayMasterId: null,
      startDate: row.startDate as any,
      endDate: row.endDate as any,
      holidayName: row.holidayName ?? "",
      isActive: true,
      recurrenceType: HolidayRecurrenceType.없음,
    })) as HolidayApplicationTypes[];
  }, [hospital?.id, temporaryHolidays, toDateOnlyKey]);

  const modifiedApplications = useMemo(() => {
    return [...masterApplications, ...regularApplications, ...temporaryApplications];
  }, [masterApplications, regularApplications, temporaryApplications]);

  const modifiedApplicationsForSave = useMemo(() => {
    // 임시 휴무일은 start/end 둘다 있는 row만 저장
    return modifiedApplications.filter((h) => {
      if (h.holidayMasterId !== null) return true;
      const recurrenceType = h.recurrenceType ?? HolidayRecurrenceType.없음;
      if (recurrenceType !== HolidayRecurrenceType.없음) return true;
      return !!h.startDate && !!h.endDate;
    });
  }, [modifiedApplications]);

  // 같은 날짜라도 API는 "2024-01-01", 클라이언트는 Date→toISOString() 등 서로 다른 문자열이 될 수 있어
  // 비교 시 날짜만 YYYY-MM-DD로 정규화하여 최초 로드 시 hasChanges가 잘못 true가 되지 않도록 함
  const toNormalizedDateString = useCallback(
    (value: string | Date | null | undefined): string => {
      const key = toKstDateOnlyKey(value);
      if (key === null) return "";
      const y = Math.floor(key / 10000);
      const m = Math.floor((key % 10000) / 100);
      const d = key % 100;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    },
    [toKstDateOnlyKey]
  );

  const canonicalKey = useCallback(
    (h: HolidayApplicationTypes): string => {
      if (h.holidayMasterId !== null) return `M:${h.holidayMasterId}`;
      const recurrenceType = h.recurrenceType ?? HolidayRecurrenceType.없음;
      if (recurrenceType !== HolidayRecurrenceType.없음) {
        return `R:${recurrenceType}:${h.recurrenceWeek ?? ""}:${h.recurrenceDayOfWeek ?? ""}`;
      }
      const s = toNormalizedDateString(h.startDate as string | Date | null | undefined);
      const e = toNormalizedDateString(h.endDate as string | Date | null | undefined);
      return `C:${s}:${e}:${(h.holidayName ?? "").trim()}`;
    },
    [toNormalizedDateString]
  );

  const toComparable = useCallback(
    (apps: HolidayApplicationTypes[]) => {
      // 완전 빈 placeholder는 비교에서 제외
      const filtered = apps.filter((h) => {
        if (h.holidayMasterId !== null) return true;
        const recurrenceType = h.recurrenceType ?? HolidayRecurrenceType.없음;
        if (recurrenceType !== HolidayRecurrenceType.없음) return true;
        const hasAny =
          !!h.startDate || !!h.endDate || (h.holidayName ?? "").trim() !== "";
        return hasAny;
      });
      // API가 동일 holidayMasterId를 중복 건으로 내려줄 수 있으므로, 비교 시 키 집합으로 봄(중복 제거)
      const keys = filtered.map(canonicalKey);
      return [...new Set(keys)].sort();
    },
    [canonicalKey]
  );

  // react-query mutation
  const {
    mutateAsync: checkHolidayConflicts,
    isPending: isCheckingHolidayConflicts,
  } = useCheckHolidayConflicts({
    onError: (error: any) => {
      console.error("휴무일 예약 검증 실패:", error);
      toastHelpers.error("기존 예약 검증에 실패했습니다.");
    },
  });

  useEffect(() => {
    allHolidaysRef.current = allHolidays;
  }, [allHolidays]);

  const fetchHolidayMasters = useCallback(async (): Promise<HolidayMasterTypesResponse[]> => {
    try {
      return await HolidayMastersService.getHolidayMasters();
    } catch (error) {
      console.error("공휴일 마스터 조회 실패:", error);
      toastHelpers.error("공휴일 정보를 불러오는데 실패했습니다.");
      return [];
    }
  }, [toastHelpers]);

  const initialize = useCallback(async () => {
    const fetchedHolidayMasters = await fetchHolidayMasters();
    setHolidayMasters(fetchedHolidayMasters ?? []);

    const preloadedApplications = normalizeApplications(allHolidaysRef.current);
    setOriginApplications(preloadedApplications);
    setLockedTemporaryRowIds(extractLockedTemporaryRowIds(preloadedApplications));
    setSelectedHolidayMasterIds(extractSelectedMasterIds(preloadedApplications));
    setRegularHolidays(extractRegularRows(preloadedApplications));
    setTemporaryHolidays(extractTemporaryRows(preloadedApplications));
    setHasChanges(false);
  }, [
    extractLockedTemporaryRowIds,
    extractRegularRows,
    extractSelectedMasterIds,
    extractTemporaryRows,
    fetchHolidayMasters,
    normalizeApplications,
    setHasChanges,
  ]);

  useEffect(() => {
    if (!hospital?.id) return;
    void initialize();
  }, [hospital?.id, allHolidays.length, initialize]);

  useEffect(() => {
    const changed =
      JSON.stringify(toComparable(modifiedApplications)) !==
      JSON.stringify(toComparable(originApplications));
    setHasChanges(changed);
  }, [modifiedApplications, originApplications, setHasChanges, toComparable]);

  // handlers: masters
  const setAllHolidayMasters = useCallback(
    (isChecked: boolean) => {
      if (isChecked) setSelectedHolidayMasterIds(holidayMasters.map((m) => m.id));
      else setSelectedHolidayMasterIds([]);
      setHasChanges(false);
    },
    [holidayMasters, setHasChanges]
  );

  const toggleHolidayMaster = useCallback(
    (masterId: number) => {
      setSelectedHolidayMasterIds((prev) => {
        const set = new Set(prev);
        if (set.has(masterId)) set.delete(masterId);
        else set.add(masterId);
        return [...set.values()].sort((a, b) => a - b);
      });
      setHasChanges(true);
    },
    [setHasChanges]
  );

  // handlers: regular
  const addRegularHoliday = useCallback(() => {
    // 새로 추가한 정기 휴무일은 리스트 최상단에 표시
    setRegularHolidays((prev) => [
      { id: Date.now(), recurrenceWeek: HolidayRecurrenceWeek.첫째주, selectedDays: [] },
      ...prev,
    ]);
    setHasChanges(true);
  }, [setHasChanges]);

  const removeRegularHoliday = useCallback((rowId: number) => {
    setRegularHolidays((prev) => prev.filter((r) => r.id !== rowId));
    setHasChanges(true);
  }, [setHasChanges]);

  const updateRegularRecurrenceWeek = useCallback(
    (rowId: number, week: HolidayRecurrenceWeek) => {
      setRegularHolidays((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, recurrenceWeek: week } : r))
      );
      setHasChanges(true);
    },
    [setHasChanges]
  );

  const toggleRegularDayOfWeek = useCallback(
    (rowId: number, dayKey: number) => {
      setRegularHolidays((prev) =>
        prev.map((r) => {
          if (r.id !== rowId) return r;
          const nextDays = r.selectedDays.includes(dayKey)
            ? r.selectedDays.filter((d) => d !== dayKey)
            : [...r.selectedDays, dayKey];
          return { ...r, selectedDays: nextDays };
        })
      );
      setHasChanges(true);
    },
    [setHasChanges]
  );

  // handlers: temporary
  const addTemporaryHoliday = useCallback(() => {
    // 새로 추가한 임시 휴무일은 리스트 최상단에 표시
    setTemporaryHolidays((prev) => [createEmptyTemporaryRow(), ...prev]);
    setHasChanges(true);
  }, [createEmptyTemporaryRow, setHasChanges]);

  const updateTemporaryRow = useCallback(
    (rowId: number, patch: Partial<TemporaryRow>) => {
      const row = temporaryHolidays.find((r) => r.id === rowId);
      if (row && isTemporaryLocked(row)) return;
      setTemporaryHolidays((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
      );
      setHasChanges(true);
    },
    [isTemporaryLocked, setHasChanges, temporaryHolidays]
  );

  const removeTemporaryHoliday = useCallback(
    (rowId: number) => {
      const row = temporaryHolidays.find((r) => r.id === rowId);
      if (row && isTemporaryLocked(row)) return;
      setTemporaryHolidays((prev) => prev.filter((r) => r.id !== rowId));
      setHasChanges(true);
    },
    [isTemporaryLocked, setHasChanges, temporaryHolidays]
  );

  const persistHolidays = useCallback(
    async (payload: SyncHospitalHolidaysRequest[]) => {
      const updated = await HospitalsService.syncHolidays(hospital.id, { holidays: payload });
      const normalized = normalizeApplications(updated);

      setHospital({ ...hospital, holidayApplications: normalized });
      setAllHolidays(normalized);

      setOriginApplications(normalized);
      setLockedTemporaryRowIds(extractLockedTemporaryRowIds(normalized));
      setSelectedHolidayMasterIds(extractSelectedMasterIds(normalized));
      setRegularHolidays(extractRegularRows(normalized));
      setTemporaryHolidays(extractTemporaryRows(normalized));

      setHasChanges(false);
      await queryClient.invalidateQueries({ queryKey: ["holidays", "hospital"] });

      toastHelpers.success("공휴일 설정이 저장되었습니다.");
      setShowHolidayConflictPopup(false);
      setHolidayConflicts([]);
      setPendingHolidayData([]);
    },
    [
      extractLockedTemporaryRowIds,
      extractRegularRows,
      extractSelectedMasterIds,
      extractTemporaryRows,
      hospital,
      normalizeApplications,
      queryClient,
      setAllHolidays,
      setHasChanges,
      setHospital,
      toastHelpers,
    ]
  );

  const syncHolidays = useCallback(async () => {
    if (!hospital?.id) {
      toastHelpers.error("병원 정보를 찾을 수 없습니다.");
      return;
    }

    const payload = HolidayApplicationsService.toSyncHospitalHolidaysRequests(
      modifiedApplicationsForSave
    );

    const hasExistingHolidays =
      allHolidays && Array.isArray(allHolidays) && allHolidays.length > 0;

    if (hasExistingHolidays) {
      try {
        const checkPayload = {
          hospitalId: hospital?.id,
          appointmentRoomId: null,
          holidays: HolidayApplicationsService.toCheckHolidayConflictsHolidays(
            modifiedApplicationsForSave
          ),
        };
        const result = await checkHolidayConflicts({
          ...checkPayload,
        });

        if (
          !result ||
          typeof result.hasConflicts !== "boolean" ||
          !Array.isArray(result.appointments)
        ) {
          console.error("휴무일 예약 검증 응답 형식이 올바르지 않습니다:", result);
          toastHelpers.error("기존 예약 검증 응답을 처리할 수 없습니다.");
          return;
        }

        const hasAnyAppointments = result.appointments.length > 0;
        const hasConflicts =
          result.hasConflicts === true && (result.conflictCount > 0 || hasAnyAppointments);

        if (hasConflicts) {
          setHolidayConflicts(result.appointments);
          setPendingHolidayData(payload);
          setShowHolidayConflictPopup(true);
          return;
        }
      } catch (error) {
        console.error("휴무일 예약 검증 실패:", error);
        toastHelpers.error("기존 예약 검증에 실패했습니다. 저장이 중단되었습니다.");
        return;
      }
    }

    await persistHolidays(payload);
  }, [
    allHolidays,
    checkHolidayConflicts,
    hospital?.id,
    modifiedApplicationsForSave,
    persistHolidays,
    toastHelpers,
  ]);

  const confirmHolidayConflicts = useCallback(async () => {
    if (!pendingHolidayData || pendingHolidayData.length === 0) {
      setShowHolidayConflictPopup(false);
      setHolidayConflicts([]);
      setPendingHolidayData([]);
      return;
    }
    await persistHolidays(pendingHolidayData);
  }, [pendingHolidayData, persistHolidays]);

  const closeHolidayConflicts = useCallback(() => {
    setShowHolidayConflictPopup(false);
    setHolidayConflicts([]);
    setPendingHolidayData([]);
  }, []);

  return {
    // data
    holidayMasters,
    selectedMasterIdSet,
    regularHolidays,
    temporaryHolidays,
    isTemporaryLocked,
    holidayConflicts,
    showHolidayConflictPopup,
    isCheckingHolidayConflicts,

    // actions
    setAllHolidayMasters,
    toggleHolidayMaster,

    addRegularHoliday,
    removeRegularHoliday,
    updateRegularRecurrenceWeek,
    toggleRegularDayOfWeek,

    addTemporaryHoliday,
    updateTemporaryRow,
    removeTemporaryHoliday,

    syncHolidays,
    confirmHolidayConflicts,
    closeHolidayConflicts,
  };
}


