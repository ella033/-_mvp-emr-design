import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useHospitalStore } from "@/store/hospital-store";
import { useReceptionStore, useReceptionTabsStore, useSelectedDate } from "@/store/reception";
import { useRegistrationsByHospital } from "@/hooks/registration/use-registrations-by-hospital";
import { usePatientFamiliesByPatient } from "@/hooks/patient-family/use-patient-families-by-patient";
import { useVitalSignMeasurements } from "@/hooks/vital-sign-measurement/use-vital-sign-measurements";
import { formatDateByPattern } from "@/lib/date-utils";
import { useToastHelpers } from "@/components/ui/toast";
import { setEligibilityResponseToInsuranceInfo } from "@/lib/eligibility-utils";
import { VALIDATE_MSG } from "@/constants/validate-constants";
import {
  usePatientReception,
} from "@/hooks/reception/use-patient-reception";
import { useOpenNewReceptionTab } from "@/hooks/reception/use-open-new-reception-tab";
import { getResidentRegistrationNumberWithNumberString } from "@/lib/patient-utils";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { useClear } from "@/contexts/ClearContext";
import type {
  VitalReceptionInfoType,
  Reception,
} from "@/types/common/reception-types";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import type { components } from "@/generated/api/types";
import { ReceptionService } from "@/services/reception-service";
import {
  isNewRegistrationId,
  normalizeRegistrationId,
} from "@/lib/registration-utils";
import { 접수상태 } from "@/constants/common/common-enum";
import type { Registration } from "@/types/registration-types";

// 데이터 타입 정의
interface PatientDataState {
  registration: any; // 등록 관련 데이터
  vital: any[]; // 바이탈 데이터
  family: any[]; // 가족 정보
  insurance: Partial<InsuranceInfo> | undefined; // 보험 정보
}

// 로딩 상태 통합 관리
interface LoadingState {
  registration: boolean;
  vital: boolean;
  family: boolean;
  all: boolean;
}

// 접수 필수 입력 항목 검증
function validateReceptionInfo(patientBaseInfo: any): string | null {
  const rules = [
    {
      ok: patientBaseInfo.name?.trim() !== "",
      msg: VALIDATE_MSG.RECEPTION.NAME_REQUIRED,
    },
    {
      ok: patientBaseInfo.rrn?.trim() !== "",
      msg: VALIDATE_MSG.RECEPTION.RRN_REQUIRED,
    },
    {
      ok: patientBaseInfo.facilityId && patientBaseInfo.facilityId !== 0,
      msg: VALIDATE_MSG.RECEPTION.FACILITY_REQUIRED,
    },
  ];
  const failed = rules.find((r) => !r.ok);
  return failed ? failed.msg : null;
}

/**
 * PatientInfo 도메인/서비스 전용 훅
 *
 * - 기존 usePatientInfo 훅의 모든 비즈니스/데이터 로직을 포함하는 단일 소스입니다.
 * - UI 훅(usePatientInfoUi)은 이 훅에서 노출하는 상태 중 UI 관련 부분만 선택적으로 사용합니다.
 */
