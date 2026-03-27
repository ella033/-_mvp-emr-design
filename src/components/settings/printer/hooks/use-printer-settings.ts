import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { printerApi } from "../api/printer.api";
import { usePrinterList } from "./use-printer-list";
import { useAgentPresence } from "@/contexts/SocketContext";
import type {
  PrinterOutputTypeWithSetting,
  PrinterSettingItemDto,
  PrinterRecord,
  PrinterOutputSettingRecord
} from "../model";

type LocalSetting = {
  outputTypeCode: string;
  printerId: string | null;
  paperTrayCode: string | null;
  paperTypeCode: string | null;
  labelSizeCode: string | null;
  orientation: string | null;
  duplexMode: string | null;
  copies: number | null;
  isEnabled: boolean;
  options: Record<string, any> | null;
};

const CLEAR_VALUE = "__NONE__";

const cloneSetting = (setting: LocalSetting): LocalSetting => ({
  outputTypeCode: setting.outputTypeCode,
  printerId: setting.printerId,
  paperTrayCode: setting.paperTrayCode,
  paperTypeCode: setting.paperTypeCode,
  labelSizeCode: setting.labelSizeCode,
  orientation: setting.orientation,
  duplexMode: setting.duplexMode,
  copies: setting.copies,
  isEnabled: setting.isEnabled,
  options: setting.options ? { ...setting.options } : null,
});

const serializeSetting = (setting: LocalSetting): string =>
  JSON.stringify({
    printerId: setting.printerId ?? null,
    paperTrayCode: setting.paperTrayCode ?? null,
    paperTypeCode: setting.paperTypeCode ?? null,
    labelSizeCode: setting.labelSizeCode ?? null,
    orientation: setting.orientation ?? null,
    duplexMode: setting.duplexMode ?? null,
    copies: setting.copies ?? null,
    isEnabled: setting.isEnabled,
    options: setting.options ?? null,
  });

const recordToLocal = (
  record: PrinterOutputSettingRecord | null,
  code: string
): LocalSetting => ({
  outputTypeCode: code,
  printerId: record?.printerId ?? null,
  paperTrayCode: record?.paperTrayCode ?? null,
  paperTypeCode: record?.paperTypeCode ?? null,
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
});

const buildDto = (setting: LocalSetting): PrinterSettingItemDto => ({
  outputTypeCode: setting.outputTypeCode,
  printerId: setting.printerId,
  paperTrayCode: setting.paperTrayCode,
  paperTypeCode: setting.paperTypeCode,
  labelSizeCode: setting.labelSizeCode,
  orientation: setting.orientation,
  duplexMode: setting.duplexMode,
  copies: setting.copies ?? null,
  isEnabled: setting.isEnabled,
  options: setting.options ?? null,
});

export function usePrinterSettings() {
  const { currentAgentId } = useAgentPresence();
  const { printers } = usePrinterList();

  const [outputTypes, setOutputTypes] = useState<PrinterOutputTypeWithSetting[]>([]);
  const [localSettings, setLocalSettings] = useState<Record<string, LocalSetting>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, LocalSetting>>({});
  const [originalHashes, setOriginalHashes] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRequestedRef = useRef(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await printerApi.getPrinterSettings();
      const sorted = data.outputTypes
        .slice()
        .sort((a, b) => {
          if (a.sortOrder === b.sortOrder) {
            return a.name.localeCompare(b.name);
          }
          return a.sortOrder - b.sortOrder;
        })
        .map((type) => ({
          ...type,
          setting: type.setting ? { ...type.setting } : null,
        }));

      const nextLocal: Record<string, LocalSetting> = {};
      const nextOriginal: Record<string, LocalSetting> = {};
      const nextHashes: Record<string, string> = {};

      sorted.forEach((type) => {
        const local = recordToLocal(type.setting ?? null, type.code);
        nextLocal[type.code] = cloneSetting(local);
        nextOriginal[type.code] = cloneSetting(local);
        nextHashes[type.code] = serializeSetting(local);
      });

      setOutputTypes(sorted);
      setLocalSettings(nextLocal);
      setOriginalSettings(nextOriginal);
      setOriginalHashes(nextHashes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "프린터 설정을 불러올 수 없습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    loadSettings();
  }, [loadSettings]);

  const applySettingUpdate = useCallback((code: string, updater: (current: LocalSetting) => LocalSetting) => {
    setLocalSettings(prev => {
      const current = prev[code];
      if (!current) return prev;
      return {
        ...prev,
        [code]: updater(cloneSetting(current))
      };
    });
  }, []);

  const handleUpdate = useCallback((code: string, field: keyof LocalSetting, value: any) => {
    applySettingUpdate(code, (current) => {
      const updates: Partial<LocalSetting> = { [field]: value };
      if (field === 'printerId') {
        // Reset dependent fields
        updates.paperTrayCode = null;
        updates.paperTypeCode = null;
        updates.labelSizeCode = null;
      }
      if (value === CLEAR_VALUE) {
        updates[field] = null;
      }
      return { ...current, ...updates };
    });
  }, [applySettingUpdate]);

  const changedEntries = useMemo(() => {
    return Object.entries(localSettings).filter(([code, setting]) => {
      const baseline = originalHashes[code];
      if (!baseline) return true;
      return serializeSetting(setting) !== baseline;
    });
  }, [localSettings, originalHashes]);

  const hasChanges = changedEntries.length > 0;

  const saveSettings = useCallback(async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const payload = changedEntries.map(([, setting]) => buildDto(setting));
      if (payload.length === 0) return;

      const response = await printerApi.updatePrinterDefaults(payload);
      // Update local state with response
      const updatedLocals = new Map<string, LocalSetting>();
      response.settings.forEach((record) => {
        updatedLocals.set(
          record.outputTypeCode,
          recordToLocal(record, record.outputTypeCode)
        );
      });

      if (updatedLocals.size > 0) {
        setLocalSettings(prev => {
          const next = { ...prev };
          updatedLocals.forEach((val, key) => next[key] = cloneSetting(val));
          return next;
        });
        setOriginalSettings(prev => {
          const next = { ...prev };
          updatedLocals.forEach((val, key) => next[key] = cloneSetting(val));
          return next;
        });
        setOriginalHashes(prev => {
          const next = { ...prev };
          updatedLocals.forEach((val, key) => next[key] = serializeSetting(val));
          return next;
        });
      }
      return true;
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [changedEntries, hasChanges]);

  // Printer map for UI convenience
  const printerMap = useMemo(() => {
    const map = new Map<string, PrinterRecord>();
    printers.forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [printers]);

  return {
    outputTypes,
    localSettings,
    isLoading,
    isSaving,
    error,
    hasChanges,
    handleUpdate,
    saveSettings,
    loadSettings,
    printerMap,
    currentAgentId, // exposed if needed for printing
  };
}
