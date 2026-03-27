import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";

import { ScheduleTab } from "./(details)/ScheduleTab";
import { HolidayTab } from "./(details)/HolidayTab";
import { HolidayApplicationsService } from "@/services/holiday-applications-service";
import { getHolidayQueryRangeRelativeToYear } from "@/lib/holiday-utils";

type ToastHelpers = {
  success: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
};

interface OperatingDaysSettingsPanelProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  toastHelpers: ToastHelpers;
  fetchHospitalData: () => Promise<void>;
  allHolidays?: HolidayApplicationTypes[];
  setAllHolidays?: (holidays: HolidayApplicationTypes[]) => void;
}

export const OperatingDaysSettingsPanel: React.FC<
  OperatingDaysSettingsPanelProps
> = ({
  hospital,
  setHospital,
  toastHelpers,
  fetchHospitalData,
  allHolidays: externalAllHolidays,
  setAllHolidays: externalSetAllHolidays,
}) => {
    const scheduleTabRef = useRef<{ saveSchedule: () => Promise<boolean> }>(null);
    const holidayTabRef = useRef<{ syncHolidays: () => Promise<void> }>(null);
    const queryClient = useQueryClient();

    const [scheduleHasChanges, setScheduleHasChanges] = useState(false);
    const [holidayHasChanges, setHolidayHasChanges] = useState(false);
    const [internalAllHolidays, setInternalAllHolidays] = useState<
      HolidayApplicationTypes[]
    >([]);
    const allHolidays = externalAllHolidays ?? internalAllHolidays;
    const setAllHolidays = externalSetAllHolidays ?? setInternalAllHolidays;
    const hasAnyChanges = useMemo(
      () => scheduleHasChanges || holidayHasChanges,
      [holidayHasChanges, scheduleHasChanges]
    );

    const handleSave = useCallback(async () => {
      if (!hasAnyChanges) {
        toastHelpers.info("변경내역이 없습니다.");
        return;
      }

      try {
        // 1) 진료시간 저장 (내부에서 API 호출/토스트 처리)
        if (scheduleHasChanges && scheduleTabRef.current) {
          const ok = await scheduleTabRef.current.saveSchedule();
          if (!ok) return;
        }

        // 2) 휴무일 저장 (내부에서 API 호출/토스트 처리)
        if (holidayHasChanges && holidayTabRef.current) {
          await holidayTabRef.current.syncHolidays();
        }

        await fetchHospitalData();

        // 예약 화면에서 사용하는 병원 스케줄(useHospitalSchedule) 캐시 무효화
        // queryKey: ["calendar", "hospital-schedule", year, month]
        await queryClient.invalidateQueries({
          queryKey: ["calendar", "hospital-schedule"],
          // 전역 defaultOptions에서 refetchOnMount=false라서
          // inactive 상태로 남아있는 캐시도 저장 직후 미리 갱신해둔다.
          refetchType: "all",
        });

        setScheduleHasChanges(false);
        setHolidayHasChanges(false);
      } catch (error) {
        console.error("진료일 설정 저장 실패:", error);
        toastHelpers.error("저장에 실패했습니다.");
      }
    }, [
      fetchHospitalData,
      hasAnyChanges,
      holidayHasChanges,
      queryClient,
      scheduleHasChanges,
      toastHelpers,
    ]);

    const handleCancel = useCallback(async () => {
      try {
        await fetchHospitalData();
        setScheduleHasChanges(false);
        setHolidayHasChanges(false);
        toastHelpers.info("변경사항이 초기화되었습니다.");
      } catch (error) {
        console.error("진료일 설정 초기화 실패:", error);
        toastHelpers.error("초기화에 실패했습니다.");
      }
    }, [fetchHospitalData, toastHelpers]);

    const loadAllHolidays = useCallback(async () => {
      if (!hospital?.id) return;
      try {
        const currentYear = new Date().getFullYear();
        const holidayRange = getHolidayQueryRangeRelativeToYear(currentYear, 0, 0);
        const fetchedHolidayApplications =
          await HolidayApplicationsService.getHolidayApplications(holidayRange);
        setAllHolidays(fetchedHolidayApplications ?? []);
      } catch (error) {
        console.error("allHolidays 로드 실패:", error);
      }
    }, [hospital?.id, setAllHolidays]);

    // 예약설정 모달 등에서 allHolidays를 외부에서 주지 않는 경우를 대비해 내부 로드
    // (환경설정 페이지에서는 상위에서 주입됨)
    useEffect(() => {
      if (externalAllHolidays) return;
      void loadAllHolidays();
    }, [externalAllHolidays, loadAllHolidays]);

    return (
      <div className="h-full flex flex-col gap-2">
        <div className="min-h-0 flex-1 border border-slate-200 rounded-lg overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* 좌측: 진료시간 */}
            <div className="min-h-0 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="text-[14px] font-bold text-slate-900">
                  진료시간
                </div>
                <div className="text-xs text-slate-500">
                  적용일 : {new Date().toISOString().split("T")[0]}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <ScheduleTab
                  ref={scheduleTabRef}
                  hospital={hospital}
                  setHospital={setHospital}
                  hasChanges={scheduleHasChanges}
                  setHasChanges={setScheduleHasChanges}
                  toastHelpers={toastHelpers}
                  fetchHospitalData={fetchHospitalData}
                  allHolidays={allHolidays}
                  setAllHolidays={setAllHolidays}
                  appointmentRooms={[]}
                />
              </div>
            </div>

            {/* 우측: 휴무일 */}
            <div className="min-h-0 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 bg-white">
                <div className="text-[14px] font-bold text-slate-900">휴무일</div>
                <div className="text-xs text-slate-500">
                  적용일 : {new Date().toISOString().split("T")[0]}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <HolidayTab
                  ref={holidayTabRef}
                  hospital={hospital}
                  setHospital={setHospital}
                  hasChanges={holidayHasChanges}
                  setHasChanges={setHolidayHasChanges}
                  toastHelpers={toastHelpers}
                  allHolidays={allHolidays}
                  setAllHolidays={setAllHolidays}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mt-auto flex justify-end gap-2 bg-white sticky bottom-0 z-10 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-slate-700 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    );
  };


