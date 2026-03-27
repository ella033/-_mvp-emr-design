import React, { useMemo } from "react";
import { formatTime, isSameDay } from "@/lib/reservation-utils";
import { formatDate } from "@/lib/date-utils";
import type { HospitalSchedule, AppointmentRoom } from "@/types/calendar-types";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { AppointmentStatus } from "@/constants/common/common-enum";
import { useAppointmentPage } from "@/hooks/appointment/use-appointment-page";
import { useTimeSlot } from "@/hooks/appointment-contents-panel/use-time-slot";
import { findHospitalHolidayInfoFromDate } from "@/lib/holiday-utils";
import { useMyGridHeaders } from "@/components/yjg/my-grid/use-my-grid-headers";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { formatRrn } from "@/lib/patient-utils";

// 타입 정의
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  appointmentRoomId: number;
  status: number;
  isSimplePatient: boolean;
  patientId?: number;
  originalData?: any;
}

interface CalendarProps {
  events: CalendarEvent[];
  hospitalSchedules: HospitalSchedule;
  onTimeSlotClick?: (date: Date, time: { start: string; end: string }) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  onDateTimeSelect?: (
    date: Date,
    time?: { hour: number; minute: number }
  ) => void;
  onDateChange?: (date: Date) => void;
}

// 목록 뷰 컴포넌트
export const ListView: React.FC<CalendarProps & { currentDate: Date }> = ({
  currentDate,
  events,
  hospitalSchedules,
  onEventClick,
  onDateTimeSelect,
  onDateChange,
}) => {
  const { getStatusColor, getStatusIconComponent, getStatusKey, getStatusLabel } =
    useAppointmentPage();

  const LS_RESERVATION_LIST_VIEW_HEADERS_KEY =
    "reservation.contents-view.list-view.headers";


  // useTimeSlot 훅 사용
  const { getHospitalOperatingHours } = useTimeSlot(
    {} as AppointmentRoom,
    hospitalSchedules
  );

  // 공휴일 또는 미운영일 체크
  const holiday = findHospitalHolidayInfoFromDate(
    hospitalSchedules?.hospitalHolidays,
    currentDate
  );
  const isNonOperatingDay = !getHospitalOperatingHours(currentDate);

  // 그리드 기본 헤더 정의
  const defaultHeaders: MyGridHeaderType[] = useMemo(
    () => [
      {
        key: "appointmentTime",
        name: "예약시간",
        width: 60,
        minWidth: 0,
        sortNumber: 1,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "patientName",
        name: "환자명",
        width: 85,
        minWidth: 0,
        sortNumber: 2,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentRoomName",
        name: "예약실",
        sortNumber: 3,
        width: 85,
        minWidth: 0,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentDoctorName",
        name: "진료의",
        width: 85,
        minWidth: 0,
        sortNumber: 4,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentType",
        name: "예약유형",
        sortNumber: 5,
        width: 70,
        minWidth: 0,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentMemo",
        name: "예약내용",
        width: 120,
        minWidth: 0,
        sortNumber: 6,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "phone2",
        name: "연락처",
        width: 100,
        minWidth: 0,
        sortNumber: 7,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "birthDate",
        name: "생년월일",
        width: 80,
        minWidth: 0,
        sortNumber: 8,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "rrn",
        name: "주민번호",
        width: 100,
        minWidth: 0,
        sortNumber: 9,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "patientNo",
        name: "차트번호",
        sortNumber: 9,
        width: 70,
        minWidth: 0,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
      {
        key: "appointmentStatus",
        name: "상태",
        width: 65,
        minWidth: 0,
        sortNumber: 10,
        isFixedLeft: false,
        isFixedRight: false,
        visible: true,
        align: "center",
        readonly: true,
      },
    ],
    []
  );

  const { headers, setHeadersAction, fittingScreen } = useMyGridHeaders({
    lsKey: LS_RESERVATION_LIST_VIEW_HEADERS_KEY,
    defaultHeaders,
    fittingScreen: true,
  });

  // 이벤트 데이터를 그리드 행 데이터로 변환
  const gridRows: MyGridRowType[] = useMemo(() => {
    const filteredEvents = events.filter(
      (event) =>
        event &&
        event.start &&
        event.start instanceof Date &&
        isSameDay(event.start, currentDate)
    );

    return filteredEvents.map((event, index) => {
      const originalData = event.originalData || {};
      return {
        key: event.id,
        rowIndex: index + 1,
        cells: [
          {
            headerKey: "appointmentTime",
            value: `${formatTime(event.start.getHours(), event.start.getMinutes())}`,
          },
          {
            headerKey: "patientName",
            value: originalData.patient.name || event.title || "",
          },
          {
            headerKey: "appointmentRoomName",
            value: originalData.appointmentRoom?.displayName || "",
          },
          {
            headerKey: "appointmentDoctorName",
            value: originalData.doctor?.name || "",
          },
          {
            headerKey: "appointmentType",
            value: originalData.appointmentType?.name || "",
            customRender: (
              <span
                style={{
                  color: originalData.appointmentType?.colorCode || "#6B7280",
                  fontSize: "12px",
                }}
              >
                {originalData.appointmentType?.name || ""}
              </span>
            ),
          },
          {
            headerKey: "appointmentMemo",
            value: stripHtmlTags(originalData.memo) || "",
          },
          {
            headerKey: "phone2",
            value: originalData.patient?.phone1 || "",
          },
          {
            headerKey: "birthDate",
            value: originalData.patient?.birthDate
              ? formatDate(originalData.patient.birthDate, "-")
              : "",
          },
          {
            headerKey: "rrn",
            value: formatRrn(originalData.patient?.rrn || ""),
          },
          {
            headerKey: "patientNo",
            value: originalData.patient?.patientNo || "",
          },
          {
            headerKey: "appointmentStatus",
            value: getStatusLabel(originalData.status as AppointmentStatus),
            customRender: (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-xs ${getStatusColor(
                  getStatusKey(originalData.status || AppointmentStatus.PENDING)
                )}`}
              >
                {getStatusLabel(originalData.status as AppointmentStatus)}
              </span>
            ),
          },
        ],
      };
    });
  }, [
    events,
    currentDate,
    getStatusLabel,
    getStatusColor,
    getStatusKey,
    getStatusIconComponent,
  ]);

  // 행 클릭 핸들러
  const handleRowClick = (row: MyGridRowType) => {
    const originalEvent = events.find((e) => e.id === row.key);
    if (originalEvent) {
      onEventClick?.(originalEvent);
      if (onDateTimeSelect) {
        onDateTimeSelect(originalEvent.start, {
          hour: originalEvent.start.getHours(),
          minute: originalEvent.start.getMinutes(),
        });
      }
      if (onDateChange) {
        onDateChange(originalEvent.start);
      }
    }
  };

  // 공휴일이거나 미운영일인 경우 메시지 표시
  if (holiday || isNonOperatingDay) {
    return (
      <div className="flex-1 h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--gray-100)] mb-2">
            {holiday ? "공휴일" : ""}
          </h2>
          <p className="text-[var(--gray-100)] font-bold text-2xl mb-4">
            {holiday ? holiday.holidayName : "병원이 운영하지 않는 날입니다"}
          </p>
          <p className="text-lg text-[var(--gray-300)]">
            {formatDate(currentDate, "-")}
          </p>
        </div>
      </div>
    );
  }

  return (
    // contents-panel이 overflow-auto 이므로, ListView 내부에서 높이를 고정해주지 않으면
    // 그리드가 콘텐츠 높이만큼 늘어나 가로 스크롤바가 "데이터 끝"까지 내려가야 보이게 된다.
    // 여기서는 ListView가 부모 높이를 채우고(MyGrid가 flex-1), 스크롤은 MyGrid(my-scroll)에서 처리하도록 한다.
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* min-w-fit은 컨텐츠 폭을 따라가며 커질 수 있어(fittingScreen과 합쳐지면 폭이 예상보다 크게 측정됨),
          부모 폭 제약이 내려오도록 w-full/min-w-0로 고정 */}
      <div className="flex-1 min-h-0 w-full min-w-0">
        <MyGrid
          testId="reservation-list-grid"
          headers={headers}
          data={gridRows}
          onHeadersChange={setHeadersAction}
          onRowClick={handleRowClick}
          multiSelect={false}
          fittingScreen={fittingScreen}
          isLoading={false}
          loadingMsg="로딩 중..."
          isError={false}
          errorMsg="오류가 발생했습니다."
        />
      </div>
    </div>
  );
};
