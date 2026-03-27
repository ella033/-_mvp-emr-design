import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getCellValueAsNumber,
  getCellValueAsBoolean,
  getNormalizedCellString,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import {
  getSpecificDetail,
  getSpecimenDetail,
} from "@/app/medical/_components/panels/(patient-diagnosis-prescription)/api-converter";

export const convertBundleDiseases = (rows: MyTreeGridRowType[]) => {
  return rows.map((row, idx) => {
    const code = getNormalizedCellString(row, "code");
    const name = getNormalizedCellString(row, "name");
    const specificSymbol = getNormalizedCellString(row, "specificSymbol");
    const externalCauseCode = getNormalizedCellString(row, "externalCauseCode");
    const diseaseId = getCellValueAsNumber(row, "diseaseLibraryId");

    return {
      ...(row.orgData.type === "bundle-item-disease" &&
        row.orgData.data.id !== undefined && {
          id: Number(row.orgData.data.id),
        }),
      ...(diseaseId != null && { diseaseId }),
      sortNumber: idx + 1,
      ...(code != null && { code: code as string }),
      ...(name != null && { name: name as string }),
      isExcluded: getCellValueAsBoolean(row, "isExcluded") || false,
      isSuspected: getCellValueAsBoolean(row, "isSuspected") || false,
      isLeftSide: getCellValueAsBoolean(row, "isLeftSide") || false,
      isRightSide: getCellValueAsBoolean(row, "isRightSide") || false,
      isSurgery: getCellValueAsBoolean(row, "isSurgery") || false,
      department: getCellValueAsNumber(row, "department") || 0,
      ...(specificSymbol != null && { specificSymbol: specificSymbol as string }),
      ...(externalCauseCode != null && { externalCauseCode: externalCauseCode as string }),
    };
  });
};

export const convertBundleOrders = (rows: MyTreeGridRowType[]) => {
  return rows.map((row, index) => {
    const userCodeId = getCellValueAsNumber(row, "userCodeId");
    const prescriptionLibraryId = getCellValueAsNumber(row, "prescriptionLibraryId");
    const typePrescriptionLibraryId = getCellValueAsNumber(row, "typePrescriptionLibraryId");
    const type = getCellValueAsNumber(row, "prescriptionType");
    const userCode = getNormalizedCellString(row, "userCode");
    const claimCode = getNormalizedCellString(row, "claimCode");
    const name = getNormalizedCellString(row, "name");
    const itemType = getNormalizedCellString(row, "itemType");
    const drugAtcCode = getNormalizedCellString(row, "drugAtcCode");
    const dose = getCellValueAsNumber(row, "dose");
    const days = getCellValueAsNumber(row, "days");
    const times = getCellValueAsNumber(row, "times");
    const usage = getNormalizedCellString(row, "usage");
    const specification = getNormalizedCellString(row, "specification");
    const unit = getNormalizedCellString(row, "unit");
    const exceptionCode = getNormalizedCellString(row, "exceptionCode");
    const paymentMethod = getCellValueAsNumber(row, "paymentMethod");

    return {
      ...(row.orgData.type === "bundle-item-order" &&
        row.orgData.data.id !== undefined && {
          id: Number(row.orgData.data.id),
        }),
      ...(userCodeId != null && { userCodeId }),
      ...(prescriptionLibraryId != null && { prescriptionLibraryId }),
      ...(typePrescriptionLibraryId != null && { typePrescriptionLibraryId }),
      ...(type != null && { type }),
      sortNumber: index + 1,
      ...(userCode != null && { userCode: userCode as string }),
      ...(claimCode != null && { claimCode: claimCode as string }),
      ...(name != null && { name: name as string }),
      ...(itemType != null && { itemType: itemType as string }),
      ...(drugAtcCode != null && { drugAtcCode: drugAtcCode as string }),
      ...(dose != null && { dose }),
      ...(days != null && { days }),
      ...(times != null && { times }),
      ...(usage != null && { usage: usage as string }),
      ...(specification != null && { specification: specification as string }),
      ...(unit != null && { unit: unit as string }),
      ...(exceptionCode != null && { exceptionCode: exceptionCode as string }),
      ...(paymentMethod != null && { paymentMethod }),
      isClaim: getCellValueAsBoolean(row, "isClaim") ?? false,
      isPowder: getCellValueAsBoolean(row, "isPowder") ?? false,
      inOutType: getCellValueAsNumber(row, "inOutType") || 0,
      specificDetail: getSpecificDetail(row),
      specimenDetail: getSpecimenDetail(row),
    };
  });
};
