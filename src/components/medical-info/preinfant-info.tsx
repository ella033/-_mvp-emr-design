import React from 'react';
import { useDisregFormUtils } from '@/hooks/medical-info/use-disreg-form-utils';
import { components } from '@/generated/api/types';

type PreInfantInfo = components["schemas"]["PreInfantInfo"];

interface PreinfantInfoProps {
  data: PreInfantInfo;
  onDataChange: (data: PreInfantInfo) => void;
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

const PreinfantInfo: React.FC<PreinfantInfoProps> = ({
  data,
  onDataChange,
  isDisabled = false,
}) => {
  const { formatDate, parseDate, getStringValue, parseDateString, formatDateString } = useDisregFormUtils();

  const updateData = (field: keyof PreInfantInfo, value: string) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData);
  };

  const getStartDate = (): Date | null => parseDateString(getDateStrFromField(data.시작유효일자));
  const getEndDate = (): Date | null => parseDateString(getDateStrFromField(data.종료유효일자));

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="p-3 bg-white border border-gray-200 rounded">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[70px]">등록번호</label>
            <input
              type="text"
              value={getStringValue(data.등록번호)}
              onChange={(e) => updateData('등록번호', e.target.value )}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="등록번호"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[70px]">시작유효일자</label>
            <input
              type="date"
              value={formatDate(getStartDate())}
              onChange={(e) => {
                const date = parseDate(e.target.value);
                const dateStr = date ? formatDateString(date) : '';
                updateData('시작유효일자', dateStr );
              }}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[70px]">종료유효일자</label>
            <input
              type="date"
              value={formatDate(getEndDate())}
              onChange={(e) => {
                const date = parseDate(e.target.value);
                const dateStr = date ? formatDateString(date) : '';
                updateData('종료유효일자', dateStr );
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

export default PreinfantInfo;
