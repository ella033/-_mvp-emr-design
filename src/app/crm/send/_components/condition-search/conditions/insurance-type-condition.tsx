"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConditionPanel } from "./condition-panel";
import {
  보험구분상세,
  보험구분상세Label,
} from "@/constants/common/common-enum";
import { X } from "lucide-react";

// 보험구분 조건 컴포넌트
interface InsuranceTypeConditionProps {
  conditionNumber: number;
  data: {
    insuranceTypes: number[];
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const InsuranceTypeCondition: React.FC<InsuranceTypeConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  const handleSelectInsuranceType = (typeId: number) => {
    if (!data.insuranceTypes.includes(typeId)) {
      onChangeAction({
        ...data,
        insuranceTypes: [...data.insuranceTypes, typeId],
      });
    }
  };

  const handleRemoveInsuranceType = (typeId: number) => {
    onChangeAction({
      ...data,
      insuranceTypes: data.insuranceTypes.filter((id) => id !== typeId),
    });
  };

  const getInsuranceTypeName = (typeId: number) => {
    return 보험구분상세Label[typeId as 보험구분상세] || "";
  };

  const insuranceTypeOptions = Object.entries(보험구분상세)
    .filter(([, value]) => typeof value === "number")
    .map(([, value]) => ({
      id: value as number,
      name: 보험구분상세Label[value as 보험구분상세],
    }));

  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="보험구분"
      onRemoveAction={onRemoveAction}
    >
      <div>
        <Select
          value=""
          onValueChange={(value) => handleSelectInsuranceType(Number(value))}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                data.insuranceTypes.length > 0
                  ? `보험구분 선택 (${data.insuranceTypes.length})`
                  : "보험구분 선택"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {insuranceTypeOptions.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {data.insuranceTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.insuranceTypes.map((typeId) => (
              <Button
                key={typeId}
                size="xs"
                variant="outline"
                onClick={() => handleRemoveInsuranceType(typeId)}
                className="h-7 text-xs flex items-center gap-1 border-[var(--border-1)]"
              >
                {getInsuranceTypeName(typeId)}
                <X className="size-3" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </ConditionPanel>
  );
};
