import React from 'react';
import { Clock } from 'lucide-react';

interface IntegrationSettingsProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  onSave: () => void;
  onCancel: () => void;
  fetchHospitalData: () => Promise<void>;
}

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({

}) => {
  return (
    <div className="h-full flex flex-col">
      {/* 메뉴 헤더 */}
      <div className="flex justify-between items-center mb-4 pb-2">
        <h2 className="text-lg py-1 font-bold text-[var(--main-color)]">연동 설정</h2>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className="text-gray-500 text-center">
          <Clock size={48} className="mx-auto mb-4 text-gray-300" />
          <div>연동설정 기능은 아직 구현되지 않았습니다.</div>
        </div>
      </div>
    </div>
  );
};
