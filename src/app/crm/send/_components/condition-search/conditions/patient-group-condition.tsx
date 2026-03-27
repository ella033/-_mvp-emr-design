"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ConditionPanel } from "./condition-panel";

// 환자그룹 조건 컴포넌트
interface PatientGroupConditionProps {
  conditionNumber: number;
  data: {
    selectedGroups: string[];
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const PatientGroupCondition: React.FC<PatientGroupConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  const patientGroups = [
    "GC LAB", "GCBP", "VIP", "원장님 지인", "원장님 가족", "직원", "직원 가족"
  ];

  const toggleGroup = (group: string) => {
    const newGroups = data.selectedGroups.includes(group)
      ? data.selectedGroups.filter(g => g !== group)
      : [...data.selectedGroups, group];
    onChangeAction({ ...data, selectedGroups: newGroups });
  };

  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="환자그룹"
      onRemoveAction={onRemoveAction}
    >
      <div className="flex flex-wrap gap-2">
        {patientGroups.map((group) => (
          <Button
            key={group}
            variant={data.selectedGroups.includes(group) ? "default" : "outline"}
            size="sm"
            onClick={() => toggleGroup(group)}
            className="text-xs h-7"
          >
            {group}
          </Button>
        ))}
      </div>
    </ConditionPanel>
  );
};
