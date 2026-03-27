import type { DiseaseLibrariesType } from "@/types/master-data/disease-libraries/disease-libraries-response-type";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { Check } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { DiseaseLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import { getGender } from "@/lib/patient-utils";

export function convertDiseaseLibrariesToGridRowType(
  libraries: DiseaseLibrariesType[],
  lastIndex: number
): MyGridRowType[] {
  return libraries
    .filter((library) => library.details[0])
    .map((library, index) => {
      const detail = library.details[0]!;
      return {
        rowIndex: lastIndex + index + 1,
        key: library.id,
        cells: [
          {
            headerKey: "index",
            value: lastIndex + index + 1,
          },
          {
            headerKey: "code",
            value: detail.code,
          },
          {
            headerKey: "applyDate",
            value: formatDate(detail.applyDate),
          },
          {
            headerKey: "name",
            value: library.name,
          },
          {
            headerKey: "nameEn",
            value: library.nameEn,
          },
          {
            headerKey: "isPossibleMainDisease",
            value: detail.isPossibleMainDisease,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {detail.isPossibleMainDisease && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "legalInfectiousCategory",
            value: detail.legalInfectiousCategory,
          },
          {
            headerKey: "gender",
            value: getGender(detail.gender),
          },
          {
            headerKey: "maxAge",
            value: detail.maxAge,
          },
          {
            headerKey: "minAge",
            value: detail.minAge,
          },
        ],
      };
    });
}

export function convertDiseaseLinkToGridRowType(
  diseaseLinks: DiseaseLinkType[],
): MyGridRowType[] {
  return diseaseLinks.map((diseaseLink, index) => ({
    rowIndex: index + 1,
    key: diseaseLink.id,
    cells: [
      {
        headerKey: "index",
        value: index + 1,
      },
      {
        headerKey: "code",
        value: diseaseLink.code,
      },
      {
        headerKey: "name",
        value: diseaseLink.name,
      }
    ],
  })) as MyGridRowType[];
}
