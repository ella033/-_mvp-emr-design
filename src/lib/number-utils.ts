export function formatNumberWithComma(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "";
  const numericValue =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(numericValue)) return "";
  return numericValue.toLocaleString();
}

export function parseNumberInput(value: string): number {
  if (!value) return 0;
  const numericValue = Number(value.replace(/,/g, ""));
  return Number.isNaN(numericValue) ? 0 : numericValue;
}
