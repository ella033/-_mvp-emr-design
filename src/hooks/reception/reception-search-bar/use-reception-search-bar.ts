import { useEffect, useState, useMemo } from "react";
import type { Patient } from "@/types/patient-types";
import { useSearchPatientsInfinite } from "@/hooks/patient/use-search-patients-infinite";
import {
  useReceptionStore,
  useReceptionTabsStore,
  useSelectedDate,
} from "@/store/reception";
import { useQueryClient } from "@tanstack/react-query";
import { useToastHelpers } from "@/components/ui/toast";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { ReceptionService } from "@/services/reception-service";
import { createReceptionDateTime } from "@/lib/date-utils";
import { registrationKeys } from "@/lib/query-keys/registrations";
import {
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
  buildProvisionalRegistrationId,
} from "@/lib/registration-utils";
import { isNewRegistrationId } from "@/lib/registration-utils";
import { ReceptionInitialTab, 초재진, 주간야간휴일구분 } from "@/constants/common/common-enum";
import { useHospitalStore } from "@/store/hospital-store";

// 커스텀 useDebounce 훅 구현
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface UseReceptionSearchBarProps {
  onPatientSelect?: (patient: Patient) => void;
  /** true이면 환자 선택 시 접수 탭을 열지 않고 onPatientSelect만 호출 (예: 예약 패널) */
  disableDefaultBehavior?: boolean;
  query: string;
}

