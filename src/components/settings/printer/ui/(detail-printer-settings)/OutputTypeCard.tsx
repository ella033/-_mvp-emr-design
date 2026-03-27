"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/settings/hospital-certificates/ui/switch";
import { Info } from "lucide-react";
import type { PrinterOutputTypeWithSetting } from "@/types/printer-settings";
import type { LocalSetting } from "../../model/basic-printer-settings";
import { CLEAR_VALUE, getLabelOptions, isLabelType, serializeSetting } from "../../model/basic-printer-settings";
import { LabelOptionsFields } from "./LabelOptionsFields";
import { TrayPaperSelects } from "./TrayPaperSelects";
import { PreviewDialog, isPreviewSupported } from "./PreviewDialog";

type PrinterOption = { id: string; label: string };

type OutputTypeCardProps = {
  type: PrinterOutputTypeWithSetting;
  local: LocalSetting;
  originalHash: string | undefined;
  printerOptions: PrinterOption[];
  suggestedTrays: string[] | undefined;
  onPrinterChange: (code: string, value: string) => void;
  onTraySelect: (code: string, value: string) => void;
  onPrescriptionFormToggle: (code: string, checked: boolean) => void;
  onLabelOptionUpdate: (
    code: string,
    patch: Partial<{
      labelWidthMm: number | null;
      labelHeightMm: number | null;
      density: number;
      autoCut: boolean;
      top2bottom: boolean;
    }>
  ) => void;
  onReset: (code: string) => void;
};

export function OutputTypeCard({
  type,
  local,
  originalHash,
  printerOptions,
  suggestedTrays,
  onPrinterChange,
  onTraySelect,
  onPrescriptionFormToggle,
  onLabelOptionUpdate,
  onReset,
}: OutputTypeCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isDirty = originalHash !== undefined && serializeSetting(local) !== originalHash;
  const showLabelFields = isLabelType(type.code);
  const showPreview = isPreviewSupported(type.code);
  const showPrescriptionFormToggle = type.code === "OUTPATIENT_RX";
  const labelOptions = showLabelFields ? getLabelOptions(local) : undefined;

  return (
    <div className="self-stretch p-3 bg-card rounded-md outline outline-1 outline-offset-[-1px] outline-border inline-flex justify-start items-start gap-8 transition-all duration-200 hover:shadow-md hover:outline-border hover:bg-accent">
      <div className="flex-1 inline-flex flex-col justify-start items-start gap-3">
        <div className="self-stretch inline-flex justify-between items-start gap-3">
          <div className="inline-flex flex-col justify-start items-start gap-1">
            <div className="inline-flex items-center gap-1.5">
              <div className="justify-start text-foreground text-[13px] font-bold leading-[16px]">
                {type.name || type.code}
              </div>
              {type.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="설명 보기"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{type.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="inline-flex items-center gap-3">
            {showPrescriptionFormToggle && (
              <div className="inline-flex items-center gap-2">
                <span className="text-xs text-muted-foreground">처방전 양식지</span>
                <Switch
                  checked={local.usePrescriptionForm}
                  onCheckedChange={(checked) =>
                    onPrescriptionFormToggle(type.code, checked === true)
                  }
                />
              </div>
            )}
            {showPreview && (
              <button
                type="button"
                className="px-3.5 py-1.5 text-sm rounded cursor-pointer"
                style={{
                  backgroundColor: "var(--main-color)",
                  color: "white",
                }}
                onClick={() => setPreviewOpen(true)}
              >
                미리보기
              </button>
            )}
            {isDirty && (
              <Button variant="outline" size="xs" onClick={() => onReset(type.code)}>
                초기화
              </Button>
            )}
          </div>
        </div>

        <div className="self-stretch grid grid-cols-2 gap-3">
          <div className="inline-flex w-full flex-col justify-start items-start gap-2">
            <div className="inline-flex justify-start items-start gap-1">
              <div className="justify-start text-foreground text-[13px] leading-4">
                프린터
              </div>
            </div>
            <Select
              value={local.printerId ?? CLEAR_VALUE}
              onValueChange={(value) => onPrinterChange(type.code, value)}
            >
              <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
                <SelectValue placeholder="미선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
                {printerOptions.map((option, index) => (
                  <SelectItem
                    key={option.id ? `${option.id}` : `printer-${index}`}
                    value={option.id}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showLabelFields ? (
            <LabelOptionsFields
              local={local}
              outputTypeCode={type.code}
              onLabelOptionUpdate={onLabelOptionUpdate}
            />
          ) : (
            <TrayPaperSelects
              local={local}
              outputTypeCode={type.code}
              suggestedTrays={suggestedTrays}
              onTraySelect={onTraySelect}
            />
          )}
        </div>
      </div>

      {showPreview && (
        <PreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          outputTypeCode={type.code}
          labelOptions={labelOptions}
        />
      )}
    </div>
  );
}
