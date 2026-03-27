import React from 'react';
import type { BaseDisReg } from '@/types/dis-reg-types/base-dis-reg-type';
import { useDisregFormUtils } from '@/hooks/medical-info/use-disreg-form-utils';

interface SelectOption {
  value: number;
  label: string;
}

interface DisregSpecialInfoProps<T extends BaseDisReg> {
  data: T;
  onDataChange: (data: T) => void;
  isDisabled?: boolean;
  title: string;
  /** 첫 번째 줄 위에 표시할 구분 select (잠복결핵 등) */
  selectConfig?: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    options: SelectOption[];
    placeholder?: string;
  };
}

const DisregSpecialInfo = <T extends BaseDisReg>({
  data,
  onDataChange,
  isDisabled = false,
  selectConfig,
}: DisregSpecialInfoProps<T>) => {
  const { formatDate, parseDate, getStringValue } = useDisregFormUtils();

  // 데이터 업데이트
  const updateData = (field: keyof BaseDisReg, value: string | Date | null) => {
    const updatedData = { ...data, [field]: value };
    onDataChange(updatedData as T);
  };

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="p-3 bg-white border border-gray-200 rounded">
        {/* 구분 select (옵셔널) */}
        {selectConfig && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">{selectConfig.label}</label>
              <select
                value={selectConfig.value}
                onChange={(e) => selectConfig.onChange(Number(e.target.value))}
                disabled={isDisabled}
                className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>{selectConfig.placeholder ?? "선택"}</option>
                {selectConfig.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {/* 첫 번째 줄: 등록번호 / 특정기호 */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">등록번호</label>
            <input
              type="text"
              value={getStringValue(data.registeredCode)}
              onChange={(e) => updateData('registeredCode', e.target.value)}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="등록번호"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">특정기호</label>
            <input
              type="text"
              value={getStringValue(data.specificCode)}
              onChange={(e) => updateData('specificCode', e.target.value)}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="특정기호"
            />
          </div>
        </div>

        {/* 두 번째 줄: 시작일 / 종료일 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">시작일</label>
            <input
              type="date"
              value={formatDate(data.registeredDate)}
              onChange={(e) => updateData('registeredDate', parseDate(e.target.value))}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">종료일</label>
            <input
              type="date"
              value={formatDate(data.validity)}
              onChange={(e) => updateData('validity', parseDate(e.target.value))}
              disabled={isDisabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisregSpecialInfo;
