import React from 'react';
import { components } from '@/generated/api/types';
import { useDisregFormUtils } from '@/hooks/medical-info/use-disreg-form-utils';

type DisRegPrson1Info = components["schemas"]["DisRegPrson1Info"];

interface RDisOldInfoProps {
  data: DisRegPrson1Info;
  onDataChange: (data: DisRegPrson1Info) => void;
  isDisabled?: boolean;
}

const RDisOldInfo: React.FC<RDisOldInfoProps> = ({
  data,
  onDataChange,
  isDisabled = false
}) => {
  const { formatDate, parseDate, getStringValue, parseDateString, formatDateString } = useDisregFormUtils();

  // 데이터 업데이트
  const updateData = (field: keyof DisRegPrson1Info, value: string | Date | null) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  // DisRegPrson1Info는 승인일을 사용하므로 승인일을 Date로 변환
  const getApprovalDate = (): Date | null => {
    return parseDateString(data.승인일);
  };

  // DisRegPrson1Info는 종료일을 사용
  const getEndDate = (): Date | null => {
    return parseDateString(data.종료일);
  };

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="p-3 bg-white border border-gray-200 rounded">
        {/* 첫 번째 줄: 특정기호 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[45px]">특정기호</label>
            <input
              type="text"
              value={getStringValue(data.특정기호)}
              onChange={(e) => updateData('특정기호', e.target.value as any)}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="특정기호"
            />
          </div>
        </div>

        {/* 두 번째 줄: 승인일 / 종료일 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[45px]">승인일</label>
            <input
              type="date"
              value={formatDate(getApprovalDate())}
              onChange={(e) => {
                const date = parseDate(e.target.value);
                const dateStr = date ? formatDateString(date) : '';
                updateData('승인일', dateStr as any);
              }}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[45px]">종료일</label>
            <input
              type="date"
              value={formatDate(getEndDate())}
              onChange={(e) => {
                const date = parseDate(e.target.value);
                const dateStr = date ? formatDateString(date) : '';
                updateData('종료일', dateStr as any);
              }}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RDisOldInfo;
