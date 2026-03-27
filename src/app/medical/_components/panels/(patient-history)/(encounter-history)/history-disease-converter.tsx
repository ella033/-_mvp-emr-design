import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { Disease } from "@/types/chart/disease-types";
import { DEPARTMENT_OPTIONS } from "@/constants/department";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import ExternalCauseCodeTooltip from "@/components/library/external-cause-code/external-cause-code-tooltip";

export const convertHistoryDiseasesToMyTreeGridType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  diseases: Disease[]
): MyTreeGridRowType[] => {
  return diseases.map((disease, index) => {
    const rowKey = `row-key-${disease.id}-${index}`;
    const isMainDisease = index === 0;

    return {
      rowKey,
      parentRowKey: null,
      type: "item",
      orgData: {
        type: "disease",
        data: disease,
      },
      iconBtn: (
        <GetItemTypeCategoryIcon
          size={size}
          category="disease"
          iconClassName={isMainDisease ? "text-orange-500" : ""}
        />
      ),
      cells: [
        {
          headerKey: "code",
          value: disease.code,
        },
        {
          headerKey: "name",
          value: disease.name,
        },
        {
          headerKey: "isSuspected",
          value: disease.isSuspected,
        },
        {
          headerKey: "isExcluded",
          value: disease.isExcluded,
        },
        {
          headerKey: "isLeftSide",
          value: disease.isLeftSide,
        },

        {
          headerKey: "isRightSide",
          value: disease.isRightSide,
        },

        {
          headerKey: "department",
          value: disease.department === 0 ? "" : DEPARTMENT_OPTIONS.find(
            (option) => option.value === disease.department?.toString()
          )?.label,
        },

        {
          headerKey: "specificSymbol",
          value: disease.specificSymbol,
        },
        {
          headerKey: "externalCauseCode",
          value: disease.externalCauseCode,
          customRender: (
            <ExternalCauseCodeTooltip
              externalCauseCode={disease.externalCauseCode || ""}
            />
          ),
        },
        {
          headerKey: "isSurgery",
          value: disease.isSurgery,
        },
      ],
    };
  });
};
