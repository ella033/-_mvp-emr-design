"use client";

/**
 * 조건 검색 컴포넌트
 * 조건에 맞는 CRM 발송 대상을 검색하는 기능을 제공합니다.
 */
import React, { useState, useEffect } from "react";
import { useConditionSearch } from "@/hooks/crm/use-condition-search";
import { useGetConditions } from "@/hooks/crm/use-get-conditions";
import { useGetConditionById } from "@/hooks/crm/use-get-condition-by-id";
import type {
  ConditionSearchPatient,
  ConditionSearchRequest,
} from "@/types/crm/condition-search/condition-search-types";
import type {
  TargetConditionsDto,
  ConditionDetailResponseDto,
} from "@/types/crm/condition-search/condition-management-types";
import { useToastHelpers } from "@/components/ui/toast";
import ConditionSaveModal from "./condition-save-modal";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { useDeleteCondition } from "@/hooks/crm/use-delete-condition";
import { useQueryClient } from "@tanstack/react-query";

interface ConditionSearchProps {
  onSearchResults?: (patients: ConditionSearchPatient[]) => void | Promise<void>;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RecentVisitCondition,
  validateRecentVisit,
  ReservationCondition,
  AgeCondition,
  PatientGroupCondition,
  GenderCondition,
  BirthYearCondition,
  InsuranceTypeCondition,
  PrescriptionCondition,
} from "./conditions";

// 조건 추가 버튼 데이터
const conditionButtons = [
  { id: "recent-visit", label: "최근 내원" },
  { id: "reservation", label: "예약" },
  { id: "age", label: "나이" },
  { id: "patient-group", label: "환자그룹" },
  { id: "gender", label: "성별" },
  { id: "birth-year", label: "출생년도" },
  { id: "insurance-type", label: "보험구분" },
  { id: "prescription", label: "처방 정보" },
];

