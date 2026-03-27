import React from 'react';
import { useDisregFormUtils } from '@/hooks/medical-info/use-disreg-form-utils';
import { components } from '@/generated/api/types';

type SelfPreparationPersonInfo = components["schemas"]["SelfPreparationPersonInfo"];

interface SelfPrepInfoProps {
  data: SelfPreparationPersonInfo;
  onDataChange: (data: SelfPreparationPersonInfo) => void;
  isDisabled?: boolean;
}

/** 필드에서 YYYYMMDD 문자열 추출 (문자열 또는 객체 내 값) */
function getDateStrFromField(field: unknown): string {
  if (typeof field === 'string' && field.length === 8) return field;
  if (field && typeof field === 'object') {
    const v = (field as Record<string, unknown>).value ?? (field as Record<string, unknown>).data;
    if (typeof v === 'string' && v.length === 8) return v;
  }
  return '';
}

const SelfPrepInfo: React.FC<SelfPrepInfoProps> = ({
  data,
  onDataChange,
  isDisabled = false,
}) => {
  const { formatDate, parseDate, getStringValue, parseDateString, formatDateString } = useDisregFormUtils();

  const updateData = (field: keyof SelfPreparationPersonInfo, value: string) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  const getSupportStartDate = (): Date | null => parseDateString(getDateStrFromField(data.지원시작일));
  const getSupportEndDate = (): Date | null => parseDateString(getDateStrFromField(data.지원종료일));

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="p-3 bg-white border border-gray-200 rounded">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[70px]">특정기호</label>
            <input
              type="text"
              value={getStringValue(data.특정기호)}
              onChange={(e) => updateData('특정기호', e.target.value )}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="특정기호"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[70px]">지원시작일</label>
            <input
              type="date"
              value={formatDate(getSupportStartDate())}
              onChange={(e) => {
                const date = parseDate(e.target.value);
                const dateStr = date ? formatDateString(date) : '';
                updateData('지원시작일', dateStr );
              }}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[70px]">지원종료일</label>
            <input
              type="date"
              value={formatDate(getSupportEndDate())}
              onChange={(e) => {
                const date = parseDate(e.target.value);
                const dateStr = date ? formatDateString(date) : '';
                updateData('지원종료일', dateStr );
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

export default SelfPrepInfo;
