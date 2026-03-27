import { Search } from "lucide-react";
import DaumPostcode from "react-daum-postcode";
import { getAgeOrMonth, formatPhoneNumberRealtime } from "@/lib/patient-utils";
import {
  formatRrnNumber,
  extractInfoFromRrn,
} from "@/lib/common-utils";
import { REGISTRATION_ID_NEW } from "@/lib/registration-utils";
import { useBasicInfo } from "@/hooks/reception/use-basic-info";
import { useQualificationCheck } from "@/hooks/reception/use-qualification-check";
import QualificationCheckModals from "@/components/qualification-check/qualification-check-modals";
import { useState, useEffect, useRef, useCallback } from "react";
import { useClear } from "@/contexts/ClearContext";
import {
  PatientIdType,
  PatientIdTypeLabel,
  ConsentPrivacyType,
  본인확인여부Label,
} from "@/constants/common/common-enum";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import { usePatientGroups } from "@/hooks/patient/use-patient-groups";
import { formatDate } from "@/lib/date-utils";
import { useDoctorsStore } from "@/store/doctors-store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { components } from "@/generated/api/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PatientGroup } from "@/types/patient-groups-types";
import type { Reception } from "@/types/common/reception-types";
import { useBoardPatientRuntime } from "../board-patient-runtime-context";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import { usePatientCheckRrn } from "@/hooks/patient/use-patient-check-rrn";
import { cn } from "@/lib/utils";
import { RrnInput } from "@/components/ui/rrn-input";
import { ConsentRequestModal } from "@/components/consent/consent-request-modal";

interface BasicInfo2Props {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  onNhicResponseApply?: (
    responseModel: components["schemas"]["EligibilityCheckResponseDto"]
  ) => void;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
  /**
   * 카드(컨테이너) 라운딩 변형
   * - standalone: 단독 카드
   * - mergedTop: 아래 카드와 붙는 상단 카드(하단 라운딩 제거)
   * - mergedBottom: 위 카드와 붙는 하단 카드(상단 라운딩 제거)
   */
  cardVariant?: "standalone" | "mergedTop" | "mergedBottom";
  /** 루트 컨테이너 클래스 확장 */
  className?: string;
}

