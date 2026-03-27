import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import type { DoctorType } from "@/types/doctor-type";
import { Check } from "lucide-react";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import { toKRW } from "@/lib/patient-utils";
import { ITEM_TYPE_ACTION_OPTIONS } from "@/constants/library-option/item-type-option";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/common/common-option";

export const convertActionMasterToGridRowType = (
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
        rowIndex: lastIndex + index + 1,
        key: library.typePrescriptionLibraryId,
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
            headerKey: "itemType",
            value:
              ITEM_TYPE_ACTION_OPTIONS.find(
                (option) => option.value === library.itemType
              )?.label || "",
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
            headerKey: "nameEn",
            value: library.medicalLibrary?.nameEn,
          },
          {
            headerKey: "organCategory",
            value: library.medicalLibrary?.organCategory,
          },
          {
            headerKey: "sectionCategory",
            value: library.medicalLibrary?.sectionCategory,
          },
          {
            headerKey: "subCategory",
            value: library.medicalLibrary?.subCategory,
          },
          {
            headerKey: "classificationNo",
            value: library.medicalLibrary?.classificationNo,
          },
          {
            headerKey: "price",
            value: toKRW(detail.price),
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
            headerKey: "isSelfPayRate90",
            value: detail.isSelfPayRate90,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {detail.isSelfPayRate90 && <Check className="w-4 h-4" />}
              </div>
            ),
          },
          {
            headerKey: "oneTwoType",
            value: detail.oneTwoType,
          },
          {
            headerKey: "relativeValueScore",
            value: detail.relativeValueScore,
          },
          {
            headerKey: "assessmentName",
            value: library.medicalLibrary?.assessmentName,
          },
          {
            headerKey: "surgeryType",
            value: library.medicalLibrary?.surgeryType,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {library.medicalLibrary?.surgeryType === "9" && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isDuplicateAllowed",
            value: library.medicalLibrary?.isDuplicateAllowed,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {library.medicalLibrary?.isDuplicateAllowed && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
        ],
      } as MyGridRowType;
    })
    .filter((row): row is MyGridRowType => row !== null);
};

export const convertActionUserCodeToGridRowType = (
  userCodes: PrescriptionUserCodeType[],
  lastIndex: number,
  doctors: DoctorType[]
): MyGridRowType[] => {
  return userCodes
    .map((userCode, index) => {
      const medicalUserCode = userCode.medicalUserCode;
      const libraryDetail = userCode.library.details[0];
      const medicalLibrary = userCode.library.medicalLibrary;
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
            headerKey: "itemType",
            value:
              ITEM_TYPE_ACTION_OPTIONS.find(
                (option) => option.value === userCode.library.itemType
              )?.label || "",
          },
          {
            headerKey: "claimCode",
            value: libraryDetail?.claimCode || "",
          },
          {
            headerKey: "krName",
            value: userCode.name || userCode.library.name || "",
          },
          {
            headerKey: "enName",
            value: userCode.nameEn || medicalLibrary?.nameEn || "",
          },
          {
            headerKey: "organCategory",
            value: medicalLibrary?.organCategory || "",
          },
          {
            headerKey: "sectionCategory",
            value: medicalLibrary?.sectionCategory || "",
          },
          {
            headerKey: "subCategory",
            value: medicalLibrary?.subCategory || "",
          },
          {
            headerKey: "classificationNo",
            value: medicalLibrary?.classificationNo || "",
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
            headerKey: "isIncomeTaxDeductionExcluded",
            value: userCode.isIncomeTaxDeductionExcluded,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {userCode.isIncomeTaxDeductionExcluded && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isAgeAdditionExcluded",
            value: medicalUserCode?.isAgeAdditionExcluded,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {medicalUserCode?.isAgeAdditionExcluded && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isNightHolidayExcluded",
            value: medicalUserCode?.isNightHolidayExcluded,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {medicalUserCode?.isNightHolidayExcluded && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isSelfPayRate50",
            value: libraryDetail?.isSelfPayRate50,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {libraryDetail?.isSelfPayRate50 && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isSelfPayRate80",
            value: libraryDetail?.isSelfPayRate80,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {libraryDetail?.isSelfPayRate80 && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isSelfPayRate90",
            value: libraryDetail?.isSelfPayRate90,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {libraryDetail?.isSelfPayRate90 && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "oneTwoType",
            value: libraryDetail?.oneTwoType,
          },
          {
            headerKey: "relativeValueScore",
            value: libraryDetail?.relativeValueScore,
          },
          {
            headerKey: "assessmentName",
            value: medicalLibrary?.assessmentName || "",
          },
          {
            headerKey: "surgeryType",
            value: medicalLibrary?.surgeryType || "",
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {medicalLibrary?.surgeryType === "9" && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
          },
          {
            headerKey: "isDuplicateAllowed",
            value: medicalLibrary?.isDuplicateAllowed,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {medicalLibrary?.isDuplicateAllowed && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            ),
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
