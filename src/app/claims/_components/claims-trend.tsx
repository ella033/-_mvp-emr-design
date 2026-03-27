"use client";

const ClaimsTrend = () => {
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-[16px] font-bold text-[var(--gray-100)] leading-[1.4] tracking-[-0.16px]">
        청구추이
      </h2>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {/* 준비중 아이콘 */}
        <div className="w-16 h-16 flex items-center justify-center">
          <img 
            src="/icon/ic_line_준비중.svg" 
            alt="준비중" 
            width={64} 
            height={64}
          />
        </div>
        <div className="text-center">
          <p className="text-[20px] font-bold text-[var(--gray-200)] tracking-[-0.2px] leading-[1.55]">
            서비스 준비중입니다.
          </p>
          <p className="text-[14px] text-[var(--gray-400)] tracking-[-0.14px] leading-[1.57] mt-[2px]">
            데이터, 통계 기능을 준비 중에 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClaimsTrend;
