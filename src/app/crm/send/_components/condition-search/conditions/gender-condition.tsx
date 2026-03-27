"use client";

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ConditionPanel } from "./condition-panel";

// 성별 조건 컴포넌트
interface GenderConditionProps {
  conditionNumber: number;
  data: {
    gender?: "male" | "female";
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const GenderCondition: React.FC<GenderConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="성별"
      onRemoveAction={onRemoveAction}
    >
      <RadioGroup
        value={data.gender}
        onValueChange={(value) => onChangeAction({ ...data, gender: value })}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="male" id="male" />
          <Label htmlFor="male" className="text-sm">
            남성
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="female" id="female" />
          <Label htmlFor="female" className="text-sm">
            여성
          </Label>
        </div>
      </RadioGroup>
    </ConditionPanel>
  );
};
