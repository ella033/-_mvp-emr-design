"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Patient } from "@/types/patient-types";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import MyPopup from "@/components/yjg/my-pop-up";
import DetailSearchBar from "./detail-search-bar";
import NhicForm from "@/components/nhic-form/nhic-form";
import { useReceptionSearchBarUI } from "@/hooks/reception/reception-search-bar/use-reception-search-bar-ui";
import { useToastHelpers } from "@/components/ui/toast";
import { ReceptionSearchBarDropdown } from "./reception-search-bar-dropdown";
import { useReceptionTabsStore, useReceptionStore } from "@/store/reception";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { ReceptionInitialTab, 접수상태 } from "@/constants/common/common-enum";
import {
  REGISTRATION_ID_NEW,
  normalizeRegistrationId,
  buildProvisionalRegistrationId,
} from "@/lib/registration-utils";
import { createReceptionDateTime } from "@/lib/date-utils";
import {
  ReceptionSearchContextMenu,
  type ReceptionSearchMenuAction,
} from "./reception-search-context-menu";
import { ConsentRequestModal } from "@/components/consent/consent-request-modal";
import AppointmentPopup from "@/components/appointment/appointment-popup";
import type { AppointmentPatient } from "@/types/patient-types";
import { getGender } from "@/lib/patient-utils";
import { ExaminationLabelPrintDialog } from "@/components/examination-label";
import { PatientLabelPrintDialog } from "@/components/patient-label";
import { RegistrationsService } from "@/services/registrations-service";
import type { Registration } from "@/types/registration-types";
import { useSelectedDate } from "@/store/reception";
import { calculateAge } from "@/lib/patient-utils";
import type { Gender } from "@/lib/label-printer";

interface ReceptionSearchBarProps {
  widthClassName?: string;
  onPatientSelect?: (patient: Patient) => void;
  /** true이면 환자 선택 시 접수 탭을 열지 않고 onPatientSelect만 호출 (예: 예약 패널) */
  disableDefaultBehavior?: boolean;
  /** true이면 드롭다운에서 빠른접수 버튼을 숨김 (예: 예약 패널) */
  hideQuickReception?: boolean;
}

function mapToLabelDialogPatient(params: { registration?: Registration }): {
  chartNumber: string;
  patientName: string;
  age: number;
  gender: Gender;
  birthDate: string;
  patientId?: number;
} | null {
  const patient = params.registration?.patient;
  if (!patient) return null;
  const birthDate = String((patient as { birthDate?: string }).birthDate ?? "");
  if (!birthDate) return null;
  const age = calculateAge(birthDate) ?? 0;
  const gender = mapNumericGenderToGender((patient as { gender?: number }).gender);
  const chartNumber = String(
    (patient as { patientNo?: string; id?: number }).patientNo ??
    (patient as { id?: number }).id ??
    ""
  );
  const patientName = String((patient as { name?: string }).name ?? "");
  const patientId =
    typeof (patient as { id?: number }).id === "number"
      ? (patient as { id: number }).id
      : undefined;
  if (!chartNumber || !patientName) return null;
  return {
    chartNumber,
    patientName,
    age,
    gender,
    birthDate,
    ...(patientId != null && { patientId }),
  };
}

function mapNumericGenderToGender(
  gender: number | string | null | undefined
): Gender {
  if (gender === 2 || gender === "F") return "F";
  return "M";
}

