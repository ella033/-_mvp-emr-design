import React, { useMemo } from "react";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import type { CheckHolidayConflictsAppointment } from "@/types/common/holiday-applications-types";

interface CheckHolidaysConflictsListProps {
  appointments: CheckHolidayConflictsAppointment[];
  isLoading?: boolean;
}

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function parseDate(value: unknown): Date | null {
  const text = safeText(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatKoDate(date: Date | null): string {
  if (!date) return "-";
  return date.toLocaleDateString("ko-KR");
}

function formatKoTime(date: Date | null): string {
  if (!date) return "-";
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const renderUnknownPayload = (item: unknown) => (
  <pre className="text-[11px] bg-[var(--bg-4)] text-[var(--text-secondary)] p-2 rounded mt-2 overflow-auto">
    {JSON.stringify(item, null, 2)}
  </pre>
);

const CheckHolidaysConflictsList: React.FC<CheckHolidaysConflictsListProps> = ({
  appointments,
  isLoading,
}) => {
  const headers: MyGridHeaderType[] = useMemo(
    () => [
      {
        key: "appointmentDate",
        name: "예약날짜",
        width: 95,
        sortNumber: 1,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentTime",
        name: "예약 시간",
        width: 110,
        sortNumber: 2,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "patientName",
        name: "환자명",
        width: 90,
        sortNumber: 3,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentRoomName",
        name: "예약실",
        width: 90,
        sortNumber: 4,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentContent",
        name: "예약내용",
        width: 180,
        sortNumber: 5,
        visible: true,
        align: "left",
        readonly: true,
      },
      {
        key: "phoneNumber",
        name: "연락처",
        width: 110,
        sortNumber: 6,
        visible: true,
        align: "center",
        readonly: true,
      },
    ],
    []
  );

  const gridRows: MyGridRowType[] = useMemo(() => {
    if (!Array.isArray(appointments)) return [];

    return appointments.map((appt, index) => {
      const start = parseDate((appt as any).appointmentStartTime);
      const end = parseDate((appt as any).appointmentEndTime);

      const patientName = safeText((appt as any).patientName) || "-";
      const appointmentRoomName = safeText((appt as any).appointmentRoomName) || "-";
      const appointmentTypeName = safeText((appt as any).appointmentTypeName);
      const memo = safeText((appt as any).memo);
      const phoneNumber = safeText((appt as any).phoneNumber) || "-";

      const contentParts = [appointmentTypeName, memo].filter(Boolean);
      const appointmentContent = contentParts.length > 0 ? contentParts.join(" / ") : "-";

      const timeText = end
        ? `${formatKoTime(start)} ~ ${formatKoTime(end)}`
        : `${formatKoTime(start)}`;

      return {
        key: (appt as any).id ?? index,
        rowIndex: index + 1,
        cells: [
          { headerKey: "appointmentDate", value: formatKoDate(start) },
          { headerKey: "appointmentTime", value: timeText },
          { headerKey: "patientName", value: patientName },
          { headerKey: "appointmentRoomName", value: appointmentRoomName },
          { headerKey: "appointmentContent", value: appointmentContent },
          { headerKey: "phoneNumber", value: phoneNumber },
        ],
      };
    });
  }, [appointments]);

  if (isLoading) {
    return <div className="text-sm text-gray-600 px-1 py-1">휴무일 충돌을 확인하는 중입니다...</div>;
  }

  if (!appointments || appointments.length === 0) {
    return <div className="text-sm text-gray-600 px-1 py-1">영향을 받는 예약이 없습니다.</div>;
  }

  // 혹시 API shape이 달라서 grid 변환이 비었을 경우, 디버깅 가능한 fallback 제공
  if (gridRows.length === 0) {
    return renderUnknownPayload(appointments);
  }

  return (
    <div className="flex flex-col gap-2 max-h-[360px] min-w-[720px] overflow-hidden px-1 py-1">
      <div className="text-sm text-gray-700">아래 예약이 설정된 휴무일과 충돌합니다.</div>
      <div className="flex-1 min-h-0">
        <MyGrid
          headers={headers}
          data={gridRows}
          multiSelect={false}
          isLoading={false}
          loadingMsg="로딩 중..."
          isError={false}
          errorMsg="오류가 발생했습니다."
        />
      </div>
    </div>
  );
};

export default CheckHolidaysConflictsList;


