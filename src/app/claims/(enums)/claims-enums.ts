export enum FormNumber {
  H010 = "H010", // 건강보험
  H011 = "H011", // 의료급여
}

export enum TreatmentType {
  INPATIENT = "1",
  OUTPATIENT = "2",
}

export enum ClaimClassification {
  ORIGINAL = "0",
  SUPPLEMENT = "1",
  ADDITIONAL = "2",
}

export const monthsKo = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

export const formNumberToInsuranceType = (formNumber: string): string => {
  switch (formNumber) {
    case FormNumber.H010:
      return "건강보험";
    case FormNumber.H011:
      return "의료급여";
    default:
      return "기타";
  }
};

export const treatmentTypeToLabel = (treatmentType: string): string => {
  switch (treatmentType) {
    case TreatmentType.INPATIENT:
      return "입원";
    case TreatmentType.OUTPATIENT:
      return "외래";
    default:
      return "기타";
  }
};

export const claimClassificationToLabel = (classification: string): string => {
  switch (classification) {
    case ClaimClassification.ORIGINAL:
      return "원청구";
    case ClaimClassification.SUPPLEMENT:
      return "보완청구";
    case ClaimClassification.ADDITIONAL:
      return "추가청구";
    default:
      return "원청구";
  }
};

