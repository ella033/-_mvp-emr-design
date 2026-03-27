"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LocalSetting } from "../../model/basic-printer-settings";
import { CLEAR_VALUE, shouldShowTraySelect } from "../../model/basic-printer-settings";

type Props = {
  local: LocalSetting;
  outputTypeCode: string;
  suggestedTrays: string[] | undefined;
  onTraySelect: (code: string, value: string) => void;
};

export function TrayPaperSelects({
  local,
  outputTypeCode,
  suggestedTrays,
  onTraySelect,
}: Props) {
  const showTray = shouldShowTraySelect(local.printerId, suggestedTrays);

  if (!showTray) return null;

  return (
    <div className="inline-flex w-full flex-col justify-start items-start gap-2">
      <div className="inline-flex justify-start items-start gap-1">
        <div className="justify-start text-foreground text-[13px] leading-4">용지함</div>
      </div>
      <Select
        value={local.paperTrayCode ?? CLEAR_VALUE}
        onValueChange={(value) => onTraySelect(outputTypeCode, value)}
      >
        <SelectTrigger className="h-8 w-full px-3 bg-background rounded-md outline outline-1 outline-offset-[-1px] outline-border text-foreground text-[13px]">
          <SelectValue placeholder="용지함" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR_VALUE}>미선택</SelectItem>
          {suggestedTrays?.map((tray) => (
            <SelectItem key={tray} value={tray}>
              {tray}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
