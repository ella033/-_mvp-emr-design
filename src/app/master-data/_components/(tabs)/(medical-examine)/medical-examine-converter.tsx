import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { formatDate, formatDateTime } from "@/lib/date-utils";
import type { DoctorType } from "@/types/doctor-type";
import { Check } from "lucide-react";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import { toKRW } from "@/lib/patient-utils";

export function convertExamineMasterToGridRowType(
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
}

export function convertExamineUserCodeToGridRowType(
  userCodes: PrescriptionUserCodeType[],
  lastIndex: number,
  doctors: DoctorType[]
): MyGridRowType[] {
  return userCodes
    .map((userCode, index) => {
      // typePrescriptionLibraryId가 0이면 details가 빈 배열일 수 있음
      const libraryDetail =
        userCode.library.details && userCode.library.details.length > 0
          ? userCode.library.details[0]
          : undefined;
      const userCodeDetail =
        userCode.details && userCode.details.length > 0
          ? userCode.details[0]
          : undefined;

      // 수탁기관: externalLabHospitalMapping.library.name 우선, 없으면 externalLabName
      const externalLabName =
        (userCode.externalLabHospitalMapping as any)?.library?.name ||
        userCode.externalLabName;

      // 수탁사코드: externalLabExamination이 있으면 examinationCode, 없으면 externalLabExaminationCode
      const externalLabExaminationCode =
        userCode.externalLabExamination?.examinationCode ||
        userCode.externalLabExaminationCode;

      // 표준코드: externalLabExamination이 있으면 ubCode, 없으면 externalLabUbCode
      const externalLabUbCode =
        userCode.externalLabExamination?.ubCode ||
        userCode.externalLabUbCode;

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
            headerKey: "code",
            value: userCode.code,
          },
          {
            headerKey: "applyDate",
            value: formatDate(userCode.applyDate),
          },
          {
            headerKey: "externalLabName",
            value: externalLabName,
          },
          {
            headerKey: "externalLabExaminationCode",
            value: externalLabExaminationCode,
          },
          {
            headerKey: "claimCode",
            value: libraryDetail?.claimCode,
          },
          {
            headerKey: "externalLabUbCode",
            value: externalLabUbCode,
          },
          {
            headerKey: "krName",
            value:
              userCode.name ||
              userCode.externalLabExaminationName ||
              userCode.library.name,
          },
          {
            headerKey: "enName",
            value:
              userCode.nameEn ||
              userCode.externalLabExamination?.ename ||
              userCode.library.medicalLibrary?.nameEn,
          },
          {
            headerKey: "examinationType",
            value: userCode.externalLabExamination?.type,
          },
          {
            headerKey: "specimenName",
            value: Array.isArray(userCode.specimenDetail) && userCode.specimenDetail.length > 0
              ? userCode.specimenDetail.map((s: { name: string }) => s.name).join(", ")
              : userCode.externalLabExamination?.spcName,
          },
          {
            headerKey: "priceApplyDate",
            value: userCodeDetail ? formatDate(userCodeDetail.applyDate) : "",
          },
          {
            headerKey: "price",
            value: libraryDetail?.price ? toKRW(libraryDetail.price) : "",
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
}
