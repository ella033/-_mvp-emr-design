import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { components } from '@/generated/api/types';
import { createDefaultDisRegPrsonCancerInfo } from '@/hooks/medical-info/add-disreg-modal-utils';
import { 중증등록구분Label } from '@/constants/common/common-enum';
import { useDisregFormUtils } from '@/hooks/medical-info/use-disreg-form-utils';

type DisRegPrsonCancerInfo = components["schemas"]["DisRegPrsonCancerInfo"];

interface HardSickCancerInfoProps {
  cancerData: DisRegPrsonCancerInfo[];
  onDataChange: (data: DisRegPrsonCancerInfo[]) => void;
  isDisabled?: boolean;
}

const HardSickCancerInfo: React.FC<HardSickCancerInfoProps> = ({
  cancerData,
  onDataChange,
  isDisabled = false
}) => {
  const { formatDate, parseDate, getStringValue, parseDateString, formatDateString } = useDisregFormUtils();
  const [cancerList, setCancerList] = useState<DisRegPrsonCancerInfo[]>([]);

  useEffect(() => {
    setCancerList([...cancerData]);
  }, [cancerData]);

  // 암 정보 추가
  const addCancerInfo = () => {
    const newCancer = createDefaultDisRegPrsonCancerInfo();
    const updatedList = [...cancerList, newCancer];
    setCancerList(updatedList);
    onDataChange(updatedList);
  };

  // 암 정보 삭제
  const removeCancerInfo = (index: number) => {
    const updatedList = cancerList.filter((_, i) => i !== index);
    setCancerList(updatedList);
    onDataChange(updatedList);
  };

  // 암 정보 업데이트
  const updateCancerInfo = (index: number, field: keyof DisRegPrsonCancerInfo, value: string | number | Date | null) => {
    const updatedList = cancerList.map((item, i) =>
      i === index ? { ...item, [field]: value as any } : item
    );
    setCancerList(updatedList);
    onDataChange(updatedList);
  };

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
      {/* 추가 버튼 */}
      <div className="p-2 border-b border-gray-200">
        <button
          type="button"
          onClick={addCancerInfo}
          disabled={isDisabled}
          className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${isDisabled
            ? 'text-gray-400 cursor-default bg-gray-100'
            : 'text-[var(--main-color)] hover:bg-blue-50 cursor-pointer border border-[var(--main-color)]'
            }`}
        >
          <Plus size={14} />
          추가
        </button>
      </div>

      {cancerList.map((cancer, index) => (
        <div key={index} className="mb-4 p-3 bg-white border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">중증암 산정특례</span>
            <button
              type="button"
              onClick={() => removeCancerInfo(index)}
              disabled={isDisabled}
              className={`p-1 rounded transition-colors ${isDisabled
                ? 'text-gray-400 cursor-default'
                : 'text-red-500 hover:bg-red-50 cursor-pointer'
                }`}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* 첫 번째 줄: 구분 / 상병코드 / 상병일련번호 */}
          <div className="flex gap-2 mb-2">
            <div className="flex items-center gap-2 w-[90px] flex-shrink-0">
              <label className="text-xs text-gray-600 whitespace-nowrap">구분</label>
              <input
                type="text"
                value={index + 1}
                disabled
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-gray-100 text-gray-600"
                placeholder="구분"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[40px]">상병기호</label>
              <input
                type="text"
                value={getStringValue(cancer.상병기호)}
                onChange={(e) => updateCancerInfo(index, '상병기호', e.target.value)}
                disabled={isDisabled}
                className="w-full flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="상병기호"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">상병일련번호</label>
              <input
                type="text"
                value={getStringValue(cancer.상병일련번호)}
                onChange={(e) => updateCancerInfo(index, '상병일련번호', e.target.value)}
                disabled={isDisabled}
                className="w-full flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="상병일련번호"
              />
            </div>
          </div>

          {/* 두 번째 줄: 등록구분 / 등록번호 / 특정기호 */}
          <div className="flex gap-2 mb-2">
            <div className="flex items-center gap-2 w-[90px] flex-shrink-0">
              <label className="text-xs text-gray-600 whitespace-nowrap">등록구분</label>
              <select
                value={getStringValue(cancer.등록구분) || '0'}
                onChange={(e) => updateCancerInfo(index, '등록구분', e.target.value)}
                disabled={isDisabled}
                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(중증등록구분Label).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[40px]">등록번호</label>
              <input
                type="text"
                value={getStringValue(cancer.등록번호)}
                onChange={(e) => updateCancerInfo(index, '등록번호', e.target.value)}
                disabled={isDisabled}
                className="w-full flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="등록번호"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[50px]">특정기호</label>
              <input
                type="text"
                value={getStringValue(cancer.특정기호)}
                onChange={(e) => updateCancerInfo(index, '특정기호', e.target.value)}
                disabled={isDisabled}
                className="w-full flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="특정기호"
              />
            </div>
          </div>

          {/* 세 번째 줄: 등록일 / 종료일 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[40px]">등록일</label>
              <input
                type="date"
                value={formatDate(parseDateString(cancer.등록일))}
                onChange={(e) => {
                  const date = parseDate(e.target.value);
                  const dateStr = date ? formatDateString(date) : '';
                  updateCancerInfo(index, '등록일', dateStr);
                }}
                disabled={isDisabled}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 whitespace-nowrap w-[40px]">종료일</label>
              <input
                type="date"
                value={formatDate(parseDateString(cancer.종료일))}
                onChange={(e) => {
                  const date = parseDate(e.target.value);
                  const dateStr = date ? formatDateString(date) : '';
                  updateCancerInfo(index, '종료일', dateStr);
                }}
                disabled={isDisabled}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      {cancerList.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          중증암 정보가 없습니다. '추가' 버튼을 클릭하여 정보를 입력하세요.
        </div>
      )}
    </div>
  );
};

export default HardSickCancerInfo;