export const usePatientInfoService = (options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
  /**
   * unsaved(dirty) 판단/해제를 외부에서 주입할 수 있다.
   * - /reception(탭/다중 환자): 기본값(reception-tabs-store 기반)
   * - /medical(단독 1건): 로컬(draft/baseline) 기반으로 분리 가능
   */
  unsavedChanges?: {
    check: (receptionId?: string) => boolean;
    markClean?: (receptionId: string) => void;
  };
}) => {
  //#region Dependencies & Services
  const queryClient = useQueryClient();
  const { hospital } = useHospitalStore();
  const { clearAll, setEnabled } = useClear();
  const { success, error } = useToastHelpers();
  const selectedDate = useSelectedDate();
  //#endregion

  //#region State Management
  // Reception Stores
  const { registrations } = useReceptionStore();
  const {
    openedReceptions,
    openedReceptionId,
    setOpenedReceptionId,
    removeOpenedReception,
    refreshOpenedReceptions,
    updateInsuranceInfo,
    updateOpenedReception,
    markReceptionAsUnchanged,
    calculateNewActiveReceptionId,
    hasCurrentReceptionChanges,
    hasReceptionChanges,
  } = useReceptionTabsStore();
  const { openNewReceptionTab } = useOpenNewReceptionTab({
    onError: (_title, message) => error(message),
  });

  // Local States
  const [currentInsuranceInfo, setCurrentInsuranceInfo] = useState<
    Partial<InsuranceInfo> | undefined
  >();
  const [actionType, setActionType] = useState<"저장" | "접수" | "취소">(
    "접수"
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");

  // 통합 상태 관리
  const [loadingState, setLoadingState] = useState<LoadingState>({
    registration: false,
    vital: false,
    family: false,
    all: false,
  });

  const [dataState, setDataState] = useState<PatientDataState>({
    registration: null,
    vital: [],
    family: [],
    insurance: undefined,
  });

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const newVitalMeasurementsRef = useRef<VitalReceptionInfoType[]>([]);
  //#endregion

  //#region Current Reception & Computed Values
  // 통합된 activeReceptionId 계산
  // 우선순위: options.receptionId > openedReceptionId
  const activeReceptionId = useMemo(() => {
    if (options?.receptionId !== undefined) {
      return options.receptionId;
    }
    return openedReceptionId;
  }, [options?.receptionId, openedReceptionId]);

  const getCurrentReception = useCallback(() => {
    if (options?.reception !== undefined) {
      return options.reception;
    }

    if (!activeReceptionId) {
      return undefined;
    }

    // openedReceptions에서 먼저 찾기 (신규 환자 "new", "0" 포함)
    const foundInOpened = openedReceptions.find(
      (r) => r.originalRegistrationId === activeReceptionId
    );
    if (foundInOpened) {
      return foundInOpened;
    }

    const registration = registrations.find(
      (r) => r.id === activeReceptionId
    );
    if (registration) {
      return ReceptionService.convertRegistrationToReception(registration);
    }

    return undefined;
  }, [
    options?.reception,
    activeReceptionId,
    openedReceptions,
    registrations,
  ]);

  const currentReception = getCurrentReception();
  const currentPatientInfo = currentReception?.patientBaseInfo as any;

  // 현재 환자 ID 계산
  const currentPatientId =
    currentPatientInfo?.patientId ||
    "0";

  // openedReceptions 정보 (버튼 표시 여부 등에 사용)
  const hasOpenedReceptions = useMemo(() => {
    if (options?.reception || options?.receptionId) {
      return true;
    }
    return openedReceptions.length > 0;
  }, [options?.reception, options?.receptionId, openedReceptions.length]);
  //#endregion

  //#region API Hooks
  const { handleMarkAsVisited } = useHandleAppointment();

  // Queries
  const hospitalIdStr = hospital?.id?.toString() ?? "";
  const selectedDateStr = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.getFullYear() +
      "-" +
      String(selectedDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(selectedDate.getDate()).padStart(2, "0");
  }, [selectedDate]);
  const registrationsBeginDateForRefetch = useMemo(() => selectedDate ? new Date(selectedDate) : null, [selectedDateStr]);
  const registrationsEndDateForRefetch = useMemo(() => selectedDate ? new Date(selectedDate) : null, [selectedDateStr]);
  const { refetch: refetchRegistrations } =
    useRegistrationsByHospital(hospitalIdStr, registrationsBeginDateForRefetch, registrationsEndDateForRefetch);

  const {
    data: family,
    isLoading: familyLoading,
    isFetching: familyFetching,
    refetch: refetchFamilies,
  } = usePatientFamiliesByPatient(Number(currentPatientId) ?? null);

  // selectedDate를 사용하여 날짜 범위 설정 (YYYY-MM-DD 형식)
  const vitalDateStr = useMemo(() => {
    const target = selectedDate ?? new Date();
    return formatDateByPattern(target, "YYYY-MM-DD");
  }, [selectedDate]);

  const {
    data: vital,
    isLoading: vitalLoading,
    isFetching: vitalFetching,
    refetch: refetchVital,
  } = useVitalSignMeasurements(
    Number(currentPatientId) ?? 0,
    vitalDateStr,
    vitalDateStr
  );

  // Vital 데이터를 currentReception에 업데이트
  useEffect(() => {
    if (vital && vital.length > 0 && activeReceptionId) {
      // 로컬에서 변경 중이면 서버 데이터로 덮어쓰지 않음
      if (hasReceptionChanges(activeReceptionId)) {
        return;
      }

      // 기존 데이터와 비교하여 변경된 경우에만 업데이트
      const currentReception = openedReceptions.find(
        (r) => r.originalRegistrationId === activeReceptionId
      );

      if (currentReception) {
        const existingVitalLength =
          currentReception.bioMeasurementsInfo?.vital?.length || 0;
        const newVitalLength = vital.length;

        // openedReceptions의 vital 데이터가 API의 vital 데이터보다 더 많은 경우
        // (사용자가 직접 입력한 데이터가 있는 경우) 업데이트하지 않음
        if (existingVitalLength > newVitalLength) {
          return;
        }

        // 데이터 길이가 다르거나 기존 데이터가 없는 경우에만 업데이트
        if (
          existingVitalLength !== newVitalLength ||
          existingVitalLength === 0
        ) {
          updateOpenedReception(activeReceptionId, {
            bioMeasurementsInfo: {
              ...currentReception.bioMeasurementsInfo,
              vital: vital.map((v) => ({
                id: v.id,
                measurementDateTime: v.measurementDateTime,
                itemId: v.itemId,
                value: v.value?.toString() || "0",
                memo: v.memo || "",
                vitalSignItem: v.vitalSignItem || null,
              })),
            },
          });
        }
      }
    }
  }, [
    vital,
    activeReceptionId,
    openedReceptions,
    updateOpenedReception,
    options?.receptionId,
    hasReceptionChanges,
  ]);

  // Family 데이터를 currentReception에 업데이트
  useEffect(() => {
    if (family && family.length > 0 && activeReceptionId) {
      const currentReception = openedReceptions.find(
        (r) => r.originalRegistrationId === activeReceptionId
      );

      if (currentReception) {
        // Reception store 업데이트
        updateOpenedReception(activeReceptionId, {
          patientBaseInfo: {
            ...currentReception.patientBaseInfo,
            family: family.map((f) => ({
              id: f.id,
              patientFamilyId: f.patientFamilyId,
              name: f.patientFamily?.name || "",
              birthDate: f.patientFamily?.birthDate || "",
              rrn: f.patientFamily?.rrn || "",
              phone1: f.patientFamily?.phone1 || "",
              phone2: "",
              relation: f.relationType,
              createId: f.createId,
              createDateTime: f.createDateTime,
              updateId: f.updateId,
              updateDateTime: f.updateDateTime,
            })),
          },
        });
      }
    }
  }, [
    family,
    activeReceptionId,
    openedReceptions,
    updateOpenedReception,
    options?.receptionId,
  ]);
  //#endregion

  //#region 개별 데이터 관리 함수들

  /**
   * 등록 관련 데이터 가져오기 (BasicInfo, MedicalInfo, ReceptionInfo, ChronicInfo용)
   */
  const getRegistrationData = useCallback(async () => {
    try {
      setLoadingState((prev) => ({ ...prev, registration: true }));

      const data = await refetchRegistrations();

      // 서버에서 가져온 데이터로 openedReceptions 업데이트
      if (data?.data) {
        refreshOpenedReceptions(data.data);
      } else {
      }

      setDataState((prev) => ({ ...prev, registration: data }));
      return data;
    } catch (error) {
      console.error("Registration data fetch failed:", error);
      throw error;
    } finally {
      setLoadingState((prev) => ({ ...prev, registration: false }));
    }
  }, [refetchRegistrations, refreshOpenedReceptions]);

  /**
   * 바이탈 데이터 가져오기 (VitalAndBst용)
   */
  const getVitalData = useCallback(async () => {
    if (!currentPatientId || currentPatientId === "0") return [];

    try {
      setLoadingState((prev) => ({ ...prev, vital: true }));

      const vitalData = await refetchVital();

      // currentReception에 바이탈 데이터 업데이트는 기존 useEffect에서 처리

      setDataState((prev) => ({ ...prev, vital: vitalData?.data || [] }));
      return vitalData?.data || [];
    } catch (error) {
      console.error("Vital data fetch failed:", error);
      throw error;
    } finally {
      setLoadingState((prev) => ({ ...prev, vital: false }));
    }
  }, [currentPatientId, refetchVital]);

  /**
   * 가족 정보 가져오기 (FamilyInfo용)
   */
  const getFamilyData = useCallback(async () => {
    if (!currentPatientId || currentPatientId === "0") return [];

    try {
      setLoadingState((prev) => ({ ...prev, family: true }));

      const familyData = await refetchFamilies();

      // currentReception에 가족 데이터 업데이트는 기존 useEffect에서 처리

      setDataState((prev) => ({ ...prev, family: familyData?.data || [] }));
      return familyData?.data || [];
    } catch (error) {
      console.error("Family data fetch failed:", error);
      throw error;
    } finally {
      setLoadingState((prev) => ({ ...prev, family: false }));
    }
  }, [currentPatientId, refetchFamilies]);
  //#endregion

  //#region Effects
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Update insurance info when reception changes (/medical 외부 receptionId 지원)
  useEffect(() => {
    // 1. /medical 등에서 외부 receptionId가 명시적으로 전달된 경우
    //    -> 항상 getCurrentReception()을 기준으로 insuranceInfo를 계산
    if (options?.receptionId !== undefined) {
      const reception = getCurrentReception();
      if (reception?.insuranceInfo) {
        setCurrentInsuranceInfo(reception.insuranceInfo);
      } else {
        setCurrentInsuranceInfo(undefined);
      }
      return;
    }

    // 2. 일반 탭 모드인 경우 (activeReceptionId 기반)
    if (!activeReceptionId) {
      setCurrentInsuranceInfo(undefined);
      return;
    }

    // 신규 환자든 기존 환자든 해당하는 reception의 insuranceInfo 사용
    const targetReceptionId =
      activeReceptionId === "new" ? "new" : activeReceptionId;
    const newReception = openedReceptions.find(
      (r) => r.originalRegistrationId === targetReceptionId
    );
    if (newReception?.insuranceInfo) {
      setCurrentInsuranceInfo(newReception.insuranceInfo);
    } else {
      setCurrentInsuranceInfo(undefined);
    }
  }, [
    activeReceptionId,
    openedReceptions,
    getCurrentReception,
    options?.receptionId,
  ]);

  // Handle opened reception changes
  useEffect(() => {
    // 외부 receptionId가 전달된 경우는 독립 인스턴스이므로 항상 활성화
    if (options?.receptionId !== undefined) {
      setEnabled(true);
      return;
    }

    // Enable/disable components based on opened receptions
    if (openedReceptions.length === 0) {
      setEnabled(false);
    } else {
      setEnabled(true);
    }
  }, [
    openedReceptions,
    setEnabled,
    options?.receptionId,
  ]);

  // Clear remaining receptions event listener
  useEffect(() => {
    const handleClearRemainingReceptions = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { remainingReceptions, newActiveReceptionId } = customEvent.detail;

      if (remainingReceptions.length > 0 && newActiveReceptionId) {
        // Components will automatically load new data based on updated openedReceptionId
      } else {
        await clearAll();
      }

      return undefined;
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        "clearRemainingReceptions",
        handleClearRemainingReceptions
      );
      return () => {
        window.removeEventListener(
          "clearRemainingReceptions",
          handleClearRemainingReceptions
        );
      };
    }

    return undefined;
  }, [clearAll]);
  //#endregion

  //#region Helper Functions
  const refreshPatientInfo = useCallback(
    async (refreshed: any) => {
      refreshOpenedReceptions(refreshed);
      await refetchFamilies();
      await refetchVital();
    },
    [refreshOpenedReceptions, refetchFamilies, refetchVital]
  );

  //#region 통합 관리 함수들

  /**
   * 모든 데이터를 한번에 가져오기
   */
  const getAllData = useCallback(async () => {
    try {
      setLoadingState((prev) => ({ ...prev, all: true }));

      const results = await Promise.allSettled([
        getRegistrationData(),
        getVitalData(),
        getFamilyData(),
      ]);

      // 에러 처리
      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map((result) => result.reason);

      if (errors.length > 0) {
        console.error("Some data fetches failed:", errors);
        error("일부 데이터를 불러오는데 실패했습니다.");
      }

      return {
        registration:
          results[0].status === "fulfilled" ? results[0].value : null,
        vital: results[1].status === "fulfilled" ? results[1].value : [],
        family: results[2].status === "fulfilled" ? results[2].value : [],
      };
    } catch (err) {
      console.error("Get all data failed:", err);
      throw err;
    } finally {
      setLoadingState((prev) => ({ ...prev, all: false }));
    }
  }, [getRegistrationData, getVitalData, getFamilyData, error]);

  const refreshAllData = useCallback(async () => {
    try {
      if (currentPatientId && currentPatientId !== "0") {
        await queryClient.invalidateQueries({
          queryKey: ["patient-families", Number(currentPatientId)],
        });
        await queryClient.invalidateQueries({
          queryKey: [
            "vital-sign-measurements",
            hospital?.id,
            Number(currentPatientId),
          ],
        });
      }

      // vital과 family 데이터만 다시 가져오기 (registration 데이터는 제외)
      await Promise.allSettled([getVitalData(), getFamilyData()]);

    } catch (err) {
      console.error("Refresh all data failed:", err);
      error("데이터 새로고침에 실패했습니다.");
    }
  }, [
    queryClient,
    currentPatientId,
    hospital?.id,
    getVitalData,
    getFamilyData,
    error,
  ]);

  const markUnsavedClean = useCallback(
    (receptionId: string) => {
      if (options?.unsavedChanges?.markClean) {
        options.unsavedChanges.markClean(receptionId);
        return;
      }
      markReceptionAsUnchanged(receptionId);
    },
    [markReceptionAsUnchanged, options?.unsavedChanges]
  );

  // 수정 중인 환자가 있는지 확인하는 함수
  const checkUnsavedChanges = useCallback(
    (receptionId?: string): boolean => {
      if (options?.unsavedChanges?.check) {
        return options.unsavedChanges.check(receptionId);
      }

      // receptionId가 제공되면 해당 reception의 변경사항 확인, 아니면 현재 활성화된 reception 확인
      return receptionId ? hasReceptionChanges(receptionId) : hasCurrentReceptionChanges();
    },
    [hasCurrentReceptionChanges, hasReceptionChanges, options?.unsavedChanges]
  );

  // 수정 중인 환자 경고 팝업 상태
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] =
    useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: string;
    callback: () => void;
  } | null>(null);

  // 이미 접수된 환자 확인 팝업 상태
  const [showDuplicateReceptionConfirm, setShowDuplicateReceptionConfirm] =
    useState(false);
  const [pendingReceptionCallback, setPendingReceptionCallback] = useState<
    (() => Promise<void>) | null
  >(null);

  // 수정 중인 환자가 있을 때 팝업을 표시하고 액션을 실행하는 함수
  const executeWithUnsavedChangesCheck = useCallback(
    (action: string, callback: () => void, receptionId?: string) => {
      if (checkUnsavedChanges(receptionId)) {
        setPendingAction({ action, callback });
        setShowUnsavedChangesConfirm(true);
      } else {
        callback();
      }
    },
    [checkUnsavedChanges]
  );

  // 수정 중인 환자 경고 팝업에서 확인 클릭
  const handleConfirmUnsavedChanges = useCallback(() => {
    if (pendingAction) {
      pendingAction.callback();
    }
    setShowUnsavedChangesConfirm(false);
    setPendingAction(null);
  }, [pendingAction]);

  // 수정 중인 환자 경고 팝업에서 취소 클릭
  const handleCancelUnsavedChanges = useCallback(() => {
    setShowUnsavedChangesConfirm(false);
    setPendingAction(null);
  }, []);

  // 이미 접수된 환자 확인 팝업에서 확인 클릭
  const handleConfirmDuplicateReception = useCallback(async () => {
    if (pendingReceptionCallback) {
      await pendingReceptionCallback();
    }
    setShowDuplicateReceptionConfirm(false);
    setPendingReceptionCallback(null);
  }, [pendingReceptionCallback]);

  // 이미 접수된 환자 확인 팝업에서 취소 클릭
  const handleCancelDuplicateReception = useCallback(() => {
    setShowDuplicateReceptionConfirm(false);
    setPendingReceptionCallback(null);
    setSaveStatus("idle");
  }, []);

  const clearAllData = useCallback(async () => {
    const executeClear = async () => {
      try {
        // 상태 초기화
        setDataState({
          registration: null,
          vital: [],
          family: [],
          insurance: undefined,
        });

        // 외부 receptionId가 전달된 경우는 독립 인스턴스이므로 탭 제거하지 않음
        if (options?.receptionId === undefined && activeReceptionId) {
          removeOpenedReception(activeReceptionId);
        }

        await clearAll();

        // 컴포넌트별 초기화 이벤트 발생
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("clearVitalBst"));
          window.dispatchEvent(new CustomEvent("clearFamilyInfo"));
          window.dispatchEvent(new CustomEvent("clearBasicInfo"));
        }

        // Refs 초기화
        newVitalMeasurementsRef.current = [];

        success("모든 데이터가 초기화되었습니다.");
      } catch (err) {
        console.error("Clear all data failed:", err);
        error("데이터 초기화에 실패했습니다.");
      }
    };

    executeWithUnsavedChangesCheck("데이터를 초기화", executeClear);
  }, [
    activeReceptionId,
    removeOpenedReception,
    clearAll,
    success,
    error,
    executeWithUnsavedChangesCheck,
    options?.receptionId,
  ]);

  const refreshComponentData = useCallback(
    async (component: "registration" | "vital" | "family") => {
      try {
        switch (component) {
          case "registration":
            await getRegistrationData();
            break;
          case "vital":
            await getVitalData();
            break;
          case "family":
            await getFamilyData();
            break;
        }
      } catch (err) {
        console.error(`Refresh ${component} data failed:`, err);
        error(`${component} 데이터 새로고침에 실패했습니다.`);
      }
    },
    [getRegistrationData, getVitalData, getFamilyData, success, error]
  );
  //#endregion

  // NHIC & Insurance handler
  const handleNhicResponseApply = useCallback(
    (responseModel: components["schemas"]["EligibilityCheckResponseDto"]) => {
      try {
        if (!currentPatientInfo || !activeReceptionId) {
          console.warn("환자 정보가 없어서 NHIC 응답을 적용할 수 없습니다.");
          return;
        }

        const receptionDateTime = new Date();
        const parsedData = responseModel;

        const newInsuranceInfo = setEligibilityResponseToInsuranceInfo(
          receptionDateTime,
          getResidentRegistrationNumberWithNumberString(currentPatientInfo.rrn),
          parsedData,
          {
            //TODO - unionNAME 추가
            unionName: responseModel["의료급여기관기호"]?.data ?? "",
          }
        );

        if (newInsuranceInfo && currentReception) {
          setCurrentInsuranceInfo(newInsuranceInfo);
          // /reception 탭 모드에서만 store 업데이트
          if (options?.receptionId === undefined) {
            updateInsuranceInfo(newInsuranceInfo);
          }
        }
      } catch (error) {
        console.error("Error applying NHIC response:", error);
      }
    },
    [
      currentPatientInfo,
      activeReceptionId,
      currentReception,
      updateInsuranceInfo,
      options?.receptionId,
    ]
  );

  //#endregion

  //#region Event Handlers
  // 공통 reception 관련 훅에서 함수들 가져오기
  const patientReceptionHook = usePatientReception();
  const {
    updateRegistration: commonUpdateRegistration,
    cancelRegistration: commonCancelRegistration,
    autoReception,
    compareReceptionEligibility,
    showQualificationComparePopup,
    qualificationCompareData,
    showQualificationComparePopupPromise,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,
    processQualificationCompareResult,
  } = patientReceptionHook;


  // 접수 취소 처리 함수
  // reception을 필수로 받아서 검증 후 바로 취소 작업 수행
  const handleRegistrationCancel = useCallback(async (reception: Reception): Promise<void> => {
    const normalizedId = normalizeRegistrationId(
      reception?.originalRegistrationId
    );

    if (!normalizedId || isNewRegistrationId(normalizedId)) {
      error("취소할 수 있는 접수가 없습니다.");
      return;
    }

    const registrationId = normalizedId;

    try {
      setSaveStatus("saving");
      setActionType("취소");

      await commonCancelRegistration(registrationId);

      success("접수가 취소되었습니다.");
      removeOpenedReception(registrationId);

      setSaveStatus("saved");
    } catch (err: any) {
      console.error("접수 취소 실패:", err);
      error(err?.message || "접수 취소에 실패했습니다.");
      setSaveStatus("failed");
    }
  }, [
    commonCancelRegistration,
    success,
    removeOpenedReception,
    openNewReceptionTab,
    calculateNewActiveReceptionId,
    setOpenedReceptionId,
    clearAll,
    error,
    options?.receptionId,
  ]);

  // 접수 수정 처리 함수 (Reception Store 관련 부분만 처리)
  const updateRegistration = useCallback(
    async (
      registrationId: string,
      reception: Reception,
      insuranceInfo: Partial<InsuranceInfo>
    ) => {
      try {
        const patientNo = reception.patientBaseInfo?.patientNo;

        const isNewPatient =
          patientNo === null ||
          patientNo === undefined ||
          patientNo === 0;
        // 공통 updateRegistration 호출 (순수 비즈니스 로직)
        const result = await commonUpdateRegistration(
          registrationId,
          reception,
          insuranceInfo,
          isNewPatient,
          newVitalMeasurementsRef.current
        );
        // 업데이트된 reception을 찾아서 활성화
        const { openedReceptions } = useReceptionTabsStore.getState();
        const updatedReception = openedReceptions.find(
          (r) => r.originalRegistrationId === result.registrationId
        );

        if (updatedReception) {
          // /reception 탭 모드에서만 openedReceptionId 업데이트
          if (options?.receptionId === undefined) {
            setOpenedReceptionId(result.registrationId);
          }

          // 수정중 상태를 없애기
          markUnsavedClean(result.registrationId);
        }

        return {
          success: true,
          patientId: result.patientId,
          patientNo: result.patientNo,
          registrationId: result.registrationId,
          reception: updatedReception,
        };
      } catch (err: any) {
        throw err;
      }
    },
    [
      commonUpdateRegistration,
      setOpenedReceptionId,
      markReceptionAsUnchanged,
      options?.receptionId,
    ]
  );
  // 실제 접수 처리 함수 (중복 확인 후 호출)
  const executeReception = useCallback(
    async (targetReception: Reception): Promise<boolean> => {
      try {
        // 접수: autoReception 사용 (자격조회 비교 포함)
        const autoReceptionResult = await autoReception(
          targetReception,
          newVitalMeasurementsRef.current
        );

        if (autoReceptionResult.needsCompare) {
          // 비교 팝업 표시
          const apply = await showQualificationComparePopupPromise(
            autoReceptionResult.compareData
          );

          // 팝업 결과에 따라 접수 진행
          const receptionResult = await processQualificationCompareResult(
            autoReceptionResult.compareData,
            apply,
            newVitalMeasurementsRef.current
          );

          if (!receptionResult.success) {
            setSaveStatus("failed");
            return false;
          }
            const removalId =
              autoReceptionResult.compareData.reception.originalRegistrationId ||
              receptionResult.registrationId;
            if (removalId) {
              removeOpenedReception(removalId);
            }
          
        } else if (!autoReceptionResult.success) {
          setSaveStatus("failed");
          return false;
        } else if (options?.receptionId === undefined) {
          const removalId =
            targetReception.originalRegistrationId ||
            autoReceptionResult.registrationId;

          if (removalId) {
            removeOpenedReception(removalId);
          }
        }
        else {
          const removalId =
            targetReception.originalRegistrationId ||
            autoReceptionResult.registrationId;
          removeOpenedReception(removalId!);

        }
        // 예약 처리 (기존 로직)
        const originalReceptionId = targetReception.originalRegistrationId;
        if (originalReceptionId?.startsWith("a")) {
          await handleMarkAsVisited(
            Number(originalReceptionId.substring(1))
          );
        }

        return true;
      } catch (err) {
        console.error("[executeReception] 처리 실패:", err);
        setSaveStatus("failed");
        return false;
      }
    },
    [
      autoReception,
      showQualificationComparePopupPromise,
      processQualificationCompareResult,
      removeOpenedReception,
      handleMarkAsVisited,
      options?.receptionId,
    ]
  );

  // Main patient handler (UI 상태 관리 + 접수 처리)
  const handlePatient = useCallback(
    async (
      isRegistration = false,
      overrideReception?: Reception,
      overrideInsuranceInfo?: Partial<InsuranceInfo>
    ) => {
      const { openedReceptions: latestOpenedReceptions } =
        useReceptionTabsStore.getState();

      const latestReception = latestOpenedReceptions.find(
        (r) => r.originalRegistrationId === activeReceptionId
      );

      const targetReception =
        overrideReception ?? latestReception ?? currentReception;

      if (!targetReception) {
        error("환자 정보가 없습니다.");
        return;
      }

      const targetInsuranceInfo =
        overrideInsuranceInfo ??
        targetReception.insuranceInfo ??
        currentInsuranceInfo;

      const targetPatientInfo = targetReception.patientBaseInfo as any;

      if (!targetPatientInfo) {
        error("환자 정보가 없습니다.");
        return;
      }

      const validationError = validateReceptionInfo(targetPatientInfo);
      if (validationError) {
        error(validationError);
        return;
      }

      const newActionType: "저장" | "접수" | "취소" = isRegistration
        ? "접수"
        : "저장";

      const patientName = targetPatientInfo.name ?? "환자";

      const scheduleSaveStatusReset = () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
          // clearAll 호출하지 않음 (openedReceptions 손상 방지)
          // refreshPatientsData 이벤트는 발생시키지 않음 (openedReceptions가 이미 업데이트되었으므로)
        }, 2000);
      };

      setSaveStatus("saving");
      setActionType(newActionType);

      try {
        if (isRegistration) {
          // 이미 접수된 환자 확인 - patientId기준 및 status 조건 추가 (진료중,대기 상태일때는 접수x)
          const targetPatientId = targetPatientInfo.patientId || currentPatientId;
          if (targetPatientId && targetPatientId !== "0") {
            const duplicateRegistration = registrations.find(
              (reg: Registration) => {
                const regPatientId = (reg.patient?.id ||
                  reg.patientId) &&
                  (reg.status === 접수상태.진료중
                    || reg.status === 접수상태.대기);
                return regPatientId && String(regPatientId) === String(targetPatientId);
              }
            );

            if (duplicateRegistration) {
              // 중복 접수 확인 팝업 표시
              setPendingReceptionCallback(async () => {
                // 팝업에서 확인 클릭 시 실행될 실제 접수 로직
                setSaveStatus("saving");
                const success = await executeReception(targetReception);
                if (success) {
                  setSaveStatus("saved");

                  if (
                    options?.receptionId === undefined &&
                    activeReceptionId
                  ) {
                    markUnsavedClean(activeReceptionId);
                  }

                  await refreshAllData();

                  // Vital 컴포넌트 초기화 (저장 완료 직후)
                  if (typeof window !== "undefined") {
                    setTimeout(async () => {
                      window.dispatchEvent(new CustomEvent("clearVitalBst"));
                      await getVitalData();
                    }, 100);
                  }

                  // saveStatus 리셋 스케줄링
                  if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  saveTimeoutRef.current = setTimeout(() => {
                    setSaveStatus("idle");
                  }, 2000);
                } else {
                  setSaveStatus("failed");
                }
              });
              setShowDuplicateReceptionConfirm(true);
              setSaveStatus("idle");
              return;
            }
          }

          // 중복이 없으면 바로 접수 진행
          const receptionSuccess = await executeReception(targetReception);
          if (!receptionSuccess) {
            return;
          }
        } else {
          if (!activeReceptionId) {
            error("접수 ID가 없습니다.");
            setSaveStatus("failed");
            return;
          }
          const updateRegistrationResult = await updateRegistration(
            activeReceptionId!,
            targetReception!,
            targetInsuranceInfo!
          );

          if (updateRegistrationResult.success) {
            
            const updatedPatientBaseInfo = {
              ...targetPatientInfo,
              patientId: updateRegistrationResult.patientId,
              patientNo: updateRegistrationResult.patientNo,
            };
            updateOpenedReception(activeReceptionId!, {
              patientBaseInfo: updatedPatientBaseInfo,
            });

            if (options?.onUpdateReception) {
              options.onUpdateReception({
                patientBaseInfo: updatedPatientBaseInfo,
              });
            }
      }
          success(
            `'${patientName}'환자 ${newActionType}되었습니다.`
          );
        }
        setSaveStatus("saved");

        if (
          isRegistration &&
          options?.receptionId === undefined &&
          activeReceptionId
        ) {
          markUnsavedClean(activeReceptionId);
        }

        await refreshAllData();

        // Vital 컴포넌트 초기화 (저장 완료 직후)
        if (typeof window !== "undefined") {
          setTimeout(async () => {
            window.dispatchEvent(new CustomEvent("clearVitalBst"));
            await getVitalData();
          }, 100);
        }

        scheduleSaveStatusReset();
      } catch (err) {
        console.error("[handlePatient] 처리 실패:", err);

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        error(
          `'${patientName}'환자 ${newActionType}에 실패했습니다.`
        );
        setSaveStatus("idle");
      }
    },
    [
      currentReception,
      currentInsuranceInfo,
      activeReceptionId,
      autoReception,
      compareReceptionEligibility,
      showQualificationComparePopupPromise,
      processQualificationCompareResult,
      updateRegistration,
      success,
      error,
      markReceptionAsUnchanged,
      refreshAllData,
      getVitalData,
      handleMarkAsVisited,
      options?.receptionId,
      setSaveStatus,
      setActionType,
      executeReception,
      registrations,
      currentPatientId,
      markReceptionAsUnchanged,
    ]
  );

  // Vital measurements change handler
  const handleVitalMeasurementsChange = useCallback(
    (measurements: VitalReceptionInfoType[]) => {
      newVitalMeasurementsRef.current = measurements;
    },
    []
  );

  //#endregion

  //#region Return Values
  return {
    // States
    currentReception,
    currentPatientInfo,
    currentInsuranceInfo,
    openedReceptions,
    openedReceptionId,
    activeReceptionId,
    hasOpenedReceptions,
    actionType,
    saveStatus,
    familyLoading,
    familyFetching,
    vitalLoading,
    vitalFetching,

    // Data
    family,
    vital,

    // Handlers
    handleNhicResponseApply,
    handlePatient,
    handleRegistrationCancel,
    handleVitalMeasurementsChange,

    // Utilities
    refreshPatientInfo,
    checkUnsavedChanges,
    executeWithUnsavedChangesCheck,

    // 수정 중인 환자 경고 팝업 관련
    showUnsavedChangesConfirm,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,

    // 이미 접수된 환자 확인 팝업 관련
    showDuplicateReceptionConfirm,
    handleConfirmDuplicateReception,
    handleCancelDuplicateReception,

    // 자격조회 비교 팝업 관련
    showQualificationComparePopup,
    qualificationCompareData,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,

    // 통합 데이터 관리
    // 데이터 상태
    dataState,
    loadingState,

    // 통합 관리 함수들
    getAllData,
    refreshAllData,
    clearAllData,
    refreshComponentData,

    // 개별 데이터 관리 함수들
    getRegistrationData,
    getVitalData,
    getFamilyData,

    // 편의 함수들
    isAnyLoading: Object.values(loadingState).some((loading) => loading),
    isAllDataLoaded: dataState.registration !== null,

    // Computed
    isRegistration: openedReceptionId === "new" || openedReceptionId === null,
    saveStatusText:
      saveStatus === "saving"
        ? `'${currentReception?.patientBaseInfo?.name}'환자 ${actionType}하는 중입니다...`
        : saveStatus === "saved"
          ? `'${currentReception?.patientBaseInfo?.name}'환자 ${actionType}되었습니다.`
          : null,
  };
  //#endregion
};

