"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { LocalSetting } from "../../model/basic-printer-settings";
import { getLabelOptions } from "../../model/basic-printer-settings";

type LabelOptionPatch = Partial<{
  labelWidthMm: number | null;
  labelHeightMm: number | null;
  density: number;
  autoCut: boolean;
  top2bottom: boolean;
}>;

type Props = {
  local: LocalSetting;
  outputTypeCode: string;
  onLabelOptionUpdate: (code: string, patch: LabelOptionPatch) => void;
};

export function LabelOptionsFields({
  local,
  outputTypeCode,
  onLabelOptionUpdate,
}: Props) {
  const opts = getLabelOptions(local);

  return (
    <>
      <div className="inline-flex w-full flex-col justify-start items-start gap-2">
        <div className="justify-start text-foreground text-[13px] leading-4">
          라벨 가로 (mm) <span className="text-destructive">*</span>
        </div>
        <Input
          type="number"
          min={1}
          step={1}
          className="h-8 w-full px-3 bg-background text-[13px]"
          placeholder="예: 40"
          value={opts.labelWidthMm ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onLabelOptionUpdate(outputTypeCode, {
              labelWidthMm: v === "" ? null : Number(v) || null,
            });
          }}
        />
      </div>
      <div className="inline-flex w-full flex-col justify-start items-start gap-2">
        <div className="justify-start text-foreground text-[13px] leading-4">
          라벨 세로 (mm) <span className="text-destructive">*</span>
        </div>
        <Input
          type="number"
          min={1}
          step={1}
          className="h-8 w-full px-3 bg-background text-[13px]"
          placeholder="예: 25"
          value={opts.labelHeightMm ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onLabelOptionUpdate(outputTypeCode, {
              labelHeightMm: v === "" ? null : Number(v) || null,
            });
          }}
        />
      </div>
      <div className="inline-flex w-full flex-col justify-start items-start gap-2">
        <div className="justify-start text-foreground text-[13px] leading-4">
          인쇄 농도 (1~20)
        </div>
        <Input
          type="number"
          min={1}
          max={20}
          step={1}
          className="h-8 w-full px-3 bg-background text-[13px]"
          placeholder="10"
          value={opts.density}
          onChange={(e) => {
            const v = e.target.value;
            const n = v === "" ? 10 : Math.min(20, Math.max(1, Number(v) || 10));
            onLabelOptionUpdate(outputTypeCode, { density: n });
          }}
        />
      </div>
      <div className="inline-flex w-full flex-col justify-start items-start gap-2">
        <div className="justify-start text-foreground text-[13px] leading-4">
          자동 컷
        </div>
        <div className="flex items-center h-8">
          <Checkbox
            checked={opts.autoCut}
            onCheckedChange={(checked) =>
              onLabelOptionUpdate(outputTypeCode, { autoCut: checked === true })
            }
          />
          <span className="ml-2 text-[13px] text-muted-foreground">사용</span>
        </div>
      </div>
      <div className="inline-flex w-full flex-col justify-start items-start gap-2">
        <div className="justify-start text-foreground text-[13px] leading-4">
          위→아래 출력
        </div>
        <div className="flex items-center h-8">
          <Checkbox
            checked={opts.top2bottom}
            onCheckedChange={(checked) =>
              onLabelOptionUpdate(outputTypeCode, { top2bottom: checked === true })
            }
          />
          <span className="ml-2 text-[13px] text-muted-foreground">사용</span>
        </div>
      </div>
    </>
  );
}
