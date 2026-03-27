import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";
import { toKRW } from "@/lib/patient-utils";
import type { InjectionLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";

export function convertMasterInjectionLinkToGridRowType(
  libraries: PrescriptionLibraryType[],
  lastIndex: number
): MyGridRowType[] {
  return libraries
    .map((library, index) => {
      const detail = library.details[0];
      if (!detail) {
        return null;
      }

      return {
        key: library.id,
        rowIndex: lastIndex + index + 1,
        cells: [
          {
            headerKey: "index",
            value: lastIndex + index + 1,
          },
          {
            headerKey: "claimCode",
            value: detail.claimCode,
          },
          {
            headerKey: "name",
            value: library.name,
          },

          {
            headerKey: "price",
            value: toKRW(detail.price),
          },
        ],
      } as MyGridRowType;
    })
    .filter((row): row is MyGridRowType => row !== null);
}

export function convertRegisteredInjectionLinkToGridRowType(
  injectionLinks: InjectionLinkType[]
): MyGridRowType[] {
  return injectionLinks.map((injectionLink, index) => ({
    rowIndex: index + 1,
    key: injectionLink.id,
    cells: [
      {
        headerKey: "index",
        value: index + 1,
      },
      {
        headerKey: "code",
        value: injectionLink.code,
      },
      {
        headerKey: "name",
        value: injectionLink.name,
      },
    ],
  })) as MyGridRowType[];
}
