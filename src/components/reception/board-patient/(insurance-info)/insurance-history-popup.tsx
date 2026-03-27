"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import GeneralMedical from "@/components/medical-info/general-medical";
import HealthMedical from "@/components/medical-info/health-medical";
import BohoMedical from "@/components/medical-info/boho-medical";
import SecondMedical from "@/components/medical-info/second-medical";
import QualificationCheckModals from "@/components/qualification-check/qualification-check-modals";
import { useBasicInfo } from "@/hooks/reception/use-basic-info";
import { useQualificationCheck } from "@/hooks/reception/use-qualification-check";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import { useInsuranceHistoryChange } from "@/hooks/reception/use-insurance-history-change";
import { useToastHelpers } from "@/components/ui/toast";
import { 보험구분상세 } from "@/constants/common/common-enum";
import type { Registration } from "@/types/registration-types";
import type { Reception } from "@/types/common/reception-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";

interface InsuranceHistoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  reception: Reception | null;
}

export default function InsuranceHistoryPopup({
  isOpen,
  onClose,
  registration,
  reception,
}: InsuranceHistoryPopupProps) {
  const { toast } = useToastHelpers();
  const focusAfterCloseRef = useRef<HTMLButtonElement>(null);

  // ── 로컬 reception (수진자조회 적용 결과 · 수동 편집 반영용) ──
  const [localReception, setLocalReception] = useState<Reception | null>(null);

  // 팝업 열릴 때 localReception 초기화
  const currentReception = localReception ?? reception;

  // ── 수진자조회 연동 (useBasicInfo) ──
  const basicInfo = useBasicInfo({
    reception: currentReception,
    receptionId: registration?.id ?? null,
    onUpdateReception: (updates) => {
      setLocalReception((prev) => {
        const base = prev ?? reception;
        if (!base) return null;
        return { ...base, ...updates };
      });
    },
  });

  // ── updatePatientMutation (useQualificationCheck에서 필요) ──
  const updatePatientMutation = useUpdatePatient();

  // ── 본인확인 + NHIC 팝업 관리 (useQualificationCheck) ──
  const qualCheck = useQualificationCheck({
    currentPatientInfo: basicInfo.currentPatientInfo,
    getMedicalAidStatus: basicInfo.getMedicalAidStatus,
    handleQualificationRequest: basicInfo.handleQualificationRequest,
    handleNhicModalApply: basicInfo.handleNhicModalApply,
    handleNhicModalClose: basicInfo.handleNhicModalClose,
    tempEligibilityData: basicInfo.tempEligibilityData,
    loading: basicInfo.loading,
    updatePatientBaseInfo: (data: any) => {
      // 팝업 내 localReception에 반영
      setLocalReception((prev) => {
        const base = prev ?? reception;
        if (!base) return null;
        return {
          ...base,
          patientBaseInfo: {
            ...base.patientBaseInfo,
            ...data,
          },
        };
      });
    },
    updatePatientMutation,
    focusAfterCloseRef,
  });

  // ── Mutation chain 훅 ──
  const { isLoading: isMutating, executeInsuranceHistoryChange } =
    useInsuranceHistoryChange({
      onSuccess: () => {
        toast({
          title: "보험이력이 변경되었습니다.",
          variant: "default",
        });
        handleClose();
      },
      onError: (error) => {
        toast({
          title: `보험이력변경 실패: ${error.message}`,
          variant: "destructive",
        });
      },
    });

  // ── 기존 reception과 로컬 reception의 보험정보 비교 ──
  const hasInsuranceChanged = useMemo(() => {
    if (!reception || !localReception) return false;
    const orig = reception.insuranceInfo;
    const local = localReception.insuranceInfo;
    if (!orig || !local) return false;
    return (
      orig.uDeptDetail !== local.uDeptDetail ||
      orig.cardNumber !== local.cardNumber ||
      orig.unionCode !== local.unionCode ||
      orig.unionName !== local.unionName ||
      JSON.stringify(orig.extraQualification) !== JSON.stringify(local.extraQualification)
    );
  }, [reception, localReception]);

  // ── 팝업 닫기 + 상태 초기화 ──
  const handleClose = useCallback(() => {
    setLocalReception(null);
    qualCheck.clearQualificationState();
    onClose();
  }, [onClose, qualCheck]);

  // ── 보험이력변경 실행 ──
  const handleInsuranceHistoryChange = useCallback(() => {
    if (!registration || !currentReception?.insuranceInfo) return;
    executeInsuranceHistoryChange(registration, currentReception.insuranceInfo);
  }, [registration, currentReception, executeInsuranceHistoryChange]);

  // ── 보험정보 수동 편집 핸들러 ──
  const handleInsuranceDataChange = useCallback(
    (updates: Partial<InsuranceInfo>) => {
      setLocalReception((prev) => {
        const base = prev ?? reception;
        if (!base) return null;
        return {
          ...base,
          insuranceInfo: {
            ...base.insuranceInfo,
            ...updates,
          },
        };
      });
    },
    [reception]
  );

  // ── 보험 컴포넌트 렌더링 (insurance-history-detail.tsx 패턴 재사용) ──
  const renderInsuranceComponent = () => {
    const insuranceInfo = currentReception?.insuranceInfo;

    if (!insuranceInfo || !insuranceInfo.uDeptDetail) {
      return (
        <GeneralMedical
          key="popup-general"
          currentInsuranceInfo={insuranceInfo}
          onInsuranceDataChange={handleInsuranceDataChange}
          isDisabled={false}
        />
      );
    }

    const uDeptDetail = insuranceInfo.uDeptDetail as 보험구분상세;
    switch (uDeptDetail) {
      case 보험구분상세.일반:
        return (
          <GeneralMedical
            key="popup-general"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={false}
          />
        );

      case 보험구분상세.국민공단:
      case 보험구분상세.직장조합:
        return (
          <HealthMedical
            key="popup-health"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={false}
          />
        );

      case 보험구분상세.의료급여1종:
      case 보험구분상세.의료급여2종:
      case 보험구분상세.의료급여2종장애:
        return (
          <BohoMedical
            key="popup-boho"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={false}
          />
        );

      case 보험구분상세.차상위1종:
      case 보험구분상세.차상위2종:
      case 보험구분상세.차상위2종장애:
        return (
          <SecondMedical
            key="popup-second"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={false}
          />
        );

      default:
        return (
          <GeneralMedical
            key="popup-general-default"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={handleInsuranceDataChange}
            isDisabled={false}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <MyPopup
        isOpen={isOpen}
        onCloseAction={handleClose}
        title="보험이력변경"
        fitContent={true}
        width="600px"
      >
        <div className="flex flex-col gap-2 p-2">
          {/* 보험정보 영역 */}
          <div className="flex flex-col">
            {/* 보험정보 헤더 + 수진자조회 버튼 */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">보험정보</span>
              <MyButton
                ref={focusAfterCloseRef}
                variant="outline"
                size="sm"
                onClick={() => qualCheck.triggerQualificationCheck()}
              >
                수진자조회
              </MyButton>
            </div>
            {/* 보험정보 컴포넌트 (읽기 전용) */}
            <div className="overflow-auto">{renderInsuranceComponent()}</div>
          </div>

          {/* Footer 영역 */}
          <div className="border-t pt-2 flex justify-end gap-2">
            <MyButton variant="outline" onClick={handleClose}>
              닫기
            </MyButton>
            <MyButton
              variant="default"
              onClick={handleInsuranceHistoryChange}
              disabled={!hasInsuranceChanged || isMutating}
            >
              {isMutating ? "처리 중..." : "보험이력변경"}
            </MyButton>
          </div>
        </div>
      </MyPopup>

      {/* 수진자조회 결과 모달 + 본인확인 모달 */}
      <QualificationCheckModals
        qualificationCheck={qualCheck}
        tempEligibilityData={basicInfo.tempEligibilityData}
        loading={basicInfo.loading}
      />
    </>
  );
}
