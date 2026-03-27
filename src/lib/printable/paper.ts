export type PaperPreset =
  | "A4"
  | "A4_LANDSCAPE"
  | "A3"
  | "A3_LANDSCAPE"
  | "LETTER"
  | "LEGAL";

export interface PaperSize {
  name?: string;
  width: number; // in millimeters
  height: number; // in millimeters
}

export const PAPER_SIZES: Record<PaperPreset, PaperSize> = {
  A4: { name: "A4", width: 210, height: 297 },
  A4_LANDSCAPE: { name: "A4 Landscape", width: 297, height: 210 },
  A3: { name: "A3", width: 297, height: 420 },
  A3_LANDSCAPE: { name: "A3 Landscape", width: 420, height: 297 },
  LETTER: { name: "US Letter", width: 215.9, height: 279.4 },
  LEGAL: { name: "US Legal", width: 215.9, height: 355.6 },
};

export function resolvePaperSize(
  size?: PaperPreset | PaperSize,
): PaperSize {
  if (!size) {
    return PAPER_SIZES.A4;
  }

  if (typeof size === "string") {
    return PAPER_SIZES[size] ?? PAPER_SIZES.A4;
  }

  return size;
}

