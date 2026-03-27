import React from 'react';

interface NhicMedicalAidFormProps {
  선택요양기관제도선택ToString?: string;
  선택요양기관지정일ToString?: string;
  본인부담구분코드ToString?: string;
  선택요양기관여부ToString?: string;
  건강생활유지비지원금?: string;
  본인부담구분코드?: string;
}

const NhicMedicalAidForm: React.FC<NhicMedicalAidFormProps> = ({
  선택요양기관제도선택ToString,
  선택요양기관지정일ToString,
  본인부담구분코드ToString,
  선택요양기관여부ToString,
  건강생활유지비지원금,
  본인부담구분코드
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-gray-800 mb-2">의료급여자격정보</h3>
      <div className="bg-white border-t border-[var(--bg-4)]">
        <div className="grid grid-cols-2">
          {/* 첫 번째 열 */}
          <div className="space-y-0">
            <div className="flex border-b border-[var(--border-1)]">
              <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                선택요양기관 제도선택
              </div>
              <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
                {선택요양기관제도선택ToString || ''}
              </div>
            </div>
            <div className="flex border-b border-[var(--border-1)]">
              <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                선택요양기관 지정일
              </div>
              <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
                {선택요양기관지정일ToString || ''}
              </div>
            </div>
            <div className="flex border-b border-[var(--border-1)]">
              <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                본인부담 구분코드
              </div>
              <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
                {본인부담구분코드 || ''}
              </div>
            </div>
          </div>

          {/* 두 번째 열 */}
          <div className="space-y-0">
            <div className="flex border-b border-[var(--border-1)]">
              <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                선택요양기관 여부
              </div>
              <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
                {선택요양기관여부ToString || ''}
              </div>
            </div>
            <div className="flex border-b border-[var(--border-1)]">
              <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                건강생활 유지비 잔액
              </div>
              <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
                {건강생활유지비지원금 || ''}
              </div>
            </div>
            <div className="flex border-b border-[var(--border-1)]">
              <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
                &nbsp;
              </div>
              <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
                &nbsp;
              </div>
            </div>
          </div>
        </div>

        {/* 마지막 행 - 본인부담구분코드 설명 */}
        <div className="flex">
          <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex items-center">
            본인부담구분코드 설명
          </div>
          <div className="flex-1 px-3 py-1.5 text-sm text-gray-900 max-w-[32rem]">
            <span className="text-gray-600">
              {본인부담구분코드ToString}
            </span>
          </div>
        </div>
      </div>
    </div>

  );
};

export default NhicMedicalAidForm; 