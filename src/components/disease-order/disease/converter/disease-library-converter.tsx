import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { DiseaseLibrariesType } from "@/types/master-data/disease-libraries/disease-libraries-response-type";
import { DEPARTMENT_OPTIONS } from "@/constants/department";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export const convertDiseaseLibraryToMyTreeGridType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  diseaseLibrary: DiseaseLibrariesType,
  onToggleMainDisease: (rowKey: string) => void
): MyTreeGridRowType => {
  const rowKey = getRowKey("disease-library");
  const diseaseDetail = diseaseLibrary.details[0];

  return {
    rowKey,
    parentRowKey: null,
    type: "item",
    orgData: {
      type: "disease-library",
      data: diseaseLibrary,
    },
    iconBtn: (
      <GetItemTypeCategoryIcon
        size={size}
        category="disease"
        onClick={() => onToggleMainDisease(rowKey)}
      />
    ),
    cells: [
      {
        headerKey: "code",
        value: diseaseDetail?.code || "",
      },
      {
        headerKey: "name",
        value: diseaseLibrary.name,
      },
      {
        headerKey: "isSuspected",
        value: false,
        inputType: "checkbox",
      },
      {
        headerKey: "isExcluded",
        value: false,
        inputType: "checkbox",
      },
      {
        headerKey: "isLeftSide",
        value: false,
        inputType: "checkbox",
      },
      {
        headerKey: "isRightSide",
        value: false,
        inputType: "checkbox",
      },
      {
        headerKey: "department",
        value: "",
        inputType: "select",
        selectOption: DEPARTMENT_OPTIONS,
      },
      {
        headerKey: "specificSymbol",
        value: "",
      },
      {
        headerKey: "externalCauseCode",
        value: "",
        inputType: "external-cause-code",
      },
      {
        headerKey: "isSurgery",
        value: false,
        inputType: "checkbox",
      },
      {
        headerKey: "diseaseLibraryId",
        value: diseaseLibrary.id,
      },
      {
        headerKey: "legalInfectiousCategory",
        value: diseaseDetail?.legalInfectiousCategory || "",
      },
    ],
  };
};
