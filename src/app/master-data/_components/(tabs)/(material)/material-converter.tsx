import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import type { DoctorType } from "@/types/doctor-type";
import { Check } from "lucide-react";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import { toKRW } from "@/lib/patient-utils";
import { ITEM_TYPE_MATERIAL_OPTIONS } from "@/constants/library-option/item-type-option";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/common/common-option";

export const convertMaterialMasterToGridRowType = (
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
              ITEM_TYPE_MATERIAL_OPTIONS.find(
                (option) => option.value === library.itemType
              )?.label || "",
          },
          {
            headerKey: "claimCode",
            value: detail.claimCode,
          },
          {
            headerKey: "middleCategory",
            value: library.materialLibrary?.middleCategory,
          },
          {
            headerKey: "middleCategoryCode",
            value: library.materialLibrary?.middleCategoryCode,
          },
          {
            headerKey: "name",
            value: library.name,
          },
          {
            headerKey: "material",
            value: library.materialLibrary?.material,
          },
          {
            headerKey: "manufacturerName",
            value: library.materialLibrary?.manufacturerName,
          },
          {
            headerKey: "importCompany",
            value: library.materialLibrary?.importCompany,
          },
          {
            headerKey: "specification",
            value: library.materialLibrary?.specification,
          },
          {
            headerKey: "unit",
            value: library.materialLibrary?.unit,
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
            headerKey: "isDuplicateAllowed",
            value: library.materialLibrary?.isDuplicateAllowed,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {library.materialLibrary?.isDuplicateAllowed && (
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

export const convertMaterialUserCodeToGridRowType = (
  userCodes: PrescriptionUserCodeType[],
  lastIndex: number,
  doctors: DoctorType[]
): MyGridRowType[] => {
  return userCodes
    .map((userCode, index) => {
      const materialUserCode = userCode.materialUserCode;
      const libraryDetail = userCode.library.details[0];
      const materialLibrary = userCode.library.materialLibrary;
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
              ITEM_TYPE_MATERIAL_OPTIONS.find(
                (option) => option.value === userCode.library.itemType
              )?.label || "",
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
            headerKey: "middleCategory",
            value: materialLibrary?.middleCategory || "",
          },
          {
            headerKey: "middleCategoryCode",
            value: materialLibrary?.middleCategoryCode || "",
          },
          {
            headerKey: "krName",
            value: userCode.name || "",
          },
          {
            headerKey: "enName",
            value: userCode.nameEn || "",
          },
          {
            headerKey: "material",
            value:
              materialUserCode?.material || materialLibrary?.material || "",
          },
          {
            headerKey: "manufacturerName",
            value:
              materialUserCode?.manufacturerName ||
              materialLibrary?.manufacturerName ||
              "",
          },
          {
            headerKey: "importCompany",
            value:
              materialUserCode?.importCompany ||
              materialLibrary?.importCompany ||
              "",
          },
          {
            headerKey: "specification",
            value:
              materialUserCode?.specification ||
              materialLibrary?.specification ||
              "",
          },
          {
            headerKey: "unit",
            value: materialUserCode?.unit || materialLibrary?.unit || "",
          },
          {
            headerKey: "dose",
            value: materialUserCode?.dose,
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
            headerKey: "isDuplicateAllowed",
            value: materialLibrary?.isDuplicateAllowed,
            customRender: (
              <div className="flex flex-row items-center gap-1">
                {materialLibrary?.isDuplicateAllowed && (
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
          },
        ],
      } as MyGridRowType;
    })
    .filter((row): row is MyGridRowType => row !== null);
};
