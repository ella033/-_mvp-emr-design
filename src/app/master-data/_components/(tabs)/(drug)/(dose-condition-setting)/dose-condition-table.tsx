import { MyButton } from "@/components/yjg/my-button";
import MyInput from "@/components/yjg/my-input";
import { cn } from "@/lib/utils";
import type { DoseRangeType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import { XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useToastHelpers } from "@/components/ui/toast";

const HEADER_ROW_COMMON_CLASS =
  "flex flex-row justify-between items-center border-b border-[var(--border-1)] p-2 gap-2";
const RANGE_CLASS = "flex-1 text-center";
const DELETE_CLASS = "w-12 flex justify-center";

enum DoseConditionType {
  WEIGHT = 1,
  AGE = 2,
}

interface DoseConditionTableProps {
  conditions: DoseRangeType[];
  onUpdateConditions: (ranges: DoseRangeType[]) => void;
  type: DoseConditionType;
}

export default function DoseConditionTable({
  conditions,
  onUpdateConditions,
  type,
}: DoseConditionTableProps) {
  const handleAddRange = () => {
    const lastCondition = conditions[conditions.length - 1];
    const newRange: DoseRangeType = {
      lt: 0,
      gte: lastCondition ? lastCondition.lt : 0,
      value: 0,
    };
    onUpdateConditions([...conditions, newRange]);
  };

  const handleDeleteRange = (rangeIndex: number) => {
    const newConditions = conditions.filter((_, index) => index !== rangeIndex);
    onUpdateConditions(newConditions);
  };

  // type에 따른 헤더 텍스트 설정
  const getHeaderText = () => {
    if (type === DoseConditionType.WEIGHT) {
      // 체중
      return {
        title: "체중별",
        minLabel: "이상 (kg)",
        maxLabel: "미만 (kg)",
        dosageLabel: "투여량",
      };
    } else {
      // 연령
      return {
        title: "연령별",
        minLabel: "이상 (나이)",
        maxLabel: "미만 (나이)",
        dosageLabel: "투여량",
      };
    }
  };

  const headerText = getHeaderText();

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2">
      <div className="flex flex-row justify-between items-center">
        <div className="font-bold text-lg">{headerText.title}</div>
        <div className="flex flex-row gap-2">
          <MyButton onClick={handleAddRange}>추가</MyButton>
        </div>
      </div>
      <div className="flex-1 w-full h-full flex flex-col border border-[var(--border-1)] rounded-sm">
        <DoseConditionTableHeader
          minLabel={headerText.minLabel}
          maxLabel={headerText.maxLabel}
          dosageLabel={headerText.dosageLabel}
        />
        <div className="flex-1 w-full h-full flex flex-col my-scroll">
          {conditions.map((doseRange, rangeIndex) => (
            <DoseConditionRow
              key={rangeIndex}
              doseRange={doseRange}
              rangeIndex={rangeIndex}
              onDeleteRange={handleDeleteRange}
              onUpdateConditions={onUpdateConditions}
              conditions={conditions}
              type={type}
            />
          ))}
          {conditions.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              데이터가 없습니다. 추가 버튼을 클릭하여 데이터를 추가하세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DoseConditionTableHeader({
  minLabel,
  maxLabel,
  dosageLabel,
}: {
  minLabel: string;
  maxLabel: string;
  dosageLabel: string;
}) {
  return (
    <div className={cn(HEADER_ROW_COMMON_CLASS, "bg-[var(--bg-secondary)]")}>
      <div className={RANGE_CLASS}>{minLabel}</div>
      <div className={RANGE_CLASS}>{maxLabel}</div>
      <div className={RANGE_CLASS}>{dosageLabel}</div>
      <div className={DELETE_CLASS}>삭제</div>
    </div>
  );
}

interface DoseConditionRowProps {
  doseRange: DoseRangeType;
  rangeIndex: number;
  onDeleteRange: (rangeIndex: number) => void;
  onUpdateConditions: (ranges: DoseRangeType[]) => void;
  conditions: DoseRangeType[];
  type: DoseConditionType;
}

function DoseConditionRow({
  doseRange,
  rangeIndex,
  onDeleteRange,
  onUpdateConditions,
  conditions,
  type,
}: DoseConditionRowProps) {
  const { error } = useToastHelpers();
  const [localGte, setLocalGte] = useState(String(doseRange.gte));
  const [localLt, setLocalLt] = useState(String(doseRange.lt));
  const [localValue, setLocalValue] = useState(String(doseRange.value));
  const [gteError, setGteError] = useState(false);
  const [ltError, setLtError] = useState(false);

  // doseRange 값이 변경될 때 로컬 상태 동기화
  useEffect(() => {
    setLocalGte(String(doseRange.gte));
    setLocalLt(String(doseRange.lt));
    setLocalValue(String(doseRange.value));
    setGteError(false);
    setLtError(false);
  }, [doseRange.gte, doseRange.lt, doseRange.value]);

  // gte 값 변경 처리
  const handleGteChange = (value: string) => {
    setLocalGte(value);
    const newGte = Number(value) || 0;
    const currentLt = doseRange.lt;

    if (currentLt > 0 && newGte >= currentLt) {
      setGteError(true);
      error("이상 값은 미만 값보다 작아야 합니다.");
      return;
    }

    setGteError(false);
    const newConditions = conditions.map((range, index) => {
      if (index === rangeIndex) {
        return { ...range, gte: newGte };
      }
      return range;
    });
    onUpdateConditions(newConditions);
  };

  // lt 값 변경 처리
  const handleLtChange = (value: string) => {
    setLocalLt(value);
    const newLt = Number(value) || 0;
    const currentGte = doseRange.gte;

    if (currentGte > 0 && newLt <= currentGte) {
      setLtError(true);
      error("미만 값은 이상 값보다 커야 합니다.");
      return;
    }

    setLtError(false);
    const newConditions = conditions.map((range, index) => {
      if (index === rangeIndex) {
        return { ...range, lt: newLt };
      }
      return range;
    });
    onUpdateConditions(newConditions);
  };

  // value 값 변경 처리
  const handleValueChange = (value: string) => {
    setLocalValue(value);
    const newConditions = conditions.map((range, index) => {
      if (index === rangeIndex) {
        return { ...range, value: Number(value) || 0 };
      }
      return range;
    });
    onUpdateConditions(newConditions);
  };

  // type에 따른 소수점 설정
  const pointPos = type === DoseConditionType.WEIGHT ? 2 : 0;
  const unit = type === DoseConditionType.WEIGHT ? "kg" : "세";

  return (
    <div className={cn(HEADER_ROW_COMMON_CLASS)}>
      <MyInput
        type="text-number"
        className={cn(RANGE_CLASS, gteError && "bg-red-100 border-red-500")}
        value={localGte}
        onBlur={(value) => handleGteChange(String(value))}
        min={0}
        max={999}
        pointPos={pointPos}
        unit={unit}
      />
      <MyInput
        type="text-number"
        className={cn(RANGE_CLASS, ltError && "bg-red-100 border-red-500")}
        value={localLt}
        onBlur={(value) => handleLtChange(String(value))}
        min={0}
        max={999}
        pointPos={pointPos}
        unit={unit}
      />
      <MyInput
        type="text-number"
        className={RANGE_CLASS}
        min={0}
        max={1000000000}
        pointPos={8}
        value={localValue}
        onBlur={(value) => handleValueChange(String(value))}
      />
      <div className={DELETE_CLASS}>
        <MyButton
          variant="danger"
          size="icon"
          onClick={() => onDeleteRange(rangeIndex)}
        >
          <XIcon className="w-[12px] h-[12px]" />
        </MyButton>
      </div>
    </div>
  );
}
