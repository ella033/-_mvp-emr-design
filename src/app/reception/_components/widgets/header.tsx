"use client";

import React from "react";

interface WidgetHeaderProps {
  title: string;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function WidgetHeader({
  title,
  left,
  center,
  right,
  icon,
}: WidgetHeaderProps) {
  return (
    <div
      className={`
      flex justify-between items-center
      w-full
      px-2
      mt-1
      flex-shrink-0
      overflow-x-auto overflow-y-hidden
    `}
    >
      <div className="flex items-center flex-nowrap">
        {icon && <span className="mr-2 flex items-center">{icon}</span>}
        <span className="text-base font-bold leading-9 align-middle">
          {title}
        </span>
        {left}
      </div>
      {center && (
        <div className="flex-1 flex justify-center items-center">{center}</div>
      )}
      {right && (
        <div className="h-full flex items-center justify-end flex-nowrap">
          {right}
        </div>
      )}
    </div>
  );
}
