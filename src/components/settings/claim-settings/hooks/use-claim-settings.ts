import { useState, useCallback, useEffect } from "react";
import { claimSettingsApi } from "../api/claim-settings.api";
import {
  DEFAULT_CLAIM_SETTINGS,
  type ClaimSettings,
  type ClaimUnitType,
  type SaveClaimSettingsRequest,
} from "../model";

export const useClaimSettings = (hospitalId: number | undefined) => {
  const [settings, setSettings] = useState<ClaimSettings>(
    DEFAULT_CLAIM_SETTINGS
  );
  const [formData, setFormData] = useState<ClaimSettings>(
    DEFAULT_CLAIM_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 청구 설정 조회 */
  const fetchClaimSettings = useCallback(async () => {
    if (!hospitalId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await claimSettingsApi.getClaimSettings(hospitalId);
      setSettings(data);
      setFormData(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "청구 설정을 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalId) {
      fetchClaimSettings();
    }
  }, [hospitalId, fetchClaimSettings]);

  /** 청구 단위 변경 */
  const updateClaimUnit = useCallback((unit: ClaimUnitType) => {
    setFormData((prev) => ({
      ...prev,
      claimUnit: unit,
      weeklyUnitCode: unit === "monthly" ? undefined : prev.weeklyUnitCode,
    }));
  }, []);

  /** 주단위 구분자 변경 */
  const updateWeeklyUnitCode = useCallback((code: number) => {
    setFormData((prev) => ({ ...prev, weeklyUnitCode: code }));
  }, []);

  /** 담당자 정보 변경 */
  const updateManagerInfo = useCallback(
    (field: "claimManagerName" | "claimManagerBirthDate", value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /** HIRA 사전점검 토글 */
  const toggleHiraPreCheck = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, useHiraPreCheck: checked }));
  }, []);

  /** 대행업체 정보 변경 */
  const updateProxyAgency = useCallback(
    (field: "proxyAgencyName" | "proxyAgencyCode", value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /** 저장 */
  const saveClaimSettings = useCallback(async (): Promise<boolean> => {
    if (!hospitalId) return false;

    setIsSaving(true);
    try {
      const { inspectionApprovalNumber, ...requestData } = formData;
      const saved = await claimSettingsApi.saveClaimSettings(
        hospitalId,
        requestData as SaveClaimSettingsRequest
      );
      setSettings(saved);
      setFormData(saved);
      return true;
    } catch (err: unknown) {
      console.error("청구 설정 저장 실패:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [hospitalId, formData]);

  /** 변경사항 취소 */
  const cancelChanges = useCallback(() => {
    setFormData(settings);
  }, [settings]);

  return {
    formData,
    isLoading,
    isSaving,
    error,
    updateClaimUnit,
    updateWeeklyUnitCode,
    updateManagerInfo,
    toggleHiraPreCheck,
    updateProxyAgency,
    saveClaimSettings,
    cancelChanges,
  };
};
