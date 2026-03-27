import React from "react";

interface EtcInfoComputed {
  산정특례유형: number;
  산정특례유형명: string;
  특정기호?: string;
  등록번호?: string;
  등록일?: Date;
  등록일표시: string;
  종료일?: Date;
  종료일표시: string;
  상병코드?: string;
  상병일련번호?: string;
}

interface NhicDisregFormProps {
  etcInfo: EtcInfoComputed;
}

const NhicDisregForm: React.FC<NhicDisregFormProps> = ({ etcInfo }) => {
  return (
    <div className="bg-white border-t border-[var(--bg-4)]">
      <div className="grid grid-cols-4 ">
        {/* 첫 번째 행 */}

        <div className="col-span-4 px-3 py-1.5 text-sm font-semibold bg-[var(--bg-1)] text-gray-900 border-b border-[var(--border-1)] ">
          {etcInfo.산정특례유형명 || ""}
        </div>

        {/* 두 번째 행 */}
        <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] border-b border-[var(--border-1)] flex">
          특정기호
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-900 border-b border-[var(--border-1)]">
          {etcInfo.특정기호 || ""}
        </div>
        <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex border-b border-[var(--border-1)]">
          등록번호
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-900 border-b border-[var(--border-1)]">
          {etcInfo.등록번호 || ""}
        </div>

        {/* 세 번째 행 */}
        <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] border-b border-[var(--border-1)] flex">
          등록일
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-900 border-b border-[var(--border-1)]">
          {etcInfo.등록일표시}
        </div>
        <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex border-b border-[var(--border-1)]">
          종료일
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-900 border-b border-[var(--border-1)]">
          {etcInfo.종료일표시}
        </div>

        {/* 네 번째 행 */}
        <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex">
          상병코드
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-900 border-b border-[var(--border-1)]">
          {etcInfo.상병코드 || ""}
        </div>
        <div className="w-43 bg-[var(--bg-1)] px-3 py-1.5 text-sm font-medium text-[var(--gray-300)] flex">
          상병일련코드
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-900 border-b border-[var(--border-1)]">
          {etcInfo.상병일련번호 || ""}
        </div>
      </div>
    </div>
  );
};

export default NhicDisregForm;
