import { formatDate, formatDateTime } from "@/lib/date-utils";
import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import type { DoctorType } from "@/types/doctor-type";
import { Check } from "lucide-react";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import { toKRW } from "@/lib/patient-utils";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/common/common-option";
import { POINT_OPTIONS } from "@/constants/decimal-point-option";
import { InOut } from "@/constants/master-data-enum";
import DrugInfoButton from "@/app/master-data/_components/(tabs)/(drug)/drug-info-button";
import UsageTooltip from "@/components/library/usage/usage-tooltip";
import DrugSeparationExceptionCodeTooltip from "@/components/library/drug-separation-exception-code/drug-separation-exception-code-tooltip";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";

export const convertDrugMasterToGridRowType = (
  libraries: PrescriptionLibraryType[],
  lastIndex: number
): MyGridRowType[] => {
  return libraries
    .map((library, index) => {
      const detail = library.details[0];
      if (!detail) {
        return null;
      }

      return {
        key: library.typePrescriptionLibraryId,
        rowIndex: lastIndex + index + 1,
        cells: [
          {
            headerKey: "index",
            value: lastIndex + index + 1,
          },
          {
            headerKey: "applyDate",
            value: formatDate(detail.applyDate),
          },
          {
            headerKey: "administrationRoute",
            value: library.drugLibrary?.administrationRoute,
          },
          {
            headerKey: "claimCode",
            value: detail.claimCode,
          },
          {
            headerKey: "drugInfo",
            value: detail.claimCode,
            customRender: <DrugInfoButton claimCode={detail.claimCode} />,
          },
          {
            headerKey: "name",
            value: library.name,
          },
          {
            headerKey: "price",
            value: toKRW(detail.price),
          },
          {
            headerKey: "manufacturerName",
            value: library.drugLibrary?.manufacturerName,
          },
          {
            headerKey: "specification",
            value: library.drugLibrary?.specification,
          },
          {
            headerKey: "unit",
            value: library.drugLibrary?.unit,
          },
          {
            headerKey: "isSelfPayRate30",
            value: detail.isSelfPayRate30,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {detail.isSelfPayRate30 && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "isSelfPayRate50",
            value: detail.isSelfPayRate50,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {detail.isSelfPayRate50 && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "isSelfPayRate80",
            value: detail.isSelfPayRate80,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {detail.isSelfPayRate80 && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "salaryStandard",
            value: detail.salaryStandard,
          },
          {
            headerKey: "additionalPrice",
            value: toKRW(detail.additionalPrice),
          },
          {
            headerKey: "activeIngredientCode",
            value: detail.activeIngredientCode,
          },
          {
            headerKey: "withdrawalPrevention",
            value: detail.withdrawalPrevention,
          },

          {
            headerKey: "exceptionDrugCategory",
            value: library.drugLibrary?.exceptionDrugCategory,
          },
          {
            headerKey: "classificationNo",
            value: library.drugLibrary?.classificationNo,
          },
          {
            headerKey: "specializationType",
            value: library.drugLibrary?.specializationType,
          },
          {
            headerKey: "drugEquivalence",
            value: library.drugLibrary?.drugEquivalence,
          },
          {
            headerKey: "substituteType",
            value: library.drugLibrary?.substituteType,
          },
          {
            headerKey: "prohibitedCompounding",
            value: library.drugLibrary?.prohibitedCompounding,
          },
          {
            headerKey: "sameDrugCode",
            value: library.drugLibrary?.sameDrugCode,
          },
          {
            headerKey: "claimSpecification",
            value: library.drugLibrary?.claimSpecification,
          },
        ],
      } as MyGridRowType;
    })
    .filter((row): row is MyGridRowType => row !== null);
};

export const convertDrugUserCodeToGridRowType = (
  userCodes: PrescriptionUserCodeType[],
  lastIndex: number,
  doctors: DoctorType[]
): MyGridRowType[] => {
  return userCodes
    .map((userCode, index) => {
      const drugUserCode = userCode.drugUserCode;
      const libraryDetail = userCode.library.details[0];
      const drugLibrary = userCode.library.drugLibrary;
      const userCodeDetail = userCode.details[0];

      return {
        rowIndex: lastIndex + index + 1,
        key: userCode.id,
        cells: [
          {
            headerKey: "index",
            value: lastIndex + index + 1,
          },
          {
            headerKey: "isActive",
            value: userCode.isActive,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {userCode.isActive && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "applyDate",
            value: formatDate(userCode.applyDate),
          },
          {
            headerKey: "endDate",
            value: formatDate(userCode.endDate),
          },
          {
            headerKey: "administrationRoute",
            value:
              drugUserCode?.administrationRoute ||
              drugLibrary?.administrationRoute ||
              "",
          },
          {
            headerKey: "code",
            value: userCode.code,
          },
          {
            headerKey: "claimCode",
            value: libraryDetail?.claimCode || "",
          },
          {
            headerKey: "drugInfo",
            value: libraryDetail?.claimCode || "",
            customRender: libraryDetail?.claimCode ? (
              <DrugInfoButton claimCode={libraryDetail?.claimCode} />
            ) : (
              <></>
            ),
          },
          {
            headerKey: "krName",
            value: userCode.name || userCode.library.name || "",
          },
          {
            headerKey: "enName",
            value: userCode.nameEn || "",
          },
          {
            headerKey: "manufacturerName",
            value:
              drugUserCode?.manufacturerName ||
              drugLibrary?.manufacturerName ||
              "",
          },
          {
            headerKey: "paymentMethod",
            value:
              PAYMENT_METHOD_OPTIONS.find(
                (option) => option.value === userCode.paymentMethod
              )?.label || "",
          },
          {
            headerKey: "isNormalPrice",
            value: userCode.isNormalPrice,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {userCode.isNormalPrice && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "price",
            value: toKRW(libraryDetail?.price || 0),
          },
          {
            headerKey: "normalPrice",
            value: toKRW(userCodeDetail?.normalPrice),
          },
          {
            headerKey: "actualPrice",
            value: toKRW(userCodeDetail?.actualPrice),
          },
          {
            headerKey: "specification",
            value:
              drugUserCode?.specification || drugLibrary?.specification || "",
          },
          {
            headerKey: "unit",
            value: drugUserCode?.unit || drugLibrary?.unit || "",
          },
          {
            headerKey: "dose",
            value: drugUserCode?.dose,
          },
          {
            headerKey: "decimalPoint",
            value:
              POINT_OPTIONS.find(
                (option) => option.value === drugUserCode?.decimalPoint
              )?.label || "",
          },
          {
            headerKey: "times",
            value: drugUserCode?.times,
          },
          {
            headerKey: "days",
            value: drugUserCode?.days,
          },
          {
            headerKey: "usage",
            value: drugUserCode?.usage || "",
            customRender: (
              <UsageTooltip usageCode={drugUserCode?.usage || ""} />
            ),
          },
          {
            headerKey: "inOutType",
            value: drugUserCode?.inOutType === InOut.In ? "원내" : "원외",
          },
          {
            headerKey: "exceptionCode",
            value: drugUserCode?.exceptionCode,
            customRender: (
              <DrugSeparationExceptionCodeTooltip
                type={DrugSeparationExceptionCodeType.Drug}
                exceptionCode={drugUserCode?.exceptionCode || ""}
              />
            ),
          },
          {
            headerKey: "salaryStandard",
            value: libraryDetail?.salaryStandard || 0,
          },
          {
            headerKey: "additionalPrice",
            value: libraryDetail?.additionalPrice || 0,
          },
          {
            headerKey: "activeIngredientCode",
            value: libraryDetail?.activeIngredientCode || "",
          },
          {
            headerKey: "withdrawalPrevention",
            value: libraryDetail?.withdrawalPrevention || "",
          },
          {
            headerKey: "exceptionDrugCategory",
            value: drugLibrary?.exceptionDrugCategory || "",
          },
          {
            headerKey: "classificationNo",
            value: drugLibrary?.classificationNo || "",
          },
          {
            headerKey: "specializationType",
            value:
              drugUserCode?.specializationType ||
              drugLibrary?.specializationType ||
              "",
          },
          {
            headerKey: "drugEquivalence",
            value: drugLibrary?.drugEquivalence || "",
          },
          {
            headerKey: "substituteType",
            value: drugLibrary?.substituteType || "",
          },
          {
            headerKey: "prohibitedCompounding",
            value: drugLibrary?.prohibitedCompounding || "",
          },
          {
            headerKey: "sameDrugCode",
            value: drugLibrary?.sameDrugCode || "",
          },
          {
            headerKey: "claimSpecification",
            value: drugLibrary?.claimSpecification || "",
          },
          {
            headerKey: "createId",
            value:
              doctors.find((doctor) => doctor.id === userCode.createId)?.name ||
              "",
          },
          {
            headerKey: "createDateTime",
            value: formatDateTime(userCode.createDateTime),
          },
          {
            headerKey: "updateId",
            value:
              doctors.find((doctor) => doctor.id === userCode.updateId)?.name ||
              "",
          },
          {
            headerKey: "updateDateTime",
            value: formatDateTime(userCode.updateDateTime),
          }
        ],
      } as MyGridRowType;
    })
    .filter((row): row is MyGridRowType => row !== null);
};
