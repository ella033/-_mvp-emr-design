"use client";

import React from "react";
import { ConditionPanel } from "./condition-panel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// 출생년도 조건 컴포넌트
interface BirthYearConditionProps {
  conditionNumber: number;
  data: {
    birthYear: "even" | "odd";
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const BirthYearCondition: React.FC<BirthYearConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="출생년도"
      onRemoveAction={onRemoveAction}
    >
      <div className="flex gap-2 items-center">
        <RadioGroup
          value={data.birthYear}
          onValueChange={(value) =>
            onChangeAction({ ...data, birthYear: value })
          }
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="even" id="even" />
            <Label htmlFor="even" className="text-sm text-[var(--gray-300)]">
              짝수
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="odd" id="odd" />
            <Label htmlFor="odd" className="text-sm text-[var(--gray-300)]">
              홀수
            </Label>
          </div>
        </RadioGroup>
      </div>
    </ConditionPanel>
  );
};
