import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { formatDate } from "@/lib/date-utils";
import { Check } from "lucide-react";
import { toKRW } from "@/lib/patient-utils";
import type { ExternalLabExamination } from "./external-lab-examination-types";

export function convertExternalLabExaminationToGridRowType(
  examinations: ExternalLabExamination[],
  lastIndex: number
): MyGridRowType[] {
  return examinations.map((examination, index) => {
    const prescriptionLibrary = examination.prescriptionLibrary;
    const prescriptionLibraryDetail = examination.prescriptionLibraryDetail;

    return {
      rowIndex: lastIndex + index + 1,
      key: examination.id,
      cells: [
        {
          headerKey: "index",
          value: lastIndex + index + 1,
        },
        {
          headerKey: "applyDate",
          value: prescriptionLibraryDetail
            ? formatDate(prescriptionLibraryDetail.applyDate)
            : "",
        },
        {
          headerKey: "examinationCode",
          value: examination.examinationCode,
        },
        {
          headerKey: "ubCode",
          value: examination.ubCode || "",
        },
        {
          headerKey: "claimCode",
          value: examination.claimCode || "",
        },
        {
          headerKey: "name",
          value: examination.name,
        },
        {
          headerKey: "ename",
          value: examination.ename,
        },
        {
          headerKey: "type",
          value: examination.type,
        },
        {
          headerKey: "spcName",
          value: examination.spcName,
        },
        {
          headerKey: "libraryName",
          value: examination.library.name,
        },
        {
          headerKey: "prescriptionLibraryName",
          value: prescriptionLibrary?.name || "",
        },
        {
          headerKey: "price",
          value: prescriptionLibraryDetail
            ? toKRW(prescriptionLibraryDetail.price)
            : "",
        },

        {
          headerKey: "isSelfPayRate50",
          value: prescriptionLibraryDetail?.isSelfPayRate50 || false,
          customRender: (
            <div className="flex flex-row items-center gap-1">
              {prescriptionLibraryDetail?.isSelfPayRate50 && (
                <Check className="w-4 h-4" />
              )}
            </div>
          ),
        },
        {
          headerKey: "isSelfPayRate80",
          value: prescriptionLibraryDetail?.isSelfPayRate80 || false,
          customRender: (
            <div className="flex flex-row items-center gap-1">
              {prescriptionLibraryDetail?.isSelfPayRate80 && (
                <Check className="w-4 h-4" />
              )}
            </div>
          ),
        },
        {
          headerKey: "isSelfPayRate90",
          value: prescriptionLibraryDetail?.isSelfPayRate90 || false,
          customRender: (
            <div className="flex flex-row items-center gap-1">
              {prescriptionLibraryDetail?.isSelfPayRate90 && (
                <Check className="w-4 h-4" />
              )}
            </div>
          ),
        },
        {
          headerKey: "oneTwoType",
          value: prescriptionLibraryDetail?.oneTwoType || "",
        },
        {
          headerKey: "relativeValueScore",
          value: prescriptionLibraryDetail?.relativeValueScore || "",
        }
      ],
    } as MyGridRowType;
  });
}
