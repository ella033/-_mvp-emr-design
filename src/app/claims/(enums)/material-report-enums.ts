export enum SendStatus {
  Draft = "DRAFT",
  Sent = "SENT",
}

export const SendStatusLabel: Record<SendStatus, string> = {
  [SendStatus.Draft]: "",
  [SendStatus.Sent]: "완료",
};

export enum PrepayType {
  None = "NONE",
  Prepay = "PREPAY",
  OverTwoYears = "OVER_TWO_YEARS",
}

export const PrepayTypeLabel: Record<PrepayType, string> = {
  [PrepayType.None]: "선택",
  [PrepayType.Prepay]: "선납품",
  [PrepayType.OverTwoYears]: "2년 경과",
};

export const PREPAY_TYPE_OPTIONS: Array<{
  value: PrepayType;
  label: string;
}> = [
  { value: PrepayType.None, label: PrepayTypeLabel[PrepayType.None] },
  { value: PrepayType.Prepay, label: PrepayTypeLabel[PrepayType.Prepay] },
  {
    value: PrepayType.OverTwoYears,
    label: PrepayTypeLabel[PrepayType.OverTwoYears],
  },
];
