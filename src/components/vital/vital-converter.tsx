import type { VitalSignMeasurementPivotResponse } from "@/types/vital/vital-sign-measurement-types";
import type {
  MyGridRowType,
  MyGridCellType,
} from "@/components/yjg/my-grid/my-grid-type";
import type { VitalSignItem } from "@/types/vital/vital-sign-items-types";
import { formatDateByPattern } from "@/lib/date-utils";
import type { VitalSignSubItemGroup } from "@/types/vital/vital-sign-sub-items-types";
import { MySelect } from "../yjg/my-select";
import MyInput from "../yjg/my-input";
import { cn } from "@/lib/utils";
import { GRID_FONT_SIZE_CLASS } from "../yjg/common/constant/class-constants";

type CellDataChangeHandler = (
  rowKey: string | number,
  headerKey: string,
  value: string | number | boolean,
  orgData?: any
) => void;

type SubItemDataChangeHandler = (
  rowKey: string | number,
  subItemId: number,
  orgData?: any
) => void;

// 공통: 바이탈 아이템 셀 생성 함수
export const createVitalItemCell = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  measurementDateTime: string,
  vitalSignItem: VitalSignItem,
  vitalSubItemGroups: VitalSignSubItemGroup[],
  onCellDataChange: CellDataChangeHandler,
  onSubItemDataChange: SubItemDataChangeHandler,
  measurement?: any
): MyGridCellType => {
  const subItemGroup = vitalSubItemGroups.find(
    (group) => group.itemId === vitalSignItem.id
  );

  // maxIntegerDigits에 따라 max 값 계산 (예: 2면 99, 3이면 999)
  const maxIntegerDigits = vitalSignItem.maxIntegerDigits || 0;
  const max =
    maxIntegerDigits > 0 ? Math.pow(10, maxIntegerDigits) - 1 : undefined;

  if (subItemGroup) {
    // subItemCode가 없으면 "없음" subItem의 code를 기본값으로 사용
    const noSelectionSubItem = subItemGroup.subItems.find(
      (s) => s.name === "없음"
    );
    const effectiveSubItemCode =
      measurement?.subItemCode || noSelectionSubItem?.code || "";

    const selectedSubItem = subItemGroup.subItems.find(
      (s) => s.code === effectiveSubItemCode
    );
    const subItemMaxIntegerDigits = selectedSubItem?.maxIntegerDigits ?? maxIntegerDigits;
    const subItemMax = subItemMaxIntegerDigits > 0 ? Math.pow(10, subItemMaxIntegerDigits) - 1 : max;
    const subItemPointPos = selectedSubItem?.maxDecimalDigits ?? vitalSignItem.maxDecimalDigits ?? 0;
    const subItemNormalMin = selectedSubItem?.normalMinValue ?? vitalSignItem.normalMinValue;
    const subItemNormalMax = selectedSubItem?.normalMaxValue ?? vitalSignItem.normalMaxValue;

    return {
      headerKey: vitalSignItem.code,
      value: measurement?.value || "",
      orgData: measurement || { itemId: vitalSignItem.id },
      customRender: (
        <div className="flex flex-row items-center pl-[5px]">
          <MySelect
            size="sm"
            hideChevron={true}
            className="bg-[var(--blue-1)] text-[var(--info)] border-none min-w-[25px]"
            options={subItemGroup.subItems.map((subItem) => ({
              value: subItem.code,
              label: subItem.name === "없음" ? "-" : subItem.name,
            }))}
            value={effectiveSubItemCode}
            onChange={(value) => {
              onSubItemDataChange(
                measurementDateTime,
                subItemGroup.subItems.find((subItem) => subItem.code === value)
                  ?.id || 0,
                measurement || { itemId: vitalSignItem.id }
              );
            }}
          />
          <MyInput
            type="text-number"
            className={cn(
              GRID_FONT_SIZE_CLASS[size as keyof typeof GRID_FONT_SIZE_CLASS],
              `m-[1px] rounded-none border-none text-right`
            )}
            value={measurement?.value || ""}
            pointPos={subItemPointPos}
            max={subItemMax}
            showComma={false}
            referenceValue={{
              normalMin: subItemNormalMin ?? undefined,
              normalMax: subItemNormalMax ?? undefined,
            }}
            onBlur={(value) => {
              onCellDataChange(
                measurementDateTime,
                vitalSignItem.code,
                String(value),
                measurement || { itemId: vitalSignItem.id }
              );
            }}
          />
        </div>
      ),
    };
  } else {
    return {
      headerKey: vitalSignItem.code,
      value: measurement?.value || "",
      orgData: measurement || { itemId: vitalSignItem.id },
      inputType: "textNumber" as const,
      textNumberOption: {
        pointPos: vitalSignItem.maxDecimalDigits || 0,
        max: max,
        normalMin: vitalSignItem.normalMinValue ?? undefined,
        normalMax: vitalSignItem.normalMaxValue ?? undefined,
      },
    };
  }
};

// 기존 측정값들을 그리드 행 타입으로 변환
export const convertVitalSignMeasurementsToGridRowType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: CellDataChangeHandler,
  onSubItemDataChange: SubItemDataChangeHandler,
  vitalSignItems: VitalSignItem[],
  vitalSubItemGroups: VitalSignSubItemGroup[],
  vitalSignMeasurements: VitalSignMeasurementPivotResponse
): MyGridRowType[] => {
  return vitalSignMeasurements.map((vitalSignMeasurement, index) => {
    const cells: MyGridCellType[] = [
      {
        headerKey: "measurementDate",
        value: formatDateByPattern(
          vitalSignMeasurement.measurementDateTime,
          "YYYY-MM-DD HH:mm:ss"
        ),
        inputType: "dateTime" as const,
      },
    ];

    vitalSignItems.forEach((vitalSignItem) => {
      const measurement = vitalSignMeasurement.measurements.find(
        (m) => m.itemCode === vitalSignItem.code
      );

      cells.push(
        createVitalItemCell(
          size,
          vitalSignMeasurement.measurementDateTime,
          vitalSignItem,
          vitalSubItemGroups,
          onCellDataChange,
          onSubItemDataChange,
          measurement
        )
      );
    });

    return {
      rowIndex: index,
      key: vitalSignMeasurement.measurementDateTime,
      cells: cells,
    };
  });
};

// 새로운 빈 바이탈 측정 행 생성
export const createEmptyVitalSignRow = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: CellDataChangeHandler,
  onSubItemDataChange: SubItemDataChangeHandler,
  vitalSignItems: VitalSignItem[],
  vitalSubItemGroups: VitalSignSubItemGroup[]
): MyGridRowType => {
  const now = new Date().toISOString();

  const cells: MyGridCellType[] = [
    {
      headerKey: "measurementDate",
      value: formatDateByPattern(now, "YYYY-MM-DD HH:mm:ss"),
      inputType: "dateTime" as const,
    },
  ];

  vitalSignItems.forEach((vitalSignItem) => {
    cells.push(
      createVitalItemCell(
        size,
        now,
        vitalSignItem,
        vitalSubItemGroups,
        onCellDataChange,
        onSubItemDataChange,
        undefined // 새 행이므로 measurement 없음
      )
    );
  });

  return {
    rowIndex: -1, // 새 행은 -1로 표시
    key: now,
    cells: cells,
  };
};
