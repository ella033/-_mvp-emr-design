"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ConditionPanel } from "./condition-panel";

// 나이 조건 컴포넌트
interface AgeConditionProps {
  conditionNumber: number;
  data: {
    mode: "include" | "exclude";
    min?: number;
    max?: number;
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const AgeCondition: React.FC<AgeConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="나이"
      onRemoveAction={onRemoveAction}
    >
      <div className="space-y-4">
        <RadioGroup
          value={data.mode}
          onValueChange={(value) => onChangeAction({ ...data, mode: value })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="include" id="include" />
            <Label htmlFor="include" className="text-sm text-[var(--gray-300)]">
              포함
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="exclude" id="exclude" />
            <Label htmlFor="exclude" className="text-sm text-[var(--gray-300)]">
              제외
            </Label>
          </div>
        </RadioGroup>

        <div className="flex gap-2 items-center">
          <Input
            type="number"
            value={data.min}
            onChange={(e) =>
              onChangeAction({
                ...data,
                min: parseInt(e.target.value) || undefined,
              })
            }
            placeholder="0"
            className="flex-1"
            min="0"
            max="150"
          />
          <span className="text-sm text-[var(--gray-500)]">-</span>
          <Input
            type="number"
            value={data.max}
            onChange={(e) =>
              onChangeAction({
                ...data,
                max: parseInt(e.target.value) || undefined,
              })
            }
            placeholder="0"
            className="flex-1"
            min="0"
            max="150"
          />
          <span className="text-sm text-[var(--gray-300)]">세</span>
        </div>
      </div>
    </ConditionPanel>
  );
};
