import React from 'react';
import { 급여제한여부 } from '@/constants/common/common-enum';

interface QualRestrictInfoProps {
  data: 급여제한여부 | null;
  onDataChange: (data: 급여제한여부) => void;
  isDisabled?: boolean;
}

const QualRestrictInfo: React.FC<QualRestrictInfoProps> = ({
  data,
  onDataChange,
  isDisabled = false
}) => {

  // 급여제한여부 옵션 (해당없음 제외)
  const qualRestrictOptions = [
    { value: 급여제한여부.무자격자, label: '무자격자' },
    { value: 급여제한여부.보험료체납자, label: '보험료체납자' },
    { value: 급여제한여부.재외국인보험료체납자, label: '재외국인보험료체납자' },
    { value: 급여제한여부.사망자, label: '사망자' },
    { value: 급여제한여부.국외이민자, label: '국외이민자' },
  ];

  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md">
      <div className="p-3 bg-white border border-gray-200 rounded">
        <div >
          {qualRestrictOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="qualRestrict"
                value={option.value}
                checked={data === option.value}
                onChange={(e) => onDataChange(parseInt(e.target.value) as 급여제한여부)}
                disabled={isDisabled}
                className={`w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 ${isDisabled ? 'bg-gray-50' : ''}`}
              />
              <span className="text-sm text-gray-700 select-none">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualRestrictInfo;
