"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import { useAgentPresence } from "@/contexts/SocketContext";
import type { PrinterRecord } from "@/types/printer-types";
import type { PrinterOutputTypeWithSetting } from "@/types/printer-settings";
import { printerApi } from "../api/printer.api";
import { usePrinterList } from "./use-printer-list";
import { usePrintersStore } from "@/store/printers-store";
import {
  type LocalSetting,
  type LabelOptions,
  CLEAR_VALUE,
  cloneSetting,
  serializeSetting,
  recordToLocal,
  buildDto,
  getPrinterLabel,
  getLabelOptions,
  isLabelOptionsValid,
  isLabelType,
  createTestPdfBase64,
  detectContentType,
  generateFileName,
} from "../model/basic-printer-settings";

const DEFAULT_IMAGE_URL = "http://localhost:8081/ubcare_logo.png";

export function useBasicPrinterSettings() {
  const { printers } = usePrinterList({ listenEvents: false });
  const { success, error } = useToastHelpers();
  const { currentAgentId } = useAgentPresence();

  const [outputTypes, setOutputTypes] = useState<PrinterOutputTypeWithSetting[]>([]);
  const [localSettings, setLocalSettings] = useState<Record<string, LocalSetting>>({});
  const [originalSettings, setOriginalSettings] = useState<Record<string, LocalSetting>>({});
  const [originalHashes, setOriginalHashes] = useState<Record<string, string>>({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [testingButtons, setTestingButtons] = useState<Record<string, boolean>>({});
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlModalUrl, setUrlModalUrl] = useState("");
  const [urlModalCallback, setUrlModalCallback] = useState<((url: string) => void) | null>(null);

  const printerMap = useMemo(() => {
    const map = new Map<string, PrinterRecord>();
    printers.forEach((printer) => {
      if (printer.id) map.set(printer.id, printer);
    });
    return map;
  }, [printers]);

  const printerOptions = useMemo(() => {
    const seen = new Set<string>();
    return printers
      .slice()
      .filter((p) => {
        const id = p.id ?? "";
        if (seen.has(id)) return false;
        seen.add(id);
        return id.length > 0;
      })
      .sort((a, b) => getPrinterLabel(a).localeCompare(getPrinterLabel(b)))
      .map((printer) => ({ id: printer.id!, label: getPrinterLabel(printer) }));
  }, [printers]);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    setSettingsError(null);
    try {
      const data = await printerApi.getPrinterSettings();
      const sorted = data.outputTypes
        .slice()
        .sort((a, b) => {
          if (a.sortOrder === b.sortOrder) return a.name.localeCompare(b.name);
          return a.sortOrder - b.sortOrder;
        })
        .map((type) => ({ ...type, setting: type.setting ? { ...type.setting } : null }));

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
      const message =
        err instanceof Error ? err.message : "프린터 설정을 불러올 수 없습니다.";
      setSettingsError(message);
      error("프린터 설정 불러오기 실패", <p>{message}</p>);
    } finally {
      setLoadingSettings(false);
    }
  }, [error]);

  const hasRequestedSettingsRef = useRef(false);
  useEffect(() => {
    if (hasRequestedSettingsRef.current) return;
    hasRequestedSettingsRef.current = true;
    loadSettings();
  }, [loadSettings]);

  const applySettingUpdate = useCallback(
    (code: string, updater: (current: LocalSetting) => LocalSetting) => {
      setLocalSettings((prev) => {
        const current = prev[code];
        if (!current) return prev;
        return { ...prev, [code]: updater(cloneSetting(current)) };
      });
    },
    []
  );

  const handlePrinterChange = useCallback(
    (code: string, value: string) => {
      applySettingUpdate(code, (current) => {
        const printerId = value === CLEAR_VALUE ? null : value;
        return {
          ...current,
          printerId,
          paperTrayCode: null,
          labelSizeCode: null,
        };
      });
    },
    [applySettingUpdate]
  );

  const handleTraySelect = useCallback(
    (code: string, value: string) => {
      applySettingUpdate(code, (current) => ({
        ...current,
        paperTrayCode: value === CLEAR_VALUE ? null : value,
      }));
    },
    [applySettingUpdate]
  );

  const handlePrescriptionFormToggle = useCallback(
    (code: string, checked: boolean) => {
      applySettingUpdate(code, (current) => ({
        ...current,
        usePrescriptionForm: checked,
      }));
    },
    [applySettingUpdate]
  );

  const handleLabelOptionUpdate = useCallback(
    (
      code: string,
      patch: Partial<{
        labelWidthMm: number | null;
        labelHeightMm: number | null;
        density: number;
        autoCut: boolean;
        top2bottom: boolean;
      }>
    ) => {
      applySettingUpdate(code, (current) => {
        const opts = { ...(current.options ?? {}) } as Record<string, unknown>;
        if (patch.labelWidthMm !== undefined) opts.labelWidthMm = patch.labelWidthMm;
        if (patch.labelHeightMm !== undefined) opts.labelHeightMm = patch.labelHeightMm;
        if (patch.density !== undefined) opts.density = patch.density;
        if (patch.autoCut !== undefined) opts.autoCut = patch.autoCut;
        if (patch.top2bottom !== undefined) opts.top2bottom = patch.top2bottom;
        return { ...current, options: opts };
      });
    },
    [applySettingUpdate]
  );

  const handleReset = useCallback(
    (code: string) => {
      const original = originalSettings[code];
      if (!original) return;
      setLocalSettings((prev) => ({ ...prev, [code]: cloneSetting(original) }));
    },
    [originalSettings]
  );

  const changedEntries = useMemo(() => {
    return Object.entries(localSettings).filter(([code, setting]) => {
      const baseline = originalHashes[code];
      if (!baseline) return true;
      return serializeSetting(setting) !== baseline;
    });
  }, [localSettings, originalHashes]);

  const hasChanges = changedEntries.length > 0;

  const validateLabelSettings = useCallback(
    (entries: [string, LocalSetting][]): boolean => {
      for (const [, setting] of entries) {
        if (isLabelType(setting.outputTypeCode)) {
          const opts = getLabelOptions(setting);
          if (!isLabelOptionsValid(opts)) {
            error(
              "저장 불가",
              <p>
                {setting.outputTypeCode}에는 라벨 가로(mm), 세로(mm)를 0보다 큰 숫자로 입력해야
                합니다.
              </p>
            );
            return false;
          }
        }
      }
      return true;
    },
    [error]
  );

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;
    if (!validateLabelSettings(changedEntries)) return;

    const payload = changedEntries.map(([, setting]) => buildDto(setting));
    if (payload.length === 0) return;

    setSaving(true);
    try {
      const response = await printerApi.updatePrinterDefaults(payload);
      const updatedLocals = new Map<string, LocalSetting>();
      response.settings.forEach((record) => {
        updatedLocals.set(
          record.outputTypeCode,
          recordToLocal(record, record.outputTypeCode)
        );
      });

      if (updatedLocals.size > 0) {
        setLocalSettings((prev) => {
          const next = { ...prev };
          updatedLocals.forEach((value, code) => {
            next[code] = cloneSetting(value);
          });
          return next;
        });
        setOriginalSettings((prev) => {
          const next = { ...prev };
          updatedLocals.forEach((value, code) => {
            next[code] = cloneSetting(value);
          });
          return next;
        });
        setOriginalHashes((prev) => {
          const next = { ...prev };
          updatedLocals.forEach((value, code) => {
            next[code] = serializeSetting(value);
          });
          return next;
        });
        setOutputTypes((prev) =>
          prev.map((type) => {
            const updated = updatedLocals.get(type.code);
            if (!updated) return type;
            const matchingRecord = response.settings.find(
              (record) => record.outputTypeCode === type.code
            );
            return {
              ...type,
              setting: matchingRecord ? { ...matchingRecord } : type.setting,
            };
          })
        );
      }

      // 전역 스토어 동기화: 출력 설정 및 프린터 outputTypeCodes 즉시 반영
      const store = usePrintersStore.getState();
      store.fetchOutputTypes().catch(console.error);
      store.fetchPrinters().catch(console.error);

      success("프린터 기본 설정 업데이트 완료", <p>변경사항이 저장되었습니다.</p>);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "프린터 기본 설정을 업데이트할 수 없습니다.";
      error("프린터 기본 설정 업데이트 실패", <p>{message}</p>);
    } finally {
      setSaving(false);
    }
  }, [changedEntries, error, hasChanges, success, validateLabelSettings]);

  const buildPrintPayload = useCallback(
    (
      outputTypeCode: string,
      testName: string,
      options: {
        contentUrl?: string;
        useDefaultImage?: boolean;
      }
    ) => {
      if (options.contentUrl) {
        const { contentType, extension } = detectContentType(options.contentUrl);
        return {
          outputTypeCode,
          contentType,
          fileName: generateFileName(testName, extension),
          contentUrl: options.contentUrl,
        };
      }
      if (options.useDefaultImage) {
        return {
          outputTypeCode,
          contentType: "image/webp",
          fileName: generateFileName(testName, "png"),
          contentUrl: DEFAULT_IMAGE_URL,
        };
      }
      const testPdfBase64 = createTestPdfBase64(testName);
      return {
        outputTypeCode,
        contentType: "application/pdf",
        fileName: generateFileName(testName, "pdf"),
        contentBase64: testPdfBase64,
      };
    },
    []
  );

  const handleActualPrint = useCallback(
    async (
      outputTypeCode: string,
      testName: string,
      useImageUrl?: boolean,
      contentUrl?: string
    ) => {
      setTestingButtons((prev) => ({ ...prev, [outputTypeCode]: true }));
      try {
        const payload = buildPrintPayload(outputTypeCode, testName, {
          contentUrl,
          useDefaultImage: useImageUrl && !contentUrl,
        }) as Parameters<typeof printerApi.print>[0];
        if (currentAgentId) payload.agentId = currentAgentId;
        const response = await printerApi.print(payload);
        success(
          "출력 작업 생성 완료",
          <p>{testName} 출력 작업이 생성되었습니다. (ID: {response.id})</p>
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "출력 작업 생성을 시작하지 못했습니다.";
        error("출력 작업 생성 실패", <p>{message}</p>);
      } finally {
        setTestingButtons((prev) => ({ ...prev, [outputTypeCode]: false }));
      }
    },
    [buildPrintPayload, currentAgentId, error, success]
  );

  const handleUrlModalConfirm = useCallback(() => {
    if (urlModalCallback && urlModalUrl.trim()) {
      urlModalCallback(urlModalUrl.trim());
    }
    setUrlModalOpen(false);
    setUrlModalUrl("");
    setUrlModalCallback(null);
  }, [urlModalCallback, urlModalUrl]);

  const handleUrlModalCancel = useCallback(() => {
    setUrlModalOpen(false);
    setUrlModalUrl("");
    setUrlModalCallback(null);
  }, []);

  const openUrlModal = useCallback(
    (initialUrl: string, onConfirm: (url: string) => void) => {
      setUrlModalUrl(initialUrl);
      setUrlModalCallback((url: string) => onConfirm(url));
      setUrlModalOpen(true);
    },
    []
  );

  const isEmptyState =
    !loadingSettings && settingsError === null && outputTypes.length === 0;

  return {
    outputTypes,
    localSettings,
    originalHashes,
    printerMap,
    printerOptions,
    loadingSettings,
    saving,
    settingsError,
    hasChanges,
    isEmptyState,
    serializeSetting,
    handlePrinterChange,
    handleTraySelect,
    handlePrescriptionFormToggle,
    handleLabelOptionUpdate,
    handleReset,
    handleSave,
    urlModalOpen,
    urlModalUrl,
    setUrlModalUrl,
    setUrlModalOpen,
    handleUrlModalConfirm,
    handleUrlModalCancel,
    openUrlModal,
    handleActualPrint,
  };
}
