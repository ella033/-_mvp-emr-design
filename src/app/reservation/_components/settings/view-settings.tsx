import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ViewSettingsProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  onSave: () => void;
  onCancel: () => void;
  fetchHospitalData: () => Promise<void>;
}

export const ViewSettings: React.FC<ViewSettingsProps> = ({
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* 메뉴 헤더 */}
      <div className="flex justify-between items-center mb-4 pb-2">
        <h2 className="text-lg py-1 font-bold text-[var(--main-color)]">보기 설정</h2>
      </div>

      {/* 기본설정 섹션 */}
      <div className="flex-1 border-b border-gray-200 pb-6">
        <h3 className="font-bold text-lg text-[var(--gray-300)] mb-4">기본 설정</h3>
        <div className="space-y-6">
          {/* 한주의 시작 */}
          <div className="grid grid-cols-[100px_100px_1fr] gap-4 items-center">
            <label className="text-md font-bold text-[var(--main-color)]">한주의 시작</label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="weekStart"
                value="sunday"
                className="mr-2"
                defaultChecked
              />
              <span className="text-sm">일요일</span>
            </label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="weekStart"
                value="monday"
                className="mr-2"
              />
              <span className="text-sm">월요일</span>
            </label>
          </div>

          {/* 시간 표시 */}
          <div className="grid grid-cols-[100px_100px_1fr] gap-4 items-center">
            <label className="text-md font-bold text-[var(--main-color)]">시간 표시</label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                value="12hour"
                className="mr-2"
                defaultChecked
              />
              <span className="text-sm">오전/오후</span>
            </label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="timeFormat"
                value="24hour"
                className="mr-2"
              />
              <span className="text-sm">24시간</span>
            </label>
          </div>

          {/* 요일 표시 */}
          <div className="grid grid-cols-[100px_100px_1fr] gap-4 items-center">
            <label className="text-md font-bold text-[var(--main-color)]">요일 표시</label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="dayDisplay"
                value="workingDaysOnly"
                className="mr-2"
                defaultChecked
              />
              <span className="text-sm">진료일만 보기</span>
            </label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="dayDisplay"
                value="allDays"
                className="mr-2"
              />
              <span className="text-sm">모든 요일 보기</span>
            </label>
          </div>

          {/* 시간 표시 범위 */}
          <div className="grid grid-cols-[100px_100px_1fr] gap-4 items-center">
            <label className="text-md font-bold text-[var(--main-color)]">시간 표시 범위</label>
            <label className="flex items-center w-fit cursor-pointer">
              <input
                type="radio"
                name="timeRange"
                value="workingHours"
                className="mr-2"
                defaultChecked
              />
              <span className="text-sm">진료시간</span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center w-fit cursor-pointer">
                <input
                  type="radio"
                  name="timeRange"
                  value="customRange"
                  className="mr-2"
                />
                <span className="text-sm">범위지정</span>
              </label>
              <div className="ml-6 flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="time"
                    defaultValue="08:00"
                    className="border border-gray-300 rounded px-2 py-1 text-sm pr-6"
                  />
                  <ChevronDown size={14} className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                <span className="text-gray-500">~</span>
                <div className="relative">
                  <input
                    type="time"
                    defaultValue="20:00"
                    className="border border-gray-300 rounded px-2 py-1 text-sm pr-6"
                  />
                  <ChevronDown size={14} className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예약설정 섹션 */}
      <div className="flex-1 pt-6">
        <h3 className="font-bold text-lg text-[var(--gray-300)] mb-4">예약 화면 설정</h3>
        <div className="space-y-4">
          {/* 자동 노쇼 설정 */}
          <div className="grid grid-cols-[100px_60px_90px_1fr] gap-2 items-center">
            <label className="text-md font-medium text-[var(--main-color)]">자동노쇼 사용</label>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--violet-1)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--main-color)]"></div>
              </label>
            </div>
            <label className="text-md font-medium text-[var(--main-color)]">자동 노쇼 기준</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm max-w-xs"
              defaultValue="60"
            >
              <option value="30">예약시간 30분 경과</option>
              <option value="60">예약시간 60분 경과</option>
              <option value="90">예약시간 90분 경과</option>
              <option value="120">예약시간 120분 경과</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};