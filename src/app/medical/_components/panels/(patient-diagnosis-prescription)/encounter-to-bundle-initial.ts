import type { Disease } from "@/types/chart/disease-types";
import type { Order, UpsertManyOrders } from "@/types/chart/order-types";
import type { BundleItemDisease } from "@/types/master-data/bundle/bundle-item-disease-type";
import type { BundleItemOrder } from "@/types/master-data/bundle/bundle-item-order-type";
import { InOut, PrescriptionType } from "@/constants/master-data-enum";
import type { ApiDisease } from "@/hooks/disease/use-upsert-diseases-by-encounter";

const PLACEHOLDER_BUNDLE_ITEM_ID = 0;

/**
 * convertToApiDisease 결과(ApiDisease[]) → 묶음 상세용 BundleItemDisease[] 변환
 */
export function convertApiDiseasesToBundleItemDiseases(
  apiDiseases: ApiDisease[]
): BundleItemDisease[] {
  return apiDiseases.map((d, idx) => ({
    bundleItemId: PLACEHOLDER_BUNDLE_ITEM_ID,
    diseaseId: d.diseaseLibraryId ?? 0,
    sortNumber: d.sortNumber ?? idx + 1,
    code: d.code ?? "",
    name: d.name ?? "",
    isExcluded: d.isExcluded ?? false,
    isSuspected: d.isSuspected ?? false,
    isLeftSide: d.isLeftSide ?? false,
    isRightSide: d.isRightSide ?? false,
    isSurgery: d.isSurgery ?? false,
    department: d.department ?? 0,
    specificSymbol: d.specificSymbol ?? "",
    externalCauseCode: d.externalCauseCode ?? "",
  }));
}

/**
 * convertToApiOrder 결과(UpsertManyOrders[]) → 묶음 상세용 BundleItemOrder[] 변환
 */
export function convertUpsertManyOrdersToBundleItemOrders(
  orders: UpsertManyOrders[]
): BundleItemOrder[] {
  return orders.map((o, idx) => ({
    bundleItemId: PLACEHOLDER_BUNDLE_ITEM_ID,
    userCodeId: o.userCodeId ?? null,
    prescriptionLibraryId: (o as { prescriptionLibraryId?: number }).prescriptionLibraryId ?? 0,
    typePrescriptionLibraryId: o.typePrescriptionLibraryId ?? 0,
    type: o.type ?? PrescriptionType.medical,
    sortNumber: o.sortNumber ?? idx + 1,
    userCode: o.userCode ?? "",
    claimCode: o.claimCode ?? "",
    name: o.name ?? "",
    itemType: o.itemType ?? o.classificationCode ?? "",
    drugAtcCode: o.drugAtcCode ?? "",
    dose: o.dose ?? 0,
    days: o.days ?? 0,
    times: o.times ?? 0,
    usage: o.usage ?? "",
    specification: o.specification ?? "",
    unit: o.unit ?? "",
    exceptionCode: o.exceptionCode ?? "",
    paymentMethod: o.paymentMethod ?? 0,
    isClaim: o.isClaim ?? false,
    isPowder: o.isPowder ?? false,
    inOutType: (o.inOutType ?? InOut.Out) as InOut,
    specificDetail: o.specificDetail ?? [],
    specimenDetail: o.specimenDetail ?? [],
  }));
}

/**
 * 진단 및 처방 패널의 Disease[] → 묶음 상세용 BundleItemDisease[] 변환 (신규 묶음 초기값)
 */
export function convertEncounterDiseasesToBundleItemDiseases(
  diseases: Disease[]
): BundleItemDisease[] {
  return diseases.map((d, idx) => ({
    bundleItemId: PLACEHOLDER_BUNDLE_ITEM_ID,
    diseaseId: d.diseaseLibraryId ?? 0,
    sortNumber: idx + 1,
    code: d.code ?? "",
    name: d.name ?? "",
    isExcluded: d.isExcluded ?? false,
    isSuspected: d.isSuspected ?? false,
    isLeftSide: d.isLeftSide ?? false,
    isRightSide: d.isRightSide ?? false,
    isSurgery: d.isSurgery ?? false,
    department: d.department ?? 0,
    specificSymbol: d.specificSymbol ?? "",
    externalCauseCode: d.externalCauseCode ?? "",
  }));
}

/**
 * 진단 및 처방 패널의 Order[] → 묶음 상세용 BundleItemOrder[] 변환 (신규 묶음 초기값)
 */
export function convertEncounterOrdersToBundleItemOrders(
  orders: Order[]
): BundleItemOrder[] {
  return orders.map((o, idx) => ({
    bundleItemId: PLACEHOLDER_BUNDLE_ITEM_ID,
    userCodeId: o.userCodeId ?? null,
    prescriptionLibraryId: o.prescriptionLibraryId ?? 0,
    typePrescriptionLibraryId: o.typePrescriptionLibraryId ?? 0,
    type: o.type ?? PrescriptionType.medical,
    sortNumber: idx + 1,
    userCode: o.userCode ?? "",
    claimCode: o.claimCode ?? "",
    name: o.name ?? "",
    itemType: o.itemType ?? o.classificationCode ?? "",
    drugAtcCode: o.drugAtcCode ?? "",
    dose: o.dose ?? 0,
    days: o.days ?? 0,
    times: o.times ?? 0,
    usage: o.usage ?? "",
    specification: o.specification ?? "",
    unit: o.unit ?? "",
    exceptionCode: o.exceptionCode ?? "",
    paymentMethod: o.paymentMethod ?? 0,
    isClaim: o.isClaim ?? false,
    isPowder: o.isPowder ?? false,
    inOutType: (o.inOutType ?? InOut.Out) as InOut,
    specificDetail: o.specificDetail ?? [],
    specimenDetail: o.specimenDetail ?? [],
  }));
}
