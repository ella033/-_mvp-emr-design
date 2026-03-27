import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { ExternalCauseCode } from "./external-cause-code-option";

export const convertExternalCauseCodeToGridRowType = (
  items: ExternalCauseCode[]
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
        headerKey: "content",
        value: item.content,
      },
    ],
  }));
};
