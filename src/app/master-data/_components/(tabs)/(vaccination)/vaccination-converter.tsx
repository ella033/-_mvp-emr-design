import type { MyGridRowType } from "@/components/yjg/my-grid/my-grid-type";
import { toKRW } from "@/lib/patient-utils";
import type { VaccinationLibrary } from "@/types/master-data/prescription-libraries/library/vaccination-library-type";
import type { VaccinationUserCode } from "@/types/master-data/prescription-user-codes/user-code/vaccination-user-code-type";

export const convertVaccinationLibrariesToGridRowType = (
  vaccinationLibraries: VaccinationLibrary[]
): MyGridRowType[] => {
  return vaccinationLibraries.map((vaccinationLibrary, index) => ({
    rowIndex: index + 1,
    key: vaccinationLibrary.id,
    cells: [
      {
        headerKey: "index",
        value: index + 1,
      },
      {
        headerKey: "code",
        value: vaccinationLibrary.code,
      },
      {
        headerKey: "name",
        value: vaccinationLibrary.name,
      },
    ],
  }));
};

export const convertVaccinationUserCodesToGridRowType = (
  vaccinationUserCodes: VaccinationUserCode[]
): MyGridRowType[] => {
  return vaccinationUserCodes.map((vaccinationUserCode, index) => ({
    rowIndex: index + 1,
    key: vaccinationUserCode.id,
    cells: [
      {
        headerKey: "index",
        value: index + 1,
      },
      {
        headerKey: "code",
        value: vaccinationUserCode.code,
      },
      {
        headerKey: "name",
        value: vaccinationUserCode.name,
      },
      {
        headerKey: "price",
        value: toKRW(vaccinationUserCode.price),
      },
      {
        headerKey: "isActive",
        value: vaccinationUserCode.isActive,
      },
    ],
  }));
};
