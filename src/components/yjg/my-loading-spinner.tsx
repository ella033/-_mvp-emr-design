import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "fixed" | "sm" | "md" | "lg";
  text?: string;
  className?: string;
  isFlexCol?: boolean;
}

export function MyLoadingSpinner({
  size = "md",
  text = "",
  className = "",
  isFlexCol = true,
}: LoadingProps) {
  const sizeClasses = {
    fixed: "w-[16px] h-[16px]",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    fixed: "text-[16px]",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={cn(
        `flex items-center justify-center gap-3 ${isFlexCol ? "flex-col" : "flex-row"}`,
        className
      )}
    >
      {/* 회전하는 스피너 */}
      <div className={`${sizeClasses[size]} relative`}>
        <div
          className={`${sizeClasses[size]} border-2 border-[var(--border-primary)] rounded-full`}
        />
        <div
          className={`${sizeClasses[size]} border-2 border-[var(--text-primary)] border-t-transparent rounded-full absolute top-0 left-0 animate-spin`}
        />
      </div>

      {/* 텍스트 */}
      {text && (
        <div
          className={`${textSizes[size]} text-[var(--text-secondary)] font-medium`}
        >
          {text}
        </div>
      )}
    </div>
  );
}
