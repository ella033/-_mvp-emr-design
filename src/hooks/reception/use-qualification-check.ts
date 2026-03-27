import { useState, useCallback } from "react";
import { checkIdYN } from "@/lib/registration-utils";
import { 본인확인여부 } from "@/constants/common/common-enum";
import { formatDate } from "@/lib/date-utils";
import type { components } from "@/generated/api/types";
import type { EligibilityCheck } from "@/types/eligibility-checks-types";

interface UseQualificationCheckOptions {
  currentPatientInfo: any;
  getMedicalAidStatus: () => {
    type: "success" | "failure";
    displayDate?: string;
    buttonProps?: {
      idYN: 본인확인여부;
      style: Record<string, string>;
    };
  } | null;
  handleQualificationRequest: (options?: {
    rrn?: string;
    name?: string;
  }) => Promise<boolean>;
  handleNhicModalApply: (
    responseModel: components["schemas"]["EligibilityCheckResponseDto"],
    onNhicResponseApply?: (
      model: components["schemas"]["EligibilityCheckResponseDto"]
    ) => void
  ) => Promise<void>;
  handleNhicModalClose: () => void;
  tempEligibilityData: EligibilityCheck | null;
  loading: boolean;
  updatePatientBaseInfo: (data: any) => void;
  updatePatientMutation: {
    mutateAsync: (params: {
      patientId: number;
      updatePatient: any;
    }) => Promise<any>;
  };
  onNhicResponseApply?: (
    responseModel: components["schemas"]["EligibilityCheckResponseDto"]
  ) => void;
  focusAfterCloseRef?: React.RefObject<HTMLElement | null>;
}

