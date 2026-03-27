import React from "react";
import { cn } from "@/lib/utils";

interface MyDivideLineProps {
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const MyDivideLine: React.FC<MyDivideLineProps> = ({
  orientation = "horizontal",
  size = "md",
  color,
  className,
  style,
}) => {
  const sizeClasses = {
    sm: orientation === "horizontal" ? "h-[0.5px]" : "w-[0.5px]",
    md: orientation === "horizontal" ? "h-[1px]" : "w-[1px]",
    lg: orientation === "horizontal" ? "h-[1.5px]" : "w-[1.5px]",
    xl: orientation === "horizontal" ? "h-[2px]" : "w-[2px]",
  };

  const orientationClasses = {
    horizontal: "w-full",
    vertical: "h-full",
  };

  const defaultColor = "bg-[var(--border-1)]";

  return (
    <div
      className={cn(
        sizeClasses[size],
        orientationClasses[orientation],
        color || defaultColor,
        className
      )}
      style={style}
    />
  );
};

export default MyDivideLine;
