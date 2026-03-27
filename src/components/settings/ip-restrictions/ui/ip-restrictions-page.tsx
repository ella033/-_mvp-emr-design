"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, RefreshCcw, Trash } from "lucide-react";

import { SectionLayout } from "@/components/settings/commons/section-layout";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import MyInput from "@/components/yjg/my-input";
import { safeJsonParse, safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import { DeleteConfirmationAlert } from "./delete-confirmation-alert";
import { ExceptionManagementModal } from "./exception-management-modal";
import { IpWhitelistTable } from "./ip-whitelist-table";
import { useIpRestrictions } from "../hooks/use-ip-restrictions";

// Helper function for IP validation
const isValidIpAddress = (value: string) => {
  const ipv4 =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  const ipv6 =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}|:):|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
  return ipv4.test(value) || ipv6.test(value);
};

export function IpRestrictionsPage() {
  const {
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
    addWhitelist: addWhitelistAction,
    deleteWhitelists: deleteWhitelistsAction,
    updateExemptUsers,
    fetchPublicIp
  } = useIpRestrictions();

  const [ipAddressInput, setIpAddressInput] = useState("");
  const [memoInput, setMemoInput] = useState("");

  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [isFetchingPublicIp, setIsFetchingPublicIp] = useState(false);
  const [publicIpError, setPublicIpError] = useState<string | null>(null);
  const [addIpError, setAddIpError] = useState<string | null>(null);

  // Get Hospital ID
  const storedUser = safeJsonParse(safeLocalStorage.getItem("user"), {} as any);
  const currentHospitalId =
    storedUser?.hospitalId ??
    (storedUser?.hospitals && storedUser.hospitals[0]?.hospitalId) ?? 0;


  const handleAddIp = async (): Promise<boolean> => {
    const trimmedIp = ipAddressInput.trim();
    setAddIpError(null);
    if (!trimmedIp) {
      const message = "IP 주소를 입력해주세요.";
      setAddIpError(message);
      setWhitelistError(message);
      return false;
    }

    if (!isValidIpAddress(trimmedIp)) {
      const message = "올바른 IP 주소 형식이 아닙니다 (예: 123.456.78.90)";
      setAddIpError(message);
      setWhitelistError(message);
      return false;
    }

    if (whitelist.some((item) => item.ipAddress === trimmedIp)) {
      const message = "이미 등록된 IP 주소입니다";
      setAddIpError(message);
      setWhitelistError(message);
      return false;
    }

    try {
      await addWhitelistAction(trimmedIp, memoInput.trim() || undefined);
      setIpAddressInput("");
      setMemoInput("");
      setIsAddPopupOpen(false);
      return true;
    } catch (error) {
      // Error is handled in hook (logged), but we might want to set specific UI error here if not set by hook properly for this form
      // Hook sets whitelistError. We also want addIpError.
      setAddIpError(
        "IP를 추가하지 못했어요. 입력값을 확인하고 다시 시도해주세요."
      );
      return false;
    }
  };

  const handleDeleteClick = () => {
    if (!hasSelection) return;
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!hasSelection) return;
    try {
      await deleteWhitelistsAction();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      // Hook handles error setting
    }
  };

  const handleFetchPublicIp = async () => {
    setIsFetchingPublicIp(true);
    setPublicIpError(null);
    try {
      const ip = await fetchPublicIp();
      setIpAddressInput(ip);
    } catch (error: any) {
      setPublicIpError(error.message);
    } finally {
      setIsFetchingPublicIp(false);
    }
  };

  const handleOpenAddPopup = () => {
    setAddIpError(null);
    setPublicIpError(null);
    setIsAddPopupOpen(true);
  };

  const handleCloseAddPopup = () => {
    setIsAddPopupOpen(false);
  };

  const handleSaveExemptUsers = async (userIds: number[]) => {
    await updateExemptUsers(userIds);
  };

  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-[20px]">
      <SettingPageHeader
        title="접속 IP 관리"
        tooltipContent="병원 대표자는 모든 기능에 접근하고 관리할 수 있습니다."
      />
      <section className="flex flex-row lg:flex-row gap-[20px] w-full min-h-[500px] lg:min-h-[600px] flex-1 overflow-hidden">
        <SectionLayout
          body={
            <>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row justify-between">
                    <MyButton
                      className="h-[32px]"
                      variant="outline"
                      onClick={() => setIsExceptionModalOpen(true)}
                    >
                      예외관리
                    </MyButton>
                    <div className="flex flex-row gap-2">
                      <MyButton
                        className="h-[32px]"
                        variant="outline"
                        leftIcon={<Trash className="h-4 w-4" aria-hidden />}
                        onClick={handleDeleteClick}
                        disabled={!hasSelection || isWhitelistMutating}
                      >
                        IP 주소 삭제
                      </MyButton>
                      <MyButton
                        className="h-[32px]"
                        leftIcon={<Plus className="h-4 w-4" aria-hidden />}
                        onClick={handleOpenAddPopup}
                      >
                        IP 주소 등록
                      </MyButton>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {isWhitelistLoading
                      ? "허용 IP 목록을 불러오는 중입니다..."
                      : `등록된 IP: ${whitelist.length}건`}
                    {whitelistError && (
                      <span className="ml-2 text-red-500">
                        {whitelistError}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-h-0">
                    <div className="">
                      <IpWhitelistTable
                        rows={whitelist}
                        isLoading={isWhitelistLoading}
                        error={whitelistError}
                        allSelected={allSelected}
                        selectedIds={selectedIds}
                        onToggleAll={toggleAll}
                        onToggleRow={toggleRow}
                        onRetry={() => void loadWhitelist()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          }
        />
      </section>
      <MyPopup
        isOpen={isAddPopupOpen}
        onCloseAction={handleCloseAddPopup}
        title="IP 주소 등록"
        width="520px"
        height="auto"
        fitContent
      >
        <div className="flex flex-col gap-4 p-2 text-sm text-[var(--text-primary)]">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              공인 IP 주소
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex-1 flex items-center gap-2">
                <MyInput
                  type="text"
                  value={ipAddressInput}
                  onChange={(value) => setIpAddressInput(value)}
                  placeholder="예: 192.168.0.1 또는 IPv6"
                  className="w-full h-[32px]"
                />
                <MyButton
                  className="h-[32px]"
                  variant="outline"
                  leftIcon={<RefreshCcw className="h-4 w-4" aria-hidden />}
                  onClick={handleFetchPublicIp}
                  loading={isFetchingPublicIp}
                >
                  현재 IP 불러오기
                </MyButton>
              </div>
              {publicIpError && (
                <p className="text-xs text-red-500">{publicIpError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)]">
              메모 (선택)
            </label>
            <MyInput
              className="h-[32px]"
              type="text"
              value={memoInput}
              onChange={(value) => setMemoInput(value)}
              placeholder="메모를 작성해주세요"
            />
          </div>

          {(addIpError || whitelistError) && (
            <p className="text-sm text-red-500">
              {addIpError || whitelistError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <MyButton
              className="h-[32px]"
              variant="outline"
              onClick={handleCloseAddPopup}
            >
              취소
            </MyButton>
            <MyButton
              className="h-[32px]"
              leftIcon={
                isWhitelistMutating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )
              }
              onClick={() => {
                void handleAddIp();
              }}
              disabled={isWhitelistMutating}
            >
              {isWhitelistMutating ? "등록 중..." : "등록"}
            </MyButton>
          </div>
        </div>
      </MyPopup>

      {/* Modals */}
      <ExceptionManagementModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        hospitalId={currentHospitalId}
        initialExemptUsers={exemptUsers}
        onSave={handleSaveExemptUsers}
      />

      <DeleteConfirmationAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={() => void handleConfirmDelete()}
        isLastIp={isDeletingLastIp}
      />
    </div>
  );
}
