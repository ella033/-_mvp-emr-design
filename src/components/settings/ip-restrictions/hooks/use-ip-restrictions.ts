import { useState, useCallback, useEffect, useMemo } from "react";
import { ipRestrictionsApi } from "../api/ip-restrictions.api";
import type { ExemptUser, IpWhitelistEntry } from "../model";

export const useIpRestrictions = () => {
  const [whitelist, setWhitelist] = useState<IpWhitelistEntry[]>([]);
  const [exemptUsers, setExemptUsers] = useState<ExemptUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [isWhitelistLoading, setIsWhitelistLoading] = useState(false);
  const [isWhitelistMutating, setIsWhitelistMutating] = useState(false);
  const [whitelistError, setWhitelistError] = useState<string | null>(null);

  const loadWhitelist = useCallback(async () => {
    setIsWhitelistLoading(true);
    setWhitelistError(null);
    try {
      const data = await ipRestrictionsApi.getWhitelists();
      setWhitelist(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
      setWhitelist([]);
      setWhitelistError("허용 IP 목록을 불러오지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsWhitelistLoading(false);
    }
  }, []);

  const loadExemptUsers = useCallback(async () => {
    try {
      const data = await ipRestrictionsApi.getExemptUsers();
      setExemptUsers(data);
    } catch (error) {
      console.error("Failed to load exempt users", error);
    }
  }, []);

  useEffect(() => {
    void loadWhitelist();
    void loadExemptUsers();
  }, [loadWhitelist, loadExemptUsers]);

  const toggleAll = useCallback(() => {
    if (whitelist.length > 0 && selectedIds.size === whitelist.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(whitelist.map((item) => item.id)));
    }
  }, [whitelist, selectedIds]);

  const toggleRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const addWhitelist = useCallback(async (ipAddress: string, memo?: string): Promise<void> => {
    setIsWhitelistMutating(true);
    setWhitelistError(null);
    try {
      await ipRestrictionsApi.addWhitelist({ ipAddress, memo });
      await loadWhitelist();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsWhitelistMutating(false);
    }
  }, [loadWhitelist]);

  const deleteWhitelists = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsWhitelistMutating(true);
    setWhitelistError(null);
    try {
      await ipRestrictionsApi.deleteWhitelists(Array.from(selectedIds));
      await loadWhitelist();
    } catch (error) {
      console.error(error);
      setWhitelistError("선택한 IP를 삭제하지 못했어요. 다시 시도해주세요.");
      throw error;
    } finally {
      setIsWhitelistMutating(false);
    }
  }, [selectedIds, loadWhitelist]);

  const updateExemptUsers = useCallback(async (userIds: number[]) => {
    await ipRestrictionsApi.updateExemptUsers({ userIds });
    await loadExemptUsers();
  }, [loadExemptUsers]);

  const fetchPublicIp = useCallback(async (): Promise<string> => {
    try {
      const ip = await ipRestrictionsApi.getPublicIp();
      return ip;
    } catch (error) {
      console.error(error);
      throw new Error("현재 IP를 불러오지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.");
    }
  }, []);

  const hasSelection = selectedIds.size > 0;
  const allSelected = whitelist.length > 0 && selectedIds.size === whitelist.length;

  const isDeletingLastIp = useMemo(() => {
    if (!hasSelection) return false;
    return whitelist.length - selectedIds.size === 0;
  }, [hasSelection, whitelist.length, selectedIds.size]);


  return {
    whitelist,
    exemptUsers,
    selectedIds,
    isWhitelistLoading,
    isWhitelistMutating,
    whitelistError,
    hasSelection,
    allSelected,
    isDeletingLastIp,
    setWhitelistError,
    loadWhitelist,
    toggleAll,
    toggleRow,
    addWhitelist,
    deleteWhitelists,
    updateExemptUsers,
    fetchPublicIp
  };
};
