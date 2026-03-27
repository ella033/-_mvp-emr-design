"use client";

import React, { useMemo } from "react";
import { Image } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileUploadV2Uuid } from "@/types/file-types-v2";

interface TemplatePreviewProps {
  title: string;
  content: string;
  messageSubTypeName: string;
  messageImageFileinfo?: FileUploadV2Uuid[];
  isSelected?: boolean;
  onClick?: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  title,
  content,
  messageSubTypeName,
  messageImageFileinfo,
  isSelected = false,
  onClick,
}) => {
  const byteLength = useMemo(() => {
    let bytes = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charAt(i);
      const code = char.charCodeAt(0);
      if (code > 127) {
        bytes += 2;
      } else {
        bytes += 1;
      }
    }

    return bytes;
  }, [content]);
  // 메시지 타입별 배경색
  const bgColor = useMemo(() => {
    const type = messageSubTypeName?.toUpperCase() ?? "SMS";
    if (type === "MMS") return "#FFEEED";
    if (type === "SMS") return "var(--blue-1)";
    return "var(--purple-1)";
  }, [messageSubTypeName]);

  // 메시지 타입별 텍스트 컬러
  const textColor = useMemo(() => {
    const type = messageSubTypeName?.toUpperCase() ?? "SMS";
    if (type === "MMS") return "var(--color-picker-Red-1)";
    if (type === "SMS") return "var(--info)";
    return "var(--purple-2)";
  }, [messageSubTypeName]);

  return (
    <div
      className={cn(
        "flex flex-col h-[260px] border rounded-md p-3 cursor-pointer bg-white transition-all",
        isSelected
          ? "border-[var(--main-color)] shadow-lg"
          : "border-[var(--border-1)]"
      )}
      onClick={onClick}
    >
      {/* 타이틀 */}
      <div>
        <h3 className="text-sm font-bold text-[var(--gray-100)]">{title}</h3>
      </div>

      {/* 메시지 내용 박스 */}
      <div
        className="mt-3 flex-1 flex flex-col rounded-md overflow-hidden border"
        style={{
          backgroundColor: bgColor,
          borderColor: bgColor,
        }}
      >
        {/* 메시지 내용 영역 */}
        <div className="flex-1 overflow-hidden p-4">
          <div
            className={cn(
              "w-full h-full rounded-md",
              "text-sm text-[var(--gray-200)] overflow-y-auto overflow-x-hidden",
              "whitespace-pre-wrap break-words bg-transparent"
            )}
          >
            {content || "내용이 없습니다."}
          </div>
        </div>

        {/* 하단 메시지 유형 표기 영역 */}
        <div
          className={cn(
            "flex justify-between items-center gap-2",
            "h-[20px] px-3 py-2 pb-4"
          )}
        >
          {/* 좌측: 이미지 개수 */}
          <div className="flex items-center gap-1">
            {messageImageFileinfo && messageImageFileinfo.length > 0 && (
              <>
                <Image className="w-3.5 h-3.5 text-[var(--gray-500)]" />
                <span className="text-xs text-[var(--gray-500)]">
                  +{messageImageFileinfo.length}
                </span>
              </>
            )}
          </div>

          {/* 우측: 바이트 수 및 메시지 유형 */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-right font-normal",
                "text-xs text-[var(--gray-300)]"
              )}
            >
              <span className="font-bold">{byteLength}</span> /{" "}
              {byteLength > 90 ? 2000 : 90} bytes
            </span>
            <div
              className="flex justify-center items-center rounded px-[2px] py-[2px] gap-[2px]"
              style={{
                backgroundColor: bgColor,
              }}
            >
              <span
                className="text-xs"
                style={{
                  color: textColor,
                }}
              >
                {messageSubTypeName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
