import { useState, useRef, useCallback, useEffect } from "react";
import { useReceptionStore } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import { useHospitalStore } from "@/store/hospital-store";
import { QualificationService } from "@/services/nhmp/qualification-service";
import { useToastHelpers } from "@/components/ui/toast";
import { getErrorMessage, isNHICError } from "@/constants/nhmp-error-codes";
import { formatRrnNumber, formatBirthDate } from "@/lib/common-utils";
import {
  ConsentPrivacyType,
  의료급여메시지타입,
  type PatientIdType,
} from "@/constants/common/common-enum";
import type { components } from "@/generated/api/types";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";
import { useReceptionTabsStore } from "@/store/reception";
import type { Reception } from "@/types/common/reception-types";
import {
  extractExtraQualificationFromParsedData,
  setEligibilityResponseToInsuranceInfo
} from "@/lib/eligibility-utils";
import { getResidentRegistrationNumberWithNumberString } from "@/lib/patient-utils";
import { isNewRegistrationId, showIdYN } from "@/lib/registration-utils";
import { 본인확인여부 } from "@/constants/common/common-enum";

export const useBasicInfo = (options?: {
  /** 외부에서 주입할 reception 객체 */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
}) => {
  //#region Dependencies & Services
  const { hospital } = useHospitalStore();
  const { toast } = useToastHelpers();
  //#endregion

  //#region State Management
  // Reception Stores
  const { registrations } = useReceptionStore();
  const {
    openedReceptions,
    openedReceptionId,
    updatePatientBaseInfo,
    updateOpenedReception,
  } = useReceptionTabsStore();

  // Form states
  const [localName, setLocalName] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [localRrn, setLocalRrn] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState(0);

  // UI states
  const [isSearchAddressOpen, setIsSearchAddressOpen] = useState(false);
  const [isQualificationModalOpen, setIsQualificationModalOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // 임시 자격조회 데이터 저장 (정보적용 시 사용)
  const [tempEligibilityData, setTempEligibilityData] = useState<EligibilityCheck | null>(null);

  // Refs
  const searchBtnRef = useRef<HTMLButtonElement>(null);
  const isApplyingRef = useRef(false); // 중복 실행 방지 플래그
  //#endregion

  //#region Current Reception & Computed Values
  // Get current reception and patient info
  const getCurrentReception = useCallback(() => {
    // 1. 외부에서 주입된 reception이 있으면 우선 사용
    if (options?.reception !== undefined) {
      return options.reception || undefined;
    }

    // 2. 외부에서 주입된 receptionId가 있으면 해당 ID로 조회
    //    receptionId가 명시적으로 전달되면 openedReceptions를 무시하고
    //    registrations에서만 찾는다. (/medical 등 독립 인스턴스용)
    if (options?.receptionId !== undefined) {
      if (options.receptionId === null) {
        return undefined;
      }

      const registration = registrations.find(
        (r) => r.id === options.receptionId
      );
      if (registration) {
        return ReceptionService.convertRegistrationToReception(registration);
      }
      return undefined;
    }

    // 3. 일반 모드인 경우 (기존 로직)
    if (isNewRegistrationId(openedReceptionId)) {
      return openedReceptions.find((reception) =>
        isNewRegistrationId(reception.originalRegistrationId)
      );
    }

    return openedReceptions.find(
      (reception) => reception.originalRegistrationId === openedReceptionId
    );
  }, [
    options?.reception,
    options?.receptionId,
    openedReceptions,
    openedReceptionId,
    registrations,
  ]);

  const currentReception = getCurrentReception();
  const currentPatientInfo = currentReception?.patientBaseInfo as any;

  // updatePatientBaseInfo 래퍼 함수 (외부 receptionId가 있을 때 콜백 사용)
  const updatePatientBaseInfoWrapper = useCallback(
    (data: Partial<Reception["patientBaseInfo"]>) => {
      // 외부 receptionId가 있고 콜백이 있으면 콜백 사용, 아니면 store 업데이트
      if (options?.receptionId && options?.onUpdateReception) {
        // currentReception을 다시 가져와서 최신 상태 사용
        const latestReception = getCurrentReception();
        const basePatientInfo = latestReception?.patientBaseInfo || currentPatientInfo;
        options.onUpdateReception({
          patientBaseInfo: {
            ...basePatientInfo,
            ...data,
          } as Reception["patientBaseInfo"],
        });
      } else {
        updatePatientBaseInfo(data);
      }
    },
    [options?.receptionId, options?.onUpdateReception, getCurrentReception, currentPatientInfo, updatePatientBaseInfo]
  );
  //#endregion

  //#region Effects
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const patientInfo = options?.reception?.patientBaseInfo || currentPatientInfo;

      // RRN은 포맷된 값이므로 숫자만 추출하여 동기화
      const rrnValue = patientInfo?.rrn || "";
      const rrnNumbersOnly = rrnValue.replace(/[^0-9]/g, "");

      // 항상 현재 환자 정보와 동기화 (RRN 유무와 관계없이)
      setLocalRrn(rrnNumbersOnly);
      setGender(patientInfo?.gender || 0);
      setLocalName(patientInfo?.name || "");
      setLocalPhone(patientInfo?.phone1 || "");

      // Format birth date
      if (patientInfo?.birthday) {
        const formattedBirth = formatBirthDate(patientInfo.birthday);
        setBirth(formattedBirth);
      } else {
        setBirth("");
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [
    options?.reception?.patientBaseInfo,
    currentPatientInfo?.rrn,
    currentPatientInfo?.gender,
    currentPatientInfo?.birthday,
    currentPatientInfo?.name,
    currentPatientInfo?.phone1,
    openedReceptionId,
  ]);
  //#endregion

  //#region Helper Functions
  const handleRrnChangeValue = useCallback(
    (value: string) => {
      const formatted = formatRrnNumber(value);

      // 검증 없이 항상 값 업데이트
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          rrn: formatted,
        });
      }
      setShake(false);
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  // Address search handler
  const handleDaumPostComplete = useCallback(
    (data: any) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          zipcode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
        });
      }
      setIsSearchAddressOpen(false);
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  // Qualification request handler
  const handleQualificationRequest = useCallback(async (options?: {
    rrn?: string;
    name?: string;
  }): Promise<boolean> => {
    // 옵셔널 파라미터가 있으면 우선 사용, 없으면 currentPatientInfo 사용
    const rrn = options?.rrn || currentPatientInfo?.rrn || "";
    const name = options?.name || currentPatientInfo?.name || "";

    // rrn이 포맷된 값일 수 있으므로 숫자만 추출
    const rrnNumbersOnly = rrn.replace(/[^0-9]/g, "");

    if (
      !rrnNumbersOnly ||
      !name ||
      !hospital.number
    ) {
      toast({
        title: "주민등록번호, 환자이름, 요양기관번호가 필요합니다.",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // 이전 자격조회 데이터 초기화
      setTempEligibilityData(null);

      const request = QualificationService.createRequest({
        sujinjaJuminNo: rrnNumbersOnly,
        sujinjaJuminNm: name,
        date: new Date(),
        ykiho: hospital.number,
        msgType: 의료급여메시지타입.수진자자격조회,
        idYN: currentPatientInfo?.identityOptional,
      });

      const eligibilityResponse = await QualificationService.getQualification(request);

      if (eligibilityResponse) {
        // EligibilityCheck 형태로 저장
        setTempEligibilityData(eligibilityResponse);

        setIsQualificationModalOpen(true);
        setShake(false);
        return true;
      } else {
        const errorMessage =
          error || "자격조회에 실패했습니다. 다시 시도해주세요.";
        toast({
          title: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (err: any) {
      // 자격조회 에러 메시지를 toast로 표시
      const errorMessage =
        err?.message || "자격조회 요청 중 오류가 발생했습니다.";
      setError(errorMessage);

      if (err instanceof Error && isNHICError(err.message)) {
        const errorMessage = getErrorMessage(err.message);
        toast({
          title: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: `자격조회 요청 중 오류가 발생했습니다: ${errorMessage}`,
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPatientInfo, hospital.number, toast, error]);
  //#endregion

  //#region Update Handlers
  // Patient info update handlers
  const updateName = useCallback(
    (name: string) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          name,
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updatePhone = useCallback(
    (phone: string) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          phone1: phone,
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updateRrn = useCallback(
    (rrn: string) => {
      if (currentPatientInfo) {
        handleRrnChangeValue(rrn);
      }
    },
    [currentPatientInfo, handleRrnChangeValue]
  );

  const updateAddress2 = useCallback(
    (address2: string) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          address2,
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updateIdType = useCallback(
    (idType: PatientIdType | null) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          idType,
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updateIdNumber = useCallback(
    (idNumber: string) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          idNumber,
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updateMessageConsent = useCallback(
    (refused: boolean) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          recvMsg: refused ? 0 : 1, // 거부 체크시 0, 미체크시 1
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updatePrivacyConsent = useCallback(
    (privacyType: number) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          isPrivacy: privacyType as ConsentPrivacyType, // ConsetPrivacyType enum 값
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );

  const updateGroupId = useCallback(
    (groupId: number | null) => {
      if (currentPatientInfo) {
        updatePatientBaseInfoWrapper({
          groupId,
        });
      }
    },
    [currentPatientInfo, updatePatientBaseInfoWrapper]
  );
  //#endregion

  //#region Medical Aid & Identity Verification Functions
  // 수진자조회 날짜 포맷팅 함수
  const getMedicalAidDisplayDate = useCallback((eligibilityCheck: any) => {
    if (!eligibilityCheck) return "";

    if (eligibilityCheck.updateDateTime) {
      return new Date(eligibilityCheck.updateDateTime).toISOString().split("T")[0]; // YYYY-MM-DD 형식
    }

    if (eligibilityCheck.checkDateTime) {
      return new Date(eligibilityCheck.checkDateTime).toISOString().split("T")[0];
    }

    return "";
  }, []);

  // 본인확인 버튼 속성 반환 함수
  const getIdentityButtonProps = useCallback(
    (
      eligibilityCheck: EligibilityCheck,
      identityVerifiedAt: Date | null,
      identityOptional?: boolean | null
    ) => {
      // 본인확인제외 대상 판단 (기존 로직 유지)
      if (
        eligibilityCheck?.parsedData?.["본인확인예외여부"]?.data === "Y"
      ) {
        return {
          style: {
            backgroundColor: "var(--bg-main)",
            color: "var(--border-1)",
            borderColor: "var(--border-1)",
          },
          idYN: 본인확인여부.예외,
        };
      }

      // showIdYN 함수를 사용하여 본인확인 여부 확인 (enum과 style 함께 반환)
      return showIdYN(
        identityVerifiedAt,
        eligibilityCheck?.parsedData?.["수진자주민등록번호"]?.data ?? null,
        identityOptional
      );
    },
    []
  );

  // 수진자조회 상태 반환 함수
  const getMedicalAidStatus = useCallback(() => {

    // 초기화 상태인 경우 아무것도 표시하지 않음
    if (!currentPatientInfo) {
      return null;
    }

    const eligibilityCheck = currentPatientInfo?.eligibilityCheck || {} as EligibilityCheck;
    // 수진자조회 실패 케이스
    if (!eligibilityCheck || Object.keys(eligibilityCheck).length === 0) {
      return {
        type: "failure" as const,
      };
    }

    // 수진자조회 성공 케이스
    const displayDate = getMedicalAidDisplayDate(eligibilityCheck);
    const buttonProps = getIdentityButtonProps(
      eligibilityCheck,
      currentPatientInfo?.identityVerifiedAt,
      currentPatientInfo?.identityOptional
    );

    return {
      type: "success" as const,
      displayDate,
      buttonProps,
    };
  }, [currentPatientInfo, getMedicalAidDisplayDate, getIdentityButtonProps]);
  //#endregion

  //#region Event Handlers
  // NHIC modal handlers
  const handleNhicModalClose = useCallback(() => {
    setIsQualificationModalOpen(false);
    // 모달 닫을 때 데이터 초기화 (이전 환자 데이터가 다음 환자에게 보이지 않도록)
    setTempEligibilityData(null); // 임시 데이터 삭제
    setLoading(false);
    setError(null);
    setShake(false);
  }, []);

  const handleNhicModalApply = useCallback(
    async (
      responseModel: components["schemas"]["EligibilityCheckResponseDto"],
      onNhicResponseApply?: (
        model: components["schemas"]["EligibilityCheckResponseDto"]
      ) => void
    ) => {
      // 중복 실행 방지
      if (isApplyingRef.current) {
        return;
      }
      isApplyingRef.current = true;

      try {
        // 기존 콜백 호출 (호환성 유지)
        if (onNhicResponseApply) {
          onNhicResponseApply(responseModel);
        }

        // tempEligibilityData를 기준으로 eligibilityCheck / insuranceInfo 적용
        const eligibilityCheck = tempEligibilityData;
        if (eligibilityCheck && currentPatientInfo) {
          const parsedData = eligibilityCheck.parsedData;

          // setEligibilityResponseToInsuranceInfo를 사용하여 전체 insuranceInfo 생성 (uDeptDetail 포함)
          const receptionDateTime = currentReception?.receptionDateTime
            ? new Date(currentReception.receptionDateTime)
            : new Date();
          const rrn = getResidentRegistrationNumberWithNumberString(currentPatientInfo.rrn);

          // 기존 insuranceInfo에서 unionName 유지
          const baseInsuranceInfo =
            options?.reception?.insuranceInfo ||
            currentReception?.insuranceInfo;
          const unionName = baseInsuranceInfo?.unionName || "";

          // extraQualification 추출
          const extraQualification = parsedData
            ? extractExtraQualificationFromParsedData(parsedData)
            : {};

          // setEligibilityResponseToInsuranceInfo로 전체 insuranceInfo 생성
          const newInsuranceInfo = setEligibilityResponseToInsuranceInfo(
            receptionDateTime,
            rrn,
            parsedData,
            { unionName },
            extraQualification
          );

          // 외부 receptionId + onUpdateReception이 있는 경우: 콜백을 통해 외부 reception에 반영
          if (options?.receptionId && options?.onUpdateReception) {
            const baseReception =
              options.reception ||
              (currentReception as Reception | undefined);
            if (baseReception && newInsuranceInfo) {
              // 기존 insuranceInfo와 병합 (기존 값 유지)
              const mergedInsuranceInfo = {
                ...(baseReception.insuranceInfo || {}),
                ...newInsuranceInfo,
                // extraQualification은 별도로 병합
                extraQualification: {
                  ...(baseReception.insuranceInfo?.extraQualification || {}),
                  ...(newInsuranceInfo.extraQualification || {}),
                },
              };

              options.onUpdateReception({
                patientBaseInfo: {
                  ...baseReception.patientBaseInfo,
                  eligibilityCheck,
                },
                insuranceInfo: mergedInsuranceInfo,
              });
            }
          }

          // openedReceptionId가 있고, 외부 콜백이 없을 때만 tabs-store 업데이트
          // 외부 onUpdateReception 콜백이 있으면 콜백에서 처리하므로 tabs-store 직접 업데이트 불필요
          const targetReceptionId = openedReceptionId;
          const isExternalReception = options?.receptionId && options?.onUpdateReception;

          if (targetReceptionId && newInsuranceInfo && !isExternalReception) {
            const current = openedReceptions.find(
              (r) => r.originalRegistrationId === targetReceptionId
            );
            if (current) {
              const mergedInsuranceInfo = {
                ...(current.insuranceInfo || {}),
                ...newInsuranceInfo,
                // extraQualification은 별도로 병합
                extraQualification: {
                  ...(current.insuranceInfo?.extraQualification || {}),
                  ...(newInsuranceInfo.extraQualification || {}),
                },
              };

              updateOpenedReception(targetReceptionId, {
                patientBaseInfo: {
                  ...current.patientBaseInfo,
                  eligibilityCheck,
                },
                insuranceInfo: mergedInsuranceInfo,
              });

            }
          }
        }

        setIsQualificationModalOpen(false);
        // 정보 적용 후 자격조회 데이터 초기화
        setTempEligibilityData(null);
      } catch (err) {
        console.error("[use-basic-info] handleNhicModalApply 자격조회 정보 저장 실패:", err);
        toast({
          title: "자격조회 정보 저장에 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        // 플래그 해제 (약간의 지연을 두어 중복 실행 완전 방지)
        setTimeout(() => {
          isApplyingRef.current = false;
        }, 300);
      }
    },
    [
      toast,
      tempEligibilityData,
      options?.receptionId,
      options?.onUpdateReception,
      options?.reception,
      currentReception,
      openedReceptionId,
      openedReceptions,
      updateOpenedReception,
    ]
  );

  // 개인정보수집 동의서 전송 핸들러 (PRIVACY 카테고리로 다건 생성)
  const handleConsentSend = useCallback(async (encounterId?: number) => {
    if (!currentPatientInfo) {
      toast({
        title: "환자 정보가 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { ConsentsApi } = await import("@/lib/api/routes/consents-api");

      // PRIVACY 카테고리로 다건 동의서 생성
      const result = await ConsentsApi.createByCategory({
        patientId: currentPatientInfo.patientId,
        category: "PRIVACY",
        status: "PENDING",
        encounterId,
      });

      if (result.createdCount === 0) {
        toast({
          title: "전송할 동의서가 없습니다. 이미 모든 동의서에 서명이 완료되었거나, 해당 카테고리의 동의서 템플릿이 없습니다.",
          variant: "default",
        });
      } else {
        toast({
          title: `${result.createdCount}개의 동의서가 전송되었습니다.`,
          variant: "default",
        });
      }
    } catch (err) {
      console.error("[use-basic-info] handleConsentSend 동의서 전송 실패:", err);
      toast({
        title: "동의서 전송에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [currentPatientInfo, toast]);
  //#endregion

  //#region Return Values
  return {
    // States
    localName,
    localPhone,
    localRrn,
    birth,
    gender,
    isSearchAddressOpen,
    isQualificationModalOpen,
    loading,
    error,
    shake,

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
    setGender,
    setIsSearchAddressOpen,
    setIsQualificationModalOpen,
    setLoading,
    setError,
    setShake,

    // Handlers
    handleRrnChangeValue,
    handleDaumPostComplete,
    handleQualificationRequest,
    updateName,
    updatePhone,
    updateRrn,
    updateAddress2,
    updateIdType,
    updateIdNumber,
    updateMessageConsent,
    updatePrivacyConsent,
    updateGroupId,
    handleNhicModalClose,
    handleNhicModalApply,
    handleConsentSend,

    // Medical Aid & Identity Functions
    getMedicalAidDisplayDate,
    getIdentityButtonProps,
    getMedicalAidStatus,
  };
  //#endregion
};
