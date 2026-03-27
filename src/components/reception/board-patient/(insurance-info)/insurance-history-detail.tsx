"use client";

import { useMemo } from "react";
import HealthMedical from "@/components/medical-info/health-medical";
import BohoMedical from "@/components/medical-info/boho-medical";
import SecondMedical from "@/components/medical-info/second-medical";
import GeneralMedical from "@/components/medical-info/general-medical";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { 보험구분상세 } from "@/constants/common/common-enum";
import { MyButton } from "@/components/yjg/my-button";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { InsuranceHistoryItem } from "./insurance-history-list";

interface InsuranceHistoryDetailProps {
  /** 선택된 행들 */
  selectedRows?: MyGridRowType[];
  /** 보험 이력 리스트 */
  insuranceHistoryList?: InsuranceHistoryItem[];
  /** 수진자조회 핸들러 */
  onEligibilityCheck?: () => void;
  /** 보험이력변경 핸들러 */
  onHistoryChange?: () => void;
  /** 편집 가능한 보험 정보 (부모에서 관리하는 로컬 상태) */
  editableInsuranceInfo?: Partial<InsuranceInfo> | null;
  /** 보험 정보 변경 콜백 */
  onInsuranceDataChange?: (data: Partial<InsuranceInfo>) => void;
  /** 변경 여부 (버튼 활성화 제어) */
  hasInsuranceChanged?: boolean;
  /** 로딩 상태 (mutation 진행 중) */
  isMutating?: boolean;
}

export default function InsuranceHistoryDetail({
  selectedRows = [],
  insuranceHistoryList = [],
  onEligibilityCheck,
  onHistoryChange,
  editableInsuranceInfo,
  onInsuranceDataChange,
  hasInsuranceChanged,
  isMutating,
}: InsuranceHistoryDetailProps) {
  // 선택된 행의 첫 번째 항목을 InsuranceInfo로 변환
  const selectedInsuranceInfo = useMemo<Partial<InsuranceInfo> | null>(() => {
    if (selectedRows.length === 0) return null;

    // 첫 번째 선택된 행 사용
    const firstSelectedRow = selectedRows[0];
    if (!firstSelectedRow) return null;

    // 선택된 행의 registrationId로 원본 데이터 찾기
    const selectedItem = insuranceHistoryList.find(
      (item) => item.registrationId === firstSelectedRow.key
    );
    if (!selectedItem) return null;

    // InsuranceInfo 형태로 변환
    return {
      receptionDateTime: selectedItem.receptionDateTime
        ? new Date(selectedItem.receptionDateTime)
        : new Date(),
      uDeptDetail:
        typeof selectedItem.uDeptDetail === "string" ||
        typeof selectedItem.uDeptDetail === "number"
          ? (selectedItem.uDeptDetail as 보험구분상세)
          : 보험구분상세.일반,
      cardNumber: selectedItem.cardNumber || "",
      father: selectedItem.father || "",
      relation: selectedItem.relation as any,
      unionCode: selectedItem.unionCode || "",
      unionName: selectedItem.unionName || "",
      // 기타 필드는 필요시 추가
    };
  }, [selectedRows, insuranceHistoryList]);

  // uDeptDetail에 따라 적절한 보험 컴포넌트를 렌더링하는 함수
  const renderInsuranceComponent = () => {
    const insuranceInfo =
      editableInsuranceInfo ?? selectedInsuranceInfo ?? undefined;
    const changeHandler = onInsuranceDataChange ?? (() => {});

    if (!insuranceInfo || !insuranceInfo.uDeptDetail) {
      return (
        <GeneralMedical
          key="insurance-history-general"
          currentInsuranceInfo={insuranceInfo}
          onInsuranceDataChange={changeHandler}
        />
      );
    }

    const uDeptDetail = insuranceInfo.uDeptDetail as 보험구분상세;
    switch (uDeptDetail) {
      case 보험구분상세.일반:
        return (
          <GeneralMedical
            key="insurance-history-general"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={changeHandler}
          />
        );

      case 보험구분상세.국민공단:
      case 보험구분상세.직장조합:
        return (
          <HealthMedical
            key="insurance-history-health"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={changeHandler}
          />
        );

      case 보험구분상세.의료급여1종:
      case 보험구분상세.의료급여2종:
      case 보험구분상세.의료급여2종장애:
        return (
          <BohoMedical
            key="insurance-history-boho"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={changeHandler}
          />
        );

      case 보험구분상세.차상위1종:
      case 보험구분상세.차상위2종:
      case 보험구분상세.차상위2종장애:
        return (
          <SecondMedical
            key="insurance-history-second"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={changeHandler}
          />
        );

      default:
        return (
          <GeneralMedical
            key="insurance-history-general-default"
            currentInsuranceInfo={insuranceInfo}
            onInsuranceDataChange={changeHandler}
          />
        );
    }
  };

  return (
    <div className="flex-shrink-0 flex flex-col">
      {/* 보험정보 영역 */}
      <div className="min-h-[16rem] overflow-hidden border-t pt-2 flex flex-col mb-2">
        {/* 보험정보 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold">보험정보</span>
          <MyButton
            variant="outline"
            size="sm"
            onClick={() => {
              onEligibilityCheck?.();
              // TODO: 수진자조회 로직 구현
            }}
            disabled={selectedRows.length === 0}
          >
            수진자조회
          </MyButton>
        </div>
        {/* 보험정보 컴포넌트 */}
        <div className="flex-1 overflow-auto">{renderInsuranceComponent()}</div>
      </div>

      {/* Footer 영역 */}
      <div className="border-t pt-2 flex justify-end">
        <MyButton
          variant="default"
          onClick={() => onHistoryChange?.()}
          disabled={
            selectedRows.length === 0 ||
            isMutating ||
            (hasInsuranceChanged !== undefined && !hasInsuranceChanged)
          }
        >
          {isMutating ? "처리 중..." : "보험이력변경"}
        </MyButton>
      </div>
    </div>
  );
}
