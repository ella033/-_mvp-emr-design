import { describe, it, expect } from "vitest";
import {
  PrescriptionType,
  PrescriptionSubType,
} from "@/constants/master-data-enum";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import {
  getMasterDataTitle,
  getInjectionLinkText,
  getDiseaseLinkText,
  getSpecificDetailText,
  getSpecimenDetailText,
} from "../master-data-utils";

// ================================ Helpers ================================

/** Minimal MasterDataDetailType stub with overridable fields */
function makeMasterDataDetail(
  overrides: Partial<MasterDataDetailType> = {}
): MasterDataDetailType {
  return {
    type: PrescriptionType.medical,
    subType: null,
    prescriptionLibraryDetails: [],
    prescriptionLibraryId: null,
    isActive: true,
    userCodeId: null,
    userCode: "",
    claimCode: "",
    applyDate: "",
    endDate: "",
    krName: "",
    enName: "",
    paymentMethod: 0 as any,
    isPossiblePayRate30: false,
    isPossiblePayRate50: false,
    isPossiblePayRate80: false,
    isPossiblePayRate90: false,
    isPossiblePayRate100: false,
    isNormalPrice: false,
    itemType: "",
    codeType: 0,
    receiptPrintLocation: 0 as any,
    diseaseLink: [],
    specificDetail: [],
    specimenDetail: [],
    priceDetails: [],
    isVerbal: false,
    isIncomeTaxDeductionExcluded: false,
    ...overrides,
  };
}

// ================================ getMasterDataTitle ================================

describe("getMasterDataTitle", () => {
  it("returns empty string when masterDataType is null", () => {
    expect(getMasterDataTitle(null)).toBe("");
  });

  it("returns '수가' for PrescriptionType.medical without subType", () => {
    expect(getMasterDataTitle(PrescriptionType.medical)).toBe("수가");
  });

  it("returns '약품' for PrescriptionType.drug", () => {
    expect(getMasterDataTitle(PrescriptionType.drug)).toBe("약품");
  });

  it("returns '치료재료' for PrescriptionType.material", () => {
    expect(getMasterDataTitle(PrescriptionType.material)).toBe("치료재료");
  });

  it("returns '행위' for medical + action subType", () => {
    expect(
      getMasterDataTitle(PrescriptionType.medical, PrescriptionSubType.action)
    ).toBe("행위");
  });

  it("returns '검사' for medical + examine subType", () => {
    expect(
      getMasterDataTitle(PrescriptionType.medical, PrescriptionSubType.examine)
    ).toBe("검사");
  });

  it("ignores subType for non-medical types (drug)", () => {
    expect(
      getMasterDataTitle(PrescriptionType.drug, PrescriptionSubType.action)
    ).toBe("약품");
  });

  it("ignores subType for non-medical types (material)", () => {
    expect(
      getMasterDataTitle(
        PrescriptionType.material,
        PrescriptionSubType.examine
      )
    ).toBe("치료재료");
  });

  it("returns '수가' for medical when subType is null", () => {
    expect(getMasterDataTitle(PrescriptionType.medical, null)).toBe("수가");
  });

  it("returns '수가' for medical when subType is undefined", () => {
    expect(getMasterDataTitle(PrescriptionType.medical, undefined)).toBe("수가");
  });
});

// ================================ getInjectionLinkText ================================