export default function ReceptionSearchBar({
  widthClassName = "w-[430px]",
  onPatientSelect,
  disableDefaultBehavior = false,
  hideQuickReception = false,
}: ReceptionSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const {
    // 상태
    query,
    setQuery,
    isFocused,
    setIsFocused,
    filteredPatients,
    selectedIndex,
    setSelectedIndex,
    resultsRef,
    isLoading,
    hasNextPage,
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
    showDetailedSearch,
    setShowDetailedSearch,
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
    handleDetailedSearch,
    handleNewPatientReception,
    handleKeyDown,
  } = useReceptionSearchBarUI({
    onPatientSelect,
    disableDefaultBehavior,
    inputRef,
  });

  const { error: showError, warning: showWarning } = useToastHelpers();
  const { addOpenedReception, setOpenedReceptionId, setInitialTab } =
    useReceptionTabsStore();
  const { getLatestReception } = usePatientReception();
  const selectedDate = useSelectedDate();
  const { registrations } = useReceptionStore();

  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    patient: Patient | null;
    /** 해당일 기존 접수 정보 (추가접수 활성화 여부 및 previousRegistrationId 판단용) */
    registrationToday: Registration | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    patient: null,
    registrationToday: null,
  });

  const [consentModalState, setConsentModalState] = useState<{
    isOpen: boolean;
    patient: Patient | null;
  }>({
    isOpen: false,
    patient: null,
  });

  // 환자/검사 라벨 출력 다이얼로그 (use-patient-card-context-menu와 동일)
  const [isPatientLabelDialogOpen, setIsPatientLabelDialogOpen] = useState(false);
  const [patientLabelDialogPatient, setPatientLabelDialogPatient] = useState<{
    chartNumber: string;
    patientName: string;
    age: number;
    gender: Gender;
    birthDate: string;
    patientId?: number;
  } | null>(null);
  const [isExaminationLabelDialogOpen, setIsExaminationLabelDialogOpen] =
    useState(false);
  const [examinationLabelEncounterId, setExaminationLabelEncounterId] =
    useState<string | null>(null);
  const [examinationLabelDialogPatient, setExaminationLabelDialogPatient] =
    useState<{
      chartNumber: string;
      patientName: string;
      age: number;
      gender: Gender;
      birthDate: string;
      patientId?: number;
      date?: string;
    } | null>(null);

  // 예약 생성 팝업 state
  const [isAppointmentPopupOpen, setIsAppointmentPopupOpen] = useState(false);
  const [appointmentPopupPatientInfo, setAppointmentPopupPatientInfo] =
    useState<AppointmentPatient | null>(null);

  const closeContextMenu = useCallback(() => {
    setContextMenuState((prev) =>
      prev.isOpen ? { ...prev, isOpen: false, patient: null, registrationToday: null } : prev
    );
  }, []);

  const handleContextMenuOpen = useCallback(
    (event: React.MouseEvent, patient: Patient, index: number) => {
      event.preventDefault();
      event.stopPropagation();
      setIsFocused(true);
      setSelectedIndex(index);
      // 해당일 기존 접수 정보 store에서 동기 조회 (추가접수 활성화 여부 판단용)
      const existingRegistration = registrations.find(
        (r) => r.patientId === patient.id
      ) ?? null;

      setContextMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        patient,
        registrationToday: existingRegistration,
      });
    },
    [setIsFocused, setSelectedIndex, registrations]
  );

  const formatDateParam = useCallback(
    (value: Date | string | number | undefined | null): string | null => {
      if (!value) return null;
      const date =
        value instanceof Date ? value : new Date(String(value).trim());
      if (Number.isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
    []
  );

  const handleCreateReservation = useCallback(
    (patient: Patient) => {
      if (!patient) return;

      const patientInfo: AppointmentPatient = {
        id: patient.id,
        name: patient.name || "",
        rrn: (patient as any).rrn || "",
        phone: (patient as any).phone1 || (patient as any).phone2 || "",
        birthDate: (patient as any).birthDate || "",
        gender:
          typeof patient.gender === "number"
            ? getGender(patient.gender, "ko")
            : "",
        patientNo: (patient as any).patientNo || 0,
      };

      setAppointmentPopupPatientInfo(patientInfo);
      setIsAppointmentPopupOpen(true);
    },
    []
  );

  const openReceptionWithTab = useCallback(
    async (patient: Patient, tab: ReceptionInitialTab) => {
      try {
        const latestReception = await getLatestReception(patient, true);
        if (!latestReception) {
          showError(
            "환자 정보를 열 수 없습니다.",
            "최근 접수 내역이 없습니다."
          );
          return;
        }

        const normalizedId =
          normalizeRegistrationId(latestReception.originalRegistrationId) ||
          REGISTRATION_ID_NEW;

        setInitialTab(tab);
        addOpenedReception({
          ...latestReception,
          originalRegistrationId: normalizedId,
        });
        setOpenedReceptionId(normalizedId);
      } catch (err) {
        console.error("[reception-search-bar] 탭 열기 실패:", err);
        showError(
          "환자 정보를 열 수 없습니다.",
          err instanceof Error ? err.message : "다시 시도해주세요."
        );
      }
    },
    [
      addOpenedReception,
      getLatestReception,
      setInitialTab,
      setOpenedReceptionId,
      showError,
    ]
  );

  const handleContextMenuSelect = useCallback(
    async (action: ReceptionSearchMenuAction) => {
      const targetPatient = contextMenuState.patient;
      const registrationToday = contextMenuState.registrationToday;
      if (!targetPatient) return;

      closeContextMenu();

      switch (action) {
        case "addRegistration": {
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          try {
            const latestReception = await getLatestReception(targetPatient, true);
            if (!latestReception) {
              showError(
                "환자 정보를 열 수 없습니다.",
                "최근 접수 내역이 없습니다."
              );
              break;
            }

            const provisionalId = buildProvisionalRegistrationId(
              `${targetPatient.id}-${Date.now()}`
            );
            const receptionDateTime = createReceptionDateTime(selectedDate);

            // 기준 접수의 status가 대기(0) 또는 진료중(1)이면 previousRegistrationId 설정
            const previousRegistrationId =
              registrationToday &&
                (registrationToday.status === 접수상태.대기 ||
                  registrationToday.status === 접수상태.진료중)
                ? String(registrationToday.id)
                : null;

            const receptionToOpen = {
              ...latestReception,
              receptionDateTime,
              patientStatus: {
                ...latestReception.patientStatus,
                status: 접수상태.대기,
              },
              receptionInfo: {
                ...latestReception.receptionInfo,
                status: 접수상태.대기,
                encounters: null,
                paymentInfo: { totalAmount: 0, payments: [] },
                hasReceipt: false,
                previousRegistrationId,
              },
              originalRegistrationId: provisionalId,
            };

            setInitialTab(ReceptionInitialTab.환자정보);
            addOpenedReception(receptionToOpen);
            setOpenedReceptionId(provisionalId);
          } catch (err) {
            console.error("[reception-search-bar] 추가 접수 탭 열기 실패:", err);
            showError(
              "환자 정보를 열 수 없습니다.",
              err instanceof Error ? err.message : "다시 시도해주세요."
            );
          }
          break;
        }
        case "quickReception": {
          const fakeEvent = {
            stopPropagation: () => { },
            preventDefault: () => { },
          } as unknown as React.MouseEvent;
          await handleQuickReception(fakeEvent, targetPatient);
          break;
        }
        case "reservation":
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          await handleCreateReservation(targetPatient);
          break;
        case "patientChart":
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          await openReceptionWithTab(
            targetPatient,
            ReceptionInitialTab.처방조회
          );
          break;
        case "insuranceHistory":
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          await openReceptionWithTab(
            targetPatient,
            ReceptionInitialTab.보험이력변경
          );
          break;
        case "printCenter":
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          await openReceptionWithTab(
            targetPatient,
            ReceptionInitialTab.출력센터
          );
          break;
        case "consent":
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          setConsentModalState({
            isOpen: true,
            patient: targetPatient,
          });
          break;
        case "patientLabelPrint": {
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          try {
            const baseDate = formatDateParam(selectedDate) ?? formatDateParam(new Date());
            const registration = await RegistrationsService.getLatestRegistration(
              String(targetPatient.id),
              baseDate ?? undefined
            );
            if (!registration) {
              showWarning("환자 라벨 출력을 실행할 수 없습니다.");
              break;
            }
            const labelPatient = mapToLabelDialogPatient({ registration });
            if (!labelPatient) {
              showWarning("환자 라벨 출력을 실행할 수 없습니다.");
              break;
            }
            setPatientLabelDialogPatient(labelPatient);
            setIsPatientLabelDialogOpen(true);
          } catch (err) {
            console.error("환자 라벨 출력 데이터 준비 실패:", err);
            showWarning("환자 라벨 출력을 실행할 수 없습니다.");
          }
          break;
        }
        case "examinationLabelPrint": {
          setIsFocused(false);
          setQuery("");
          inputRef.current?.blur();
          try {
            const baseDate = formatDateParam(selectedDate) ?? formatDateParam(new Date());
            const registration = await RegistrationsService.getLatestRegistration(
              String(targetPatient.id),
              baseDate ?? undefined
            );
            if (!registration) {
              showWarning("검사 라벨 출력을 실행할 수 없습니다.");
              break;
            }
            const labelPatient = mapToLabelDialogPatient({ registration });
            if (!labelPatient) {
              showWarning("검사 라벨 출력을 실행할 수 없습니다.");
              break;
            }
            const encounterId =
              registration?.encounters?.[0]?.id ??
              (await RegistrationsService.getRegistration(registration.id))
                ?.encounters?.[0]?.id ??
              String(registration.id);
            const treatmentDate =
              registration.receptionDateTime?.slice(0, 10) ??
              registration.encounters?.[0]?.encounterDateTime?.slice(0, 10) ??
              new Date().toISOString().slice(0, 10);
            setExaminationLabelEncounterId(String(encounterId));
            setExaminationLabelDialogPatient({
              ...labelPatient,
              date: treatmentDate,
            });
            setIsExaminationLabelDialogOpen(true);
          } catch (err) {
            console.error("검사 라벨 출력 데이터 준비 실패:", err);
            showWarning("검사 라벨 출력을 실행할 수 없습니다.");
          }
          break;
        }
        default:
          break;
      }
    },
    [
      closeContextMenu,
      contextMenuState.patient,
      contextMenuState.registrationToday,
      formatDateParam,
      getLatestReception,
      handleCreateReservation,
      handleQuickReception,
      inputRef,
      openReceptionWithTab,
      selectedDate,
      addOpenedReception,
      setOpenedReceptionId,
      setInitialTab,
      setQuery,
      setIsFocused,
      showError,
      showWarning,
    ]
  );

  // 해당일 기존 접수가 없으면 추가접수 비활성화
  const contextMenuDisabledActions = useMemo(() => {
    const disabled = new Set<ReceptionSearchMenuAction>();
    if (!contextMenuState.registrationToday) {
      disabled.add("addRegistration");
    }
    return disabled;
  }, [contextMenuState.registrationToday]);

  useEffect(() => {
    if (!contextMenuState.isOpen) return;
    const handleClose = () => closeContextMenu();
    document.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [closeContextMenu, contextMenuState.isOpen]);

  // 드롭다운 위치 계산
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // 드롭다운 너비는 input 너비와 동일하게 설정
    let width = rect.width;
    let left = rect.left;

    // 오른쪽으로 나가면 조정
    if (left + width > viewportWidth) {
      left = Math.max(10, viewportWidth - width - 10);
    }

    // 왼쪽으로 나가면 조정
    if (left < 0) {
      left = 10;
      // 너비도 조정
      width = Math.min(width, viewportWidth - 20);
    }

    setDropdownPosition({
      top: rect.bottom + 4, // 4px 여백 (fixed positioning이므로 scrollY 불필요)
      left: left,
      width: width,
    });
  }, []);

  // 위치 업데이트
  useEffect(() => {
    if (isFocused) {
      updateDropdownPosition();
    }
  }, [isFocused, updateDropdownPosition, filteredPatients.length, isLoading]);

  // 스크롤 및 리사이즈 시 위치 업데이트
  useEffect(() => {
    if (!isFocused) return;

    const handleUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isFocused, updateDropdownPosition]);

  return (
    <div className={`relative ${widthClassName}`} data-testid="reception-search-bar">
      <Search className="absolute w-4 h-4 left-3 top-1.5 text-muted-foreground" />
      <Input
        ref={inputRef}
        data-testid="reception-search-input"
        placeholder="환자 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 h-7 bg-[var(--bg-main)] leading-7 focus-visible:ring-transparent"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
      />
      {/* 검색 결과 드롭다운 */}
      <ReceptionSearchBarDropdown
        isOpen={isFocused}
        position={dropdownPosition}
        query={query}
        filteredPatients={filteredPatients}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        selectedIndex={selectedIndex}
        resultsRef={resultsRef}
        onKeyDown={handleKeyDown}
        onPatientSelect={handlePatientSelect}
        onQuickReception={hideQuickReception ? undefined : handleQuickReception}
        onContextMenuOpen={handleContextMenuOpen}
        onSelectedIndexChange={setSelectedIndex}
        onDetailedSearch={() => {
          setIsFocused(false);
          handleDetailedSearch();
        }}
        onNewPatientReception={handleNewPatientReception}
        hideQuickReception={hideQuickReception}
      />

      <MyPopupYesNo
        isOpen={showOverwriteConfirm}
        onCloseAction={handleOverwriteCancel}
        onConfirmAction={handleOverwriteConfirm}
        title=""
        message={`작성중인 환자내역이 있습니다.\n덮어쓰시겠습니까?`}
      />

      {/* 이미 접수된 환자 확인 팝업 */}
      <MyPopupYesNo
        isOpen={showDuplicateReceptionConfirm}
        onCloseAction={handleCancelDuplicateQuickReception}
        onConfirmAction={handleConfirmDuplicateQuickReception}
        title="이미 접수된 환자"
        message={`이미접수된 환자 입니다.\n접수하시겠습니까?`}
        confirmText="접수"
        cancelText="취소"
      />

      <MyPopup
        isOpen={showDetailedSearch}
        onCloseAction={() => setShowDetailedSearch(false)}
        title="상세검색"
        testId="reception-detail-search-modal"
        width="1000px"
        height="900px"
      >
        <DetailSearchBar
          onPatientSelect={(patient) => {
            handlePatientSelect(patient);
            setShowDetailedSearch(false);
          }}
        />
      </MyPopup>

      {isQuickReceptionLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
            {/* 로딩 스피너 */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[var(--main-color)] rounded-full animate-spin"></div>
            </div>

            {/* 로딩 텍스트 */}
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-gray-800">
                빠른 접수 진행 중
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-[var(--main-color)]">
                  {loadingPatientName}
                </span>{" "}
                환자
              </p>
              <p className="text-xs text-gray-500">
                자격조회 및 접수 처리 중입니다...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 자격조회 비교 모드 팝업 */}
      <MyPopup
        isOpen={showQualificationComparePopup && !!qualificationCompareData}
        onCloseAction={handleQualificationCompareCancelPromise}
        title="자격조회 비교"
        width="800px"
        height="600px"
        closeOnOutsideClick={false}
      >
        <NhicForm
          isOpen={showQualificationComparePopup}
          onClose={handleQualificationCompareCancelPromise}
          onApply={handleQualificationCompareApplyPromise}
          onCancel={handleQualificationCompareCancelPromise}
          isCompareMode={true}
          parsedData={qualificationCompareData?.parsedData}
          rawData={null}
        />
      </MyPopup>

      {/* 기접수내역 없음 경고 팝업 */}
      <MyPopupMsg
        isOpen={showNoReceptionHistoryWarning}
        onCloseAction={() => setShowNoReceptionHistoryWarning(false)}
        title="빠른접수"
        msgType="warning"
        message="기접수내역이 없어 빠른접수를 이용할 수 없습니다."
      />

      {/* 오늘 예약내역 불러옴 알림 */}
      <MyPopupMsg
        isOpen={showAppointmentFoundInfo}
        onCloseAction={() => setShowAppointmentFoundInfo(false)}
        title="예약 내역"
        msgType="info"
        message="당일 예약내역이 있어 해당 예약내역을 불러옵니다."
      />

      {/* 당일 예약 여러 건 경고 */}
      <MyPopupMsg
        isOpen={showMultipleAppointmentsWarning}
        onCloseAction={() => setShowMultipleAppointmentsWarning(false)}
        title="예약 내역"
        msgType="warning"
        message="당일 예약건이 여러 건 있습니다. 확인바랍니다."
      />

      <ReceptionSearchContextMenu
        isOpen={contextMenuState.isOpen}
        position={contextMenuState.position}
        onClose={closeContextMenu}
        onSelect={handleContextMenuSelect}
        disabledActions={contextMenuDisabledActions}
      />

      {consentModalState.patient && (
        <ConsentRequestModal
          isOpen={consentModalState.isOpen}
          onClose={() => setConsentModalState({ isOpen: false, patient: null })}
          patientId={consentModalState.patient.id}
          patientName={consentModalState.patient.name}
        />
      )}

      {/* 환자 라벨 출력 (use-patient-card-context-menu와 동일) */}
      {patientLabelDialogPatient && (
        <PatientLabelPrintDialog
          open={isPatientLabelDialogOpen}
          onOpenChange={(nextOpen) => {
            setIsPatientLabelDialogOpen(nextOpen);
            if (!nextOpen) setPatientLabelDialogPatient(null);
          }}
          patient={patientLabelDialogPatient}
        />
      )}

      {/* 검사 라벨 출력 (use-patient-card-context-menu와 동일) */}
      {examinationLabelEncounterId && (
        <ExaminationLabelPrintDialog
          open={isExaminationLabelDialogOpen}
          onOpenChange={(nextOpen) => {
            setIsExaminationLabelDialogOpen(nextOpen);
            if (!nextOpen) {
              setExaminationLabelEncounterId(null);
              setExaminationLabelDialogPatient(null);
            }
          }}
          patient={examinationLabelDialogPatient}
          encounterId={examinationLabelEncounterId}
          date={examinationLabelDialogPatient?.date}
        />
      )}

      {/* 예약 생성 팝업 */}
      <AppointmentPopup
        isOpen={isAppointmentPopupOpen}
        onClose={() => {
          setIsAppointmentPopupOpen(false);
          setAppointmentPopupPatientInfo(null);
        }}
        mode="create"
        patientInfo={appointmentPopupPatientInfo}
      />
    </div>
  );
}
