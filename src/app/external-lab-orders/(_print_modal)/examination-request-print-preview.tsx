"use client";

import { type ReactNode, type RefObject } from "react";
import { getZoomScale } from "./examination-request-print-utils";

interface PrintPreviewProps {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  zoomLevel: string;
  totalPages: number;
  children?: ReactNode;
}

export default function PrintPreview({
  scrollContainerRef,
  zoomLevel,
  totalPages,
  children,
}: PrintPreviewProps) {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-auto p-8 flex justify-center bg-[#525659] relative"
    >
      <div
        className="transition-transform origin-top"
        style={{
          transform: `scale(${getZoomScale(zoomLevel)})`,
        }}
      >
        {children}
      </div>

      {totalPages === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <span className="text-gray-600 font-medium">
            데이터가 없습니다.
          </span>
        </div>
      )}
    </div>
  );
}