export default function ConditionSearch({
  onSearchResults,
}: ConditionSearchProps) {
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [addedConditions, setAddedConditions] = useState<string[]>([]);
  const [conditionsData, setConditionsData] = useState<Record<string, any>>({});
  const [triggerValidation, setTriggerValidation] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [conditionsToSave, setConditionsToSave] = useState<TargetConditionsDto>(
    {}
  );
  const [isDeleteCondtionOpen, setIsDeleteCondtionOpen] = useState(false);

  const toastHelpers = useToastHelpers();
  const queryClient = useQueryClient();

  // 저장된 조건 목록 조회
  const { data: conditions = [] } = useGetConditions();

  // 조건 삭제 mutation
  const deleteConditionMutation = useDeleteCondition({
    onSuccess: () => {
      toastHelpers.success("조건이 삭제되었습니다.");
      // 조건 목록 캐시 무효화하여 드롭다운 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["crm", "conditions"] });
      // 선택 초기화
      setSelectedCondition("");
      setAddedConditions([]);
      setConditionsData({});
      setIsDeleteCondtionOpen(false);
    },
    onError: (error) => {
      toastHelpers.error("조건 삭제 중 오류가 발생하였습니다.");
      console.error("조건 삭제 오류:", error);
      setIsDeleteCondtionOpen(false);
    },
  });

  // 선택된 조건 ID로 조건 상세 조회
  const selectedConditionId = selectedCondition
    ? parseInt(selectedCondition)
    : undefined;
  const {
    data: conditionData,
    isLoading: isLoadingCondition,
    error: conditionError,
    isError: isConditionError,
  } = useGetConditionById(selectedConditionId || 0, {
    enabled: !!selectedConditionId,
  });

  // 조건 데이터 로드 처리 및 환자 검색 실행
  useEffect(() => {
    if (conditionData) {
      // UI에 조건 표시
      loadConditionDataToUI(conditionData);
      // 환자 검색 실행
      if (conditionData.conditions) {
        conditionSearchMutation.mutate(conditionData.conditions);
      }
    }
  }, [conditionData]);

  // 조건 조회 오류 처리
  useEffect(() => {
    if (isConditionError && conditionError) {
      console.error("조건 조회 오류:", conditionError);
    }
  }, [isConditionError, conditionError]);

  // 조건 목록을 Select 옵션 형태로 변환
  const conditionOptions = conditions.map((condition) => ({
    value: condition.id.toString(),
    label: condition.name,
  }));

  // 불러온 조건 데이터를 UI에 표시
  const loadConditionDataToUI = (conditionData: ConditionDetailResponseDto) => {
    if (!conditionData?.conditions) return;

    const targetConditions = conditionData.conditions;

    // 기존 조건들을 모두 제거
    setAddedConditions([]);
    setConditionsData({});

    // 새로운 조건들을 추가
    const newAddedConditions: string[] = [];
    const newConditionsData: Record<string, any> = {};

    // 각 조건 타입별로 데이터 확인 및 추가
    if (targetConditions.recentVisit) {
      newAddedConditions.push("recent-visit");
      newConditionsData["recent-visit"] = targetConditions.recentVisit;
    }
    if (targetConditions.appointmentCondition) {
      newAddedConditions.push("reservation");
      newConditionsData["reservation"] = targetConditions.appointmentCondition;
    }
    if (targetConditions.age) {
      newAddedConditions.push("age");
      newConditionsData["age"] = targetConditions.age;
    }
    if (
      targetConditions.patientGroupIds &&
      targetConditions.patientGroupIds.length > 0
    ) {
      newAddedConditions.push("patient-group");
      newConditionsData["patient-group"] = {
        selectedGroups: targetConditions.patientGroupIds,
      };
    }
    if (
      targetConditions.gender &&
      targetConditions.gender !== "male" &&
      targetConditions.gender !== "female"
    ) {
      newAddedConditions.push("gender");
      newConditionsData["gender"] = { gender: targetConditions.gender };
    }
    if (targetConditions.birthYear && targetConditions.birthYear !== "even") {
      newAddedConditions.push("birth-year");
      newConditionsData["birth-year"] = {
        birthYear: targetConditions.birthYear,
      };
    }
    if (
      targetConditions.insuranceTypes &&
      targetConditions.insuranceTypes.length > 0
    ) {
      newAddedConditions.push("insurance-type");
      newConditionsData["insurance-type"] = {
        insuranceTypes: targetConditions.insuranceTypes,
      };
    }
    if (targetConditions.prescription) {
      newAddedConditions.push("prescription");
      newConditionsData["prescription"] = targetConditions.prescription;
    }

    // 상태 업데이트
    setAddedConditions(newAddedConditions);
    setConditionsData(newConditionsData);
  };

  // 조건 검색 mutation
  const conditionSearchMutation = useConditionSearch({
    onSuccess: (data) => {
      onSearchResults?.(data.items);
    },
    onError: (error) => {
      toastHelpers.error("조건 검색 중 오류가 발생하였습니다.");
      throw error;
    },
  });

  // 조건 추가 핸들러
  const handleAddCondition = (conditionId: string) => {
    if (!addedConditions.includes(conditionId)) {
      setAddedConditions([...addedConditions, conditionId]);
      // 각 조건별 초기 데이터 설정
      const initialData = getInitialConditionData(conditionId);
      setConditionsData((prev) => ({ ...prev, [conditionId]: initialData }));
    }
  };

  // 조건 데이터 변경 핸들러
  const handleConditionDataChangeAction = (conditionId: string, data: any) => {
    setConditionsData((prev) => ({ ...prev, [conditionId]: data }));
  };

  const handleConditionRemoveAction = (conditionId: string) => {
    setAddedConditions(addedConditions.filter((id) => id !== conditionId));
    setConditionsData((prev) => {
      const newData = { ...prev };
      delete newData[conditionId];
      return newData;
    });
  };

  // 각 조건별 초기 데이터 반환
  const getInitialConditionData = (conditionId: string): any => {
    switch (conditionId) {
      case "recent-visit":
        return { visited: true };
      case "reservation":
        return { existed: true, appointmentTypeIds: [] };
      case "age":
        return { mode: "include", min: 0, max: 65 };
      case "patient-group":
        return { selectedGroups: [] };
      case "gender":
        return { gender: "all" };
      case "birth-year":
        return { birthYear: "even" };
      case "insurance-type":
        return { insuranceTypes: [] };
      case "prescription":
        return { claimCodes: [] };
      default:
        return {};
    }
  };

  // 조건 데이터를 TargetConditionsDto 형태로 변환
  const convertToTargetConditions = (): TargetConditionsDto => {
    const targetConditions: TargetConditionsDto = {};

    addedConditions.forEach((conditionId) => {
      const data = conditionsData[conditionId];
      if (!data) return;

      switch (conditionId) {
        case "recent-visit":
          targetConditions.recentVisit = data;
          break;
        case "reservation":
          targetConditions.appointmentCondition = data;
          break;
        case "age":
          targetConditions.age = data;
          break;
        case "patient-group":
          targetConditions.patientGroupIds = data.selectedGroups;
          break;
        case "gender":
          targetConditions.gender = data.gender;
          break;
        case "birth-year":
          targetConditions.birthYear = data.birthYear;
          break;
        case "insurance-type":
          targetConditions.insuranceTypes = data.insuranceTypes;
          break;
        case "prescription":
          targetConditions.prescription = data;
          break;
      }
    });

    return targetConditions;
  };

  // 조건 저장 핸들러
  const handleSaveCondition = () => {
    // 입력된 조건이 없는 경우
    if (addedConditions.length === 0) {
      toastHelpers.error("입력 된 조건이 없습니다.");
      return;
    }

    // 조건 데이터 변환 및 모달 열기
    const targetConditions = convertToTargetConditions();
    setConditionsToSave(targetConditions);
    setIsSaveModalOpen(true);
  };

  // 조건 저장 완료 후 새로 저장된 조건을 자동 선택
  const handleConditionSaved = (savedConditionId: number) => {
    setSelectedCondition(savedConditionId.toString());
  };

  // 조건 삭제 버튼 클릭 핸들러
  const handleDeleteButtonClick = () => {
    setIsDeleteCondtionOpen(true);
  };

  // 조건 삭제 확인 핸들러
  const handleDeleteCondition = () => {
    if (selectedCondition) {
      const conditionId = parseInt(selectedCondition);
      deleteConditionMutation.mutate(conditionId);
    }
  };

  // 조건 초기화 핸들러
  const handleResetConditions = () => {
    setSelectedCondition("");
    setAddedConditions([]);
    setConditionsData({});
  };

  // 검색 실행 핸들러
  const handleSearch = () => {
    setTriggerValidation(true);

    let hasError = false;
    addedConditions.forEach((conditionId) => {
      const data = conditionsData[conditionId];
      let isValid = true;

      switch (conditionId) {
        case "recent-visit":
          isValid = validateRecentVisit(data);
          break;
      }

      if (!isValid) {
        hasError = true;
      }
    });

    if (hasError) {
      toastHelpers.error("필수 정보를 모두 입력해주세요");
      setTimeout(() => setTriggerValidation(false), 100);
      return;
    }

    setTriggerValidation(false);

    const request: ConditionSearchRequest = {};

    addedConditions.forEach((conditionId) => {
      const data = conditionsData[conditionId];
      if (!data) return;

      switch (conditionId) {
        case "recent-visit":
          request.recentVisit = data;
          break;
        case "reservation":
          request.appointmentCondition = data;
          break;
        case "age":
          request.age = data;
          break;
        case "patient-group":
          request.patientGroupIds = data.selectedGroups;
          break;
        case "gender":
          request.gender = data.gender;
          break;
        case "birth-year":
          request.birthYear = data.birthYear;
          break;
        case "insurance-type":
          request.insuranceTypes = data.insuranceTypes;
          break;
        case "prescription":
          request.prescription = data;
          break;
      }
    });

    conditionSearchMutation.mutate(request);
  };

  // 조건 컴포넌트 표시
  const renderConditionComponent = (conditionId: string, index: number) => {
    const data =
      conditionsData[conditionId] || getInitialConditionData(conditionId);
    const conditionNumber = index + 1;

    switch (conditionId) {
      case "recent-visit":
        return (
          <RecentVisitCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            triggerValidation={triggerValidation}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "reservation":
        return (
          <ReservationCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "age":
        return (
          <AgeCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "patient-group":
        return (
          <PatientGroupCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "gender":
        return (
          <GenderCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "birth-year":
        return (
          <BirthYearCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "insurance-type":
        return (
          <InsuranceTypeCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      case "prescription":
        return (
          <PrescriptionCondition
            key={conditionId}
            conditionNumber={conditionNumber}
            data={data}
            onChangeAction={(newData: any) =>
              handleConditionDataChangeAction(conditionId, newData)
            }
            onRemoveAction={() => handleConditionRemoveAction(conditionId)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      data-testid="crm-condition-search-panel"
      className={cn(
        "flex flex-col items-start gap-2 self-stretch h-full min-h-0",
        "w-full px-4 py-3",
        "bg-[var(--bg-main)]",
        "border-r border-[var(--border-2)]",
        "shadow-[0_0_4px_0_rgba(0,0,0,0.06)]"
      )}
    >
      {/* 조건 불러오기 드롭다운 */}
      <div className="w-full flex gap-2">
        <Select value={selectedCondition} onValueChange={setSelectedCondition}>
          <SelectTrigger className="flex-1 w-full max-w-full overflow-hidden" data-testid="crm-condition-select">
            <SelectValue
              placeholder={
                isLoadingCondition ? "조건 불러오는 중..." : "조건 불러오기"
              }
              className="truncate block w-full"
            />
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
            {conditionOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="truncate block w-full"
              >
                <span className="truncate block w-full">{option.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          data-testid="crm-condition-delete-button"
          className="px-4 py-1.5 text-sm whitespace-nowrap text-[var(--gray-100)] border-[var(--border-2)]"
          onClick={handleDeleteButtonClick}
          disabled={!selectedCondition}
        >
          조건 삭제
        </Button>
        <Button
          variant="outline"
          data-testid="crm-condition-save-button"
          className="px-4 py-1.5 text-sm whitespace-nowrap text-[var(--main-color)] border-[var(--main-color)]"
          onClick={handleSaveCondition}
        >
          조건 저장
        </Button>
      </div>

      {/* 조건 추가 섹션 */}
      <div className="w-full mt-4">
        {/* 조건 첫 번째 행 */}
        <div className="flex gap-2 mb-2">
          {conditionButtons.slice(0, 5).map((button) => {
            const isActive = addedConditions.includes(button.id);
            return (
              <Button
                key={button.id}
                onClick={() => handleAddCondition(button.id)}
                className={cn(
                  "flex px-3 py-2 justify-center items-center gap-1 rounded-2xl text-sm",
                  isActive
                    ? "bg-[var(--main-color)] text-[var(--bg-main)]"
                    : "bg-white text-[var(--gray-100)] border border-[var(--border-2)] hover:bg-[var(--bg-4)]"
                )}
              >
                <span>{button.label}</span>
                {isActive ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
              </Button>
            );
          })}
        </div>

        {/* 조건 두 번째 행 */}
        <div className="flex gap-2">
          {conditionButtons.slice(5).map((button) => {
            const isActive = addedConditions.includes(button.id);
            return (
              <Button
                key={button.id}
                onClick={() => handleAddCondition(button.id)}
                className={cn(
                  "flex px-3 py-2 justify-center items-center gap-1 rounded-2xl text-sm",
                  isActive
                    ? "bg-[var(--main-color)] text-[var(--bg-main)]"
                    : "bg-white text-[var(--gray-100)] border border-[var(--border-2)] hover:bg-[var(--bg-4)]"
                )}
              >
                <span>{button.label}</span>
                {isActive ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 조건 표시 영역 */}
      <div className="w-full mt-4 flex-1 min-h-0 flex flex-col">
        {addedConditions.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <p className="text-[var(--gray-400)] text-sm">
              조건을 추가해주세요.
            </p>
          </div>
        ) : (
          <div className="w-full space-y-3 flex-1 overflow-y-auto">
            {addedConditions.map((conditionId, index) =>
              renderConditionComponent(conditionId, index)
            )}
          </div>
        )}
      </div>

      {/* 하단 버튼들 */}
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          size="default"
          data-testid="crm-condition-reset-button"
          className="flex-shrink-0 border-[var(--border-2)]"
          onClick={handleResetConditions}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="default"
          data-testid="crm-condition-search-button"
          className="flex-1"
          onClick={handleSearch}
          disabled={
            conditionSearchMutation.isPending || addedConditions.length === 0
          }
        >
          {conditionSearchMutation.isPending ? "검색 중..." : "검색"}
        </Button>
      </div>

      {/* 조건 저장 모달 */}
      <ConditionSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        conditions={conditionsToSave}
        onConditionSaved={handleConditionSaved}
      />

      {/* 조건 삭제 확인 팝업 */}
      <MyPopupYesNo
        isOpen={isDeleteCondtionOpen}
        onCloseAction={() => setIsDeleteCondtionOpen(false)}
        onConfirmAction={handleDeleteCondition}
        title="조건 삭제"
        message="삭제하시겠습니까?"
        confirmText="삭제"
      />
    </div>
  );
}
