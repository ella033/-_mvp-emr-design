import React, { forwardRef, useImperativeHandle } from "react";
import CheckHolidaysConflictsList from "./check-holidays-conflicts-list";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { KstDateRangeCalendarInput } from "@/components/ui/kst-date-range-calendar-input";
import type { HolidayApplicationTypes } from "@/types/common/holiday-applications-types";
import { WEEK_DAYS } from "@/constants/constants";
import { HolidayRecurrenceWeek } from "@/constants/common/common-enum";
import { useHolidayTab } from "../hooks/use-holiday-tab";


interface HolidayTabProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  allHolidays: HolidayApplicationTypes[];
  setAllHolidays: (holidays: HolidayApplicationTypes[]) => void;
}

export const HolidayTab = forwardRef<
  { syncHolidays: () => Promise<void> },
  HolidayTabProps
>(
  (
    {
      hospital,
      setHospital,
      hasChanges: _hasChanges,
      setHasChanges,
      toastHelpers,
      allHolidays,
      setAllHolidays,
    },
    ref
  ) => {
    void _hasChanges;
    const {
      holidayMasters,
      selectedMasterIdSet,
      regularHolidays,
      temporaryHolidays,
      isTemporaryLocked,
      holidayConflicts,
      showHolidayConflictPopup,
      isCheckingHolidayConflicts,
      setAllHolidayMasters,
      toggleHolidayMaster,
      addRegularHoliday,
      removeRegularHoliday,
      updateRegularRecurrenceWeek,
      toggleRegularDayOfWeek,
      addTemporaryHoliday,
      updateTemporaryRow,
      removeTemporaryHoliday,
      syncHolidays,
      confirmHolidayConflicts,
      closeHolidayConflicts,
    } = useHolidayTab({
      hospital,
      setHospital,
      setHasChanges,
      toastHelpers,
      allHolidays,
      setAllHolidays,
    });

    useImperativeHandle(ref, () => ({
      syncHolidays,
    }));

    const handleAllHolidaysToggle = (isChecked: boolean) => {
      try {
        setAllHolidayMasters(isChecked);
      } catch (error) {
        console.error("전체 공휴일 업데이트 실패:", error);
        toastHelpers.error("전체 공휴일 설정 변경에 실패했습니다.");
      }
    };

    const toggleMasterHoliday = (master: any) => {
      try {
        toggleHolidayMaster(master.id);
      } catch (error) {
        console.error("공휴일 업데이트 실패:", error);
        toastHelpers.error("공휴일 설정 변경에 실패했습니다.");
      }
    };

    return (
      <div className="space-y-1">
        {/* 1) 공휴일 */}
        <div className="border-b border-gray-200 p-4">
          <h4 className="text-md font-bold text-gray-800 mb-3">공휴일</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {holidayMasters.map((master) => {
              const isActive = selectedMasterIdSet.has(master.id);
              return (
                <button
                  key={master.id}
                  onClick={() => toggleMasterHoliday(master)}
                  className={`
                px-3 py-2 rounded border text-sm font-medium transition-colors
                ${isActive
                      ? "bg-[var(--violet-1)] text-[var(--main-color)] border-[var(--violet-1)]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-[var(--violet-1-hover)] hover:text-[var(--main-color)] hover:border-[var(--violet-1-hover)]"
                    }
              `}
                >
                  {master.holidayName}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <input
              type="checkbox"
              id="allHolidays"
              checked={
                holidayMasters.length > 0 &&
                holidayMasters.every((m) => selectedMasterIdSet.has(m.id))
              }
              onChange={(e) => handleAllHolidaysToggle(e.target.checked)}
              className="w-4 h-4 text-[var(--main-color)] border-gray-300 rounded focus:ring-[var(--main-color)]"
            />
            <label
              htmlFor="allHolidays"
              className="text-sm text-gray-700 cursor-pointer"
            >
              전체 공휴일
            </label>
          </div>
        </div>

        {/* 2) 정기 휴무일 */}
        <div className="border-b border-gray-200 pt-1 p-4">
          <h4 className="text-md font-bold text-gray-800 mb-3">정기 휴무일</h4>

          {regularHolidays.length > 0 && (
            <div className="space-y-1 mb-4">
              {regularHolidays.map((regular) => (
                <div key={regular.id} className="flex items-center gap-3">
                  <select
                    value={regular.recurrenceWeek}
                    onChange={(e) => {
                      const week = Number(e.target.value) as HolidayRecurrenceWeek;
                      updateRegularRecurrenceWeek(regular.id, week);
                    }}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm"
                  >
                    <option value={HolidayRecurrenceWeek.첫째주}>매월 첫째주</option>
                    <option value={HolidayRecurrenceWeek.둘째주}>매월 둘째주</option>
                    <option value={HolidayRecurrenceWeek.셋째주}>매월 셋째주</option>
                    <option value={HolidayRecurrenceWeek.넷째주}>매월 넷째주</option>
                    <option value={HolidayRecurrenceWeek.마지막주}>매월 마지막주</option>
                  </select>

                  <div className="flex space-x-2">
                    {WEEK_DAYS.map((day) => (
                      <button
                        key={day.key}
                        onClick={() => {
                          toggleRegularDayOfWeek(regular.id, day.key);
                        }}
                        className={`
                        px-3 py-2 rounded border text-sm font-medium transition-colors bg-white text-gray-700
                        ${regular.selectedDays.includes(day.key)
                            ? "border-[var(--main-color)]"
                            : "border-gray-300 hover:border-[var(--main-color)]"
                          }
                      `}
                      >
                        {day.label}요일
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => removeRegularHoliday(regular.id)}

                  >
                    <img
                      src="/settings/circle-delete.svg"
                      alt="삭제"
                      className="w-4 h-4"
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {regularHolidays.length === 0 && (
            <div className="text-sm text-gray-500 mb-4">
              설정된 정기 휴무일이 없습니다
            </div>
          )}

          <button
            onClick={addRegularHoliday}
            className="text-sm bg-[var(--violet-1)] font-semibold text-[var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1-hover)]"
          >
            + 정기 휴무일 추가
          </button>
        </div>

        <div className="p-4">
          <label className="block text-md font-bold text-[var(--main-color)] mb-4">
            임시 휴무일
          </label>

          <div className="space-y-1 mb-2">
            {temporaryHolidays.length === 0 ? (
              <div className="text-sm text-gray-500">
                설정된 임시 휴무일이 없습니다.
              </div>
            ) : (
              temporaryHolidays.map((row) => (
                <div key={row.id} className="flex items-center gap-2 w-full">
                  {(() => {
                    const locked = isTemporaryLocked(row);
                    const disabledClass = locked ? "opacity-50 cursor-not-allowed" : "";
                    return (
                      <>
                        <div className={disabledClass}>
                          <KstDateRangeCalendarInput
                            disabled={locked}
                            startUtcIso={row.startDate as any}
                            endUtcIso={row.endDate as any}
                            onChange={({ startUtcIso, endUtcIso }) => {
                              updateTemporaryRow(row.id, {
                                startDate: startUtcIso,
                                endDate: endUtcIso,
                              });
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          value={row.holidayName}
                          disabled={locked}
                          onChange={(e) => {
                            updateTemporaryRow(row.id, { holidayName: e.target.value });
                          }}
                          placeholder="휴무일 이름"
                          className={`flex-none w-[180px] border border-gray-300 rounded px-2 py-1 text-sm ${disabledClass}`}
                        />
                        {/* 남는 영역은 빈 칸으로 유지 */}
                        {!locked && (<button
                          type="button"
                          disabled={locked}
                          onClick={() => removeTemporaryHoliday(row.id)}
                          className={`shrink-0 ${disabledClass}`}
                        >
                          <img
                            src="/settings/circle-delete.svg"
                            alt="삭제"
                            className="w-4 h-4"
                          />
                        </button>
                        )}
                        <div className="flex-1" />
                      </>
                    );
                  })()}
                </div>
              ))
            )}
          </div>

          <button
            onClick={addTemporaryHoliday}
            className="text-sm bg-[var(--violet-1)] font-semibold text-[var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1-hover)]"
          >
            + 임시 휴무일 추가
          </button>
        </div>
        <MyPopupYesNo
          isOpen={showHolidayConflictPopup}
          onCloseAction={closeHolidayConflicts}
          onConfirmAction={confirmHolidayConflicts}
          title="기존 예약 확인"
          message={`설정된 휴무일과 겹치는 예약이 있습니다.\n계속 저장하시겠습니까?`}
          confirmText="계속 저장"
          cancelText="취소"
        >
          <CheckHolidaysConflictsList
            appointments={holidayConflicts}
            isLoading={isCheckingHolidayConflicts}
          />
        </MyPopupYesNo>
      </div>
    );
  }
);


