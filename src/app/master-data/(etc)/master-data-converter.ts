import { convertToISO8601, formatDate } from "@/lib/date-utils";
import type {
  MasterDataDetailType,
  PriceDetailType,
} from "@/types/master-data/master-data-detail-type";
import type {
  PrescriptionLibraryType,
  PrescriptionLibraryDetailType,
} from "@/types/master-data/prescription-libraries/prescription-library-type";
import {
  PrescriptionType,
  PrescriptionSubType,
  InOut,
  DecimalPoint,
  ConsignmentAgency,
} from "@/constants/master-data-enum";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import type { PrescriptionUserCodesUpsertType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import { PaymentMethod } from "@/constants/common/common-enum";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";
import { getPrescriptionDetailType, 처방상세구분 } from "@/types/master-data/item-type";

export const convertPrescriptionLibraryToMasterDataDetail = (
  prescriptionLibrary: PrescriptionLibraryType | null,
  subType: PrescriptionSubType | null
): MasterDataDetailType | null => {
  if (!prescriptionLibrary) return null;

  const detail = prescriptionLibrary.details[0];
  if (!detail) return null;

  const priceDetail = prescriptionLibrary.details.map((detail, index) => ({
    tempId: `temp-${index}`,
    applyDate: detail.applyDate,
    price: detail.price,
    additionalPrice: detail.additionalPrice,
    normalPrice: 0,
    actualPrice: 0,
  })) as PriceDetailType[];

  const masterData: MasterDataDetailType = {
    type: prescriptionLibrary.type,
    subType: subType,
    prescriptionLibraryId: prescriptionLibrary.typePrescriptionLibraryId,
    prescriptionLibraryDetails: prescriptionLibrary.details,
    isActive: true,
    userCodeId: null,
    userCode: detail.claimCode,
    claimCode: detail.claimCode,
    applyDate: formatDate(new Date(), "-"),
    endDate: "",
    krName: "", // 하위 타입에 따라 지정
    enName: "", // 하위 타입에 따라 지정
    paymentMethod: PaymentMethod.보험가,
    isPossiblePayRate30: detail.isSelfPayRate30,
    isPossiblePayRate50: detail.isSelfPayRate50,
    isPossiblePayRate80: detail.isSelfPayRate80,
    isPossiblePayRate90: detail.isSelfPayRate90,
    isPossiblePayRate100: detail.isSelfPayRate100,
    isNormalPrice: false,
    itemType: prescriptionLibrary.itemType,
    codeType: prescriptionLibrary.codeType,
    receiptPrintLocation: prescriptionLibrary.receiptPrintLocation,
    diseaseLink: [],
    specificDetail: [],
    specimenDetail: [],
    priceDetails: priceDetail,
    isVerbal: false,
    isIncomeTaxDeductionExcluded: false,
    isSystemExternalLab:
      prescriptionLibrary.isSystemExternalLab ||
      prescriptionLibrary.itemType === ItemTypeCode.검사료_위탁검사
        ? true
        : false,
    drugMasterData: undefined,
    medicalMasterData: undefined,
    materialMasterData: undefined,
  };

  // 타입별 데이터 설정
  switch (prescriptionLibrary.type) {
    case PrescriptionType.drug:
      if (prescriptionLibrary.drugLibrary) {
        const drugLibrary = prescriptionLibrary.drugLibrary;
        const isInjection =
          getPrescriptionDetailType(prescriptionLibrary.itemType) === 처방상세구분.주사;
        masterData.drugMasterData = {
          manufacturerName: drugLibrary.manufacturerName ?? "",
          specification: drugLibrary.specification ?? "",
          unit: drugLibrary.unit ?? "",
          activeIngredientCode: detail.activeIngredientCode ?? "",
          classificationNo: drugLibrary.classificationNo ?? "",
          inOutType: isInjection ? InOut.In : InOut.Out,
          dose: 1,
          days: 1,
          times: 1,
          usage: "",
          decimalPoint: DecimalPoint.Default,
          injectionLink: [],
          exceptionCode: isInjection ? "52" : "",
          doseCondition: [],
          administrationRoute: drugLibrary.administrationRoute ?? "",
          specializationType: drugLibrary.specializationType ?? "",
        };
      }
      masterData.krName = prescriptionLibrary.name; // 약가는 한글명만 존재
      break;
    case PrescriptionType.material:
      if (prescriptionLibrary.materialLibrary) {
        const materialLibrary = prescriptionLibrary.materialLibrary;
        masterData.materialMasterData = {
          manufacturerName: materialLibrary.manufacturerName ?? "",
          importCompany: materialLibrary.importCompany ?? "",
          material: materialLibrary.material ?? "",
          specification: materialLibrary.specification ?? "",
          unit: materialLibrary.unit ?? "",
          dose: 0,
        };
      }
      // 치료재료는 영문명, 한글명 분리되어 있지 않아 동일한 데이터 사용 (청구 시 한글명이 사용됨)
      masterData.krName = prescriptionLibrary.name;
      break;
    case PrescriptionType.medical:
      masterData.krName = prescriptionLibrary.name;
      if (prescriptionLibrary.medicalLibrary) {
        masterData.enName = prescriptionLibrary.medicalLibrary.nameEn;
      }
      masterData.medicalMasterData = {
        isAgeAdditionExcluded: false,
        isNightHolidayExcluded: false,
        consignmentAgency: ConsignmentAgency.위탁진료_없음,
        isExamResultViewExcluded: false,
        isPathologyNuclearAdditionExcluded: false,
      };
      break;
  }

  return masterData;
};

export const getPrice = (
  libraryDetails: PrescriptionLibraryDetailType[] | null | undefined,
  applyDateStr: string
): { price: number; additionalPrice: number } => {
  const details = libraryDetails ?? [];
  const applyDate = convertToISO8601(applyDateStr);

  const sortedDetails = [...details].sort((a, b) => {
    const dateA = new Date(a.applyDate);
    const dateB = new Date(b.applyDate);
    return dateB.getTime() - dateA.getTime(); // 내림차순
  });

  const detail = sortedDetails.find(
    (detail) => new Date(applyDate).getTime() >= new Date(detail.applyDate).getTime()
  );

  return { price: detail?.price ?? 0, additionalPrice: detail?.additionalPrice ?? 0 };
};

export const convertPrescriptionUserCodeToMasterDataDetail = (
  prescriptionUserCode: PrescriptionUserCodeType | null,
  subType: PrescriptionSubType | null
): MasterDataDetailType | null => {
  if (!prescriptionUserCode) return null;

  const library = prescriptionUserCode.library;
  if (!library) return null;

  // typePrescriptionLibraryId가 0이면 details가 빈 배열일 수 있으므로 옵셔널 체이닝 사용
  // 기존 동작 유지: details가 있으면 첫 번째 요소 사용, 없으면 undefined
  const detail = library.details && library.details.length > 0 ? library.details[0] : undefined;

  const masterData: MasterDataDetailType = {
    type: library.type,
    subType: subType,
    prescriptionLibraryId: library.typePrescriptionLibraryId,
    prescriptionLibraryDetails: library.details || [],
    isActive: prescriptionUserCode.isActive,
    userCodeId: prescriptionUserCode.id,
    userCode: prescriptionUserCode.code,
    claimCode: detail?.claimCode ?? "",
    applyDate: formatDate(prescriptionUserCode.applyDate, "-"),
    endDate: formatDate(prescriptionUserCode.endDate, "-"),
    krName: prescriptionUserCode.name,
    enName: prescriptionUserCode.nameEn,
    paymentMethod: prescriptionUserCode.paymentMethod,
    isPossiblePayRate30: detail?.isSelfPayRate30 ?? false,
    isPossiblePayRate50: detail?.isSelfPayRate50 ?? false,
    isPossiblePayRate80: detail?.isSelfPayRate80 ?? false,
    isPossiblePayRate90: detail?.isSelfPayRate90 ?? false,
    isPossiblePayRate100: detail?.isSelfPayRate100 ?? false,
    isNormalPrice: prescriptionUserCode.isNormalPrice,
    itemType: prescriptionUserCode.itemType,
    codeType: prescriptionUserCode.codeType,
    receiptPrintLocation: prescriptionUserCode.receiptPrintLocation,
    diseaseLink: prescriptionUserCode.diseaseLink,
    specificDetail: prescriptionUserCode.specificDetail,
    specimenDetail: prescriptionUserCode.specimenDetail ?? [],
    priceDetails: prescriptionUserCode.details.map((detail, index) => ({
      ...detail,
      price: getPrice(library.details ?? [], detail.applyDate).price,
      additionalPrice: getPrice(library.details ?? [], detail.applyDate).additionalPrice,
      tempId: `temp-${index}`,
    })),
    isVerbal: prescriptionUserCode.isVerbal,
    isIncomeTaxDeductionExcluded: prescriptionUserCode.isIncomeTaxDeductionExcluded,
    externalLabExaminationId: prescriptionUserCode.externalLabExaminationId,
    externalLabHospitalMappingId: prescriptionUserCode.externalLabHospitalMappingId,
    // externalLabExamination 객체가 있으면 그 값들을 우선 사용
    externalLabName: prescriptionUserCode.externalLabName,
    externalLabExaminationCode:
      prescriptionUserCode.externalLabExamination?.examinationCode ??
      prescriptionUserCode.externalLabExaminationCode,
    externalLabUbCode:
      prescriptionUserCode.externalLabExamination?.ubCode ?? prescriptionUserCode.externalLabUbCode,
    externalLabExaminationName:
      prescriptionUserCode.externalLabExamination?.name ??
      prescriptionUserCode.externalLabExaminationName,
    isSystemExternalLab:
      library.isSystemExternalLab || library.itemType === ItemTypeCode.검사료_위탁검사
        ? true
        : false,
  };

  // 타입별 데이터 설정
  switch (library.type) {
    case PrescriptionType.drug:
      const drugLibrary = library.drugLibrary;
      const drugUserCode = prescriptionUserCode.drugUserCode;
      masterData.drugMasterData = {
        activeIngredientCode: detail?.activeIngredientCode ?? "",
        classificationNo: drugLibrary?.classificationNo ?? "",
        inOutType: drugUserCode?.inOutType ?? InOut.Out,
        administrationRoute: drugUserCode?.administrationRoute ?? "",
        specializationType: drugUserCode?.specializationType ?? "",
        manufacturerName: drugUserCode?.manufacturerName ?? "",
        specification: drugUserCode?.specification ?? "",
        unit: drugUserCode?.unit ?? "",
        dose: drugUserCode?.dose ?? 0,
        days: drugUserCode?.days ?? 0,
        times: drugUserCode?.times ?? 0,
        usage: drugUserCode?.usage ?? "",
        decimalPoint: drugUserCode?.decimalPoint ?? DecimalPoint.Default,
        injectionLink: drugUserCode?.injectionLink ?? [],
        exceptionCode: drugUserCode?.exceptionCode ?? "",
        doseCondition: drugUserCode?.doseCondition ?? [],
      };
      if (!masterData.krName) {
        masterData.krName = library.name;
      }
      break;
    case PrescriptionType.material:
      const materialUserCode = prescriptionUserCode.materialUserCode;
      masterData.materialMasterData = {
        material: materialUserCode?.material ?? "",
        manufacturerName: materialUserCode?.manufacturerName ?? "",
        importCompany: materialUserCode?.importCompany ?? "",
        specification: materialUserCode?.specification ?? "",
        unit: materialUserCode?.unit ?? "",
        dose: materialUserCode?.dose ?? 0,
      };
      break;
    case PrescriptionType.medical:
      const medicalUserCode = prescriptionUserCode.medicalUserCode;
      masterData.medicalMasterData = {
        consignmentAgency: ConsignmentAgency.위탁진료_없음,
        isAgeAdditionExcluded: medicalUserCode?.isAgeAdditionExcluded ?? false,
        isNightHolidayExcluded: medicalUserCode?.isNightHolidayExcluded ?? false,
        isExamResultViewExcluded: medicalUserCode?.isExamResultViewExcluded ?? false,
        isPathologyNuclearAdditionExcluded:
          medicalUserCode?.isPathologyNuclearAdditionExcluded ?? false,
      };
      if (!masterData.krName) {
        masterData.krName = library.name;
      }
      if (!masterData.enName) {
        masterData.enName = library.medicalLibrary?.nameEn ?? "";
      }
      break;
  }

  return masterData;
};

export const convertMasterDataDetailToPrescriptionUserCodesUpsertType = (
  masterDataDetail: MasterDataDetailType
): PrescriptionUserCodesUpsertType | null => {
  if (!masterDataDetail) return null;

  const upsertData: PrescriptionUserCodesUpsertType = {
    type: masterDataDetail.type,
    userCodeId: masterDataDetail.userCodeId,
    typePrescriptionLibraryId: masterDataDetail.prescriptionLibraryId,
    code: masterDataDetail.userCode,
    applyDate: convertToISO8601(masterDataDetail.applyDate),
    endDate: convertToISO8601(masterDataDetail.endDate),
    paymentMethod: masterDataDetail.paymentMethod,
    isNormalPrice: masterDataDetail.isNormalPrice,
    diseaseLink: masterDataDetail.diseaseLink,
    specificDetail: masterDataDetail.specificDetail,
    specimenDetail: masterDataDetail.specimenDetail,
    receiptPrintLocation: masterDataDetail.receiptPrintLocation,
    isIncomeTaxDeductionExcluded: masterDataDetail.isIncomeTaxDeductionExcluded,
    isVerbal: masterDataDetail.isVerbal,
    isActive: masterDataDetail.isActive,
    itemType: masterDataDetail.itemType,
    codeType: masterDataDetail.codeType,
    name: masterDataDetail.krName,
    nameEn: masterDataDetail.enName,
    externalLabExaminationId: masterDataDetail.externalLabExaminationId,
    externalLabHospitalMappingId: masterDataDetail.externalLabHospitalMappingId,
    details: masterDataDetail.priceDetails?.map(
      ({ tempId, price, additionalPrice, ...detail }) => ({
        ...detail,
        applyDate: convertToISO8601(detail.applyDate),
      })
    ),
  };

  switch (masterDataDetail.type) {
    case PrescriptionType.drug:
      const drugMasterData = masterDataDetail.drugMasterData;
      upsertData.drugUserCode = {
        inOutType: drugMasterData?.inOutType ?? InOut.Out,
        dose: Number(drugMasterData?.dose ?? 1),
        days: Number(drugMasterData?.days ?? 1),
        times: Number(drugMasterData?.times ?? 1),
        usage: drugMasterData?.usage ?? "",
        decimalPoint: drugMasterData?.decimalPoint ?? DecimalPoint.Default,
        injectionLink: drugMasterData?.injectionLink ?? [],
        exceptionCode: drugMasterData?.exceptionCode ?? "",
        doseCondition: drugMasterData?.doseCondition ?? [],
        administrationRoute: drugMasterData?.administrationRoute ?? "",
        specializationType: drugMasterData?.specializationType ?? "",
        manufacturerName: drugMasterData?.manufacturerName ?? "",
        specification: drugMasterData?.specification ?? "",
        unit: drugMasterData?.unit ?? "",
      };
      break;
    case PrescriptionType.material:
      const materialMasterData = masterDataDetail.materialMasterData;
      upsertData.materialUserCode = {
        material: materialMasterData?.material ?? "",
        manufacturerName: materialMasterData?.manufacturerName ?? "",
        importCompany: materialMasterData?.importCompany ?? "",
        specification: materialMasterData?.specification ?? "",
        unit: materialMasterData?.unit ?? "",
        dose: Number(materialMasterData?.dose ?? 0),
      };
      break;
    case PrescriptionType.medical:
      const medicalMasterData = masterDataDetail.medicalMasterData;
      upsertData.medicalUserCode = {
        isAgeAdditionExcluded: medicalMasterData?.isAgeAdditionExcluded ?? false,
        isNightHolidayExcluded: medicalMasterData?.isNightHolidayExcluded ?? false,
        isExamResultViewExcluded: medicalMasterData?.isExamResultViewExcluded ?? false,
        isPathologyNuclearAdditionExcluded:
          medicalMasterData?.isPathologyNuclearAdditionExcluded ?? false,
      };
      break;
  }

  return upsertData;
};

export const getInitialMasterDataDetail = (
  type: PrescriptionType | null,
  subType: PrescriptionSubType | null,
  prescriptionLibraryId: number | null = null // 0일 경우 비급여로 판단한다.
): MasterDataDetailType => {
  var initialMasterDataDetail: MasterDataDetailType = {
    type: type,
    subType: subType,
    userCodeId: null,
    prescriptionLibraryId: prescriptionLibraryId,
    prescriptionLibraryDetails: [],
    userCode: "",
    applyDate: formatDate(new Date(), "-"),
    endDate: "",
    paymentMethod: PaymentMethod.보험가,
    isNormalPrice: false,
    diseaseLink: [],
    specificDetail: [],
    specimenDetail: [],
    receiptPrintLocation: 0,
    isIncomeTaxDeductionExcluded: false,
    isVerbal: false,
    isActive: true,
    priceDetails: [],
    isSystemExternalLab: false,
    drugMasterData: undefined,
    materialMasterData: undefined,
    medicalMasterData: undefined,

    claimCode: "",
    krName: "",
    enName: "",
    itemType: "",
    codeType: 0,
    isPossiblePayRate30: false,
    isPossiblePayRate50: false,
    isPossiblePayRate80: false,
    isPossiblePayRate90: false,
    isPossiblePayRate100: false,
  };

  switch (type) {
    case PrescriptionType.drug:
      initialMasterDataDetail.drugMasterData = {
        manufacturerName: "",
        specification: "",
        unit: "",
        activeIngredientCode: "",
        classificationNo: "",
        inOutType: InOut.Out,
        administrationRoute: "",
        specializationType: "",
        exceptionCode: "",
        decimalPoint: DecimalPoint.Default,
        dose: 0,
        times: 0,
        days: 0,
        usage: "",
        injectionLink: [],
        doseCondition: [],
      };
      break;
    case PrescriptionType.material:
      initialMasterDataDetail.materialMasterData = {
        manufacturerName: "",
        importCompany: "",
        material: "",
        specification: "",
        unit: "",
        dose: 0,
      };
      break;
    case PrescriptionType.medical:
      initialMasterDataDetail.medicalMasterData = {
        isAgeAdditionExcluded: false,
        isNightHolidayExcluded: false,
        isExamResultViewExcluded: false,
        isPathologyNuclearAdditionExcluded: false,
        consignmentAgency: ConsignmentAgency.위탁진료_없음,
      };
      break;
    default:
      break;
  }

  return initialMasterDataDetail;
};

export const getDetailHeaderText = (
  type: PrescriptionType,
  subType: PrescriptionSubType | null
) => {
  switch (type) {
    case PrescriptionType.drug:
      return "약품 상세정보";
    case PrescriptionType.material:
      return "치료재료 상세정보";
  }
  switch (subType) {
    case PrescriptionSubType.action:
      return "행위 상세정보";
    case PrescriptionSubType.examine:
      return "검사 상세정보";
  }

  return "";
};
