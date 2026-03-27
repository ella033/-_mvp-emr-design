import React, { useState, useEffect, useCallback } from "react";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import { 보험구분상세 } from "@/constants/common/common-enum";
import { 보험_FULL_OPTIONS } from "@/constants/common/common-option";
import AddDisreg from "./add-disreg";
import {
  PREGNANCY_DAY_MAX,
  PREGNANCY_DAY_MIN,
  PREGNANCY_WEEK_MAX,
  PREGNANCY_WEEK_MIN,
} from "@/constants/constants";
import { formatRrnNumber } from "@/lib/common-utils";
import {
  formatDateToYyyyMmDdHyphen,
  getAdditionalExtraQualificationFlag,
  get임신부WeekAndDay,
  get임신부UpsertDate,
  mergeAdditionalExtraQualificationFlag,
  merge임신부ExtraQualificationFlag,
  type Merge임신부Options,
} from "@/lib/extra-qualification-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PregnancyWeekDayInput } from "./pregnancy-week-day-input";

interface BohoMedicalProps {
  currentInsuranceInfo?: Partial<InsuranceInfo>;
  onInsuranceDataChange?: (data: Partial<InsuranceInfo>) => void;
  isDisabled?: boolean;
  /** 진료일(접수일시). 미지정 시 오늘 날짜로 임신 주차 계산 */
  selectedDate?: Date | null;
  /** 환자 성별이 여성일 때만 true. 미전달 시 임신부/난임치료 비활성 */
  pregnancyInfertilityEnabled?: boolean;
}

