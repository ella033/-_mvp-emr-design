import type { DrugSeparationExceptionCode } from "@/types/drug-separation-exception-code-type";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";

export const convertExceptionCodeToGridRowType = (
  items: DrugSeparationExceptionCode[]
): MyGridRowType[] => {
  return items.map((item, index) => ({
    key: item.code,
    rowIndex: index + 1,
    cells: [
      {
        headerKey: "code",
        value: item.code,
      },
      {
        headerKey: "title",
        value: item.title,
      },
      {
        headerKey: "content",
        value: item.content,
      },
    ],
  }));
};
