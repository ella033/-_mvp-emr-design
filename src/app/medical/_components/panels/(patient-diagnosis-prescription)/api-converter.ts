import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getCellValueAsBoolean,
  getCellValueAsNumber,
  getNormalizedCellString,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import type { ApiDisease } from "@/hooks/disease/use-upsert-diseases-by-encounter";
import { InputSource, InputType, type Order, type UpsertManyOrders } from "@/types/chart/order-types";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";
import { CodeType } from "@/constants/common/common-enum";
import { InOut, InOutLabel } from "@/constants/master-data-enum";
import { getPrescriptionDetailType, 처방상세구분 } from "@/types/master-data/item-type";

export const convertToApiDisease = (data: MyTreeGridRowType[]): ApiDisease[] => {
  return data.map((row, idx) => {
    const specificSymbol = getNormalizedCellString(row, "specificSymbol");
    const externalCauseCode = getNormalizedCellString(row, "externalCauseCode");

    return {
      sortNumber: idx + 1,
      code: getNormalizedCellString(row, "code") || "",
      name: getNormalizedCellString(row, "name") || "",
      isSuspected: getCellValueAsBoolean(row, "isSuspected") || false,
      isExcluded: getCellValueAsBoolean(row, "isExcluded") || false,
      isLeftSide: getCellValueAsBoolean(row, "isLeftSide") || false,
      isRightSide: getCellValueAsBoolean(row, "isRightSide") || false,
      department: getCellValueAsNumber(row, "department") || 0,
      ...(specificSymbol != null && { specificSymbol: specificSymbol as string }),
      ...(externalCauseCode != null && { externalCauseCode: externalCauseCode as string }),
      isSurgery: getCellValueAsBoolean(row, "isSurgery") || false,
      diseaseLibraryId: getCellValueAsNumber(row, "diseaseLibraryId") || 0,
      ...(row.orgData.type === "disease" &&
        row.orgData.data.id !== undefined && {
          id: row.orgData.data.id.toString(),
        }),
    };
  });
};

export const getSpecimenDetail = (row: MyTreeGridRowType): SpecimenDetail[] => {
  try {
    return JSON.parse(getNormalizedCellString(row, "specimenDetail") || "[]");
  } catch {
    return [];
  }
};

export const getSpecificDetail = (row: MyTreeGridRowType): SpecificDetail[] => {
  try {
    return JSON.parse(getNormalizedCellString(row, "specificDetail") || "[]");
  } catch {
    return [];
  }
};

const getInOutType = (row: MyTreeGridRowType): InOut | 0 => {
  const itemType = getNormalizedCellString(row, "itemType");
  const type = getPrescriptionDetailType(itemType);
  if (type === 처방상세구분.약 || type === 처방상세구분.주사) {
    return getCellValueAsBoolean(row, "inOutType") ? InOut.In : InOut.Out;
  }
  const inOutLabel = getNormalizedCellString(row, "inOutType")?.trim() || "";
  if (!inOutLabel) return 0;
  const entry = (Object.entries(InOutLabel) as [string, string][]).find(
    ([, label]) => label === inOutLabel
  );
  return entry ? (Number(entry[0]) as InOut) : 0;
};

