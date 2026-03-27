import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";

export function convertSpecimenLibrariesToGridRowType(
  items: SpecimenDetail[],
  lastIndex: number
): MyGridRowType[] {
  return items.map((item, index) => ({
    rowIndex: lastIndex + index + 1,
    key: item.id ?? `row-${lastIndex + index}`,
    cells: [
      {
        headerKey: "code",
        value: item.code,
      },
      {
        headerKey: "name",
        value: item.name,
      },
      {
        headerKey: "id",
        value: item.id,
      },
    ],
  }));
}

export function convertSpecimenDetailToGridRowType(
  items: SpecimenDetail[],
): MyGridRowType[] {
  return items.map((item, index) => ({
    rowIndex: index + 1,
    key: item.id ?? `row-${index}`,
    cells: [
      {
        headerKey: "code",
        value: item.code,
      },
      {
        headerKey: "name",
        value: item.name,
      },

    ],
  }));
}
