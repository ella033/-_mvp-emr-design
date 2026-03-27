import { cn } from "@/components/yjg/common/util/ui-util";
import * as React from "react";

export interface MyTreeGridRowContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const MyTreeGridRowContainer = React.forwardRef<
  HTMLDivElement,
  MyTreeGridRowContainerProps
>(({ className, children, onContextMenu, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-nowrap w-full select-none", className)}
      style={{
        minWidth: "max-content",
      }}
      onContextMenu={(e) => {
        onContextMenu?.(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
});

export const MsgContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center w-full h-full sticky bottom-0 left-0 right-0">
      {children}
    </div>
  );
};

export const LoadingMore = () => {
  return (
    <div
      className="flex items-center justify-center py-[5px] opacity-70"
      style={{
        backgroundColor: "var(--grid-bg)",
        minWidth: "max-content",
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      <div
        className="flex items-center gap-[10px]"
        style={{ color: "var(--grid-text)" }}
      >
        <div className="animate-spin rounded-full h-[12px] w-[12px] border-2 border-current border-t-transparent"></div>
        <span className="text-[12px]">불러오는 중입니다...</span>
      </div>
    </div>
  );
};
