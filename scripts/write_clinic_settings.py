from pathlib import Path

content = """import React, { useState, useEffect, useRef } from "react";
import "react-calendar/dist/Calendar.css";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { HolidayApplicationsService } from "@/services/holiday-applications-service";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";
import { ScheduleTab } from "./clinic-settings/schedule/ScheduleTab";
import { HolidayTab } from "./clinic-settings/holiday/HolidayTab";

type ClinicSubMenu = "schedule" | "holiday";

interface ClinicSettingsProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  onSave: () => void;
  onCancel: () => void;
  fetchHospitalData: () => Promise<void>;
  appointmentRooms: AppointmentRooms[];
}

export const ClinicSettings: React.FC<ClinicSettingsProps> = ({
  hospital,
  setHospital,
  hasChanges,
  setHasChanges,
  toastHelpers,
  onSave,
  onCancel,
  fetchHospitalData,
  appointmentRooms,
}) => {
  const [selectedClinicTab, setSelectedClinicTab] =
    useState<ClinicSubMenu>("schedule");
  const [showSaveConfirmPopup, setShowSaveConfirmPopup] = useState(false);
  const [pendingTab, setPendingTab] = useState<ClinicSubMenu | null>(null);
  const [allHolidays, setAllHolidays] = useState<HolidayApplicationTypes[]>([]);

  useEffect(() => {
    const loadAllHolidays = async () => {
      if (!hospital?.id) return;
      try {
        const fetchedHolidayApplications =
          await HolidayApplicationsService.getHolidayApplications();
        setAllHolidays(fetchedHolidayApplications ?? []);
      } catch (error) {
        console.error("allHolidays 로드 실패:", error);
      }
    };

    loadAllHolidays();
  }, [hospital?.id]);

  const holidayTabRef = useRef<{ syncHolidays: () => Promise<void> }>(null);
  const scheduleTabRef = useRef<{ saveSchedule: () => Promise<boolean> }>(null);

  const handleSave = async () => {
    try {
      if (selectedClinicTab === "holiday") {
        if (holidayTabRef.current) {
          await holidayTabRef.current.syncHolidays();
        }
      } else if (selectedClinicTab === "schedule") {
        if (scheduleTabRef.current) {
          const result = await scheduleTabRef.current.saveSchedule();
          if (result === false) {
            return;
          }
        }
      }
      onSave();
    } catch (error) {
      console.error("저장 실패:", error);
      toastHelpers.error("저장에 실패했습니다.");
    }
  };

  const handleTabChange = (newTab: ClinicSubMenu) => {
    if (selectedClinicTab === newTab) {
      return;
    }

    if (hasChanges) {
      setPendingTab(newTab);
      setShowSaveConfirmPopup(true);
    } else {
      setSelectedClinicTab(newTab);
    }
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmPopup(false);
    try {
      if (selectedClinicTab === "holiday") {
        if (holidayTabRef.current) {
          await holidayTabRef.current.syncHolidays();
        }
      } else if (selectedClinicTab === "schedule") {
        if (scheduleTabRef.current) {
          await scheduleTabRef.current.saveSchedule();
        }
      }
      if (pendingTab) {
        setSelectedClinicTab(pendingTab);
        setPendingTab(null);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      toastHelpers.error("저장에 실패했습니다.");
    }
  };

  const handleCancelSave = () => {
    setShowSaveConfirmPopup(false);
    if (pendingTab) {
      setSelectedClinicTab(pendingTab);
      setPendingTab(null);
      setHasChanges(false);
    }
  };

  const commonProps = {
    hospital,
    setHospital,
    hasChanges,
    setHasChanges,
    toastHelpers,
    onSave,
    onCancel,
    fetchHospitalData,
    allHolidays,
    setAllHolidays,
    appointmentRooms,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2">
        <h2 className="text-lg py-1 font-bold text-[var(--main-color)]">
          진료일 설정
        </h2>
        <span className="text-sm text-gray-500">
          {selectedClinicTab === "schedule"
            ? "적용일 : " + new Date().toISOString().split("T")[0]
            : ""}
        </span>
      </div>

      <div className="border-b border-gray-200 mb-4">
        <div className="flex w-full">
          <button
            onClick={() => handleTabChange("schedule")}
            className={`flex-1 py-2 px-4 text-md font-medium border-b-2 text-center ${selectedClinicTab === "schedule"
              ? "border-[var(--main-color)] text-[var(--main-color)]"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            진료시간
          </button>
          <button
            onClick={() => handleTabChange("holiday")}
            className={`flex-1 py-2 px-4 text-md font-medium border-b-2 text-center ${selectedClinicTab === "holiday"
              ? "border-[var(--main-color)] text-[var(--main-color)]"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            휴무일
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedClinicTab === "schedule" && (
          <ScheduleTab ref={scheduleTabRef} {...commonProps} />
        )}
        {selectedClinicTab === "holiday" && (
          <HolidayTab ref={holidayTabRef} {...commonProps} />
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[var(--main-color)] text-[var(--bg-main)] rounded hover:bg-[var(--main-color-hover)] transition-colors"
          >
            저장
          </button>
        </div>
      </div>

      <MyPopupYesNo
        isOpen={showSaveConfirmPopup}
        onCloseAction={handleCancelSave}
        onConfirmAction={handleConfirmSave}
        title="저장 확인"
        message={`아직 저장되지 않은 수정사항이 있습니다.\n수정사항을 저장하시겠습니까?`}
        confirmText="저장"
        cancelText="저장 안 함"
      />
    </div>
  );
};
"""

Path("src/app/reservation/_components/settings/clinic-settings.tsx").write_text(content, encoding="utf-8")

