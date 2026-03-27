import React from "react";
import { cn } from "@/lib/utils";

interface TextBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  className?: string;
  /**
   * 배경색 (Tailwind 또는 HEX)
   */
  backgroundColor?: string;
  /**
   * 텍스트 색상 (Tailwind 또는 HEX)
   */
  textColor?: string;
  /**
   * 테두리 색상 (Tailwind 또는 HEX)
   */
  borderColor?: string;
}

/**
 * 텍스트 길이에 따라 width가 조정되고, 너무 길면 ...으로 말줄임 처리되는 텍스트 박스
 */
export function TextBox({
  text,
  className,
  backgroundColor = "bg-white",
  textColor = "text-[#111827]",
  borderColor = "border-[#E5E7EB]",
  style,
  ...props
}: TextBoxProps) {
  // HEX, rgb, hsl 등 직접 색상값이면 style에 적용
  const isDirectTextColor = /^#|^rgb|^hsl/.test(textColor);
  const isDirectBorderColor = /^#|^rgb|^hsl/.test(borderColor);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md border",
        backgroundColor,
        "px-1.5 py-0.5 w-fit",
        "leading-[18px] font-normal text-center",
        "whitespace-nowrap overflow-hidden text-ellipsis",
        !isDirectTextColor && textColor, // Tailwind 클래스면 className에
        !isDirectBorderColor && borderColor, // Tailwind 클래스면 className에
        className
      )}
      style={{
        maxWidth: "100%",
        minWidth: 0,
        ...(isDirectTextColor
          ? { color: textColor.replace(/^text-\[|\]$/g, "") }
          : {}),
        ...(isDirectBorderColor
          ? { borderColor: borderColor.replace(/^border-\[|\]$/g, "") }
          : {}),
        ...style,
      }}
      {...props}
    >
      {text}
    </div>
  );
}
