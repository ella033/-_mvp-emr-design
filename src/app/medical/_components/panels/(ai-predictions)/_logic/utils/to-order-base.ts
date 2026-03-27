import { PrescriptionLibrariesService } from "@/services/master-data/prescription-libraries-service";
import { PrescriptionType, InOut } from "@/constants/master-data-enum";
import type { PrescriptionLibraryType } from "@/types/master-data/prescription-libraries/prescription-library-type";
import type { OrderBase } from "@/types/chart/order-types";

export const AI_TYPE_TO_PRESCRIPTION: Record<string, PrescriptionType> = {
  drug: PrescriptionType.drug,
  injection: PrescriptionType.drug,
  exam: PrescriptionType.medical,
  xray: PrescriptionType.medical,
  treatment: PrescriptionType.medical,
  material: PrescriptionType.material,
};

export function toOrderBase(lib: PrescriptionLibraryType): OrderBase {
  const detail = lib.details?.[0];
  return {
    encounterId: "",
    sortNumber: null,
    userCode: detail?.claimCode ?? "",
    claimCode: detail?.claimCode ?? "",
    name: lib.name,
    classificationCode: "",
    itemType: lib.itemType,
    codeType: lib.codeType as any,
    inOutType: InOut.Out,
    oneTwoType: detail?.oneTwoType ?? 0,
    drugAtcCode: detail?.activeIngredientCode ?? undefined,
    relativeValueScore: detail?.relativeValueScore ?? undefined,
    insurancePrice: detail?.price ?? 0,
    generalPrice: 0,
    dose: 1,
    days: 1,
    times: 1,
    isPowder: false,
    specification: lib.drugLibrary?.specification ?? lib.materialLibrary?.specification ?? "",
    unit: lib.drugLibrary?.unit ?? lib.materialLibrary?.unit ?? "",
    paymentMethod: 0,
    isClaim: true,
    isSelfPayRate30: detail?.isSelfPayRate30 ?? false,
    isSelfPayRate50: detail?.isSelfPayRate50 ?? false,
    isSelfPayRate80: detail?.isSelfPayRate80 ?? false,
    isSelfPayRate90: detail?.isSelfPayRate90 ?? false,
    isSelfPayRate100: detail?.isSelfPayRate100 ?? false,
    type: lib.type as any,
    typePrescriptionLibraryId: lib.typePrescriptionLibraryId,
    prescriptionLibraryId: lib.id,
  };
}

export async function searchAndConvert(
  items: { code?: string; name: string; type: string }[],
  prescriptionType?: PrescriptionType,
): Promise<OrderBase[]> {
  const orders: OrderBase[] = [];
  for (const item of items) {
    const keyword = item.code || item.name;
    if (!keyword) continue;

    const prescType = prescriptionType ?? AI_TYPE_TO_PRESCRIPTION[item.type] ?? PrescriptionType.medical;
    const result = await PrescriptionLibrariesService.searchPrescriptionLibraries({
      keyword,
      limit: 5,
      type: prescType,
      ...(prescriptionType === PrescriptionType.medical ? { isIncludeAssessment: "true" } : {}),
    });

    const lib = result?.items?.find(
      (r) => r.details?.[0]?.claimCode === item.code,
    ) ?? result?.items?.[0];

    if (lib) {
      orders.push(toOrderBase(lib));
    }
  }
  return orders;
}
