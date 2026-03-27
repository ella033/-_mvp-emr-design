import { HolidayType } from "@/constants/common/common-enum";
import React from "react";

interface HolidayCardProps {
  holiday?: any;
  currentDate?: Date;
  style?: React.CSSProperties;
  className?: string;
}

export const HolidayCard: React.FC<HolidayCardProps> = ({
  holiday,
  currentDate,
  style,
  className = "",
}) => {
  return (
    <div
      className={`absolute inset-0 z-15 flex items-center justify-center bg-[var(--bg-1)] ${className}`}
      style={style}
    >
      <div className="text-center text-gray-500">
        {holiday ? (
          <>
            <div className="text-red-500 font-medium text-lg">
              {holiday.holidayName}
            </div>
            <div className="text-sm mt-1">
              {" "}
              {"휴무일입니다"}
            </div>
          </>
        ) : currentDate ? (
          <>
            <div className="font-medium text-lg">
              {currentDate.toLocaleDateString("ko-KR", { weekday: "long" })}
            </div>
            <div className="text-sm mt-1">휴진일입니다</div>
          </>
        ) : null}
      </div>
    </div>
  );
};