describe("getInjectionLinkText", () => {
  it("returns empty string when drugMasterData is undefined", () => {
    const detail = makeMasterDataDetail({ drugMasterData: undefined });
    expect(getInjectionLinkText(detail)).toBe("");
  });

  it("returns empty string when injectionLink is empty", () => {
    const detail = makeMasterDataDetail({
      drugMasterData: {
        injectionLink: [],
      } as any,
    });
    expect(getInjectionLinkText(detail)).toBe("");
  });

  it("returns single code when injectionLink has one item", () => {
    const detail = makeMasterDataDetail({
      drugMasterData: {
        injectionLink: [{ id: 1, code: "INJ001", name: "Injection A" }],
      } as any,
    });
    expect(getInjectionLinkText(detail)).toBe("INJ001");
  });

  it("returns code + count when injectionLink has multiple items", () => {
    const detail = makeMasterDataDetail({
      drugMasterData: {
        injectionLink: [
          { id: 1, code: "INJ001", name: "Injection A" },
          { id: 2, code: "INJ002", name: "Injection B" },
          { id: 3, code: "INJ003", name: "Injection C" },
        ],
      } as any,
    });
    expect(getInjectionLinkText(detail)).toBe("INJ001 외 2건");
  });
});

// ================================ getDiseaseLinkText ================================

describe("getDiseaseLinkText", () => {
  it("returns empty string when diseaseLink is empty", () => {
    const detail = makeMasterDataDetail({ diseaseLink: [] });
    expect(getDiseaseLinkText(detail)).toBe("");
  });

  it("returns single code when diseaseLink has one item", () => {
    const detail = makeMasterDataDetail({
      diseaseLink: [{ id: 1, code: "D001", name: "Disease A" }],
    });
    expect(getDiseaseLinkText(detail)).toBe("D001");
  });

  it("returns code + count when diseaseLink has multiple items", () => {
    const detail = makeMasterDataDetail({
      diseaseLink: [
        { id: 1, code: "D001", name: "Disease A" },
        { id: 2, code: "D002", name: "Disease B" },
      ],
    });
    expect(getDiseaseLinkText(detail)).toBe("D001 외 1건");
  });
});

// ================================ getSpecificDetailText ================================

describe("getSpecificDetailText", () => {
  it("returns empty string when specificDetail is empty", () => {
    const detail = makeMasterDataDetail({ specificDetail: [] });
    expect(getSpecificDetailText(detail)).toBe("");
  });

  it("returns single code when specificDetail has one item", () => {
    const detail = makeMasterDataDetail({
      specificDetail: [{ code: "SP001", name: "Spec A", content: "", type: 1 }],
    });
    expect(getSpecificDetailText(detail)).toBe("SP001");
  });

  it("returns code + count when specificDetail has multiple items", () => {
    const detail = makeMasterDataDetail({
      specificDetail: [
        { code: "SP001", name: "Spec A", content: "", type: 1 },
        { code: "SP002", name: "Spec B", content: "", type: 1 },
        { code: "SP003", name: "Spec C", content: "", type: 2 },
      ],
    });
    expect(getSpecificDetailText(detail)).toBe("SP001 외 2건");
  });
});

// ================================ getSpecimenDetailText ================================

describe("getSpecimenDetailText", () => {
  it("returns empty string when specimenDetail is empty", () => {
    const detail = makeMasterDataDetail({ specimenDetail: [] });
    expect(getSpecimenDetailText(detail)).toBe("");
  });

  it("returns code + name when specimenDetail has one item", () => {
    const detail = makeMasterDataDetail({
      specimenDetail: [{ code: "SM001", name: "Specimen A" }],
    });
    expect(getSpecimenDetailText(detail)).toBe("SM001 Specimen A");
  });

  it("returns code + name + count when specimenDetail has multiple items", () => {
    const detail = makeMasterDataDetail({
      specimenDetail: [
        { code: "SM001", name: "Specimen A" },
        { code: "SM002", name: "Specimen B" },
      ],
    });
    expect(getSpecimenDetailText(detail)).toBe("SM001 Specimen A 외 1건");
  });

  it("returns code + name + count for three items", () => {
    const detail = makeMasterDataDetail({
      specimenDetail: [
        { code: "SM001", name: "Blood" },
        { code: "SM002", name: "Urine" },
        { code: "SM003", name: "Saliva" },
      ],
    });
    expect(getSpecimenDetailText(detail)).toBe("SM001 Blood 외 2건");
  });
});
