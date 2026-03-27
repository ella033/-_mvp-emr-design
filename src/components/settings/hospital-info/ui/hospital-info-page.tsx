"use client";

import { useEffect, useState, useCallback } from "react";
import HospitalInfoManager from "./hospital-info-manager";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import { useHospitalInfo } from "../hooks/use-hospital-info";
import { useToastHelpers } from "@/components/ui/toast";
import { useUserStore } from "@/store/user-store";

export function HospitalInfoPage() {
  const toastHelpers = useToastHelpers();
  const {
    fetchHospital,
    isLoading: hookLoading,
    error: hookError,
  } = useHospitalInfo();
  const user = useUserStore((state) => state.user);

  // Loading state handling from hook
  // We keep local 'saveFn' pattern for now as it coordinates with the child
  const [saveFn, setSaveFn] = useState<(() => Promise<boolean>) | null>(null);
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.hospitalId) {
      fetchHospital(user.hospitalId);
    }
  }, [fetchHospital, user?.hospitalId]);

  const handleSaveClick = async () => {
    if (saveFn) {
      setIsSaving(true);
      try {
        const success = await saveFn();
        if (success) {
          toastHelpers.success("저장 완료", "병원 정보가 저장되었습니다.");
        } else {
          toastHelpers.error("저장 실패", "병원 정보 저장에 실패했습니다. 입력 항목을 확인해주세요.");
        }
      } catch (error) {
        console.error("Save failed:", error);
        toastHelpers.error("저장 실패", "병원 정보 저장 중 오류가 발생했습니다.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveRequest = useCallback((fn: () => Promise<boolean>) => {
    setSaveFn(() => fn);
  }, []);

  const handleCancelRequest = useCallback((fn: () => void) => {
    setCancelFn(() => fn);
  }, []);

  return (
    <div
      className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-4 md:p-[20px] h-full overflow-hidden"
      data-testid="settings-hospital-info-page"
    >
      <SettingPageHeader
        title="병원 정보"
        tooltipContent="병원 기본 정보, 로고/직인, 공간 구성을 관리하세요."
      />

      {/* Main Content Area - Scrollable */}
      <section className="flex flex-row lg:flex-row gap-[20px] w-full min-h-0 flex-1 overflow-visible">
        {hookLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            로딩 중...
          </div>
        ) : hookError ? (
          <div className="flex items-center justify-center w-full h-full text-red-500">
            {hookError}
          </div>
        ) : (
          <HospitalInfoManager
            onSaveRequest={handleSaveRequest}
            onCancelRequest={handleCancelRequest}
            onValidationErrorsChange={setValidationErrors}
          />
        )}
      </section>

      {/* Footer Area - Fixed at bottom */}
      <div className="w-full mt-auto flex justify-end gap-3 bg-white sticky bottom-0 z-10">
        {validationErrors.length > 0 && (
          <div className="flex-1 text-sm text-red-500 flex items-center">
            * 필수 항목을 확인해주세요: {validationErrors[0]} 외{" "}
            {Math.max(0, validationErrors.length - 1)}건
          </div>
        )}
        <button
          type="button"
          data-testid="settings-hospital-info-save-button"
          onClick={handleSaveClick}
          disabled={isSaving}
          className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
