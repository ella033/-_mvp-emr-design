import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import type { ExternalLabExamination } from "./external-lab-examination-types";
import {
  PrescriptionType,
  PrescriptionSubType,
  ConsignmentAgency,
} from "@/constants/master-data-enum";
import { PaymentMethod } from "@/constants/common/common-enum";
import { formatDate } from "@/lib/date-utils";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";
import { CodeType, ReceiptPrintLocation } from "@/constants/common/common-enum";
import { MOCK_SPECIMEN_LIBRARIES } from "@/mocks/examination-label/mock-data";

export function convertExternalLabExaminationToMasterDataDetail(
  examination: ExternalLabExamination
): MasterDataDetailType {
  const prescriptionLibrary = examination.prescriptionLibrary;
  const prescriptionLibraryDetail = examination.prescriptionLibraryDetail;

  // 기본 MasterDataDetailType 구조 생성
  const masterData: MasterDataDetailType = {
    type: PrescriptionType.medical,
    subType: PrescriptionSubType.examine,
    prescriptionLibraryId: prescriptionLibrary?.typePrescriptionLibraryId ?? null,
    prescriptionLibraryDetails: prescriptionLibraryDetail
      ? [
          {
            type: prescriptionLibraryDetail.type,
            typePrescriptionLibraryId: prescriptionLibraryDetail.typePrescriptionLibraryId,
            applyDate: prescriptionLibraryDetail.applyDate,
            claimCode: prescriptionLibraryDetail.claimCode,
            price: prescriptionLibraryDetail.price,
            isSelfPayRate30: prescriptionLibraryDetail.isSelfPayRate30,
            isSelfPayRate50: prescriptionLibraryDetail.isSelfPayRate50,
            isSelfPayRate80: prescriptionLibraryDetail.isSelfPayRate80,
            isSelfPayRate90: prescriptionLibraryDetail.isSelfPayRate90,
            isSelfPayRate100: prescriptionLibraryDetail.isSelfPayRate100,
            oneTwoType: prescriptionLibraryDetail.oneTwoType,
            relativeValueScore: Number(prescriptionLibraryDetail.relativeValueScore ?? 0),
            salaryStandard: prescriptionLibraryDetail.salaryStandard
              ? typeof prescriptionLibraryDetail.salaryStandard === "string"
                ? Number(prescriptionLibraryDetail.salaryStandard)
                : prescriptionLibraryDetail.salaryStandard
              : null,
            additionalPrice: prescriptionLibraryDetail.additionalPrice,
            activeIngredientCode: prescriptionLibraryDetail.activeIngredientCode,
            withdrawalPrevention: prescriptionLibraryDetail.withdrawalPrevention,
          },
        ]
      : [],
    isActive: true,
    userCodeId: null,
    userCode: examination.claimCode || "",
    claimCode: examination.claimCode || "",
    applyDate: prescriptionLibraryDetail
      ? formatDate(prescriptionLibraryDetail.applyDate, "-")
      : formatDate(new Date(), "-"),
    endDate: "",
    krName: examination.name,
    enName: examination.ename,
    // 청구코드가 없으면 보험가비급여 + 일반가, 있으면 보험가
    paymentMethod:
      examination.claimCode && examination.claimCode.trim() !== "" && prescriptionLibrary
        ? PaymentMethod.보험가
        : PaymentMethod.보험가비급여,
    isPossiblePayRate30: prescriptionLibraryDetail?.isSelfPayRate30 ?? false,
    isPossiblePayRate50: prescriptionLibraryDetail?.isSelfPayRate50 ?? false,
    isPossiblePayRate80: prescriptionLibraryDetail?.isSelfPayRate80 ?? false,
    isPossiblePayRate90: prescriptionLibraryDetail?.isSelfPayRate90 ?? false,
    isPossiblePayRate100: prescriptionLibraryDetail?.isSelfPayRate100 ?? false,
    // 청구코드가 없으면 일반가 true, 있으면 false
    isNormalPrice: !(
      examination.claimCode &&
      examination.claimCode.trim() !== "" &&
      prescriptionLibrary
    ),
    itemType: ItemTypeCode.검사료_위탁검사,
    codeType: prescriptionLibrary?.codeType ?? CodeType.수가,
    receiptPrintLocation: prescriptionLibrary?.receiptPrintLocation ?? ReceiptPrintLocation.마취료,
    diseaseLink: [],
    specificDetail: [],
    specimenDetail: (() => {
      if (!examination.spcCode) return [];
      const matched = MOCK_SPECIMEN_LIBRARIES.find((item) => item.code === examination.spcCode);
      return matched
        ? [{ code: matched.code, name: matched.name }]
        : [{ code: examination.spcCode, name: examination.spcName }];
    })(),
    priceDetails: prescriptionLibraryDetail
      ? [
          {
            tempId: "temp-0",
            applyDate: prescriptionLibraryDetail.applyDate,
            price: prescriptionLibraryDetail.price,
            additionalPrice: prescriptionLibraryDetail.additionalPrice ?? 0,
            normalPrice: 0,
            actualPrice: 0,
          },
        ]
      : [],
    isIncomeTaxDeductionExcluded: false,
    isVerbal: false,
    externalLabExaminationId: examination.id,
    externalLabName: examination.library.name, // 수탁기관
    externalLabExaminationCode: examination.examinationCode, // 수탁사코드
    externalLabUbCode: examination.ubCode, // 표준코드
    externalLabExaminationName: examination.name, // 수탁사 검사 명칭
    // isSystemExternalLab은 handleExaminationSelect에서 설정됨
    medicalMasterData: {
      isAgeAdditionExcluded: false,
      isNightHolidayExcluded: false,
      consignmentAgency: ConsignmentAgency.위탁진료_없음,
      isExamResultViewExcluded: false,
      isPathologyNuclearAdditionExcluded: false,
    },
  };

  return masterData;
}