export function useQualificationCheck({
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
  focusAfterCloseRef,
}: UseQualificationCheckOptions) {
  // ── 내부 상태 ──
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certificateModalSource, setCertificateModalSource] = useState<
    "qualification" | "identity"
  >("qualification");
  const [isNhicPopupOpen, setIsNhicPopupOpen] = useState(false);

  // 포커스 이동 헬퍼
  const focusAfterClose = useCallback(() => {
    if (focusAfterCloseRef?.current) {
      setTimeout(() => {
        focusAfterCloseRef.current?.focus();
      }, 100);
    }
  }, [focusAfterCloseRef]);

  // ── 직접 자격조회 진행 ──
  const triggerDirectRequest = useCallback(
    async (options?: { rrn?: string; name?: string }) => {
      const success = await handleQualificationRequest(options);
      if (success) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        setIsNhicPopupOpen(true);
      }
    },
    [handleQualificationRequest]
  );

  // ── 공통: 본인확인 상태에 따라 바로 자격조회 vs 신분증(증명) 모달
  //    (자격조회 버튼 클릭 · RRN Enter 키 등에서 공통 사용)
  const tryQualificationOrCertificate = useCallback(
    (options?: {
      rrn?: string;
      name?: string;
      identityVerifiedAt?: Date | null;
      identityOptional?: boolean;
    }) => {
      const verifiedAt =
        options?.identityVerifiedAt ??
        currentPatientInfo?.identityVerifiedAt ??
        null;
      const rrn = options?.rrn ?? currentPatientInfo?.rrn ?? null;
      const optional = options?.identityOptional ?? currentPatientInfo?.identityOptional;

      const idYNStatus = checkIdYN(verifiedAt, rrn, optional);

      // 본인확인완료(idYN === false && verifiedAt !== null && 6개월 이내) 또는 본인확인예외 → 바로 자격조회
      if (
        idYNStatus === 본인확인여부.완료 ||
        idYNStatus === 본인확인여부.예외
      ) {
        const payload =
          options?.rrn != null && options?.name != null
            ? { rrn: options.rrn, name: options.name }
            : undefined;
        triggerDirectRequest(payload);
        return;
      }

      // 본인확인미완료: certificate-form을 통해 진행
      setCertificateModalSource("qualification");
      setIsCertificateModalOpen(true);
    },
    [
      currentPatientInfo?.identityVerifiedAt,
      currentPatientInfo?.rrn,
      currentPatientInfo?.identityOptional,
      triggerDirectRequest,
    ]
  );

  // ── 메인 진입점: 자격조회 버튼 클릭 ──
  const triggerQualificationCheck = useCallback(() => {
    const medicalAidStatus = getMedicalAidStatus();

    console.log('[triggerQualificationCheck] medicalAidStatus', medicalAidStatus);
    // 수진자조회가 성공한 경우에만 본인확인 예외 처리
    if (medicalAidStatus?.type === "success") {
      const { buttonProps } = medicalAidStatus;

      // 1-3. 본인확인예외 환자는 idYN = true로 설정하고 certificate-form 없이 바로 자격조회
      if (buttonProps?.idYN === 본인확인여부.예외) {
        if (currentPatientInfo) {
          updatePatientBaseInfo({
            ...currentPatientInfo,
            identityOptional: true,
          });
        }
        triggerDirectRequest();
        return;
      }
    }

    // 1-1. 본인확인완료 / 1-2. 본인확인미완료 → tryQualificationOrCertificate에서 처리 (바로 자격조회 vs certificate-form)
    tryQualificationOrCertificate();
  }, [
    currentPatientInfo,
    getMedicalAidStatus,
    updatePatientBaseInfo,
    triggerDirectRequest,
    tryQualificationOrCertificate,
  ]);

  // ── 본인확인 버튼 클릭 ──
  const triggerIdentityCheck = useCallback(() => {
    setCertificateModalSource("identity");
    setIsCertificateModalOpen(true);
  }, []);

  // ── certificate-form 없이 자격조회 모달 열기 (RRN Enter키에서 사용) ──
  const openCertificateForQualification = useCallback(() => {
    setCertificateModalSource("qualification");
    setIsCertificateModalOpen(true);
  }, []);

  // ── NHIC 팝업 핸들러 ──
  const handleNhicPopupClose = useCallback(() => {
    setIsNhicPopupOpen(false);
    handleNhicModalClose();
    focusAfterClose();
  }, [handleNhicModalClose, focusAfterClose]);

  const handleNhicPopupApply = useCallback(
    (eligibilityCheck: any) => {
      const parsedData = eligibilityCheck?.parsedData;
      const responseModel = parsedData;

      handleNhicModalApply(responseModel, onNhicResponseApply);
      setIsNhicPopupOpen(false);
      focusAfterClose();
    },
    [handleNhicModalApply, onNhicResponseApply, focusAfterClose]
  );

  // ── 본인확인 모달 핸들러 (자격조회 경로) ──
  const handleCertificateConfirm = useCallback(() => {
    if (!isCertificateModalOpen || isNhicPopupOpen) {
      return;
    }

    if (loading || tempEligibilityData) {
      if (currentPatientInfo) {
        updatePatientBaseInfo({
          ...currentPatientInfo,
          identityVerifiedAt: new Date(),
          identityOptional: false,
        });

        const patientIdNumber = Number(currentPatientInfo.patientId);
        if (Number.isFinite(patientIdNumber) && patientIdNumber > 0) {
          void updatePatientMutation
            .mutateAsync({
              patientId: patientIdNumber,
              updatePatient: {
                identityVerifiedAt: new Date(),
                identityOptional: false,
              } as any,
            })
            .catch((error) => {
              console.error(
                "[use-qualification-check] handleCertificateConfirm error",
                error
              );
            });
        }
      }
      setIsCertificateModalOpen(false);
      return;
    }

    // 정상적인 경우: 본인확인 정보 업데이트 후 자격조회 진행
    if (currentPatientInfo) {
      updatePatientBaseInfo({
        ...currentPatientInfo,
        identityVerifiedAt: new Date(),
        identityOptional: false,
      });
    }

    // 모달을 먼저 닫기
    setIsCertificateModalOpen(false);

    // certificateModalSource가 "qualification"일 때만 자격조회 실행
    if (certificateModalSource === "qualification") {
      setTimeout(() => {
        triggerDirectRequest();
      }, 100);
    }
  }, [
    certificateModalSource,
    isNhicPopupOpen,
    tempEligibilityData,
    loading,
    isCertificateModalOpen,
    currentPatientInfo,
    updatePatientBaseInfo,
    triggerDirectRequest,
    updatePatientMutation,
  ]);

  const handleCertificateCancel = useCallback(() => {
    // 자격조회가 이미 진행 중이거나 완료된 경우 중복 실행 방지
    if (loading || isNhicPopupOpen || tempEligibilityData) {
      if (currentPatientInfo) {
        updatePatientBaseInfo({
          ...currentPatientInfo,
          identityOptional: false,
        });
      }
      setIsCertificateModalOpen(false);
      return;
    }

    if (currentPatientInfo) {
      updatePatientBaseInfo({
        ...currentPatientInfo,
        identityOptional: false,
      });
    }

    // 모달을 먼저 닫기
    setIsCertificateModalOpen(false);

    // certificateModalSource가 "qualification"일 때만 자격조회 실행
    if (certificateModalSource === "qualification") {
      setTimeout(() => {
        triggerDirectRequest();
      }, 100);
    }
  }, [
    loading,
    isNhicPopupOpen,
    tempEligibilityData,
    currentPatientInfo,
    updatePatientBaseInfo,
    certificateModalSource,
    triggerDirectRequest,
  ]);

  const handleCertificateCheck = useCallback(() => {
    // 본인확인필요인 경우만 idYN 업데이트
    const medicalAidStatus = getMedicalAidStatus();
    if (medicalAidStatus?.type === "success") {
      const { buttonProps } = medicalAidStatus;
      if (buttonProps?.idYN === 본인확인여부.미완료) {
        if (currentPatientInfo) {
          updatePatientBaseInfo({
            ...currentPatientInfo,
            identityOptional: false,
            identityVerifiedAt: new Date(),
          });
        }
      }
    }

    // 모달 닫기
    setIsCertificateModalOpen(false);
  }, [currentPatientInfo, getMedicalAidStatus, updatePatientBaseInfo]);

  // ── 상태 초기화 ──
  const clearQualificationState = useCallback(() => {
    setIsCertificateModalOpen(false);
    setCertificateModalSource("qualification");
    setIsNhicPopupOpen(false);
  }, []);

  // ── 본인확인 모달에 전달할 props ──
  const certificateFormProps = {
    isOpen: isCertificateModalOpen,
    onClose: () => setIsCertificateModalOpen(false),
    onConfirm: handleCertificateConfirm,
    onCancel: handleCertificateCancel,
    onCheck: handleCertificateCheck,
    recentCheckDate: currentPatientInfo?.identityVerifiedAt
      ? formatDate(currentPatientInfo.identityVerifiedAt, "-")
      : null,
    identityOptional: currentPatientInfo?.identityOptional,
    certificateModalSource,
  };

  return {
    // 진입점
    triggerQualificationCheck,
    triggerIdentityCheck,
    triggerDirectRequest,
    tryQualificationOrCertificate,
    openCertificateForQualification,

    // 모달 상태
    isCertificateModalOpen,
    certificateModalSource,
    isNhicPopupOpen,

    // NHIC 팝업 핸들러
    handleNhicPopupClose,
    handleNhicPopupApply,

    // 본인확인 모달 핸들러
    handleCertificateConfirm,
    handleCertificateCancel,
    handleCertificateCheck,

    // 본인확인 모달 props (편의용)
    certificateFormProps,

    // 상태 초기화
    clearQualificationState,

    // 모달 setter (특수 케이스용)
    setIsCertificateModalOpen,
    setIsNhicPopupOpen,
  };
}
