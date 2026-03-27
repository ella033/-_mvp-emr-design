"use client";

import type { CalcResultData } from "@/types/chart/calc-result-data";
import { get본인부담금, get공단부담금, get총진료비, get비급여 } from "@/lib/calc-result-data-util";
import { toKRW } from "@/lib/patient-utils";
import { cn } from "@/lib/utils";
interface MedicalBillDetailProps {
  calcResultData: CalcResultData;
  className?: string;
}

export default function MedicalBillDetail({
  calcResultData,
  className,
}: MedicalBillDetailProps) {
  const 본인부담금 = get본인부담금(calcResultData);
  const 비급여 = get비급여(calcResultData);
  const 비급여제외본인부담금 = 본인부담금 - 비급여;

  return (
    <div className={cn("h-full my-scroll", className)}>
      <div className="border border-[var(--border-1)] rounded-[6px] flex flex-col">
        <div className="flex flex-col p-4">
          <div className="font-bold text-[14px] pb-[18px]">금액산정내용</div>
          <div className="flex flex-col gap-[12px] pb-[12px]">
            <MedicalBillDetailItem label="진료비 총액" value={get총진료비(calcResultData)} />
            <MedicalBillDetailItem label="공단부담 총액" value={get공단부담금(calcResultData)} />
          </div>
          <div className="flex flex-col gap-[12px] pt-[12px] border-t border-[var(--border-1)]">
            <MedicalBillDetailItem label="본인부담금" value={비급여제외본인부담금} />
            <MedicalBillDetailItem label="비급여" value={비급여} />
          </div>
        </div>
        <div className="flex flex-row justify-between p-[12px] gap-[24px] bg-[var(--blue-1)] rounded-b-[6px]">
          <div className="text-[14px] font-bold whitespace-nowrap">납부할 금액</div>
          <div className="text-[14px] font-bold whitespace-nowrap">{toKRW(본인부담금)}</div>
        </div>
      </div>
    </div>
  );
}

function MedicalBillDetailItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-row justify-between whitespace-nowrap gap-[24px]">
      <div className="text-[13px] font-[500] whitespace-nowrap">{label}</div>
      <div className="text-[13px] font-[700] whitespace-nowrap">{toKRW(value, false)}</div>
    </div>
  );
}
