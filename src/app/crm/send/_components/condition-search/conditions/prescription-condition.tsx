"use client";

import React, { useEffect, useRef } from "react";
import { ConditionPanel } from "./condition-panel";
import { Button } from "@/components/ui/button";
import InputDate from "@/components/ui/input-date";
import { X } from "lucide-react";
import PrescriptionLibrarySearch from "@/components/library/prescription-library-search";

// 처방정보 조건 컴포넌트
interface PrescriptionConditionProps {
  conditionNumber: number;
  data: {
    from?: string;
    to?: string;
    months?: number;
    claimCodes: {
      claimCode: string;
      name: string;
    }[];
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const PrescriptionCondition: React.FC<PrescriptionConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  const actionRowRef = useRef<HTMLDivElement>(null);

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

  const handleOrderSelect = (order: any) => {
    const claimCode = order.details?.[0]?.claimCode;
    const name = order.name;

    if (claimCode && name) {
      const isAlreadyAdded = data.claimCodes.some(
        (item) => item.claimCode === claimCode
      );

      if (!isAlreadyAdded) {
        onChangeAction({
          ...data,
          claimCodes: [...data.claimCodes, { claimCode, name }],
        });
      }
    }
  };

  const handleRemoveClaimCode = (claimCodeToRemove: string) => {
    onChangeAction({
      ...data,
      claimCodes: data.claimCodes.filter(
        (item) => item.claimCode !== claimCodeToRemove
      ),
    });
  };

  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="처방 정보"
      onRemoveAction={onRemoveAction}
    >
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <InputDate
            value={data.from || ""}
            onChange={(value) => onChangeAction({ ...data, from: value })}
            className="w-32"
          />
          <span className="text-sm text-[var(--gray-400)]">-</span>
          <InputDate
            value={data.to || ""}
            onChange={(value) => onChangeAction({ ...data, to: value })}
            className="w-32"
          />
          {[1, 3, 6].map((period) => (
            <Button
              key={period}
              variant="outline"
              onClick={() => onChangeAction({ ...data, months: period })}
              className={`text-sm h-9 px-3 ${data.months === period
                  ? "border-[var(--main-color)] text-[var(--main-color)]"
                  : "border-[var(--border-1)]"
                }`}
            >
              {period}개월
            </Button>
          ))}
        </div>

        <div className="border border-[var(--border-2)] p-[1px] rounded">
          <PrescriptionLibrarySearch
            actionRowRef={actionRowRef}
            onAddLibrary={handleOrderSelect}
            showLibrary={true}
            forceShowLibrary={true}
          />
        </div>

        {data.claimCodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {data.claimCodes.map((item) => (
              <Button
                key={item.claimCode}
                size="xs"
                variant="outline"
                onClick={() => handleRemoveClaimCode(item.claimCode)}
                className="h-7 text-xs flex items-center gap-1 border-[var(--border-1)]"
              >
                {item.name}
                <X className="size-3" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </ConditionPanel>
  );
};
