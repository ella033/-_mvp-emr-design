import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { useUserStore } from "@/store/user-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionStore } from "@/store/common/reception-store";
import { useAppointmentStore } from "@/store/appointment-store";
import { useSelectedDateStore, useReceptionTabsStore } from "@/store/reception";
import { HospitalsService } from "@/services/hospitals-service";
import { RegistrationsService } from "@/services/registrations-service";
import { AppointmentsService } from "@/services/appointments-service";
import { useRegistrationsByHospital } from "@/hooks/registration/use-registrations-by-hospital";
import { useAppointmentsByHospital } from "@/hooks/appointment/use-appointments-by-hospital";
import { createReceptionDateTime, convertKSTDateToUTCRange, formatUTCDateToKSTString } from "@/lib/date-utils";
import { REGISTRATION_ID_NEW } from "@/lib/registration-utils";
import {
  safeJsonParse,
  safeLocalStorage,
} from "@/components/yjg/common/util/ui-util";


export function useManagementPage() {
  // ===== STORES =====
  const { hospital, setHospital } = useHospitalStore();
  const { user } = useUserStore();
  const {
    registrations: storeRegistrations,
    appointments: storeAppointments,
    isInitialized,
    setInitialized,
    setRegistrations,
    setAppointments: setReceptionAppointments,
  } = useReceptionStore();
  const {
    setAppointments: setStoreAppointments,
  } = useAppointmentStore();
  const {
    openedReceptions,
    removeOpenedReception,
    setOpenedReceptionId,
    hasReceptionChanges,
  } = useReceptionTabsStore();

  const openedReceptionsRef = useRef(openedReceptions);
  const hasReceptionChangesRef = useRef(hasReceptionChanges);

  useEffect(() => {
    openedReceptionsRef.current = openedReceptions;
  }, [openedReceptions]);

  useEffect(() => {
    hasReceptionChangesRef.current = hasReceptionChanges;
  }, [hasReceptionChanges]);

  // ===== LOCAL STATE =====
  // Selected Date Store에서 selectedDate 구독
  const { selectedDate, setSelectedDate } = useSelectedDateStore();
  const [showMaxReceptionsPopup, setShowMaxReceptionsPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDateChangeConfirmOpen, setDateChangeConfirmOpen] =
    useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<Date | null>(
    null
  );
  // ===== DATA LOADING =====

  // 기본 병원 정보 로드
  const loadHospitalData = useCallback(async () => {
    try {
      if (user.hospitalId) {
        const hospitalsData = await HospitalsService.getHospital(
          user.hospitalId
        );
        if (hospitalsData) {
          setHospital(hospitalsData);
          return hospitalsData;
        }
        return null;
      } else {
        console.warn("[ReceptionPage] user.hospitalId가 없습니다:", user);
        return null;
      }
    } catch (error) {
      console.error("[ReceptionPage] 병원 데이터 로드 실패:", error);
      return null;
    }
  }, [user.hospitalId, setHospital]);

  // 선택된 날짜 문자열 생성 (queryKey 안정화를 위해)
  const selectedDateStr = useMemo(() => {
    return selectedDate.getFullYear() +
      "-" +
      String(selectedDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(selectedDate.getDate()).padStart(2, "0");
  }, [selectedDate]);

  // ===== REACT QUERY (초기 데이터 로드 전용) =====
  // React Query는 페이지 마운트/날짜 변경 시 초기 데이터를 가져오는 용도로만 사용.
  // 이후 데이터 갱신은 소켓 리스너가 store를 직접 업데이트하므로
  // React Query ↔ store 간 복잡한 merge/동기화는 불필요.
  const appointmentsBeginDate = useMemo(() => selectedDate ? new Date(selectedDate) : null, [selectedDateStr]);
  const appointmentsEndDate = useMemo(() => selectedDate ? new Date(selectedDate) : null, [selectedDateStr]);
  const {
    data: appointmentsData,
    isLoading: isAppointmentsLoading,
    isFetched: isAppointmentsFetched,
    refetch: refetchAppointments,
  } = useAppointmentsByHospital(hospital?.id, appointmentsBeginDate, appointmentsEndDate);

  const registrationsBeginDate = useMemo(() => selectedDate ? new Date(selectedDate) : null, [selectedDateStr]);
  const registrationsEndDate = useMemo(() => selectedDate ? new Date(selectedDate) : null, [selectedDateStr]);
  const {
    data: registrationsData,
    isLoading: isRegistrationsLoading,
    isFetched: isRegistrationsFetched,
    refetch: refetchRegistrations,
  } = useRegistrationsByHospital(
    hospital?.id?.toString() || "",
    registrationsBeginDate,
    registrationsEndDate
  );

  // ===== 초기 동기화: React Query → Store =====
  // Store를 single source of truth로 사용.
  // React Query 데이터는 아래 경우에만 store에 기록한다:
  //   1) 최초 페이지 로드 (날짜별 1회)
  //   2) 날짜 변경 시
  //   3) refreshPatientsData 이벤트로 강제 재조회 시 (setLastSyncedDate(null))
  // 소켓 리스너가 store를 직접 갱신하므로, 해당 경로의 데이터는 sync 없이 즉시 반영됨.
  const [lastSyncedDate, setLastSyncedDate] = useState<string | null>(null);

  useEffect(() => {
    // 아직 fetched 되지 않았으면 대기
    if (!isAppointmentsFetched || !isRegistrationsFetched) return;
    // 이미 해당 날짜에 대해 동기화가 완료되었으면 스킵
    // (소켓으로 store가 갱신된 이후 React Query refetch가 일어나도 store를 덮어쓰지 않음)
    if (lastSyncedDate === selectedDateStr) return;

    // React Query 데이터를 store에 단순 기록 (merge 없이 overwrite)
    if (appointmentsData !== undefined) {
      setStoreAppointments(appointmentsData);
      setReceptionAppointments(appointmentsData);
    } else {
      // 날짜 변경 시 appointmentsData가 아직 로딩 중이면 store 비우기
      setStoreAppointments([]);
      setReceptionAppointments([]);
    }

    if (registrationsData !== undefined) {
      setRegistrations(registrationsData as any);
    }

    setLastSyncedDate(selectedDateStr);
  }, [
    isAppointmentsFetched,
    isRegistrationsFetched,
    appointmentsData,
    registrationsData,
    selectedDateStr,
    lastSyncedDate,
    setStoreAppointments,
    setReceptionAppointments,
    setRegistrations,
  ]);

  // ===== INITIALIZATION =====

  // 전체 데이터 초기화
  const initializeData = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. 병원 정보 로드
      const hospitalData = await loadHospitalData();
      if (!hospitalData?.id) {
        console.warn("[ReceptionPage] 병원 데이터가 없어서 초기화 중단");
        return;
      }
      // 2. 페이지 마운트 시 React Query 데이터를 refetch하여 최신 데이터 가져오기
      // (다른 라우트에서 변경한 내용이 반영되도록)
      await Promise.all([refetchAppointments(), refetchRegistrations()]);

      // refetch 후 lastSyncedDate를 초기화하여 동기화 로직이 실행되도록 함
      setLastSyncedDate(null);
    } catch (error) {
      console.error("[ReceptionPage] 데이터 초기화 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadHospitalData, refetchAppointments, refetchRegistrations]);

  // 날짜 변경시 데이터 리로드
  const reloadDateData = useCallback(
    async (_newDate: Date) => {
      if (!hospital?.id) return;
      setIsLoading(true);
      try {
        // React Query refetch → 완료 후 lastSyncedDate를 리셋하여 sync effect가 실행되도록
        await Promise.all([refetchAppointments(), refetchRegistrations()]);
        setLastSyncedDate(null);
      } catch (error) {
        console.error("[ReceptionPage] 날짜별 데이터 리로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [hospital?.id, refetchAppointments, refetchRegistrations]
  );

  // ===== EVENT HANDLERS =====

  // 환자 선택 핸들러
  const handlePatientSelect = useCallback((_patient: any) => {
    // selectedPatient는 더 이상 사용하지 않음
  }, []);

  const clearAllOpenedReceptions = useCallback(() => {
    const currentReceptions = openedReceptionsRef.current;
    if (!currentReceptions || currentReceptions.length === 0) return;

    const idsToRemove = Array.from(
      new Set(
        currentReceptions
          .map((reception) => reception?.originalRegistrationId || REGISTRATION_ID_NEW)
          .filter((id): id is string => Boolean(id))
      )
    );

    idsToRemove.forEach((id) => {
      removeOpenedReception(id);
    });

    setOpenedReceptionId(null);
  }, [removeOpenedReception, setOpenedReceptionId]);

  const applyDateChange = useCallback(
    async (date: Date, shouldResetTabs: boolean) => {
      // 이미 동일한 날짜면 추가 업데이트를 하지 않음
      const nextDateStr =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
      if (nextDateStr === selectedDateStr) {
        return;
      }

      if (shouldResetTabs) {
        clearAllOpenedReceptions();
      }

      const combinedDate = createReceptionDateTime(date);
      setLastSyncedDate(null);

      setSelectedDate(combinedDate);
      await reloadDateData(date);
    },
    [
      clearAllOpenedReceptions,
      reloadDateData,
      selectedDateStr,
      setSelectedDate,
      setLastSyncedDate,
    ]
  );

  // 날짜 변경 핸들러
  const handleDateChange = useCallback(
    async (date: Date) => {
      // 동일 날짜면 아무 작업도 하지 않음 (불필요한 반복 업데이트 방지)
      const nextDateStr =
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0");
      if (nextDateStr === selectedDateStr) {
        return;
      }

      const currentReceptions = openedReceptionsRef.current;
      const hasChangesFn = hasReceptionChangesRef.current;

      const hasOpenedReceptions = currentReceptions && currentReceptions.length > 0;
      if (hasOpenedReceptions) {
        const hasChanges = currentReceptions.some((reception) =>
          hasChangesFn(reception.originalRegistrationId || REGISTRATION_ID_NEW)
        );
        if (hasChanges) {
          setPendingDateChange(date);
          setDateChangeConfirmOpen(true);
          return;
        }

        await applyDateChange(date, true);
        return;
      }

      await applyDateChange(date, false);
    },
    [applyDateChange, setPendingDateChange, setDateChangeConfirmOpen, selectedDateStr]
  );

  const handleCancelDateChange = useCallback(() => {
    setPendingDateChange(null);
    setDateChangeConfirmOpen(false);
  }, []);

  const handleDiscardDateChange = useCallback(async () => {
    if (!pendingDateChange) {
      setDateChangeConfirmOpen(false);
      return;
    }
    const dateToChange = pendingDateChange;
    setPendingDateChange(null);
    setDateChangeConfirmOpen(false);

    await applyDateChange(dateToChange, true);
  }, [pendingDateChange, applyDateChange]);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((_layout: any) => {
    // TODO: 레이아웃 저장 로직 추가
  }, []);

  // ===== EFFECTS =====

  // 컴포넌트 마운트시 데이터 초기화
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // refreshPatientsData 이벤트 리스너
  // 예약→접수 전환, 빠른접수, 접수취소, 컨텍스트 메뉴 동작 등에서 발행되는 이벤트를 수신하여
  // 본인 클라이언트에서 수행한 액션을 즉각 반영한다.
  //
  // React Query refetch → sync effect 경로 대신, 소켓 리스너와 동일하게
  // 직접 API 호출 → store 갱신 방식을 사용하여 경쟁 조건을 제거한다.
  useEffect(() => {
    const handleRefreshPatientsData = async (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const type = detail?.type; // "all" | "registrations" | "appointments" | undefined

      if (!hospital?.id) return;

      try {
        // 클로저에 캡처된 selectedDate 대신 store에서 최신 값을 직접 읽어온다.
        // 과거 날짜로 접수 후 refreshPatientsData 이벤트가 발생했을 때,
        // 클로저의 selectedDate가 stale할 수 있는 문제를 방지한다.
        const currentSelectedDate = useSelectedDateStore.getState().selectedDate;
        const { beginUTC, endUTC } = convertKSTDateToUTCRange(currentSelectedDate);

        if (type === "registrations" || type === "all" || !type) {
          const registrations = await RegistrationsService.getRegistrationsByHospital(
            hospital.id.toString(),
            beginUTC,
            endUTC
          );
          setRegistrations(registrations as any);
        }

        if (type === "appointments" || type === "all" || !type) {
          const appointments = await AppointmentsService.getAppointmentsByHospital(
            hospital.id,
            beginUTC,
            endUTC
          );
          setStoreAppointments(appointments);
          setReceptionAppointments(appointments);
        }
      } catch (error) {
        console.error("[useManagementPage] refreshPatientsData 처리 실패:", error);
      }
    };

    window.addEventListener("refreshPatientsData", handleRefreshPatientsData);

    return () => {
      window.removeEventListener("refreshPatientsData", handleRefreshPatientsData);
    };
  }, [hospital?.id, setRegistrations, setStoreAppointments, setReceptionAppointments]);

  // 최대 reception 개수 초과 이벤트 리스너
  useEffect(() => {
    const handleMaxReceptionsReached = () => {
      setShowMaxReceptionsPopup(true);
    };

    window.addEventListener(
      "maxReceptionsReached" as any,
      handleMaxReceptionsReached
    );

    return () => {
      window.removeEventListener(
        "maxReceptionsReached" as any,
        handleMaxReceptionsReached
      );
    };
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    if (!hospital?.id) return;
    if (isAppointmentsFetched && isRegistrationsFetched) {
      setInitialized(true);
    }
  }, [
    hospital?.id,
    isAppointmentsFetched,
    isRegistrationsFetched,
    isInitialized,
    setInitialized,
  ]);

  // ===== COMPUTED VALUES =====

  // 선택된 날짜의 데이터만 필터링 (UTC 데이터를 KST 기준으로)
  // Store를 단일 소스로 사용하여 소켓 이벤트로 업데이트된 최신 데이터 반영
  const liveFilteredData = useMemo(() => {
    const filteredAppointments =
      storeAppointments?.filter((apt) => {
        const kstDateStr = formatUTCDateToKSTString(apt.appointmentStartTime);
        return kstDateStr === selectedDateStr;
      }) || [];

    const filteredRegistrations =
      storeRegistrations?.filter((reg) => {
        const kstDateStr = formatUTCDateToKSTString(reg.receptionDateTime);
        return kstDateStr === selectedDateStr;
      }) || [];

    return {
      appointments: filteredAppointments,
      registrations: filteredRegistrations,
    };
  }, [storeAppointments, storeRegistrations, selectedDateStr]);

  // ===== LOCAL STORAGE 캐싱 (초기 화면 빠른 표시용) =====
  const filteredDataStorageKey = useMemo(() => {
    const hospitalIdKey = user?.hospitalId ? String(user.hospitalId) : "unknown";
    return `reception:management:filtered-data:${hospitalIdKey}:${selectedDateStr}`;
  }, [user?.hospitalId, selectedDateStr]);

  const [cachedFilteredData, setCachedFilteredData] = useState<{
    appointments: any[];
    registrations: any[];
  } | null>(null);
  const [isFilteredDataHydrated, setIsFilteredDataHydrated] = useState(false);
  const filteredDataHashRef = useRef<string>("");

  useEffect(() => {
    const saved = safeLocalStorage.getItem(filteredDataStorageKey);
    if (!saved) {
      setCachedFilteredData(null);
      setIsFilteredDataHydrated(true);
      return;
    }

    const parsed = safeJsonParse<{
      appointments?: any[];
      registrations?: any[];
    }>(saved, null as any);

    if (parsed) {
      setCachedFilteredData({
        appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
        registrations: Array.isArray(parsed.registrations)
          ? parsed.registrations
          : [],
      });
    } else {
      setCachedFilteredData(null);
    }

    setIsFilteredDataHydrated(true);
  }, [filteredDataStorageKey]);

  useEffect(() => {
    if (!isFilteredDataHydrated) return;

    const nextHash = JSON.stringify({
      appointments: (liveFilteredData.appointments || []).map(
        (item: any) => `${item.id}:${item.updateDateTime || item.updatedAt || ""}`
      ),
      registrations: (liveFilteredData.registrations || []).map(
        (item: any) => `${item.id}:${item.updateDateTime || item.updatedAt || ""}`
      ),
    });

    if (filteredDataHashRef.current === nextHash) return;
    filteredDataHashRef.current = nextHash;

    safeLocalStorage.setItem(
      filteredDataStorageKey,
      JSON.stringify(liveFilteredData)
    );
  }, [liveFilteredData, filteredDataStorageKey, isFilteredDataHydrated]);

  const filteredData = useMemo(() => {
    const isLiveEmpty =
      liveFilteredData.appointments.length === 0 &&
      liveFilteredData.registrations.length === 0;

    if (isLiveEmpty && cachedFilteredData) {
      return cachedFilteredData;
    }

    return liveFilteredData;
  }, [liveFilteredData, cachedFilteredData]);

  // 패널 스켈레톤은 "초기 fetch 완료 여부" 기준으로만 제어한다.
  // store 플래그 지연/리셋 이슈가 있어도 fetched 기반으로 즉시 수렴하도록 한다.
  const isPanelDataLoading = !isAppointmentsFetched || !isRegistrationsFetched;

  return {
    // Stores
    hospital,
    selectedDate,

    // States
    showMaxReceptionsPopup,
    setShowMaxReceptionsPopup,
    isLoading,
    isAppointmentsLoading,
    isRegistrationsLoading,
    isPanelDataLoading,
    isDateChangeConfirmOpen,
    pendingDateChange,

    // Data
    filteredData,

    // Handlers
    handlePatientSelect,
    handleDateChange,
    handleCancelDateChange,
    handleDiscardDateChange,
    handleLayoutChange,
  };
}
