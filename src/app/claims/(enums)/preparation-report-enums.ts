export enum PreparationType {
  Preparation = "PREPARATION",
  Manufacture = "MANUFACTURE",
}

export const PreparationTypeLabel: Record<PreparationType, string> = {
  [PreparationType.Preparation]: "조제",
  [PreparationType.Manufacture]: "제제",
};

export const PREPARATION_TYPE_OPTIONS: Array<{
  value: PreparationType;
  label: string;
}> = [
  { value: PreparationType.Preparation, label: PreparationTypeLabel[PreparationType.Preparation] },
  { value: PreparationType.Manufacture, label: PreparationTypeLabel[PreparationType.Manufacture] },
];

export enum AdministrationRoute {
  All = "ALL",
  OralMedicine = "ORAL_MEDICINE",
  ExternalMedicine = "EXTERNAL_MEDICINE",
  Injection = "INJECTION",
  MedicalSupply = "MEDICAL_SUPPLY",
}

export const AdministrationRouteLabel: Record<AdministrationRoute, string> = {
  [AdministrationRoute.All]: "전체",
  [AdministrationRoute.OralMedicine]: "내복약",
  [AdministrationRoute.ExternalMedicine]: "외용약",
  [AdministrationRoute.Injection]: "주사약",
  [AdministrationRoute.MedicalSupply]: "의료용품",
};

export const ADMINISTRATION_ROUTE_OPTIONS: Array<{
  value: AdministrationRoute;
  label: string;
}> = [
  { value: AdministrationRoute.All, label: AdministrationRouteLabel[AdministrationRoute.All] },
  { value: AdministrationRoute.OralMedicine, label: AdministrationRouteLabel[AdministrationRoute.OralMedicine] },
  { value: AdministrationRoute.ExternalMedicine, label: AdministrationRouteLabel[AdministrationRoute.ExternalMedicine] },
  { value: AdministrationRoute.Injection, label: AdministrationRouteLabel[AdministrationRoute.Injection] },
  { value: AdministrationRoute.MedicalSupply, label: AdministrationRouteLabel[AdministrationRoute.MedicalSupply] },
];

export enum CodeCategory {
  InsuredDrug = "INSURED_DRUG",
  RawMaterial = "RAW_MATERIAL",
  SelfPreparation = "SELF_PREPARATION",
}

export const CodeCategoryLabel: Record<CodeCategory, string> = {
  [CodeCategory.InsuredDrug]: "보험등재약",
  [CodeCategory.RawMaterial]: "원료약",
  [CodeCategory.SelfPreparation]: "요양기관 자체 조제,제재약",
};

export const CODE_CATEGORY_OPTIONS: Array<{
  value: CodeCategory;
  label: string;
}> = [
  { value: CodeCategory.InsuredDrug, label: CodeCategoryLabel[CodeCategory.InsuredDrug] },
  { value: CodeCategory.RawMaterial, label: CodeCategoryLabel[CodeCategory.RawMaterial] },
  { value: CodeCategory.SelfPreparation, label: CodeCategoryLabel[CodeCategory.SelfPreparation] },
];
