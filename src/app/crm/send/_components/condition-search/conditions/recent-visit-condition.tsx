"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import InputDate from "@/components/ui/input-date";
import { ConditionPanel } from "./condition-panel";
import { z } from "zod";

const recentVisitSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

// 최근 내원 조건 validation 함수 (부모에서 호출용)
export const validateRecentVisit = (data: any): boolean => {
  const result = recentVisitSchema.safeParse({
    from: data.from || "",
    to: data.to || "",
  });
  return result.success;
};

// 최근 내원 조건 컴포넌트
interface RecentVisitConditionProps {
  conditionNumber: number;
  data: {
    visited: boolean;
    from?: string;
    to?: string;
    months?: number;
  };
  triggerValidation?: boolean; // 부모에서 검색 버튼 클릭 시 true로 변경
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const RecentVisitCondition: React.FC<RecentVisitConditionProps> = ({
  conditionNumber,
  data,
  triggerValidation = false,
  onChangeAction,
  onRemoveAction,
}) => {
  const [validationErrors, setValidationErrors] = React.useState<{
    from?: boolean;
    to?: boolean;
  }>({});
  // 검색 버튼 클릭 시 validation 수행
  useEffect(() => {
    if (triggerValidation) {
      const result = recentVisitSchema.safeParse({
        from: data.from || "",
        to: data.to || "",
      });

      if (!result.success) {
        const errors: { from?: boolean; to?: boolean } = {};
        result.error.errors.forEach((err) => {
          if (err.path[0] === "from" || err.path[0] === "to") {
            errors[err.path[0] as "from" | "to"] = true;
          }
        });
        setValidationErrors(errors);
      } else {
        setValidationErrors({});
      }
    }
  }, [triggerValidation, data.from, data.to]);

  // 월 선택 시 날짜 자동 설정
  useEffect(() => {
    if (data.months !== undefined && data.months > 0) {
      const today = new Date();
      const to = today.toISOString().split("T")[0];

      const fromDate = new Date(today);
      fromDate.setMonth(fromDate.getMonth() - data.months);
      const from = fromDate.toISOString().split("T")[0];

      onChangeAction({ ...data, from, to });
    }
  }, [data.months]);

  // 데이터 변경 시 validation 에러 초기화
  const handleDateChange = (field: "from" | "to", value: string) => {
    onChangeAction({ ...data, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="최근 내원"
      onRemoveAction={onRemoveAction}
    >
      <div className="space-y-4">
        <RadioGroup
          value={String(data.visited)}
          onValueChange={(value) =>
            onChangeAction({ ...data, visited: value === "true" })
          }
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="recent" />
            <Label htmlFor="recent" className="text-sm text-[var(--gray-300)]">
              방문
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="none" />
            <Label htmlFor="none" className="text-sm text-[var(--gray-300)]">
              미방문
            </Label>
          </div>
        </RadioGroup>

        <div className="flex gap-2 items-center">
          <InputDate
            value={data.from || ""}
            onChange={(value) => handleDateChange("from", value)}
            error={validationErrors.from}
            className="w-32"
          />
          <span className="text-sm text-[var(--gray-400)]">-</span>
          <InputDate
            value={data.to || ""}
            onChange={(value) => handleDateChange("to", value)}
            error={validationErrors.to}
            className="w-32"
          />
          {[1, 3, 6].map((period) => (
            <Button
              key={period}
              variant="outline"
              onClick={() => onChangeAction({ ...data, months: period })}
              className={`text-sm h-9 px-3 ${
                data.months === period
                  ? "border-[var(--main-color)] text-[var(--main-color)]"
                  : "border-[var(--border-1)]"
              }`}
            >
              {period}개월
            </Button>
          ))}
        </div>
      </div>
    </ConditionPanel>
  );
};
