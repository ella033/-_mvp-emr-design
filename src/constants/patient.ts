export enum Gender {
  None = 0,
  Male = 1,
  Female = 2,
}

export const genderLabel: Record<Gender, string> = {
  [Gender.None]: "선택안함",
  [Gender.Male]: "남자",
  [Gender.Female]: "여자",
};

export enum InsuranceType {
  None = 0,
  Health = 1,
  Private = 2,
}

export const insuranceTypeLabel: Record<InsuranceType, string> = {
  [InsuranceType.None]: "선택안함",
  [InsuranceType.Health]: "건강보험",
  [InsuranceType.Private]: "실손보험",
};