export const convertToApiOrder = (data: MyTreeGridRowType[]): UpsertManyOrders[] => {
  return data.map((row, idx) => {
    const parentRow = data.find((r) => r.rowKey === row.parentRowKey);
    const orgData = row.orgData.data;

    let isSelfPayRate30 = false;
    let isSelfPayRate50 = false;
    let isSelfPayRate80 = false;
    let isSelfPayRate90 = false;
    let isSelfPayRate100 = false;

    if (row.orgData.type === "order-library") {
      const libraryDetail =
        orgData.category === "userCode" ? orgData.library.details?.[0] : orgData.details?.[0];
      isSelfPayRate30 = libraryDetail?.isSelfPayRate30 || false;
      isSelfPayRate50 = libraryDetail?.isSelfPayRate50 || false;
      isSelfPayRate80 = libraryDetail?.isSelfPayRate80 || false;
      isSelfPayRate90 = libraryDetail?.isSelfPayRate90 || false;
      isSelfPayRate100 = libraryDetail?.isSelfPayRate100 || false;
    }

    if (row.orgData.type === "order") {
      isSelfPayRate30 = orgData.isSelfPayRate30 || false;
      isSelfPayRate50 = orgData.isSelfPayRate50 || false;
      isSelfPayRate80 = orgData.isSelfPayRate80 || false;
      isSelfPayRate90 = orgData.isSelfPayRate90 || false;
      isSelfPayRate100 = orgData.isSelfPayRate100 || false;
    }

    // 기본값 없음 → null/undefined면 프로퍼티 제외
    const name = getNormalizedCellString(row, "name");
    const usage = getNormalizedCellString(row, "usage");
    const specification = getNormalizedCellString(row, "specification");
    const unit = getNormalizedCellString(row, "unit");
    const exceptionCode = getNormalizedCellString(row, "exceptionCode");
    const userCode = getNormalizedCellString(row, "userCode");
    const claimCode = getNormalizedCellString(row, "claimCode");
    const itemType = getNormalizedCellString(row, "itemType");
    const classificationCode = getNormalizedCellString(row, "classificationCode");
    const drugAtcCode = getNormalizedCellString(row, "drugAtcCode");
    const actualPrice = getCellValueAsNumber(row, "actualPrice");
    const incentivePrice = getCellValueAsNumber(row, "incentivePrice");
    const bundlePriceType = getCellValueAsNumber(row, "bundlePriceType");
    const bundlePrice = getCellValueAsNumber(row, "bundlePrice");
    const receiptPrintLocation = getCellValueAsNumber(row, "receiptPrintLocation");
    const userCodeId = getCellValueAsNumber(row, "userCodeId");
    const type = getCellValueAsNumber(row, "prescriptionType");
    const typePrescriptionLibraryId = getCellValueAsNumber(row, "typePrescriptionLibraryId");
    const prescriptionLibraryId = getCellValueAsNumber(row, "prescriptionLibraryId");
    const bundleItemId = getCellValueAsNumber(row, "bundleItemId");
    const parentBundleItemId = getCellValueAsNumber(row, "parentBundleItemId");

    return {
      // 수정되는 정보
      parentSortNumber: parentRow?.sortNumber ? Number(parentRow.sortNumber) : null,
      sortNumber: row.sortNumber ? Number(row.sortNumber) : idx,
      ...(name != null && { name: name as string }),
      dose: getCellValueAsNumber(row, "dose") || 0,
      days: getCellValueAsNumber(row, "days") || 0,
      times: getCellValueAsNumber(row, "times") || 0,
      ...(usage != null && { usage: usage as string }),
      ...(specification != null && { specification: specification as string }),
      ...(unit != null && { unit: unit as string }),
      ...(exceptionCode != null && { exceptionCode: exceptionCode as string }),
      specimenDetail: getSpecimenDetail(row),
      paymentMethod: getCellValueAsNumber(row, "paymentMethod") || 0,
      isSelfPayRate30: isSelfPayRate30,
      isSelfPayRate50: isSelfPayRate50,
      isSelfPayRate80: isSelfPayRate80,
      isSelfPayRate90: isSelfPayRate90,
      isSelfPayRate100: isSelfPayRate100,
      isClaim: getCellValueAsBoolean(row, "isClaim") || false,
      specificDetail: getSpecificDetail(row),
      // 수정되지 않는 정보
      ...(userCode != null && { userCode: userCode as string }),
      ...(claimCode != null && { claimCode: claimCode as string }),
      ...(itemType != null && { itemType: itemType as string }),
      ...(classificationCode != null && { classificationCode: classificationCode as string }),
      codeType: getCellValueAsNumber(row, "codeType") ?? CodeType.없음,
      oneTwoType: getCellValueAsNumber(row, "oneTwoType") || 0,
      ...(drugAtcCode != null && { drugAtcCode: drugAtcCode as string }),
      relativeValueScore: getCellValueAsNumber(row, "relativeValueScore") || 0,
      insurancePrice: getCellValueAsNumber(row, "insurancePrice") || 0,
      carInsurancePrice: 0, // 기획되진 않았으나 DB 구조상 넘겨줘야 함.
      generalPrice: getCellValueAsNumber(row, "generalPrice") || 0,
      ...(actualPrice != null && { actualPrice }),
      ...(incentivePrice != null && { incentivePrice }),
      ...(bundlePriceType != null && { bundlePriceType }),
      ...(bundlePrice != null && { bundlePrice }),
      ...(receiptPrintLocation != null && { receiptPrintLocation }),
      isPowder: getCellValueAsBoolean(row, "isPowder") || false,
      inOutType: getInOutType(row) as InOut,
      ...(userCodeId != null && { userCodeId }),
      ...(type != null && { type }),
      ...(typePrescriptionLibraryId != null && { typePrescriptionLibraryId }),
      ...(prescriptionLibraryId != null && { prescriptionLibraryId }),
      inputType: getCellValueAsNumber(row, "inputType") ?? InputType.일반,
      inputSource: getCellValueAsNumber(row, "inputSource") ?? InputSource.없음,
      ...(bundleItemId != null && { bundleItemId }),
      ...(parentBundleItemId != null && { parentBundleItemId }),
      ...(row.orgData.type === "order" &&
        row.orgData.data.id !== undefined && {
          id: row.orgData.data.id.toString(),
        }),
    };
  });
};

