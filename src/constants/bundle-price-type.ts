export const BUNDLE_PRICE_TYPE_OPTIONS = [
  { value: "1", label: "단가합산" },
  { value: "2", label: "직접입력" },
];

export enum BundlePriceType {
  선택없음 = 0,
  단가합산 = 1,
  직접입력 = 2,
}