export default function BasicInfo2({
  reception: externalReception,
  receptionId: externalReceptionId,
  onNhicResponseApply,
  isDisabled = false,
  onUpdateReception,
  cardVariant = "standalone",
  className,
}: BasicInfo2Props) {
  const {
    // States
    localName,
    localPhone,
    localRrn,
    birth,
    loading,

    // Refs
    searchBtnRef,

    // Data
    currentPatientInfo,
    tempEligibilityData,

    // State setters
    setLocalName,
    setLocalPhone,
    setLocalRrn,
    setBirth,
    setIsQualificationModalOpen,
    setLoading,

    // Handlers
    handleDaumPostComplete,
    handleQualificationRequest,
    updateName,
    updatePhone,
    updateAddress2,
    updateIdType,
    updateIdNumber,
    updateMessageConsent,
    updatePrivacyConsent,
    updateGroupId,
    handleNhicModalClose,
    handleNhicModalApply,
    getMedicalAidStatus,
  } = useBasicInfo({
    reception: externalReception,
    receptionId: externalReceptionId,
    onUpdateReception,
  });

  const { doctors } = useDoctorsStore();
  const patientGroupsFromStore = usePatientGroupsStore((s) => s.patientGroups);
  const { data: patientGroupsFromQuery } = usePatientGroups();
  const patientGroups: PatientGroup[] =
    patientGroupsFromStore?.length > 0
      ? patientGroupsFromStore
      : patientGroupsFromQuery ?? [];

  const updatePatientMutation = useUpdatePatient();
  const patientCheckRrnMutation = usePatientCheckRrn();
  const [isRrnDuplicate, setIsRrnDuplicate] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const isNewPatient = externalReception?.originalRegistrationId === REGISTRATION_ID_NEW;

  // 현재 활성화된 reception ID 계산
  const activeReceptionId = externalReceptionId || "";
  const { dirty } = useBoardPatientRuntime();

  const markChangedOnce = useCallback(() => {
    if (!activeReceptionId) return;
    if (!dirty.hasChanges(activeReceptionId)) {
      dirty.markChanged(activeReceptionId);
    }
  }, [activeReceptionId, dirty]);

  // Clear Context 등록
  const { registerMyClear, unregisterMyClear } = useClear("basic-info2");

  // 담당의 로컬 상태 (doctorId로 변경)
  const [localDoctorId, setLocalDoctorId] = useState<number | null>(null);
  // 상세주소 로컬 상태
  const [localAddress2, setLocalAddress2] = useState("");
  // 기본주소 로컬 상태
  const [localAddress, setLocalAddress] = useState("");
  // 외국인/기타: 신분증 타입/번호 로컬 상태 (입력 즉시 반영용)
  const [localIdType, setLocalIdType] = useState<number | null>(null);
  const [localIdNumber, setLocalIdNumber] = useState("");

  // 초기값 refs (Dirty 감지용)
  const initialNameRef = useRef<string>("");
  const initialPhoneRef = useRef<string>("");
  const initialRrnRef = useRef<string>("");
  const initialAddress2Ref = useRef<string>("");
  const initialAddressRef = useRef<string>("");
  const initialDoctorIdRef = useRef<number | null>(null);
  const initialGroupIdRef = useRef<number | null>(null);
  const initialIdTypeRef = useRef<number | null>(null);
  const initialIdNumberRef = useRef<string>("");

  // 다음우편번호 레이어 상태
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [postcodeDefaultQuery, setPostcodeDefaultQuery] = useState("");
  const postcodeLayerRef = useRef<HTMLDivElement>(null);

  // handleRrnEnterKey 중복 실행 방지 플래그
  const isRrnEnterKeyProcessingRef = useRef(false);

  // patientBaseInfo 업데이트 래퍼 (onUpdateReception만 사용, store 직접 접근 없음)
  const updatePatientBaseInfo = useCallback(
    (data: any) => {
      if (currentPatientInfo && onUpdateReception) {
        onUpdateReception({
          patientBaseInfo: {
            ...currentPatientInfo,
            ...data,
          } as any,
        });
      }
    },
    [currentPatientInfo, onUpdateReception]
  );

  // Clear 함수 정의 - useBasicInfo의 모든 로컬 상태들을 초기화
  const clearBasicInfo = useCallback(() => {
    // useBasicInfo의 로컬 상태들 초기화
    setLocalName("");
    setLocalPhone("");
    setLocalRrn("");
    setBirth("");
    setIsQualificationModalOpen(false);
    setLoading(false);
    setIsRrnDuplicate(false);

    // BasicInfo2 컴포넌트의 로컬 상태들 초기화
    setLocalDoctorId(null);
    setLocalAddress2("");
    setLocalAddress("");
    qualificationCheck.clearQualificationState();

    // Store의 patientBaseInfo도 초기화
    if (currentPatientInfo && onUpdateReception) {
      onUpdateReception({
        patientBaseInfo: {
          ...currentPatientInfo,
          name: "",
          rrn: "",
          phone1: "",
          address: "",
          address2: "",
          zipcode: "",
          birthday: "",
          fatherRrn: "",
          age: 0,
          gender: 0,
          idType: null,
          idNumber: "",
          receptionMemo: "",
          clinicalMemo: "",
          doctorId: null,
          recvMsg: 1,
          isPrivacy: ConsentPrivacyType.미동의,
          groupId: null,
          lastVisit: null,
        } as any,
      });
    }
  }, [
    currentPatientInfo,
    onUpdateReception,
    setBirth,
    setIsQualificationModalOpen,
    setLoading,
    setLocalName,
    setLocalPhone,
    setLocalRrn,
  ]);

  const triggerRrnDuplicateUi = useCallback(() => {
    setIsRrnDuplicate(true);
  }, []);

  const clearRrnDuplicateUi = useCallback(() => {
    setIsRrnDuplicate(false);
  }, []);

  const checkRrnDuplicateIfNeeded = useCallback(async () => {
    if (isDisabled) return { duplicate: false };

    const rrnDigits = (localRrn || "").replace(/[^0-9]/g, "");
    if (rrnDigits.length !== 13) {
      clearRrnDuplicateUi();
      return { duplicate: false };
    }

    const excludePatientIdRaw = Number(currentPatientInfo?.patientId);
    const excludePatientId =
      Number.isFinite(excludePatientIdRaw) && excludePatientIdRaw > 0
        ? excludePatientIdRaw
        : undefined;

    try {
      const result = await patientCheckRrnMutation.mutateAsync({
        rrn: rrnDigits,
        excludePatientId,
      });

      if (result?.duplicate) {
        triggerRrnDuplicateUi();
      } else {
        clearRrnDuplicateUi();
      }

      return result;
    } catch {
      // 중복체크 실패는 입력 UX를 막지 않도록 조용히 무시 (필요시 toast로 변경 가능)
      clearRrnDuplicateUi();
      return { duplicate: false };
    }
  }, [
    isDisabled,
    localRrn,
    currentPatientInfo?.patientId,
    patientCheckRrnMutation,
    triggerRrnDuplicateUi,
    clearRrnDuplicateUi,
  ]);

  // Clear 함수 등록/해제
  useEffect(() => {
    registerMyClear(clearBasicInfo);
    return () => {
      unregisterMyClear();
    };
  }, [registerMyClear, unregisterMyClear, clearBasicInfo]);

  // 담당의 동기화 (props reception 우선) + 초기값 저장
  useEffect(() => {
    const patientInfo = externalReception?.patientBaseInfo || currentPatientInfo;
    const doctorId = patientInfo?.doctorId || null;
    setLocalDoctorId(doctorId);
    initialDoctorIdRef.current = doctorId;
  }, [externalReception?.patientBaseInfo?.doctorId, currentPatientInfo?.doctorId]);

  // 상세주소 동기화 (props reception 우선) + 초기값 저장
  useEffect(() => {
    const patientInfo = externalReception?.patientBaseInfo || currentPatientInfo;
    const address2 = patientInfo?.address2 || "";
    setLocalAddress2(address2);
    initialAddress2Ref.current = address2;
  }, [externalReception?.patientBaseInfo?.address2, currentPatientInfo?.address2]);

  // 기본주소 동기화 (props reception 우선) + 초기값 저장
  useEffect(() => {
    const patientInfo = externalReception?.patientBaseInfo || currentPatientInfo;
    const address = patientInfo?.address || "";
    setLocalAddress(address);
    initialAddressRef.current = address;
  }, [externalReception?.patientBaseInfo?.address, currentPatientInfo?.address]);

  // 초기값 동기화 (name, phone, rrn, groupId, idType, idNumber, address)
  useEffect(() => {
    const patientInfo = externalReception?.patientBaseInfo || currentPatientInfo;
    if (patientInfo) {
      initialNameRef.current = patientInfo.name || "";
      initialPhoneRef.current = patientInfo.phone1 || "";
      initialRrnRef.current = patientInfo.rrn || "";
      initialGroupIdRef.current = patientInfo.groupId ?? null;
      initialIdTypeRef.current = patientInfo.idType || null;
      initialIdNumberRef.current = patientInfo.idNumber || "";
      initialAddressRef.current = patientInfo.address || "";
    }
  }, [externalReception?.patientBaseInfo, currentPatientInfo]);

  // 외국인/기타 로컬 상태 동기화 (편집 중이면 덮어쓰지 않음)
  const idTypeSelectRef = useRef<HTMLSelectElement>(null);
  const idNumberInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const patientInfo = externalReception?.patientBaseInfo || currentPatientInfo;
    if (!patientInfo) return;

    // 사용자가 입력/선택 중일 때는 로컬 값을 유지
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active === idTypeSelectRef.current || active === idNumberInputRef.current) {
        return;
      }
    }

    setLocalIdType(patientInfo.idType ?? null);
    setLocalIdNumber(patientInfo.idNumber ?? "");
  }, [externalReception?.patientBaseInfo?.idType, externalReception?.patientBaseInfo?.idNumber, currentPatientInfo?.idType, currentPatientInfo?.idNumber]);

  // Daum Postcode 완료 핸들러 (인라인 레이어용)
  const handlePostcodeComplete = useCallback(
    (data: any) => {
      handleDaumPostComplete(data);
      setIsPostcodeOpen(false);
      // 선택 후 상세주소로 포커스 이동
      setTimeout(() => {
        const address2Input = document.querySelector(
          'input[placeholder="상세주소"]'
        ) as HTMLInputElement;
        if (address2Input) {
          address2Input.focus();
        }
      }, 100);
    },
    [handleDaumPostComplete]
  );

  // Daum Postcode 열기 (기본주소 입력값을 검색어로 전달)
  const openDaumPostcode = useCallback(
    (searchQuery?: string) => {
      if (isDisabled) return;
      setPostcodeDefaultQuery(searchQuery || localAddress || "");
      setIsPostcodeOpen(true);
    },
    [isDisabled, localAddress]
  );

  // Daum Postcode 외부 클릭 시 닫기
  useEffect(() => {
    if (!isPostcodeOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        postcodeLayerRef.current &&
        !postcodeLayerRef.current.contains(target) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(target)
      ) {
        setIsPostcodeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPostcodeOpen, searchBtnRef]);

  // 담당의 업데이트 함수 (doctorId로 변경)
  const updateDoctorId = useCallback(
    (doctorId: number | null) => {
      if (currentPatientInfo && onUpdateReception) {
        onUpdateReception({
          patientBaseInfo: {
            ...currentPatientInfo,
            doctorId,
          } as any,
        });
      }
    },
    [currentPatientInfo, onUpdateReception]
  );

  const rrnInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // 자격조회 오케스트레이션 훅
  const qualificationCheck = useQualificationCheck({
    currentPatientInfo,
    getMedicalAidStatus,
    handleQualificationRequest,
    handleNhicModalApply,
    handleNhicModalClose,
    tempEligibilityData,
    loading,
    updatePatientBaseInfo,
    updatePatientMutation,
    onNhicResponseApply,
    focusAfterCloseRef: phoneInputRef,
  });

  // 주민등록번호 입력 필드에서 Enter 키 처리
  const handleRrnEnterKey = useCallback(async () => {
    // 중복 실행 방지
    if (isRrnEnterKeyProcessingRef.current) {
      return;
    }
    isRrnEnterKeyProcessingRef.current = true;
    // 필수 값 확인: 13자리 완성 + 이름 필수
    const rrnDigits = (localRrn || "").replace(/[^0-9]/g, "");
    if (rrnDigits.length !== 13 || !localName) {
      isRrnEnterKeyProcessingRef.current = false;
      return;
    }

    // 최신 값으로 업데이트 (localRrn과 localName 사용)
    const rrnInfo = extractInfoFromRrn(localRrn);
    const latestPatientInfo = externalReception?.patientBaseInfo || currentPatientInfo;

    if (latestPatientInfo) {
      const updatedInfo = {
        ...latestPatientInfo,
        rrn: formatRrnNumber(localRrn),
        name: localName,
        ...(rrnInfo.isValid
          ? {
            birthday: rrnInfo.birthDate,
            gender: rrnInfo.gender,
          }
          : {}),
      };

      // 최신 값으로 업데이트
      updatePatientBaseInfo(updatedInfo);

      // 상태 업데이트 대기
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    const isNewPatient =
      !latestPatientInfo?.patientNo ||
      latestPatientInfo.patientNo === "" ||
      latestPatientInfo.patientNo === 0;

    // 신규(본인확인 없음) vs 기존 환자에 따라 본인확인 인자만 다르게, 동일한 공통 흐름 사용
    // 본인확인완료 상태 확인(6개월 이내) 후, 범위 내면 바로 자격조회 / 범위 밖이면 신분증확인 팝업
    const identityVerifiedAt =
      isNewPatient && latestPatientInfo?.identityVerifiedAt === null
        ? null
        : (latestPatientInfo?.identityVerifiedAt ?? null);
    const identityOptional =
      isNewPatient && latestPatientInfo?.identityVerifiedAt === null
        ? undefined
        : latestPatientInfo?.identityOptional;

    qualificationCheck.tryQualificationOrCertificate({
      rrn: formatRrnNumber(localRrn),
      name: localName,
      identityVerifiedAt,
      identityOptional,
    });

    // 플래그 해제 (약간의 지연을 두어 중복 실행 완전 방지)
    setTimeout(() => {
      isRrnEnterKeyProcessingRef.current = false;
    }, 500);
  }, [
    localRrn,
    localName,
    currentPatientInfo,
    externalReception,
    updatePatientBaseInfo,
    qualificationCheck,
  ]);

  const messageReceiveValue =
    currentPatientInfo?.recvMsg === 0 ? "refuse" : "agree";

  const editableBgClass = isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]";

  const cardClassName = cn(
    "flex flex-col w-full p-2",
    cardVariant === "standalone" && "rounded-md bg-[var(--bg-1)] border border-transparent transition-colors focus-within:border-[var(--main-color-2-1)] focus-within:bg-[var(--bg-base1)]",
    cardVariant === "mergedTop" && "rounded-t-md rounded-b-none pb-0",
    // merged일 때는 bg 없음 (wrapper에서 제공)
    className
  );

  return (
    <div className={cardClassName}>
      <div className="text-[13px] font-semibold p-1 pb-0 text-[var(--gray-100)]">
        환자정보
      </div>

      <div className="p-1 space-y-1.5">
        {/* 공통: 7컬럼 (col1~3=50%, col4~7=50%) */}
        {/* - 왼쪽: 75px | 77px | calc(50% - 152px - 1.25rem) */}
        {/* - 오른쪽: 78px | 85px | 35px | calc(50% - 198px - 1.75rem) */}
        {/* => 좌/우 시각적 50%씩 (gap 비대칭 보정: 왼쪽 2gap, 오른쪽 3gap) */}

        {/* 1) 차트번호 / 생년월일 / 나이 */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-center">
          <div className="col-span-3 flex items-center gap-2 min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              차트번호
            </label>
            <input
              type="text"
              value={currentPatientInfo?.patientNo || ""}
              readOnly
              className="text-sm text-gray-500 dark:text-gray-300 border border-[var(--border-2)] rounded-md p-1 pl-2 bg-[var(--bg-3)] w-full"
            />
          </div>

          {/* col4 */}
          <label className="text-sm text-[var(--gray-300)] w-[78px] shrink-0">
            생년월일
          </label>

          {/* col5 (고정폭) */}
          <input
            type="text"
            tabIndex={-1}
            value={
              birth
                ? `${birth.slice(0, 4)}-${birth.slice(4, 6)}-${birth.slice(6, 8)}`
                : ""
            }
            readOnly
            className="text-sm text-gray-500 dark:text-gray-300 border border-[var(--border-2)] rounded-md p-1 pl-2 bg-[var(--bg-3)] w-[85px] shrink-0"
          />

          {/* col6 */}
          <label className="text-sm text-[var(--gray-300)] w-[35px] shrink-0">
            나이
          </label>
          {/* col7 */}
          <input
            type="text"
            tabIndex={-1}
            value={birth ? `${getAgeOrMonth(birth, "en")} ` : ""}
            readOnly
            className="text-sm text-gray-500 dark:text-gray-300 border border-[var(--border-2)] rounded-md p-1 pl-2 bg-[var(--bg-3)] w-full"
          />
        </div>

        {/* 2) 환자명 / 주민등록번호 */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-start">
          <div className="col-span-3 flex items-center gap-2 min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              환자명<span className="text-[var(--negative)]"> *</span>
            </label>
            <input
              type="text"
              data-testid="reception-patient-name-input"
              placeholder="이름 입력"
              value={localName}
              onFocus={(e) => {
                e.target.setAttribute("data-previous-value", localName);
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  const value = e.target.value;
                  setLocalName(value);
                  markChangedOnce();
                }
              }}
              onBlur={() => {
                if (localName !== initialNameRef.current) {
                  updateName(localName);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab" && e.shiftKey) return;
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  rrnInputRef.current?.focus();
                }
              }}
              className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 pl-2 w-full ${editableBgClass}`}
              disabled={isDisabled}
            />
          </div>

          <div className="col-span-4 flex gap-2 min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[78px] shrink-0 pt-1">
              주민등록번호 <span className="text-[var(--negative)]">*</span>
            </label>
            <div className="flex flex-col w-full min-w-0">
              <RrnInput
                ref={rrnInputRef}
                testId="reception-patient-rrn-input"
                value={localRrn}
                onRrnChange={(rawDigits) => {
                  setLocalRrn(rawDigits);
                  clearRrnDuplicateUi();
                }}
                onBirthInfoExtracted={(info) => {
                  if (info.isValid) {
                    setBirth(info.birthString);
                  }
                }}
                onBlur={(rawDigits) => {
                  if (rawDigits !== initialRrnRef.current && currentPatientInfo) {
                    const rrnInfo = extractInfoFromRrn(rawDigits);
                    if (rrnInfo.isValid) {
                      updatePatientBaseInfo({
                        ...currentPatientInfo,
                        rrn: formatRrnNumber(rawDigits),
                        birthday: rrnInfo.birthDate,
                        gender: rrnInfo.gender,
                      });
                    } else {
                      updatePatientBaseInfo({
                        ...currentPatientInfo,
                        rrn: formatRrnNumber(rawDigits),
                      });
                    }
                  }
                  void checkRrnDuplicateIfNeeded();
                }}
                onTabKey={async () => {
                  const res = await checkRrnDuplicateIfNeeded();
                  if (!res?.duplicate) {
                    phoneInputRef.current?.focus();
                  }
                  return !res?.duplicate;
                }}
                onEnterKey={() => {
                  void checkRrnDuplicateIfNeeded().then((res) => {
                    if (!res?.duplicate) {
                      handleRrnEnterKey();
                    }
                  });
                }}
                isDuplicate={isRrnDuplicate}
                loading={loading}
                disabled={isDisabled}
                onDirtyChange={markChangedOnce}
                inputClassName={editableBgClass}
                renderSuffix={
                  <button
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2 h-5.5 w-5.5 flex items-center justify-center rounded-md bg-[var(--violet-1)] text-white",
                      loading || isDisabled
                        ? "opacity-50 cursor-default"
                        : "hover:brightness-110"
                    )}
                    onClick={qualificationCheck.triggerQualificationCheck}
                    disabled={loading || isDisabled}
                    type="button"
                    title={loading ? "조회 중" : "자격조회"}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <img
                        src="/icon/ic_line_user-search.svg"
                        alt="검색"
                        className="w-4 h-4"
                      />
                    )}
                  </button>
                }
              />
              {isRrnDuplicate && (
                <div className="mt-1 text-xs text-[var(--negative)]">
                  이미 등록된 주민등록번호 입니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3) 전화번호 / (col4~7) 본인확인완료·수진자조회실패 표기 */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-center">
          {/* col1~3 (전화번호 input은 col2~col3 영역까지) */}
          <div className="col-span-3 flex items-center gap-2 min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              전화번호
            </label>
            <input
              ref={phoneInputRef}
              type="text"
              data-testid="reception-patient-phone-input"
              placeholder="- 없이 입력"
              value={localPhone}
              onFocus={(e) => {
                e.target.setAttribute("data-previous-value", localPhone);
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  const formattedValue = formatPhoneNumberRealtime(e.target.value);
                  setLocalPhone(formattedValue);
                  markChangedOnce();
                }
              }}
              onBlur={() => {
                if (localPhone !== initialPhoneRef.current) {
                  updatePhone(localPhone);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab" && e.shiftKey) return;
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  addressInputRef.current?.focus();
                }
              }}
              inputMode="numeric"
              pattern="[0-9\\-]*"
              className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 pl-2 w-full ${editableBgClass}`}
              disabled={isDisabled}
            />
          </div>

          {/* col3 영역은 위 컨테이너(col-span-3)에서 같이 사용 */}

          {/* col4~7 */}
          <div className="col-span-4 flex items-center justify-end min-h-[25px]">
            {(() => {
              const medicalAidStatus = getMedicalAidStatus();
              if (!medicalAidStatus) return null;
              if (medicalAidStatus.type === "failure") {
                return (
                  <div className="flex items-center gap-1">
                    <img
                      src="/system/system-danger.svg"
                      alt="위험"
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-[var(--negative)]">
                      수진자조회 실패
                    </span>
                  </div>
                );
              }

              const { displayDate, buttonProps } = medicalAidStatus;
              return (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <img
                      src="/system/system-success.svg"
                      alt="성공"
                      className="w-3 h-3"
                    />
                    <span className="text-xs text-[var(--positive)]">
                      {displayDate} 수진자조회 성공
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`text-xs border rounded-sm px-1.5 py-0.5 ${isDisabled ? "cursor-default" : "cursor-pointer"
                          }`}
                        style={buttonProps.style}
                        onClick={qualificationCheck.triggerIdentityCheck}
                        disabled={isDisabled}
                      >
                        {본인확인여부Label[buttonProps.idYN]}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-white border border-gray-300 shadow-lg p-1 rounded-md [&>svg]:hidden"
                      side="bottom"
                    >
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                        <span className="text-[var(--gray-300)] font-medium">
                          최근확인일
                        </span>
                        <span className="text-[var(--gray-100)]">
                          {currentPatientInfo?.identityVerifiedAt
                            ? formatDate(currentPatientInfo.identityVerifiedAt, "-")
                            : "-"}
                        </span>
                        <span className="text-[var(--gray-300)] font-medium">
                          만료일
                        </span>
                        <span className="text-[var(--gray-100)]">
                          {(() => {
                            if (!currentPatientInfo?.identityVerifiedAt) return "-";
                            const verifiedDate = new Date(
                              currentPatientInfo.identityVerifiedAt
                            );
                            const expiryDate = new Date(verifiedDate);
                            expiryDate.setMonth(expiryDate.getMonth() + 6);
                            return formatDate(expiryDate, "-");
                          })()}
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 4) 주소: col1 라벨 / col2 우편번호 / col3~4 기본주소 / col5~7 상세주소 */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-center">
          {/* col1: label */}
          <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
            주소
          </label>

          {/* col2: 우편번호 */}
          <div className="relative">
            <input
              type="text"
              placeholder="우편번호"
              tabIndex={-1}
              value={currentPatientInfo?.zipcode || ""}
              readOnly
              className="text-sm text-gray-700 dark:text-gray-300 border border-[var(--border-2)] rounded-md p-1 pl-2 w-full bg-[var(--bg-3)] pr-5"
            />
            <button
              ref={searchBtnRef}
              className="text-sm p-1 whitespace-nowrap flex items-center justify-center gap-1 w-6 absolute right-0.5 top-1/2 -translate-y-1/2 text-gray-500 cursor-default"
              onClick={() => !isDisabled && openDaumPostcode(localAddress)}
              type="button"
              disabled={isDisabled}
            >
              <Search className="w-4 h-4" />
            </button>

            {isPostcodeOpen && (
              <div
                ref={postcodeLayerRef}
                className="absolute left-0 top-full z-50 mt-2 bg-white rounded-lg border shadow-lg"
                style={{ width: 400, zIndex: 300 }}
              >
                <DaumPostcode
                  onComplete={handlePostcodeComplete}
                  onClose={() => setIsPostcodeOpen(false)}
                  autoClose
                  defaultQuery={postcodeDefaultQuery}
                  style={{ width: 400, height: 400 }}
                />
              </div>
            )}
          </div>

          {/* col3~4: 기본주소 */}
          <input
            ref={addressInputRef}
            type="text"
            placeholder="주소입력"
            value={localAddress}
            onFocus={(e) => {
              e.target.setAttribute("data-previous-value", localAddress);
            }}
            onChange={(e) => {
              if (document.activeElement === e.target) {
                const value = e.target.value;
                setLocalAddress(value);
                markChangedOnce();
              }
            }}
            onBlur={() => {
              if (localAddress !== initialAddressRef.current) {
                if (currentPatientInfo && onUpdateReception) {
                  onUpdateReception({
                    patientBaseInfo: {
                      ...currentPatientInfo,
                      address: localAddress,
                    } as any,
                  });
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab") {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!isDisabled) {
                    openDaumPostcode(localAddress);
                  }
                }
              }
            }}
            className={`col-span-2 text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 pl-2 w-full min-w-0 ${isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
            disabled={isDisabled}
          />

          {/* col5~7: 상세주소 */}
          <input
            type="text"
            placeholder="상세주소 입력"
            value={localAddress2}
            onFocus={(e) => {
              e.target.setAttribute("data-previous-value", localAddress2);
            }}
            onChange={(e) => {
              if (document.activeElement === e.target) {
                const value = e.target.value;
                setLocalAddress2(value);
                markChangedOnce();
              }
            }}
            onBlur={() => {
              if (localAddress2 !== initialAddress2Ref.current) {
                updateAddress2(localAddress2);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab") {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (typeof document !== "undefined") {
                    const patientMemoSection = document.querySelector(
                      '[data-focus-target="patient-memo"]'
                    );
                    const editable = patientMemoSection?.querySelector(
                      ".ProseMirror"
                    ) as HTMLElement | null;
                    if (editable) {
                      editable.focus();
                    }
                  }
                }
              }
            }}
            className={`col-span-3 text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 pl-2 w-full ${editableBgClass}`}
            disabled={isDisabled}
          />
        </div>

        {/* 5) 환자그룹 / 환자유형 */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-center">
          <div className="col-span-3 flex items-center gap-2 min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              환자그룹
            </label>
            <select
              value={
                currentPatientInfo?.groupId !== null &&
                  currentPatientInfo?.groupId !== undefined
                  ? String(currentPatientInfo.groupId)
                  : ""
              }
              onFocus={(e) => {
                e.target.setAttribute(
                  "data-previous-value",
                  String(currentPatientInfo?.groupId ?? "")
                );
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  markChangedOnce();
                  const newValue = e.target.value
                    ? Number(e.target.value)
                    : null;
                  updateGroupId(newValue);
                }
              }}
              onBlur={(e) => {
                const newValue = e.target.value
                  ? Number(e.target.value)
                  : null;
                if (newValue !== initialGroupIdRef.current) {
                  updateGroupId(newValue);
                }
              }}
              className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-full ${editableBgClass}`}
              disabled={isDisabled}
            >
              <option value="">선택</option>
              {patientGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* col4 */}
          <label className="text-sm text-[var(--gray-300)] w-[78px] shrink-0">
            환자유형
          </label>
          {/* col5~7 */}
          <div className="col-span-3 min-w-0">
            <input
              type="text"
              placeholder="환자유형"
              value={currentPatientInfo?.patientType ?? ""}
              readOnly
              className="text-sm text-gray-500 border border-[var(--border-2)] rounded-md p-1 pl-2 w-full bg-[var(--bg-3)]"
            />
            {/* TODO: 환자유형 컴포넌트 */}
          </div>
        </div>

        {/* 6) 외국인/기타(좌) / 담당의(우, 임시 invisible) */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-center">
          {/* col1~3: 외국인/기타 (위치 스왑으로 좌측 배치) */}
          <div className="col-span-3 flex items-center gap-2 min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              외국인/기타
            </label>
            <select
              ref={idTypeSelectRef}
              value={localIdType !== null && localIdType !== undefined ? String(localIdType) : ""}
              onFocus={(e) => {
                e.target.setAttribute(
                  "data-previous-value",
                  String(localIdType ?? "")
                );
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  markChangedOnce();
                  const next = e.target.value !== "" ? Number(e.target.value) : null;
                  setLocalIdType(next);
                  if (next === null) {
                    setLocalIdNumber("");
                  }
                }
              }}
              onBlur={(e) => {
                const newValue =
                  e.target.value !== "" ? Number(e.target.value) : null;
                if (newValue !== initialIdTypeRef.current) {
                  updateIdType(newValue);
                  initialIdTypeRef.current = newValue;
                }
                // 타입이 비워지면 번호도 같이 정리
                if (newValue === null) {
                  if (initialIdNumberRef.current !== "") {
                    updateIdNumber("");
                    initialIdNumberRef.current = "";
                  }
                  setLocalIdNumber("");
                }
              }}
              className={`text-sm text-gray-500 dark:text-gray-300 border border-[var(--border-2)] rounded-md p-1 w-[85px] shrink-0 ${isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
              disabled={isDisabled}
            >
              <option value="">선택</option>
              {Object.entries(PatientIdType)
                .filter(([, value]) => typeof value === "number")
                .map(([, value]) => (
                  <option key={value} value={value}>
                    {PatientIdTypeLabel[value as PatientIdType]}
                  </option>
                ))}
            </select>

            <input
              ref={idNumberInputRef}
              type="text"
              placeholder={
                localIdType !== null && localIdType !== undefined
                  ? `${PatientIdTypeLabel[localIdType as PatientIdType]}를 입력하세요`
                  : ""
              }
              value={localIdNumber}
              onFocus={(e) => {
                e.target.setAttribute(
                  "data-previous-value",
                  localIdNumber || ""
                );
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  setLocalIdNumber(e.target.value);
                  markChangedOnce();
                }
              }}
              onBlur={() => {
                if (localIdNumber !== initialIdNumberRef.current) {
                  updateIdNumber(localIdNumber);
                  initialIdNumberRef.current = localIdNumber;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Tab") {
                  // 입력값 커밋 (탭 이동 전 store 반영)
                  if (localIdNumber !== initialIdNumberRef.current) {
                    updateIdNumber(localIdNumber);
                    initialIdNumberRef.current = localIdNumber;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (typeof document !== "undefined") {
                      const firstRadio =
                        document.getElementById("message-recv-agree");
                      firstRadio?.focus();
                    }
                  }
                }
              }}
              disabled={
                isDisabled ||
                localIdType === null ||
                localIdType === undefined
              }
              className={`text-sm border border-[var(--border-2)] rounded-md p-1 pl-2 flex-1 min-w-0 ${localIdType === null ||
                localIdType === undefined
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : isDisabled
                  ? "bg-[var(--bg-3)] text-[var(--main-color)]"
                  : "text-[var(--main-color)] bg-[var(--bg-main)]"
                }`}
            />
          </div>

          {/* col4 공란 */}
          <div />

          {/* col5~7: 담당의 (임시 invisible, 복귀 시 제거) */}
          <div className="col-span-3 flex items-center gap-2 min-w-0 invisible">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              담당의
            </label>
            <select
              value={localDoctorId || ""}
              onFocus={(e) => {
                e.target.setAttribute(
                  "data-previous-value",
                  String(localDoctorId || "")
                );
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  const newDoctorId = e.target.value ? Number(e.target.value) : null;
                  setLocalDoctorId(newDoctorId);
                  markChangedOnce();
                }
              }}
              onBlur={(e) => {
                const newDoctorId = e.target.value ? Number(e.target.value) : null;
                if (newDoctorId !== initialDoctorIdRef.current) {
                  updateDoctorId(newDoctorId);
                }
              }}
              className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-[77px] ${isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
              disabled={isDisabled}
            >
              <option value="">담당의</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7) 개인정보수집 / 메시지 수신 */}
        <div className="grid grid-cols-[75px_77px_calc(50%-152px-1.25rem)_78px_85px_35px_calc(50%-198px-1.75rem)] gap-2 items-center">
          {/* col1~3: 내부 그리드로 label(75px) 기준선 맞추기 */}
          <div className="col-span-3 grid grid-cols-[75px_77px_auto] gap-2 items-center min-w-0">
            <label className="text-sm text-[var(--gray-300)] w-[75px] shrink-0">
              개인정보수집
            </label>

            {isNewPatient ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-[var(--gray-400)] w-[77px] inline-block cursor-default">
                    미동의
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-white border border-gray-300 shadow-lg p-2 rounded-md [&>svg]:hidden"
                  side="bottom"
                >
                  <span className="text-sm text-[var(--gray-100)]">환자 저장 후 동의서를 전송할 수 있습니다.</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              <select
                value={String(
                  currentPatientInfo?.isPrivacy ?? ConsentPrivacyType.미동의
                )}
                onChange={(e) => {
                  updatePrivacyConsent(Number(e.target.value) as ConsentPrivacyType);
                  markChangedOnce();
                }}
                disabled={isDisabled}
                className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-1 w-[77px] ${editableBgClass}`}
              >
                <option value={String(ConsentPrivacyType.미동의)}>미동의</option>
                <option value={String(ConsentPrivacyType.동의)}>동의</option>
                <option value={String(ConsentPrivacyType.거부)}>거부</option>
              </select>
            )}

            <div className="justify-self-start">
              {!isNewPatient && (currentPatientInfo?.isPrivacy === ConsentPrivacyType.동의 ||
                currentPatientInfo?.isPrivacy === ConsentPrivacyType.미동의) && (
                  <button
                    className={`text-sm text-[var(--bg-main)] bg-[var(--main-color)] dark:text-gray-300 border rounded-md px-2 py-0.5 ${isDisabled ? "cursor-default" : "cursor-pointer"
                      }`}
                    onClick={() => setIsConsentModalOpen(true)}
                    disabled={isDisabled}
                    type="button"
                  >
                    동의서전송
                  </button>
                )}
            </div>
          </div>

          {/* col4 */}
          <label className="text-sm text-[var(--gray-300)] w-[78px]">
            메시지 수신
          </label>

          {/* col5~7 */}
          <div className="col-span-3">
            <RadioGroup
              value={messageReceiveValue}
              onValueChange={(value) => {
                updateMessageConsent(value === "refuse");
                markChangedOnce();
              }}
              disabled={isDisabled}
              className="flex items-center gap-4"
            >
              <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                <RadioGroupItem value="agree" id="message-recv-agree" />
                동의
              </label>
              <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                <RadioGroupItem value="refuse" id="message-recv-refuse" />
                거부
              </label>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* 자격조회 관련 모달 (NHIC, 본인확인, 로딩 오버레이) */}
      <QualificationCheckModals
        qualificationCheck={qualificationCheck}
        tempEligibilityData={tempEligibilityData}
        loading={loading}
      />
      {/* 동의서 전송 모달 */}
      {currentPatientInfo?.patientId && (
        <ConsentRequestModal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          patientId={Number(currentPatientInfo.patientId)}
          patientName={currentPatientInfo.name}
        />
      )}
    </div>
  );
}

