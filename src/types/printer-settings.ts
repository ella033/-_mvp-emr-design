export interface PrinterOutputTypeInfo {
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface PrinterOutputSettingRecord {
  id: string;
  hospitalId: number;
  outputTypeCode: string;
  printerId?: string | null;
  paperTrayCode?: string | null;
  paperTypeCode?: string | null;
  usePrescriptionForm?: boolean | null;
  labelSizeCode?: string | null;
  orientation?: string | null;
  duplexMode?: string | null;
  copies: number;
  isEnabled: boolean;
  options?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrinterOutputTypeWithSetting extends PrinterOutputTypeInfo {
  setting: PrinterOutputSettingRecord | null;
}

export interface PrinterWorkstationOverrideRecord {
  id: string;
  hospitalId: number;
  outputTypeCode: string;
  agentId?: string | null;
  pcName?: string | null;
  printerId?: string | null;
  paperTrayCode?: string | null;
  paperTypeCode?: string | null;
  usePrescriptionForm?: boolean | null;
  labelSizeCode?: string | null;
  orientation?: string | null;
  duplexMode?: string | null;
  copies?: number | null;
  priority: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isEnabled: boolean;
  options?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrinterSettingsResponse {
  outputTypes: PrinterOutputTypeWithSetting[];
  overrides: PrinterWorkstationOverrideRecord[];
}

export interface UpdatePrinterDefaultsResponse {
  updated: string[];
  settings: PrinterOutputSettingRecord[];
}

export interface PrinterSettingItemDto {
  outputTypeCode: string;
  printerId?: string | null;
  paperTrayCode?: string | null;
  paperTypeCode?: string | null;
  usePrescriptionForm?: boolean | null;
  labelSizeCode?: string | null;
  orientation?: string | null;
  duplexMode?: string | null;
  copies?: number | null;
  isEnabled?: boolean;
  options?: Record<string, any> | null;
}

export interface UpdatePrinterDefaultsDto {
  items: PrinterSettingItemDto[];
}

export interface CreatePrinterWorkstationOverrideDto {
  outputTypeCode: string;
  agentId?: string | null;
  pcName?: string | null;
  printerId?: string | null;
  paperTrayCode?: string | null;
  paperTypeCode?: string | null;
  usePrescriptionForm?: boolean | null;
  labelSizeCode?: string | null;
  orientation?: string | null;
  duplexMode?: string | null;
  copies?: number | null;
  priority: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isEnabled: boolean;
  options?: Record<string, any> | null;
}

export interface UpdatePrinterWorkstationOverrideDto
  extends Partial<CreatePrinterWorkstationOverrideDto> {}

export interface DeletePrinterWorkstationOverrideResponse {
  deleted: boolean;
}
