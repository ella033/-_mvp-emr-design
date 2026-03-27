"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBasicPrinterSettings } from "../../hooks/use-basic-printer-settings";
import { OutputTypeCard } from "./OutputTypeCard";

export default function BasicPrinterSettings() {
  const {
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
  } = useBasicPrinterSettings();

  return (
    <div className="self-stretch flex-1 min-h-0 bg-background rounded-[10px] outline outline-1 outline-offset-[-1px] outline-border flex flex-col overflow-hidden">
      <div className="self-stretch flex-1 h-full p-4 rounded-[10px] outline outline-1 outline-offset-[-1px] flex flex-col gap-6 overflow-auto">
        <div className="self-stretch inline-flex flex-col gap-3">
          <div className="self-stretch h-8 inline-flex justify-between items-center gap-2">
            <div className="self-stretch min-h-6 flex justify-start items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="justify-start text-foreground text-base font-bold leading-snug cursor-help">
                    기본 프린터 설정
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    개별 설정되지 않은 출력물에 적용되는 기본 프린터와 용지함을 지정합니다.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="inline-flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? "저장 중..." : hasChanges ? "저장" : "저장"}
              </Button>
            </div>
          </div>
        </div>

        {settingsError && (
          <div className="self-stretch rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {settingsError}
          </div>
        )}

        {loadingSettings && outputTypes.length === 0 && (
          <div className="text-xs text-muted-foreground">
            설정을 불러오는 중입니다...
          </div>
        )}

        {isEmptyState && (
          <div className="text-xs text-muted-foreground">
            서버에서 출력 타입 정보가 제공되지 않았습니다.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {outputTypes.map((type) => {
            const local = localSettings[type.code];
            if (!local) return null;

            const selectedPrinter = local.printerId
              ? printerMap.get(local.printerId)
              : undefined;
            const printerTrays = selectedPrinter?.capabilities?.bins ?? undefined;
            const suggestedTrays = printerTrays
              ? [...printerTrays]
              : local.paperTrayCode
                ? [local.paperTrayCode]
                : undefined;

            return (
              <OutputTypeCard
                key={type.code}
                type={type}
                local={local}
                originalHash={originalHashes[type.code]}
                printerOptions={printerOptions}
                suggestedTrays={suggestedTrays}
                onPrinterChange={handlePrinterChange}
                onTraySelect={handleTraySelect}
                onPrescriptionFormToggle={handlePrescriptionFormToggle}
                onLabelOptionUpdate={handleLabelOptionUpdate}
                onReset={handleReset}
              />
            );
          })}
        </div>
      </div>

      <Dialog open={urlModalOpen} onOpenChange={setUrlModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>출력 URL 설정</DialogTitle>
            <DialogDescription>
              출력할 파일의 URL을 입력하세요. 기본값이 설정되어 있으며 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="url"
              value={urlModalUrl}
              onChange={(e) => setUrlModalUrl(e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleUrlModalCancel}>
              취소
            </Button>
            <Button onClick={handleUrlModalConfirm} disabled={!urlModalUrl.trim()}>
              출력
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
