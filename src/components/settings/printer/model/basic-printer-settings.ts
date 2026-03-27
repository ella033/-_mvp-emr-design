import type { PrinterOutputSettingRecord, PrinterSettingItemDto } from "@/types/printer-settings";
import type { PrinterRecord } from "@/types/printer-types";

/** 기본 프린터 설정 화면에서 쓰는 로컬 설정 타입 */
export type LocalSetting = {
  outputTypeCode: string;
  printerId: string | null;
  paperTrayCode: string | null;
  paperTypeCode: string | null;
  usePrescriptionForm: boolean;
  labelSizeCode: string | null;
  orientation: string | null;
  duplexMode: string | null;
  copies: number | null;
  isEnabled: boolean;
  options: Record<string, unknown> | null;
};

/** 라벨 타입(LABEL, EXAM_LABEL) 전용 options */
export type LabelOptions = {
  labelWidthMm: number | null;
  labelHeightMm: number | null;
  density: number;
  autoCut: boolean;
  top2bottom: boolean;
};

/** 라벨 옵션 기본값 (프론트 표시/저장 시 사용) */
export const DEFAULT_LABEL_OPTIONS: Pick<
  LabelOptions,
  "labelWidthMm" | "labelHeightMm" | "density" | "autoCut" | "top2bottom"
> = {
  labelWidthMm: 40,
  labelHeightMm: 25,
  density: 10,
  autoCut: true,
  top2bottom: false,
};

export const CLEAR_VALUE = "__NONE__";

export const LABEL_TYPE_CODES = ["LABEL", "EXAM_LABEL"] as const;

export function cloneSetting(setting: LocalSetting): LocalSetting {
  return {
    outputTypeCode: setting.outputTypeCode,
    printerId: setting.printerId,
    paperTrayCode: setting.paperTrayCode,
    paperTypeCode: setting.paperTypeCode,
    usePrescriptionForm: setting.usePrescriptionForm,
    labelSizeCode: setting.labelSizeCode,
    orientation: setting.orientation,
    duplexMode: setting.duplexMode,
    copies: setting.copies,
    isEnabled: setting.isEnabled,
    options: setting.options ? { ...setting.options } : null,
  };
}

export function serializeSetting(setting: LocalSetting): string {
  return JSON.stringify({
    printerId: setting.printerId ?? null,
    paperTrayCode: setting.paperTrayCode ?? null,
    paperTypeCode: setting.paperTypeCode ?? null,
    usePrescriptionForm: setting.usePrescriptionForm,
    labelSizeCode: setting.labelSizeCode ?? null,
    orientation: setting.orientation ?? null,
    duplexMode: setting.duplexMode ?? null,
    copies: setting.copies ?? null,
    isEnabled: setting.isEnabled,
    options: setting.options ?? null,
  });
}

export function recordToLocal(
  record: PrinterOutputSettingRecord | null,
  code: string
): LocalSetting {
  return {
    outputTypeCode: code,
    printerId: record?.printerId ?? null,
    paperTrayCode: record?.paperTrayCode ?? null,
    paperTypeCode: record?.paperTypeCode ?? null,
    usePrescriptionForm: record?.usePrescriptionForm ?? false,
    labelSizeCode: record?.labelSizeCode ?? null,
    orientation: record?.orientation ?? null,
    duplexMode: record?.duplexMode ?? null,
    copies:
      typeof record?.copies === "number"
        ? record?.copies
        : record?.copies === null
          ? null
          : 1,
    isEnabled: record?.isEnabled ?? true,
    options: record?.options ?? null,
  };
}

export function buildDto(setting: LocalSetting): PrinterSettingItemDto {
  let options = setting.options ?? null;
  if (isLabelType(setting.outputTypeCode)) {
    const opts = getLabelOptions(setting);
    options = {
      ...(options as Record<string, unknown>),
      labelWidthMm: opts.labelWidthMm ?? DEFAULT_LABEL_OPTIONS.labelWidthMm,
      labelHeightMm: opts.labelHeightMm ?? DEFAULT_LABEL_OPTIONS.labelHeightMm,
      density: opts.density,
      autoCut: opts.autoCut,
      top2bottom: opts.top2bottom,
    };
  }
  return {
    outputTypeCode: setting.outputTypeCode,
    printerId: setting.printerId,
    paperTrayCode: setting.paperTrayCode,
    paperTypeCode: setting.paperTypeCode,
    usePrescriptionForm: setting.usePrescriptionForm,
    labelSizeCode: setting.labelSizeCode,
    orientation: setting.orientation,
    duplexMode: setting.duplexMode,
    copies: setting.copies ?? null,
    isEnabled: setting.isEnabled,
    options,
  };
}

export function getPrinterLabel(printer: PrinterRecord): string {
  const alias = printer.displayName?.trim();
  if (alias) return `${alias} (${printer.name})`;
  return printer.name;
}

export function shouldShowTraySelect(
  printerId: string | null,
  suggestedTrays: string[] | undefined
): boolean {
  return !!printerId && !!suggestedTrays && suggestedTrays.length > 0;
}

export function isLabelType(code: string): boolean {
  return LABEL_TYPE_CODES.includes(code as (typeof LABEL_TYPE_CODES)[number]);
}

export function getLabelOptions(setting: LocalSetting): LabelOptions {
  const opts = (setting.options ?? {}) as Record<string, unknown>;
  const num = (key: string, defaultVal: number): number => {
    const v = opts[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (v != null && v !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return defaultVal;
  };
  const numOrNull = (key: string): number | null => {
    const v = opts[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (v != null && v !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
    return null;
  };
  return {
    labelWidthMm: numOrNull("labelWidthMm") ?? DEFAULT_LABEL_OPTIONS.labelWidthMm,
    labelHeightMm: numOrNull("labelHeightMm") ?? DEFAULT_LABEL_OPTIONS.labelHeightMm,
    density: num("density", DEFAULT_LABEL_OPTIONS.density),
    autoCut: opts.autoCut === false ? false : DEFAULT_LABEL_OPTIONS.autoCut,
    top2bottom: opts.top2bottom === true ? true : DEFAULT_LABEL_OPTIONS.top2bottom,
  };
}

export function isLabelOptionsValid(opts: LabelOptions): boolean {
  const w = opts.labelWidthMm ?? DEFAULT_LABEL_OPTIONS.labelWidthMm;
  const h = opts.labelHeightMm ?? DEFAULT_LABEL_OPTIONS.labelHeightMm;
  return w > 0 && h > 0;
}

/** 테스트용 최소 PDF base64 (도메인 유틸) */
export function createTestPdfBase64(testName: string): string {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(${testName} 테스트) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000315 00000 n
0000000440 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
527
%%EOF`;
  return btoa(unescape(encodeURIComponent(pdfContent)));
}

export function detectContentType(
  url: string
): { contentType: string; extension: string } {
  const urlLower = url.toLowerCase();
  if (urlLower.endsWith(".pdf")) return { contentType: "application/pdf", extension: "pdf" };
  if (urlLower.endsWith(".png")) return { contentType: "image/png", extension: "png" };
  if (urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg")) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (urlLower.endsWith(".webp")) return { contentType: "image/webp", extension: "webp" };
  return { contentType: "image/webp", extension: "webp" };
}

export function generateFileName(testName: string, extension: string): string {
  const dateStr = new Date().toISOString().split("T")[0]?.replace(/-/g, "") ?? "";
  return `${testName}-${dateStr}.${extension}`;
}
