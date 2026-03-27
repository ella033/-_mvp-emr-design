import { useEffect, useState, useRef } from "react";
import type { Patient } from "@/types/patient-types";
import { useReceptionSearchBar } from "./use-reception-search-bar";

interface UseReceptionSearchBarUIProps {
  onPatientSelect?: (patient: Patient) => void;
  /** true이면 환자 선택 시 접수 탭을 열지 않고 onPatientSelect만 호출 */
  disableDefaultBehavior?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null> | React.RefObject<HTMLInputElement>;
}

export function useReceptionSearchBarUI({
  onPatientSelect,
  disableDefaultBehavior = false,
  inputRef,
}: UseReceptionSearchBarUIProps) {
  // UI 상태 관리
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showDetailedSearch, setShowDetailedSearch] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 비즈니스 로직 훅 사용
  const businessLogic = useReceptionSearchBar({
    onPatientSelect,
    disableDefaultBehavior,
    query,
  });

  const {
    filteredPatients,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handlePatientSelect: businessHandlePatientSelect,
    handleQuickReception,
    handleNewPatientReception,
  } = businessLogic;

  // 환자 선택 핸들러 (UI 로직 포함)
  const handlePatientSelect = async (patient: Patient) => {
    // UI 상태 초기화
    setIsFocused(false);
    setQuery("");
    inputRef.current?.blur();

    // 비즈니스 로직 실행
    await businessHandlePatientSelect(patient);
  };

  // 검색 결과가 변경되면 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredPatients.length, query]);

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || filteredPatients.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (selectedIndex < filteredPatients.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        } else {
          setSelectedIndex(0);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        } else {
          setSelectedIndex(filteredPatients.length - 1);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPatients.length) {
          const selectedPatient = filteredPatients[selectedIndex];
          if (selectedPatient) {
            handlePatientSelect(selectedPatient);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        setQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-patient-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // 빠른 접수 핸들러 (UI 상태 포함)
  const handleQuickReceptionWithUI = async (
    e: React.MouseEvent,
    patient: Patient
  ) => {
    // UI 상태 초기화
    setIsFocused(false);
    setQuery("");
    inputRef.current?.blur();

    // 비즈니스 로직 실행
    await handleQuickReception(e, patient);
  };

  // 신환 접수 핸들러 (UI 상태 포함)
  const handleNewPatientReceptionWithUI = () => {
    // UI 상태 초기화
    setIsFocused(false);
    setQuery("");
    inputRef.current?.blur();

    // 비즈니스 로직 실행
    handleNewPatientReception();
  };

  const handleDetailedSearch = () => {
    setShowDetailedSearch(true);
  };

  return {
    // UI 상태
    query,
    setQuery,
    isFocused,
    setIsFocused,
    selectedIndex,
    setSelectedIndex,
    resultsRef,
    showDetailedSearch,
    setShowDetailedSearch,

    // 비즈니스 로직에서 가져온 값들
    filteredPatients,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,

    // 팝업 상태
    showOverwriteConfirm: businessLogic.showOverwriteConfirm,
    showDuplicateReceptionConfirm: businessLogic.showDuplicateReceptionConfirm,
    showNoReceptionHistoryWarning: businessLogic.showNoReceptionHistoryWarning,
    setShowNoReceptionHistoryWarning: businessLogic.setShowNoReceptionHistoryWarning,
    showAppointmentFoundInfo: businessLogic.showAppointmentFoundInfo,
    setShowAppointmentFoundInfo: businessLogic.setShowAppointmentFoundInfo,
    showMultipleAppointmentsWarning: businessLogic.showMultipleAppointmentsWarning,
    setShowMultipleAppointmentsWarning: businessLogic.setShowMultipleAppointmentsWarning,
    isQuickReceptionLoading: businessLogic.isQuickReceptionLoading,
    loadingPatientName: businessLogic.loadingPatientName,

    // 자격조회 관련
    showQualificationComparePopup: businessLogic.showQualificationComparePopup,
    qualificationCompareData: businessLogic.qualificationCompareData,
    handleQualificationCompareApplyPromise: businessLogic.handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise: businessLogic.handleQualificationCompareCancelPromise,

    // 핸들러
    handlePatientSelect,
    handleQuickReception: handleQuickReceptionWithUI,
    handleOverwriteConfirm: businessLogic.handleOverwriteConfirm,
    handleOverwriteCancel: businessLogic.handleOverwriteCancel,
    handleConfirmDuplicateQuickReception: businessLogic.handleConfirmDuplicateQuickReception,
    handleCancelDuplicateQuickReception: businessLogic.handleCancelDuplicateQuickReception,
    handleDetailedSearch,
    handleNewPatientReception: handleNewPatientReceptionWithUI,
    handleKeyDown,
  };
}