export function useReceptionSearchBar({
  onPatientSelect,
  disableDefaultBehavior = false,
  query,
}: UseReceptionSearchBarProps) {
  const queryClient = useQueryClient();
  const { error: showError } = useToastHelpers();

  // usePatientInfo 사용 (자격조회 팝업 포함)
  const {
    autoReception,
    getLatestReception,
    getLatestReceptionForReceptionTab,
    showQualificationComparePopup,
    qualificationCompareData,
    showQualificationComparePopupPromise,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,
    processQualificationCompareResult,
  } = usePatientReception();

  const {
    addOpenedReception,
    setOpenedReceptionId,
    replaceReceptionTab,
    openedReceptions,
    setInitialTab,
  } = useReceptionTabsStore();
  const { registrations, appointments } = useReceptionStore();
  const selectedDate = useSelectedDate();
  const hospital = useHospitalStore((state) => state.hospital);

  // 상태 관리
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [pendingReception, setPendingReception] = useState<any>(null);
  const [isQuickReceptionLoading, setIsQuickReceptionLoading] = useState(false);
  const [loadingPatientName, setLoadingPatientName] = useState("");
  const [showNoReceptionHistoryWarning, setShowNoReceptionHistoryWarning] =
    useState(false);
  const [showDuplicateReceptionConfirm, setShowDuplicateReceptionConfirm] =
    useState(false);
  const [pendingQuickReception, setPendingQuickReception] = useState<{
    patient: Patient;
    targetReception: any;
  } | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>(
    undefined
  );
  const [processedPatientId, setProcessedPatientId] = useState<string | null>(
    null
  );
  const [showAppointmentFoundInfo, setShowAppointmentFoundInfo] =
    useState(false);
  const [showMultipleAppointmentsWarning, setShowMultipleAppointmentsWarning] =
    useState(false);

  // Reception Store 조작을 위한 통합 함수
  const handleReceptionStoreUpdate = (reception: any) => {
    const normalizedId = normalizeRegistrationId(reception.originalRegistrationId);

    const { openedReceptions } = useReceptionTabsStore.getState();
    const existingReception = openedReceptions.find(
      (r: any) => r.originalRegistrationId === normalizedId
    );

    if (existingReception) {
      // 기존 reception이 있으면 해당 reception을 활성화
      setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
    } else {
      // 새로운 reception 추가
      addOpenedReception({ ...reception, originalRegistrationId: normalizedId });
      setOpenedReceptionId(normalizedId || REGISTRATION_ID_NEW);
    }
  };

  // 환자 선택 시 getLatestReceptionForReceptionTab을 사용하여 최신 접수 정보 가져오기
  useEffect(() => {
    if (selectedPatient && String(selectedPatient.id) !== processedPatientId) {
      setProcessedPatientId(String(selectedPatient.id));

      // 기존 캐시 무효화 (동일한 환자 재조회 시 최신 데이터 가져오기)
      queryClient.invalidateQueries({
        queryKey: registrationKeys.latestByPatient(String(selectedPatient.id)),
      });

      const handlePatientSelection = async () => {
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await getLatestReceptionForReceptionTab(
              selectedPatient,
              registrations,
              appointments,
              selectedDate
            );

            switch (result.type) {
              case 'noHistory':
                break;

              case 'sameDayRegistration': {
                const normalizedId = result.matchedRegistrationId!;
                // 이미 열린 탭이 있으면 활성화만
                const openedMatch = openedReceptions.find(
                  (r: any) => r.originalRegistrationId === normalizedId
                );
                if (openedMatch) {
                  setOpenedReceptionId(normalizedId);
                  return;
                }
                // 새 탭으로 열기
                if (result.initialTab) setInitialTab(result.initialTab);
                handleReceptionStoreUpdate(result.reception!);
                setOpenedReceptionId(normalizedId);
                break;
              }

              case 'todayAppointment': {
                const appointmentReception = result.reception!;
                setInitialTab(ReceptionInitialTab.환자정보);
                handleReceptionStoreUpdate(appointmentReception);
                setOpenedReceptionId(appointmentReception.originalRegistrationId);
                setShowAppointmentFoundInfo(true);
                break;
              }

              case 'multipleAppointments':
                setShowMultipleAppointmentsWarning(true);
                break;

              case 'differentDay': {
                const provisionalId = selectedPatient
                  ? buildProvisionalRegistrationId(`${selectedPatient.id}-${Date.now()}`)
                  : REGISTRATION_ID_NEW;
                setInitialTab(ReceptionInitialTab.환자정보);
                const receptionToOpen = {
                  ...result.reception!,
                  originalRegistrationId: provisionalId,
                };
                handleReceptionStoreUpdate(receptionToOpen);
                setOpenedReceptionId(provisionalId);
                break;
              }
            }

            return; // 성공 시 함수 종료
          } catch (error) {
            console.warn(
              `[reception-search-bar] 시도 ${attempt}/${maxRetries} 실패:`,
              error
            );

            // 마지막 시도가 아니면 잠시 대기 후 재시도
            if (attempt < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt)
              ); // 점진적 대기
            }
          }
        }

        // 모든 재시도 실패 시 에러 처리
        showError("환자정보 설정에 실패했습니다. 잠시 후 다시 시도해주세요.");
      };

      handlePatientSelection();
    }
  }, [
    selectedPatient,
    processedPatientId,
    queryClient,
    getLatestReceptionForReceptionTab,
    addOpenedReception,
    setOpenedReceptionId,
    showError,
    selectedDate,
    openedReceptions,
    registrations,
    appointments,
  ]);

  const handleOverwriteConfirm = () => {
    if (pendingReception) {
      const targetId = normalizeRegistrationId(
        pendingReception.originalRegistrationId
      );
      const { openedReceptions } = useReceptionTabsStore.getState();
      const existingReception = openedReceptions.find(
        (r: any) => r.originalRegistrationId === targetId
      );
      if (existingReception) {
        replaceReceptionTab(targetId, pendingReception);
      } else {
        handleReceptionStoreUpdate(pendingReception);
      }
    }
    setShowOverwriteConfirm(false);
    setPendingReception(null);
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
    setPendingReception(null);
  };

  const handlePatientSelect = async (patient: Patient) => {
    // 1. Props로 받은 콜백이 있으면 먼저 실행
    if (onPatientSelect) {
      onPatientSelect(patient);
    }

    // 2. disableDefaultBehavior이면 접수 탭 열기 없이 종료
    if (disableDefaultBehavior) {
      return;
    }

    // 3. 새로운 환자가 선택되면 processedPatientId 초기화 후 접수 탭 열기
    setProcessedPatientId(null);
    setSelectedPatient(patient);
  };

  // 실제 빠른 접수 처리 함수 (중복 확인 후 호출)
  const executeQuickReception = async (_patient: Patient, targetReception: any) => {
    try {
      // autoReception 호출 (자격조회 포함)
      const autoReceptionResult = await autoReception(targetReception);

      // 자격조회 비교 팝업이 필요한 경우
      if (autoReceptionResult.needsCompare) {
        // 자격조회 비교 팝업 표시 및 결과 대기
        const apply = await showQualificationComparePopupPromise(autoReceptionResult.compareData);

        // 선택한 정보로 접수 진행
        const result = await processQualificationCompareResult(
          autoReceptionResult.compareData,
          apply
        );

        if (result.success) {
          // 빠른접수 성공 시 patients-list 새로고침
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refreshPatientsData"));
          }
        } else {
          showError("빠른접수에 실패했습니다.");
        }
      } else {
        // 자격조회 비교 팝업이 필요 없는 경우
        if (autoReceptionResult.success) {
          // 빠른접수 성공 시 patients-list 새로고침
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refreshPatientsData"));
          }
        } else {
          showError("빠른접수에 실패했습니다.");
        }
      }
    } catch (err) {
      showError("빠른접수에 실패했습니다.");
    } finally {
      // 로딩 종료
      setIsQuickReceptionLoading(false);
      setLoadingPatientName("");
    }
  };

  const handleQuickReception = async (
    e: React.MouseEvent,
    patient: Patient
  ) => {
    e.stopPropagation(); // 부모의 onClick 이벤트 방지

    if (!autoReception || !getLatestReception) {
      showError("빠른접수 기능을 사용할 수 없습니다.");
      return;
    }

    // 로딩 시작
    setIsQuickReceptionLoading(true);
    setLoadingPatientName(patient.name);

    try {
      // 캐시 무효화 (최신 데이터 가져오기)
      queryClient.invalidateQueries({
          queryKey: registrationKeys.latestByPatient(String(patient.id)),
      });

      // getLatestReception을 사용하여 Reception 객체 생성
      const targetReception = await getLatestReception(patient, true);

      if (targetReception) {
        // 이미 접수된 환자 확인
        const targetPatientId = String(patient.id);
        if (targetPatientId && targetPatientId !== "0") {
          const duplicateRegistration = registrations.find(
            (reg) => {
              const regPatientId = (reg as any).patientId ||
                (reg as any).patientId ||
                (reg as any).patientStatus?.patientId;
              return regPatientId && String(regPatientId) === targetPatientId;
            }
          );

          if (duplicateRegistration) {
            // 중복 접수 확인 팝업 표시
            setPendingQuickReception({ patient, targetReception });
            setShowDuplicateReceptionConfirm(true);
            setIsQuickReceptionLoading(false);
            setLoadingPatientName("");
            return;
          }
        }

        // 중복이 없으면 바로 접수 진행
        await executeQuickReception(patient, targetReception);
      } else {
        setShowNoReceptionHistoryWarning(true);
        setIsQuickReceptionLoading(false);
        setLoadingPatientName("");
      }
    } catch (err) {
      showError("빠른접수에 실패했습니다.");
      setIsQuickReceptionLoading(false);
      setLoadingPatientName("");
    }
  };

  // 이미 접수된 환자 확인 팝업에서 확인 클릭
  const handleConfirmDuplicateQuickReception = async () => {
    if (pendingQuickReception) {
      setIsQuickReceptionLoading(true);
      setLoadingPatientName(pendingQuickReception.patient.name);
      await executeQuickReception(
        pendingQuickReception.patient,
        pendingQuickReception.targetReception
      );
    }
    setShowDuplicateReceptionConfirm(false);
    setPendingQuickReception(null);
  };

  // 이미 접수된 환자 확인 팝업에서 취소 클릭
  const handleCancelDuplicateQuickReception = () => {
    setShowDuplicateReceptionConfirm(false);
    setPendingQuickReception(null);
  };

  const handleNewPatientReception = () => {
    // 신규 환자 추가 시 초기 reception 생성
    const { openedReceptions } = useReceptionTabsStore.getState();
    const existingNewReception = openedReceptions.find(
      (r: any) => isNewRegistrationId(r.originalRegistrationId)
    );

    const applyAttachedClinicDefaults = (reception: any) => {
      reception.receptionInfo.receptionType = hospital?.isAttachedClinic === true ? 초재진.재진 : 초재진.초진;
      reception.receptionInfo.timeCategory = hospital?.isAttachedClinic === true ? 주간야간휴일구분.주간 : 주간야간휴일구분.주간;
    };

    if (existingNewReception) {
      const initialReception = ReceptionService.createInitialReception();
      initialReception.receptionDateTime = createReceptionDateTime(selectedDate);
      applyAttachedClinicDefaults(initialReception);
      setPendingReception(initialReception);
      setShowOverwriteConfirm(true);
    } else {
      const initialReception = ReceptionService.createInitialReception();
      // selectedDate의 날짜 부분 + 현재 시간으로 조합
      initialReception.receptionDateTime = createReceptionDateTime(selectedDate);
      applyAttachedClinicDefaults(initialReception);
      handleReceptionStoreUpdate(initialReception);
      // selectedPatientId는 board-patient에서 openedReceptionId 변경을 감지하여 자동으로 동기화됨
    }
  };

  const debouncedQuery = useDebounce(query, 300);

  // 검색 파라미터 생성 (메모이제이션하여 불필요한 재생성 방지)
  const params = useMemo(() => ({
    take: 20,
    sortBy: "lastEncounterDate",
    sortOrder: "desc",
    search: debouncedQuery,
  }), [debouncedQuery]);

  // React Query 훅 사용 (cursor 기반 무한 스크롤) - 검색어가 있을 때만 호출
  const {
    data: apiData,
    isLoading: apiIsLoading,
    isError: apiIsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchPatientsInfinite({
    ...params,
    enabled: !!debouncedQuery.trim(),
  } as any);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredPatients([]);
      return;
    }

    const pages = apiData?.pages ?? [];
    const items = pages.flatMap((page: any) => page?.items ?? []);
    if (items.length > 0) {
      const patients: Patient[] = items.map((item: any) => ({
        phone: item.phone1 ?? item.phone2 ?? "",
        ...item,
      }));
      setFilteredPatients(patients);
    } else if (apiIsError) {
      setFilteredPatients([]);
    }
  }, [
    debouncedQuery,
    apiData,
    apiIsError,
  ]);

  return {
    // 검색 결과
    filteredPatients,
    isLoading: apiIsLoading,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,

    // 팝업 상태
    showOverwriteConfirm,
    showDuplicateReceptionConfirm,
    showNoReceptionHistoryWarning,
    setShowNoReceptionHistoryWarning,
    showAppointmentFoundInfo,
    setShowAppointmentFoundInfo,
    showMultipleAppointmentsWarning,
    setShowMultipleAppointmentsWarning,
    isQuickReceptionLoading,
    loadingPatientName,

    // 자격조회 관련
    showQualificationComparePopup,
    qualificationCompareData,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,

    // 핸들러
    handlePatientSelect,
    handleQuickReception,
    handleOverwriteConfirm,
    handleOverwriteCancel,
    handleConfirmDuplicateQuickReception,
    handleCancelDuplicateQuickReception,
    handleNewPatientReception,
  };
}

