"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

export default function BottomActionBar() {
  return (
    <div className="flex h-[40px] items-center border-t border-[#C2C4C8] bg-white px-[12px] gap-[6px] shrink-0">
      {/* 좌측 - 초진/청구/주간/외래치료종결 */}
      <div className="flex items-center gap-[4px]">
        <DropdownButton label="초진" />
        <DropdownButton label="청구" />
        <DropdownButton label="주간" />
        <DropdownButton label="외래치료종결" />
      </div>

      {/* 우측 - 저장 버튼 */}
      <div className="flex items-center gap-[4px] ml-auto">
        <button className="rounded-[6px] border border-[#453EDC] bg-white px-[14px] py-[5px] text-[12px] font-bold text-[#453EDC] hover:bg-[#F1EDFF] transition-colors">
          저장
        </button>
        <button className="rounded-[6px] bg-[#453EDC] px-[14px] py-[5px] text-[12px] font-bold text-white hover:bg-[#3730B0] transition-colors">
          저장전달
        </button>
        <button className="rounded-[6px] bg-[#FF4242] px-[14px] py-[5px] text-[12px] font-bold text-white hover:bg-[#E03030] transition-colors">
          출력전달
        </button>
      </div>
    </div>
  );
}

function DropdownButton({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-[2px] rounded-[6px] border border-[#C2C4C8] bg-white px-[10px] py-[5px] text-[12px] text-[#171719] hover:bg-[#F4F4F5] transition-colors">
      <span>{label}</span>
      <ChevronDown className="h-[12px] w-[12px] text-[#989BA2]" />
    </button>
  );
}
