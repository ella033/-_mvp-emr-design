"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useToastHelpers } from "@/components/ui/toast";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import { useUserStore } from "@/store/user-store";
import { HospitalsService } from "@/services/hospitals-service";
import { HolidayApplicationsService } from "@/services/holiday-applications-service";
import { getHolidayQueryRangeRelativeToYear } from "@/lib/holiday-utils";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";

import { OperatingDaysSettingsPanel } from "./operating-days-settings-panel";

export function OperatingDaysPage() {
  const toastHelpers = useToastHelpers();
  const toastRef = useRef(toastHelpers);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    toastRef.current = toastHelpers;
  }, [toastHelpers]);

  const hospitalId = useMemo(() => {
    return user?.hospitalId ?? null;
  }, [user]);

  const [hospital, setHospital] = useState<any>(null);
  const [allHolidays, setAllHolidays] = useState<HolidayApplicationTypes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchHospitalData = useCallback(async () => {
    if (!hospitalId) return;
    const updatedHospital = await HospitalsService.getHospital(hospitalId);
    setHospital(updatedHospital);
  }, [hospitalId]);

  const fetchAllHolidays = useCallback(async () => {
    if (!hospitalId) return;
    const currentYear = new Date().getFullYear();
    const holidayRange = getHolidayQueryRangeRelativeToYear(currentYear, 0, 0);
    const fetchedHolidayApplications =
      await HolidayApplicationsService.getHolidayApplications(holidayRange);
    setAllHolidays(fetchedHolidayApplications ?? []);
  }, [hospitalId]);

  useEffect(() => {
    if (!hospitalId) return;
    setIsLoading(true);
    setLoadError(null);
    let cancelled = false;
    Promise.all([fetchHospitalData(), fetchAllHolidays()])
      .catch((error) => {
        console.error("진료일 설정 초기 로드 실패:", error);
        toastRef.current.error("진료일 설정 정보를 불러오는데 실패했습니다.");
        setLoadError("진료일 설정 정보를 불러오는데 실패했습니다.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchAllHolidays, fetchHospitalData, hospitalId]);

  return (
    <div className="flex flex-col items-start gap-[20px] flex-1 self-stretch p-4 md:p-[20px] h-full overflow-hidden">
      <SettingPageHeader
        title="진료일 설정"
        tooltipContent="진료시간 및 휴무일 변경내역은 당일부터 적용됩니다."
      />

      <section className="flex flex-row lg:flex-row gap-[20px] w-full min-h-0 flex-1 overflow-visible">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            로딩 중...
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center w-full h-full text-red-500">
            {loadError}
          </div>
        ) : !hospital ? (
          <div className="flex items-center justify-center w-full h-full text-slate-500">
            병원 정보를 찾을 수 없습니다.
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full">
            <OperatingDaysSettingsPanel
              hospital={hospital}
              setHospital={setHospital}
              toastHelpers={toastHelpers}
              fetchHospitalData={fetchHospitalData}
              allHolidays={allHolidays}
              setAllHolidays={setAllHolidays}
            />
          </div>
        )}
      </section>
    </div>
  );
}


