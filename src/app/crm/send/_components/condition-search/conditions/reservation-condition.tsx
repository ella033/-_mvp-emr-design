"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ConditionPanel } from "./condition-panel";
import InputDate from "@/components/ui/input-date";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import type { AppointmentTypes } from "@/types/appointments/appointment-types";
import { X } from "lucide-react";

// 예약 조건 컴포넌트
interface ReservationConditionProps {
  conditionNumber: number;
  data: {
    existed: boolean;
    from?: string;
    to?: string;
    months?: number;
    appointmentTypeIds: number[];
  };
  onChangeAction: (data: any) => void;
  onRemoveAction: () => void;
}

export const ReservationCondition: React.FC<ReservationConditionProps> = ({
  conditionNumber,
  data,
  onChangeAction,
  onRemoveAction,
}) => {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentTypes[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointmentTypes = async () => {
      try {
        const types = await AppointmentTypesService.getAppointmentTypes();
        setAppointmentTypes(types);
      } catch (error) {
        console.error("예약 유형 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointmentTypes();
  }, []);

  useEffect(() => {
    if (data.months !== undefined && data.months > 0) {
      const today = new Date();
      const from = today.toISOString().split("T")[0];

      const toDate = new Date(today);
      toDate.setMonth(toDate.getMonth() + data.months);
      const to = toDate.toISOString().split("T")[0];

      onChangeAction({ ...data, from, to });
    }
  }, [data.months]);

  const handleSelectAppointmentType = (typeId: number) => {
    if (!data.appointmentTypeIds.includes(typeId)) {
      onChangeAction({
        ...data,
        appointmentTypeIds: [...data.appointmentTypeIds, typeId],
      });
    }
  };

  const handleRemoveAppointmentType = (typeId: number) => {
    onChangeAction({
      ...data,
      appointmentTypeIds: data.appointmentTypeIds.filter((id) => id !== typeId),
    });
  };

  const getAppointmentTypeName = (typeId: number) => {
    return appointmentTypes.find((type) => type.id === typeId)?.name || "";
  };

  return (
    <ConditionPanel
      conditionNumber={conditionNumber}
      title="예약"
      onRemoveAction={onRemoveAction}
    >
      <div className="space-y-4">
        <RadioGroup
          value={String(data.existed)}
          onValueChange={(value: string) =>
            onChangeAction({ ...data, existed: value === "true" })
          }
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="scheduled" />
            <Label
              htmlFor="scheduled"
              className="text-sm text-[var(--gray-300)]"
            >
              예약
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="none" />
            <Label htmlFor="none" className="text-sm text-[var(--gray-300)]">
              없음
            </Label>
          </div>
        </RadioGroup>

        {data.existed && (
          <>
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

            <div>
              <Select
                value=""
                onValueChange={(value) =>
                  handleSelectAppointmentType(Number(value))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoading
                        ? "로딩 중..."
                        : data.appointmentTypeIds.length > 0
                          ? `예약 유형 선택 (${data.appointmentTypeIds.length})`
                          : "예약 유형 선택"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {data.appointmentTypeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.appointmentTypeIds.map((typeId) => (
                    <Button
                      key={typeId}
                      size="xs"
                      variant="outline"
                      onClick={() => handleRemoveAppointmentType(typeId)}
                      className="h-7 text-xs flex items-center gap-1 border-[var(--border-1)]"
                    >
                      {getAppointmentTypeName(typeId)}
                      <X className="size-3" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ConditionPanel>
  );
};
