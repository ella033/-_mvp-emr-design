import type { Registration } from "@/types/registration-types";
import clsx from "clsx";
import { useState, useEffect } from "react";
import {
  접수상태,
  접수상태Label,
} from "@/constants/common/common-enum";

const STATUS_COLOR_MAP: Record<string, string> = {
  [접수상태.보류]: "border-gray-400 text-gray-400 bg-gray-50",
  [접수상태.취소]: "border-gray-300 text-gray-300 bg-gray-50",
  [접수상태.수납대기]: "border-[#FFB800] text-[#FFB800]",
  [접수상태.대기]: "border-[#333] text-[#333] bg-white",
  [접수상태.진료중]: "border-[#5395FF] text-[#5395FF]",
  [접수상태.수납완료]: "border-green-500 text-green-500 bg-green-50",
};

export default function StatusBadge({
  registration,
}: {
  registration: Registration;
}) {
  const status = registration.status || 접수상태.대기;
  const colorClass = STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[접수상태.대기];
  const [waitingMinutes, setWaitingMinutes] = useState<number>(0);

  useEffect(() => {
    if (status !== 접수상태.대기 || !registration.receptionDateTime) {
      setWaitingMinutes(0);
      return;
    }

    const calculateWaitingTime = () => {
      if (!registration.receptionDateTime) return;
      const createdTime = new Date(registration.receptionDateTime);
      const currentTime = new Date();
      const diffInMs = currentTime.getTime() - createdTime.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      setWaitingMinutes(diffInMinutes);
    };

    calculateWaitingTime();
    const interval = setInterval(calculateWaitingTime, 30000);

    return () => clearInterval(interval);
  }, [status, registration.receptionDateTime]);

  const getDisplayText = () => {
    if (status === 접수상태.대기) {
      return waitingMinutes > 0 ? `${waitingMinutes}분` : "1분미만";
    }
    return 접수상태Label[status as unknown as keyof typeof 접수상태Label];
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-center px-2 py-1 rounded-sm border text-xs",
        colorClass
      )}
    >
      <span>{getDisplayText()}</span>
    </div>
  );
}
