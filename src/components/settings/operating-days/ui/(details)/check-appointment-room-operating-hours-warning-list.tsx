import React from "react";

interface CheckAppointmentRoomOperatingHoursWarningListProps {
  rooms: string[];
}

const CheckAppointmentRoomOperatingHoursWarningList: React.FC<
  CheckAppointmentRoomOperatingHoursWarningListProps
> = ({ rooms }) => {
  if (!rooms || rooms.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 max-h-[280px] min-w-[320px] overflow-auto px-1 py-1">
      <div className="text-sm text-var(--main-color) font-bold">
        변경된 진료 시간을 저장하시겠습니까?
      </div>
      <div className="text-sm text-var(--main-color)">
        진료시간 외 시간이 설정된 예약실이 있습니다.
      </div>
      <div className="border border-[var(--border-1)] bg-[var(--border-1)] rounded p-2">
        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
          {rooms.map((roomName) => (
            <li key={roomName} className="flex items-center gap-2">
              <span className="flex-1 truncate">{roomName}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="text-sm text-var(--main-color)">
        변경사항은 오늘 날짜부터 적용되며 과거 예약에는 영향을 주지 않습니다.
      </div>
    </div>
  );
};

export default CheckAppointmentRoomOperatingHoursWarningList;