const BohoMedical: React.FC<BohoMedicalProps> = ({
  currentInsuranceInfo,
  onInsuranceDataChange,
  isDisabled = false,
  selectedDate,
  pregnancyInfertilityEnabled = false,
}) => {
  const [selectedInsuranceType, setSelectedInsuranceType] = useState<string>(
    String(currentInsuranceInfo?.uDeptDetail || 보험구분상세.의료급여1종)
  );

  // currentInsuranceInfo가 변경될 때 selectedInsuranceType 업데이트
  useEffect(() => {
    if (!currentInsuranceInfo) {
      setSelectedInsuranceType("");
    } else {
      setSelectedInsuranceType(
        String(currentInsuranceInfo?.uDeptDetail || 보험구분상세.의료급여1종)
      );
    }
  }, [currentInsuranceInfo]);

  // 개별 필드 업데이트 핸들러들
  const updateUDeptDetail = useCallback(
    (uDeptDetail: number) => {
      onInsuranceDataChange?.({ uDeptDetail });
    },
    [onInsuranceDataChange]
  );

  const resolvedSelectedDate = selectedDate ?? new Date();

  const updatePregnancy = useCallback(
    (is임신부: boolean, options?: Merge임신부Options) => {
      const updatedExtraQualification = merge임신부ExtraQualificationFlag(
        currentInsuranceInfo?.extraQualification,
        is임신부,
        is임신부
          ? {
            upsertDate: options?.upsertDate ?? formatDateToYyyyMmDdHyphen(resolvedSelectedDate),
            week: options?.week,
            day: options?.day,
          }
          : undefined
      );
      onInsuranceDataChange?.({
        is임신부,
        extraQualification: updatedExtraQualification,
      });
    },
    [
      currentInsuranceInfo?.extraQualification,
      onInsuranceDataChange,
      resolvedSelectedDate,
    ]
  );

  const updateInfertility = useCallback(
    (is난임치료: boolean) => {
      const updatedExtraQualification = mergeAdditionalExtraQualificationFlag(
        currentInsuranceInfo?.extraQualification,
        "난임치료",
        is난임치료
      );
      onInsuranceDataChange?.({
        is난임치료,
        extraQualification: updatedExtraQualification,
      });
    },
    [currentInsuranceInfo?.extraQualification, onInsuranceDataChange]
  );

  const insuranceTypes = [
    { value: "", label: "선택하세요" },
    ...보험_FULL_OPTIONS.map((option) => ({
      value: option.value.toString(),
      label: option.label,
    })),
  ];

  const handleInsuranceTypeChange = (value: string) => {
    setSelectedInsuranceType(value);
    updateUDeptDetail(Number(value));
  };

  const handleDisregChange = (extraQualification: Record<string, any>) => {
    onInsuranceDataChange?.({
      extraQualification,
    });
  };

  const handlePregnancyChange = (isPregnant: boolean) => {
    updatePregnancy(isPregnant);
  };

  // selectedDate·upsertDate 기준으로 계산된 주·일을 표시 (최초/접수일 변경 시 동일 적용)
  const weekDay = get임신부WeekAndDay(
    currentInsuranceInfo?.extraQualification,
    resolvedSelectedDate
  );
  const displayWeek = weekDay?.week ?? 0;
  const displayDay = weekDay?.day ?? 0;

  // 43주 0일 이상 시 임신부 체크 해제
  useEffect(() => {
    if (weekDay && weekDay.week >= 43) {
      updatePregnancy(false);
    }
  }, [weekDay?.week, updatePregnancy]);

  const handlePregnancyWeekDayChange = (week: number, day: number) => {
    const w = Math.min(PREGNANCY_WEEK_MAX, Math.max(PREGNANCY_WEEK_MIN, week));
    const d = Math.min(PREGNANCY_DAY_MAX, Math.max(PREGNANCY_DAY_MIN, day));
    updatePregnancy(true, {
      upsertDate: formatDateToYyyyMmDdHyphen(resolvedSelectedDate),
      week: w,
      day: d,
    });
  };

  const handleInfertilityChange = (isInfertility: boolean) => {
    updateInfertility(isInfertility);
  };

  const pregnancyChecked = getAdditionalExtraQualificationFlag(
    currentInsuranceInfo?.extraQualification,
    "임신부",
    currentInsuranceInfo?.is임신부 || false
  );

  const pregnancyUpsertDate = get임신부UpsertDate(
    currentInsuranceInfo?.extraQualification
  );
  const pregnancyUpsertDateLabel =
    pregnancyUpsertDate.length >= 10
      ? `입력 : ${pregnancyUpsertDate.slice(2)}`
      : "";

  const infertilityChecked = getAdditionalExtraQualificationFlag(
    currentInsuranceInfo?.extraQualification,
    "난임치료",
    currentInsuranceInfo?.is난임치료 || false
  );

  const pregnancyInfertilityDisabled =
    isDisabled || !pregnancyInfertilityEnabled;

  return (
    <div className="relative" style={{ paddingRight: "calc(155px + 1rem)" }}>
      {/* 보험정보 폼 - 4 column grid */}
      <div
        className="grid items-center gap-x-3 gap-y-1.5"
        style={{ gridTemplateColumns: "70px 1fr 70px 1fr" }}
      >
        {/* row1: 보험구분 / 증번호 */}
        <label className="text-sm font-medium text-gray-700 truncate">
          보험구분
        </label>
        <select
          value={selectedInsuranceType}
          onChange={(e) => {
            if (document.activeElement === e.target) {
              handleInsuranceTypeChange(e.target.value);
            }
          }}
          onFocus={(e) => {
            e.target.setAttribute(
              "data-previous-value",
              selectedInsuranceType
            );
          }}
          onBlur={(e) => {
            const previousValue = e.target.getAttribute(
              "data-previous-value"
            );
            if (previousValue !== selectedInsuranceType) {
              handleInsuranceTypeChange(selectedInsuranceType);
            }
          }}
          disabled={isDisabled}
          className={`w-full border border-[var(--border-2)] rounded p-1 pl-2 text-sm focus:outline-none focus:border-blue-500 ${isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
        >
          {insuranceTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <label className="text-sm font-medium text-gray-700 truncate">
          증번호
        </label>
        <div className="w-full border border-gray-300 rounded p-1 pl-2 text-sm text-gray-900 bg-[var(--bg-3)]">
          {currentInsuranceInfo?.cardNumber || "-"}
        </div>

        {/* row2: 가입자 / 가입자주민등록번호 */}
        <label className="text-sm font-medium text-gray-700 truncate">
          가입자
        </label>
        <div className="w-full border border-gray-300 rounded p-1 pl-2 text-sm text-gray-900 bg-[var(--bg-3)]">
          {currentInsuranceInfo?.father || "-"}
        </div>
        <div className="col-span-2 w-full border border-gray-300 rounded p-1 pl-2 text-sm text-gray-900 bg-[var(--bg-3)]">
          {currentInsuranceInfo?.fatherRrn
            ? formatRrnNumber(currentInsuranceInfo.fatherRrn)
            : "000000-0000000"}
        </div>

        {/* row3: 보장기관명 / 보장기관기호 */}
        <label
          className="text-sm font-medium text-gray-700 truncate"
          title="보장기관명"
        >
          보장기관명
        </label>
        <input
          type="text"
          value={currentInsuranceInfo?.unionName ?? ""}
          onChange={(e) => {
            if (document.activeElement === e.target) {
              onInsuranceDataChange?.({ unionName: e.target.value });
            }
          }}
          onBlur={(e) => {
            onInsuranceDataChange?.({ unionName: e.target.value });
          }}
          placeholder="보장기관명"
          disabled={isDisabled}
          className={`w-full border border-[var(--border-2)] rounded p-1 pl-2 text-sm text-[var(--main-color)] focus:outline-none focus:border-blue-500 ${isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
        />
        <label
          className="text-sm font-medium text-gray-700 truncate"
          title="보장기관기호"
        >
          보장기관기호
        </label>
        <input
          type="text"
          value={currentInsuranceInfo?.unionCode ?? ""}
          onChange={(e) => {
            if (document.activeElement === e.target) {
              onInsuranceDataChange?.({ unionCode: e.target.value });
            }
          }}
          onBlur={(e) => {
            onInsuranceDataChange?.({ unionCode: e.target.value });
          }}
          placeholder="보장기관기호"
          disabled={isDisabled}
          className={`w-full border border-[var(--border-2)] rounded p-1 pl-2 text-sm text-[var(--main-color)] focus:outline-none focus:border-blue-500 ${isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]"}`}
        />

        {/* row4: 건생비 / 지원금 */}
        <label
          className="text-sm font-medium text-gray-700 truncate"
          title="건강생활유지비"
        >
          건생비
        </label>
        <div className="w-full border border-gray-300 rounded p-1 pl-2 text-sm text-gray-900 bg-[var(--bg-3)]">
          0
        </div>
        <label className="text-sm font-medium text-gray-700 truncate">
          지원금
        </label>
        <div className="w-full border border-gray-300 rounded p-1 pl-2 text-sm text-gray-900 bg-[var(--bg-3)]">
          0
        </div>

        {/* row5: 임신/난임 */}
        <label className="text-sm font-medium text-gray-700 truncate">
          임신/난임
        </label>
        <div className="col-span-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="pregnancy-boho"
              checked={pregnancyChecked}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  handlePregnancyChange(e.target.checked);
                }
              }}
              onFocus={(e) => {
                e.target.setAttribute(
                  "data-previous-value",
                  String(currentInsuranceInfo?.is임신부 || false)
                );
              }}
              onBlur={(e) => {
                const previousValue = e.target.getAttribute(
                  "data-previous-value"
                );
                const currentValue = String(
                  currentInsuranceInfo?.is임신부 || false
                );
                if (previousValue !== currentValue) {
                  handlePregnancyChange(
                    currentInsuranceInfo?.is임신부 || false
                  );
                }
              }}
              disabled={pregnancyInfertilityDisabled}
              className="rounded border border-[var(--border-2)] text-blue-600 focus:ring-blue-500"
            />
            {pregnancyUpsertDateLabel ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    htmlFor="pregnancy-boho"
                    className="text-sm text-gray-700 cursor-default"
                  >
                    임신부
                  </label>
                </TooltipTrigger>
                <TooltipContent className="z-999">{pregnancyUpsertDateLabel}</TooltipContent>
              </Tooltip>
            ) : (
              <label
                htmlFor="pregnancy-boho"
                className="text-sm text-gray-700"
              >
                임신부
              </label>
            )}
            {pregnancyChecked && (
              <PregnancyWeekDayInput
                week={displayWeek}
                day={displayDay}
                onWeekDayChange={handlePregnancyWeekDayChange}
                onWeekOutOfRange={() => handlePregnancyChange(false)}
                disabled={pregnancyInfertilityDisabled}
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="infertility-boho"
              checked={infertilityChecked}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  handleInfertilityChange(e.target.checked);
                }
              }}
              onFocus={(e) => {
                e.target.setAttribute(
                  "data-previous-value",
                  String(currentInsuranceInfo?.is난임치료 || false)
                );
              }}
              onBlur={(e) => {
                const previousValue = e.target.getAttribute(
                  "data-previous-value"
                );
                const currentValue = String(
                  currentInsuranceInfo?.is난임치료 || false
                );
                if (previousValue !== currentValue) {
                  handleInfertilityChange(
                    currentInsuranceInfo?.is난임치료 || false
                  );
                }
              }}
              disabled={pregnancyInfertilityDisabled}
              className="rounded border border-[var(--border-2)] text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="infertility-boho"
              className="text-sm text-gray-700"
            >
              난임치료
            </label>
          </div>
        </div>
      </div>

      {/* 추가자격 - absolute로 왼쪽 그리드 높이에 제한 */}
      <div className="absolute top-0 right-0 bottom-0 w-[155px]">
        <AddDisreg
          currentInsuranceInfo={currentInsuranceInfo}
          onDisregChange={handleDisregChange}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  );
};

export default BohoMedical;
