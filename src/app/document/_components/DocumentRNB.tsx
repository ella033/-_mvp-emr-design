'use client';

import { Settings } from 'lucide-react';
import VisitHistoryTab from './VisitHistoryTab';
import { useState } from 'react';
import DocumentSettingsDialog from './DocumentSettingsDialog';

export default function DocumentRNB() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div
      className="w-full h-full bg-white flex flex-col overflow-hidden rounded-[6px] border border-[#DBDCDF]"
      style={{ minWidth: '200px' }}
    >
      <div className="flex items-center justify-between bg-[#f4f4f5] border-b border-[#dbdcdf] pr-[12px] h-[36px]">
        <div className="relative h-full px-[12px] py-[9px] text-[13px] font-bold text-[#180f38]">
          내원이력
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#180f38]" />
        </div>
        {/* FIXME: 서식 설정 기능 구현되면 다시 복구 */}
        {/* <button
          className="p-1 hover:bg-gray-200 rounded"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="w-4 h-4 text-[#46474c]" />
        </button> */}
      </div>
      <div className="flex-1 overflow-hidden">
        <VisitHistoryTab />
      </div>

      <DocumentSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}