// ── Order[] → UpsertManyOrders[] 변환 (convertToApiOrder와 동일 필드) ──
export const convertOrderToApiOrder = (orders: Order[]): UpsertManyOrders[] => {
  return orders.map((order, idx) => {
    return {
      id: order.id,
      // 수정되는 정보
      parentSortNumber: order.parentSortNumber ?? null,
      sortNumber: order.sortNumber ?? idx,
      name: order.name,
      dose: order.dose,
      days: order.days,
      times: order.times,
      isPowder: order.isPowder,
      usage: order.usage ?? "",
      specification: order.specification ?? "",
      unit: order.unit ?? "",
      exceptionCode: order.exceptionCode ?? "",
      paymentMethod: order.paymentMethod,
      specimenDetail: order.specimenDetail ?? [],
      isSelfPayRate30: order.isSelfPayRate30 || false,
      isSelfPayRate50: order.isSelfPayRate50 || false,
      isSelfPayRate80: order.isSelfPayRate80 || false,
      isSelfPayRate90: order.isSelfPayRate90 || false,
      isSelfPayRate100: order.isSelfPayRate100 || false,
      isClaim: order.isClaim,
      specificDetail: order.specificDetail ?? [],
      // 수정되지 않는 정보
      userCode: order.userCode,
      claimCode: order.claimCode,
      classificationCode: order.classificationCode,
      itemType: order.itemType,
      codeType: order.codeType ?? CodeType.없음,
      oneTwoType: order.oneTwoType,
      inOutType: order.inOutType,
      drugAtcCode: order.drugAtcCode ?? "",
      relativeValueScore: order.relativeValueScore ?? 0,
      insurancePrice: order.insurancePrice,
      generalPrice: order.generalPrice,
      actualPrice: order.actualPrice,
      incentivePrice: order.incentivePrice,
      carInsurancePrice: order.carInsurancePrice ?? 0,
      bundlePriceType: order.bundlePriceType,
      bundlePrice: order.bundlePrice,
      receiptPrintLocation: order.receiptPrintLocation,
      userCodeId: order.userCodeId,
      type: order.type,
      typePrescriptionLibraryId: order.typePrescriptionLibraryId,
      prescriptionLibraryId: order.prescriptionLibraryId,
      inputType: order.inputType ?? InputType.일반,
      inputSource: order.inputSource ?? InputSource.없음,
      bundleItemId: order.bundleItemId,
      parentBundleItemId: order.parentBundleItemId,
    };
  });
};
