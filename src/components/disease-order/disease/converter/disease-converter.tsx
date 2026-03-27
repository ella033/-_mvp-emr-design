import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { Disease } from "@/types/chart/disease-types";
import { DEPARTMENT_OPTIONS } from "@/constants/department";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";

export const convertDiseasesToMyTreeGridType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  diseases: Disease[],
  onToggleMainDisease?: (rowKey: string) => void,
  isHighlight?: boolean,
  lastIndex?: number
): MyTreeGridRowType[] => {
  return diseases.map((disease, index) => {
    const rowKey = `row-key-${lastIndex ? lastIndex + index : index}`;

    return {
      rowKey,
      parentRowKey: null,
      type: "item",
      orgData: {
        type: "disease",
        data: disease,
      },
      isHighlight: isHighlight ?? false,
      iconBtn: (
        <GetItemTypeCategoryIcon
          size={size}
          category="disease"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMainDisease?.(rowKey);
          }}
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
          inputType: "checkbox",
        },
        {
          headerKey: "isExcluded",
          value: disease.isExcluded,
          inputType: "checkbox",
        },
        {
          headerKey: "isLeftSide",
          value: disease.isLeftSide,
          inputType: "checkbox",
        },

        {
          headerKey: "isRightSide",
          value: disease.isRightSide,
          inputType: "checkbox",
        },

        {
          headerKey: "department",
          value: disease.department,
          inputType: "select",
          selectOption: DEPARTMENT_OPTIONS,
        },
        {
          headerKey: "specificSymbol",
          value: disease.specificSymbol,
        },
        {
          headerKey: "externalCauseCode",
          value: disease.externalCauseCode,
          inputType: "external-cause-code",
        },
        {
          headerKey: "isSurgery",
          value: disease.isSurgery,
          inputType: "checkbox",
        },
        {
          headerKey: "diseaseLibraryId",
          value: disease.diseaseLibraryId,
        }
      ],
    };
  });
};
