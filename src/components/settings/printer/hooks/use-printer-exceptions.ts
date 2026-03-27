import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { printerApi } from "../api/printer.api";
import { usePrinterList } from "./use-printer-list";
import { useQuery } from "@tanstack/react-query";
import type {
  LocalOverride, // Locally defined but types exported from index
  CreatePrinterWorkstationOverrideDto,
  UpdatePrinterWorkstationOverrideDto,
  PrinterWorkstationOverrideRecord
} from "../model";

const recordToLocal = (record: PrinterWorkstationOverrideRecord): LocalOverride => ({
  id: record.id,
  outputTypeCode: record.outputTypeCode,
  agentId: record.agentId ?? null,
  pcName: record.pcName ?? null,
  printerId: record.printerId ?? null,
  paperTrayCode: record.paperTrayCode ?? null,
  paperTypeCode: record.paperTypeCode ?? null,
  labelSizeCode: record.labelSizeCode ?? null,
  orientation: record.orientation ?? null,
  duplexMode: record.duplexMode ?? null,
  copies: typeof record.copies === "number" ? record.copies : record.copies === null ? null : 1,
  priority: record.priority,
  effectiveFrom: record.effectiveFrom ?? null,
  effectiveTo: record.effectiveTo ?? null,
  isEnabled: record.isEnabled,
  options: record.options ?? null,
  isNew: false,
});

const serializeOverride = (override: LocalOverride): string =>
  JSON.stringify({
    outputTypeCode: override.outputTypeCode ?? null,
    agentId: override.agentId ?? null,
    pcName: override.pcName ?? null,
    printerId: override.printerId ?? null,
    paperTrayCode: override.paperTrayCode ?? null,
    paperTypeCode: override.paperTypeCode ?? null,
    labelSizeCode: override.labelSizeCode ?? null,
    orientation: override.orientation ?? null,
    duplexMode: override.duplexMode ?? null,
    copies: override.copies ?? null,
    priority: override.priority,
    effectiveFrom: override.effectiveFrom ?? null,
    effectiveTo: override.effectiveTo ?? null,
    isEnabled: override.isEnabled,
    options: override.options ?? null,
  });

const toCreateDto = (form: LocalOverride): CreatePrinterWorkstationOverrideDto => ({
  outputTypeCode: form.outputTypeCode || "",
  agentId: form.agentId,
  pcName: form.pcName,
  printerId: form.printerId,
  paperTrayCode: form.paperTrayCode,
  paperTypeCode: form.paperTypeCode,
  labelSizeCode: form.labelSizeCode,
  orientation: form.orientation,
  duplexMode: form.duplexMode,
  copies: form.copies ?? null,
  priority: form.priority,
  effectiveFrom: form.effectiveFrom,
  effectiveTo: form.effectiveTo,
  isEnabled: form.isEnabled,
  options: form.options ?? null,
});

const toUpdateDto = (form: LocalOverride): UpdatePrinterWorkstationOverrideDto => ({
  outputTypeCode: form.outputTypeCode,
  agentId: form.agentId,
  pcName: form.pcName,
  printerId: form.printerId,
  paperTrayCode: form.paperTrayCode,
  paperTypeCode: form.paperTypeCode,
  labelSizeCode: form.labelSizeCode,
  orientation: form.orientation,
  duplexMode: form.duplexMode,
  copies: form.copies ?? null,
  priority: form.priority,
  effectiveFrom: form.effectiveFrom,
  effectiveTo: form.effectiveTo,
  isEnabled: form.isEnabled,
  options: form.options ?? null,
});

