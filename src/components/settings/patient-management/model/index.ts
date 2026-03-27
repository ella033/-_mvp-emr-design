export type BenefitType = "DISCOUNT";
export type DiscountTarget = "PAYABLE_AMOUNT" | "COPAY" | "UNINSURED";
export type DiscountUnit = "WON" | "PERCENT";

export type DiscountConfig = {
  target: DiscountTarget;
  unit: DiscountUnit;
  value: number;
};

export type Benefit = {
  id: number;
  name: string;
  type: BenefitType;
  config: DiscountConfig;
};

export type CreateBenefitRequest = {
  name: string;
  type: BenefitType;
  config: DiscountConfig;
};

export type UpdateBenefitRequest = Partial<CreateBenefitRequest>;

export type GroupBenefitSummary = {
  id: number;
  name: string;
};

export type PatientGroup = {
  id: number;
  name: string;
  benefits?: GroupBenefitSummary[];
};

export type CreatePatientGroupRequest = {
  name: string;
  benefitId?: number;
};

export type UpdatePatientGroupRequest = {
  name?: string;
  benefitId?: number | null;
};

export const DISCOUNT_TARGET_OPTIONS: Array<{
  value: DiscountTarget;
  label: string;
}> = [
  { value: "PAYABLE_AMOUNT", label: "총 진료비" },
  { value: "COPAY", label: "본인부담금" },
  { value: "UNINSURED", label: "비급여" },
];

export const DISCOUNT_UNIT_OPTIONS: Array<{
  value: DiscountUnit;
  label: string;
}> = [
  { value: "WON", label: "원" },
  { value: "PERCENT", label: "%" },
];

export const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  target: "COPAY",
  unit: "PERCENT",
  value: 10,
};
