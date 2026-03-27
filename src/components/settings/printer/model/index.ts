export type * from "@/types/printer-types";
export type * from "@/types/printer-settings";

// Additional local types if needed
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
  options: Record<string, any> | null;
};

export type OverrideFormState = {
  outputTypeCode: string;
  agentId: string | null;
  pcName: string | null;
  printerId: string | null;
  paperTrayCode: string | null;
  paperTypeCode: string | null;
  usePrescriptionForm: boolean;
  labelSizeCode: string | null;
  orientation: string | null;
  duplexMode: string | null;
  copies: number | null;
  priority: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isEnabled: boolean;
  options: Record<string, any> | null;
};

export type LocalOverride = OverrideFormState & {
  id: string;
  isNew?: boolean;
};

export {
  CLEAR_VALUE,
  LABEL_TYPE_CODES,
  cloneSetting,
  serializeSetting,
  recordToLocal,
  buildDto,
  getPrinterLabel,
  shouldShowTraySelect,
  isLabelType,
  getLabelOptions,
  isLabelOptionsValid,
  createTestPdfBase64,
  detectContentType,
  generateFileName,
} from "./basic-printer-settings";
export type { LocalSetting as BasicLocalSetting, LabelOptions } from "./basic-printer-settings";  
