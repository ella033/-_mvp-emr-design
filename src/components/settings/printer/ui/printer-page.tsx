"use client";

import AvailablePrintersPanel from "./(available)/available_printers";
import DetailPrinterSettings from "./(detail-printer-settings)/detail_printer_settings";

import { SectionLayout } from "@/components/settings/commons/section-layout";

export function PrinterPage() {
  return (
    <div className="w-full h-full">
      <SectionLayout
        className="bg-background h-full w-full border-none"
        header={
          <div className="flex items-center gap-2 h-8">
            <span className="text-foreground text-base font-bold font-['Pretendard'] leading-snug">
              프린터 설정
            </span>
          </div>
        }
        body={
          <div className="flex w-full h-full gap-6 overflow-hidden">
            <AvailablePrintersPanel />
            <DetailPrinterSettings />
          </div>
        }
      />
    </div>
  );
}
