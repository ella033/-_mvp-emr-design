"use client";

import { highlightKeyword } from "@/components/yjg/common/util/ui-util";
import { formatNumberWithComma } from "@/lib/number-utils";
import type { MaterialSearchItem } from "@/types/claims/material-report";

const HIGHLIGHT_CLASS = "font-bold text-[var(--second-color)] bg-transparent";

type MaterialSearchResultItemProps = {
  item: MaterialSearchItem;
  searchWord: string;
};

function highlightText(text: string, searchWord: string) {
  return highlightKeyword(text, searchWord, {
    splitWords: true,
    className: HIGHLIGHT_CLASS,
  });
}

export default function MaterialSearchResultItem({
  item,
  searchWord,
}: MaterialSearchResultItemProps) {
  return (
    <div className="grid grid-cols-[28px_90px_90px_300px_72px] items-center w-full h-full text-[13px] text-[var(--gray-300)]">
      <div className="flex items-center justify-center w-[28px] h-[28px] bg-[var(--blue-1)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon/ic_line_treatment.svg"
          alt=""
          width={16}
          height={16}
        />
      </div>
      <div className="text-center truncate px-2">
        {highlightText(item.userCode, searchWord)}
      </div>
      <div className="text-center truncate px-2">
        {highlightText(item.claimCode, searchWord)}
      </div>
      <div className="truncate pl-2 pr-2">
        {highlightText(item.name, searchWord)}
      </div>
      <div className="text-right pr-2 whitespace-nowrap">
        {formatNumberWithComma(item.defaultUnitPrice)}원
      </div>
    </div>
  );
}