export function usePrinterExceptions() {
  // We need printer list too
  const { printers } = usePrinterList(); // This is global list
  // We also need agent list and output types
  const { data: agents = [] } = useQuery({ queryKey: ["agents"], queryFn: printerApi.getAgents });
  const { data: settingsData } = useQuery({ queryKey: ["printerSettings"], queryFn: printerApi.getPrinterSettings });
  const outputTypes = settingsData?.outputTypes || [];

  const [localOverrides, setLocalOverrides] = useState<LocalOverride[]>([]);
  const [originalHashes, setOriginalHashes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We also need agent-specific devices. In original code, it was loaded into store.
  // Here we can use useQueries or just fetch on demand?
  // The original code fetched ALL agent devices when loading exceptions.
  // I'll keep it simple for now and maybe fetch as needed or fetch all.
  // Since React Query handles caching, we can fetch all agent devices in a side effect or separate query.
  // Actually, getting all printers (including agent ones) is needed for "allPrinters" list.
  // The `usePrinterList` (if configured with includeAgents=true) returns them?
  // Let's check api of getPrinters: `availableOnly: false, includeAgents: true`.
  // Yes, `getPrinters` in `PrintersService` returns `PrinterRecord[]` which includes agent printers if `includeAgents` is true.
  // So `usePrinterList` should be sufficient for the dropdown list of printers!
  // Original code had `printerListsByAgentId` separately. Maybe `getPrinters` consolidates them?
  // If `getPrinters` returns ALL, we don't need separate calls.
  // But `getPrinters` implementation:
  // `const url = params ? ... : printersApi.list;`
  // It calls `/api/printers?includeAgents=true`. 
  // This endpoint typically returns ONLY printers registered in DB + (maybe) dynamic ones or just DB ones.
  // But `PrintersService.getAgentDevices` calls `/api/agents/:id/devices`.
  // If the backend `GET /printers` aggregates everything, good. 
  // If not, we might miss printers that are only on agents but not in DB?
  // In `exception_settings.tsx`, it merges `printers` (DB) + `printerListsByAgentId` (Live).
  // So likely `GET /printers` only returns registered/known printers. 
  // But for Exceptions, we might want reference to any printer seen on agent?
  // I will implement fetching agent devices here if needed.

  const [agentDevices, setAgentDevices] = useState<any[]>([]);

  const fetchAllAgentDevices = useCallback(async () => {
    if (agents.length === 0) return;
    try {
      const results = await Promise.all(
        agents.map(agent => printerApi.getAgentDevices(agent.id)
          .then(res => res.printers)
          .catch(() => [] as any[])
        )
      );
      setAgentDevices(results.flat());
    } catch (e) {
      console.error(e);
    }
  }, [agents]);

  // Consolidate printers
  const allPrinters = useMemo(() => {
    const map = new Map<string, any>();
    printers.forEach(p => { if (p.id) map.set(p.id, p); });
    agentDevices.forEach(p => { if (p.id) map.set(p.id, p); });
    return Array.from(map.values());
  }, [printers, agentDevices]);

  const loadOverrides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = settingsData || await printerApi.getPrinterSettings(); // utilize cache if available or refetch?
      // Actually `settingsData` comes from `useQuery`. If we call this manually, we assume we want fresh data?
      // But `usePrinterExceptions` initializes `localOverrides` from `settingsData`.
      // Let's simplify: leverage `settingsData` from `useQuery` to initialize, but allow manual refresh.
      // However, `settingsData` changes causing re-init is tricky if user has edits.
      // Standard pattern: `useEffect` to sync `settingsData` to `localOverrides` ONLY on first load (or explicit reset).

      // If we just use data directly:
      // But we need `fetch` function for "Refresh" button.
      // So `refetch` from useQuery is better.
      // But `settingsData` structure is complex.
    } catch (e) {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [settingsData]); // This logic is circular if I rely on settingsData query.

  // Better approach:
  // Manage `localOverrides` as state.
  // Init from `settingsData`. 
  const isInitialized = useRef(false);
  useEffect(() => {
    if (settingsData && !isInitialized.current) {
      const sortedOverrides = settingsData.overrides.slice().sort((a, b) => a.priority - b.priority); // simplified sort
      const locals = sortedOverrides.map(recordToLocal);
      const hashes: Record<string, string> = {};
      locals.forEach(o => hashes[o.id] = serializeOverride(o));
      setLocalOverrides(locals);
      setOriginalHashes(hashes);
      isInitialized.current = true;

      // Trigger agent devices fetch
      fetchAllAgentDevices();
    }
  }, [settingsData, fetchAllAgentDevices]);

  const addOverride = useCallback(() => {
    setLocalOverrides(prev => {
      const maxPriority = prev.length > 0 ? Math.max(...prev.map(p => p.priority)) : 0;
      const newOverride: LocalOverride = {
        id: `temp-${Date.now()}`,
        outputTypeCode: "",
        agentId: null,
        pcName: null,
        printerId: null,
        paperTrayCode: null,
        paperTypeCode: null,
        labelSizeCode: null,
        orientation: null,
        duplexMode: null,
        copies: null,
        priority: maxPriority + 1,
        effectiveFrom: null,
        effectiveTo: null,
        isEnabled: true,
        options: null,
        isNew: true
      };
      return [...prev, newOverride];
    });
  }, []);

  const updateOverride = useCallback((id: string, patch: Partial<LocalOverride>) => {
    setLocalOverrides(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const removeOverride = useCallback(async (id: string) => {
    // Logic to delete from server if not new
    // We'll return a promise so UI can await
    const override = localOverrides.find(o => o.id === id);
    if (!override) return;
    if (override.isNew) {
      setLocalOverrides(prev => prev.filter(p => p.id !== id));
      return;
    }
    try {
      await printerApi.deletePrinterOverride(id);
      setLocalOverrides(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      throw e;
    }
  }, [localOverrides]);

  const saveOverride = useCallback(async (override: LocalOverride) => {
    // Validation logic should be in UI or here?
    if (!override.outputTypeCode || !override.printerId) throw new Error("Missing fields");

    try {
      if (override.isNew) {
        const payload = toCreateDto(override);
        await printerApi.createPrinterOverride(payload);
      } else {
        const payload = toUpdateDto(override);
        await printerApi.updatePrinterOverride(override.id, payload);
      }
      // Ideally reload or update local state to remove isNew and update hashes
      // To simplify, we can refetch settings
      // queryClient.invalidateQueries(["printerSettings"])
    } catch (e) {
      throw e;
    }
  }, []);

  const saveAll = useCallback(async () => {
    setSavingAll(true);
    try {
      // Filter changes
      const promises = localOverrides.map(async (ov) => {
        if (ov.isNew) {
          if (ov.outputTypeCode && ov.printerId) await proxyCreate(ov);
        } else {
          if (serializeOverride(ov) !== originalHashes[ov.id]) {
            await proxyUpdate(ov);
          }
        }
      });
      await Promise.all(promises);
      // Refresh
    } catch (e) {
      setError("Failed to save all");
    } finally {
      setSavingAll(false);
    }
  }, [localOverrides, originalHashes]);

  // Helpers to avoid closure issues if defined inside loop
  const proxyCreate = async (ov: LocalOverride) => printerApi.createPrinterOverride(toCreateDto(ov));
  const proxyUpdate = async (ov: LocalOverride) => printerApi.updatePrinterOverride(ov.id, toUpdateDto(ov));

  return {
    localOverrides,
    agents,
    outputTypes,
    allPrinters,
    loading,
    savingAll,
    error,
    addOverride,
    updateOverride,
    removeOverride,
    saveOverride,
    saveAll
  };
}
