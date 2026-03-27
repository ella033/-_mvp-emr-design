"use client";

import { useUserStore } from "@/store/user-store";
import { useToastHelpers } from "@/components/ui/toast";
import { useClaimSettings } from "../hooks/use-claim-settings";
import { ClaimUnitSection } from "./claim-unit-section";
import { ClaimManagerSection } from "./claim-manager-section";
import { HiraPreCheckSection } from "./hira-pre-check-section";
import { InspectionApprovalSection } from "./inspection-approval-section";
import { ProxyAgencySection } from "./proxy-agency-section";
import { Button } from "@/components/ui/button";

export function ClaimSettingsPage() {
  const toastHelpers = useToastHelpers();
  const user = useUserStore((state) => state.user);

  const {
    formData,
    isLoading,
    isSaving,
    error,
    updateClaimUnit,
    updateManagerInfo,
    toggleHiraPreCheck,
    updateProxyAgency,
    saveClaimSettings,
  } = useClaimSettings(user?.hospitalId);

  const handleSave = async () => {
    const success = await saveClaimSettings();
    if (success) {
      toastHelpers.success("저장 완료", "청구 설정이 저장되었습니다.");
    } else {
      toastHelpers.error(
        "저장 실패",
        "청구 설정 저장에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-start w-full h-full">
      {/* Left Panel - 설정 폼 */}
      <div className="flex flex-col h-full w-[600px] shrink-0 justify-center">
        {/* Scrollable Content */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto bg-white px-4 py-3 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.06)]">
          <ClaimUnitSection
            claimUnit={formData.claimUnit}
            onClaimUnitChange={updateClaimUnit}
          />

          <ClaimManagerSection
            managerName={formData.claimManagerName}
            managerBirthDate={formData.claimManagerBirthDate}
            onManagerInfoChange={updateManagerInfo}
          />

          <HiraPreCheckSection
            isEnabled={formData.useHiraPreCheck}
            onToggle={toggleHiraPreCheck}
          />

          <InspectionApprovalSection
            approvalNumber={formData.inspectionApprovalNumber}
          />

          <ProxyAgencySection
            agencyName={formData.proxyAgencyName}
            agencyCode={formData.proxyAgencyCode}
            onAgencyInfoChange={updateProxyAgency}
          />
        </div>

        {/* Bottom - 저장 버튼 */}
        <div className="bg-white p-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* Right Panel - 빈 영역 */}
      <div className="flex-1 h-full min-h-0 min-w-0 border-r border-[var(--border-1)] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.06)]" />
    </div>
  );
}
