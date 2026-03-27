import type { ReactNode } from "react";

type SettingSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** title/description 영역과 children 영역의 정렬 */
  align?: "start" | "center" | "end";
};

/**
 * 청구 설정 각 섹션을 감싸는 공통 카드 컴포넌트
 * Figma: bg-[#f7f7f8] rounded-[6px] px-5 py-4 layout
 */
export function SettingSectionCard({
  title,
  description,
  children,
  align = "start",
}: SettingSectionCardProps) {
  return (
    <div className="flex items-start justify-between bg-[var(--bg-1)] rounded-[6px] px-5 py-4 w-full">
      {/* Label 영역 */}
      <div className="flex flex-col gap-2 items-start justify-center max-w-[270px] w-[270px] shrink-0">
        <div className="flex items-center py-1 h-6">
          <span className="font-pretendard font-bold text-[15px] leading-[1.4] tracking-[-0.15px] text-[var(--gray-200)]">
            {title}
          </span>
        </div>
        {description && (
          <p className="font-pretendard text-[13px] leading-[1.25] tracking-[-0.13px] text-[var(--gray-400)]">
            {description}
          </p>
        )}
      </div>

      {/* Content 영역 */}
      <div
        className={`flex items-${align === "center" ? "center" : align} py-1`}
      >
        {children}
      </div>
    </div>
  );
}
