import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import {
  getCellValueAsBoolean,
  getCellValueAsNumber,
  getCellValueAsString,
} from "@/components/yjg/my-grid/my-grid-util";
import type {
  ProhibitedDrug,
  UpsertManyProhibitedDrugs,
} from "@/types/prohibited-drugs-type";
import { formatDateByPattern } from "@/lib/date-utils";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export const convertProhibitedDrugsToMyGridType = (
  prohibitedDrugs: ProhibitedDrug[]
): MyGridRowType[] => {
  return prohibitedDrugs.map((prohibitedDrug, index) => {
    const key = getRowKey("prohibited-drug", prohibitedDrug.id);
    return {
      rowIndex: index,
      key: key,
      cells: [
        {
          headerKey: "id",
          value: prohibitedDrug.id,
        },
        {
          headerKey: "prescriptionLibraryId",
          value: prohibitedDrug.prescriptionLibraryId,
        },
        {
          headerKey: "createDate",
          value: formatDateByPattern(
            prohibitedDrug.createDateTime,
            "YYYY-MM-DD"
          ),
        },
        {
          headerKey: "name",
          value: prohibitedDrug.name,
        },
        {
          headerKey: "atcCode",
          value: prohibitedDrug.atcCode,
        },
        {
          headerKey: "memo",
          value: prohibitedDrug.memo,
          inputType: "text",
        },
        {
          headerKey: "isSameIngredientProhibited",
          value: prohibitedDrug.isSameIngredientProhibited,
          inputType: "checkbox",
          tooltip: sameIngredientProhibitedTooltip,
          tooltipDelayDuration: 500,
        },
        {
          headerKey: "isPrescriptionAllowed",
          value: prohibitedDrug.isPrescriptionAllowed,
          inputType: "checkbox",
          tooltip: prescriptionAllowedTooltip,
          tooltipDelayDuration: 500,
        },
      ],
    };
  });
};

export const convertLibraryToMyGridType = (
  data: any,
  lastIndex: number
): MyGridRowType | null => {
  if (data.category !== "drugLibrary") return null;
  const key = getRowKey("prohibited-drug-library");

  return {
    rowIndex: lastIndex,
    key: key,
    cells: [
      {
        headerKey: "prescriptionLibraryId",
        value: data.id,
      },
      {
        headerKey: "createDate",
        value: formatDateByPattern(new Date(), "YYYY-MM-DD"),
      },
      {
        headerKey: "name",
        value: data.name,
      },
      {
        headerKey: "atcCode",
        value: data.details?.[0]?.activeIngredientCode || "",
      },
      {
        headerKey: "memo",
        value: "",
        inputType: "text",
      },
      {
        headerKey: "isSameIngredientProhibited",
        value: false,
        inputType: "checkbox",
        tooltip: sameIngredientProhibitedTooltip,
        tooltipDelayDuration: 500,
      },
      {
        headerKey: "isPrescriptionAllowed",
        value: false,
        inputType: "checkbox",
        tooltip: prescriptionAllowedTooltip,
        tooltipDelayDuration: 500,
      },
    ],
  };
};

export const convertToApiProhibitedDrug = (
  data: MyGridRowType[]
): UpsertManyProhibitedDrugs[] => {
  return data.map((row) => {
    return {
      id: getCellValueAsString(row, "id") || undefined,
      prescriptionLibraryId:
        getCellValueAsNumber(row, "prescriptionLibraryId") || 0,
      name: getCellValueAsString(row, "name") || "",
      atcCode: getCellValueAsString(row, "atcCode") || "",
      memo: getCellValueAsString(row, "memo") || "",
      isSameIngredientProhibited:
        getCellValueAsBoolean(row, "isSameIngredientProhibited") || false,
      isPrescriptionAllowed:
        getCellValueAsBoolean(row, "isPrescriptionAllowed") || false,
    };
  });
};

const sameIngredientProhibitedTooltip = (
  <pre className="text-[12px] whitespace-pre-wrap">
    해당 성분이 포함된 다른 약도 모두 금지합니다.
  </pre>
);

const prescriptionAllowedTooltip = (
  <pre className="text-[12px] whitespace-pre-wrap">
    처방금지 경고를 무시하고 처방을 내릴 수 있습니다.
  </pre>
);
