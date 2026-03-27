import React from "react";

type ClaimStatus =
  | "pending"
  | "completed"
  | "check_required"
  | "transforming"
  | "launch_failed"
  | "program_not_installed";

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  className?: string;
}

export const ClaimStatusBadge: React.FC<ClaimStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  if (status === "check_required") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] ${className}`}
      >
        <img
          src="/icon/ic_line_alert-circle.svg"
          alt="점검필요"
          width={14}
          height={14}
        />
        <span className="text-[12px] font-medium leading-[1.4] tracking-[-0.12px] text-[#FF4242]">
          점검필요
        </span>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] ${className}`}
      >
        <span className="text-[12px] font-medium leading-[1.4] tracking-[-0.12px] text-[var(--gray-300)]">
          송신완료
        </span>
      </div>
    );
  }

  if (status === "transforming") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] ${className}`}
      >
        <img
          src="/icon/ic_filled_clock.svg"
          alt="변환중"
          width={14}
          height={14}
        />
        <span className="text-[12px] font-medium leading-[1.4] tracking-[-0.12px] text-[#7B5CFF]">
          변환중
        </span>
      </div>
    );
  }

  if (status === "launch_failed") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] ${className}`}
      >
        <img
          src="/icon/ic_line_alert-circle.svg"
          alt="호출실패"
          width={14}
          height={14}
        />
        <span className="text-[12px] font-medium leading-[1.4] tracking-[-0.12px] text-[#FF8A00]">
          호출실패
        </span>
      </div>
    );
  }

  if (status === "program_not_installed") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] ${className}`}
      >
        <img
          src="/icon/ic_line_alert-circle.svg"
          alt="프로그램미설치"
          width={14}
          height={14}
        />
        <span className="text-[12px] font-medium leading-[1.4] tracking-[-0.12px] text-[#FF8A00]">
          프로그램미설치
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-[4px] ${className}`}
    >
      <img
        src="/icon/ic_filled_clock.svg"
        alt="대기중"
        width={14}
        height={14}
      />
      <span className="text-[12px] font-medium leading-[1.4] tracking-[-0.12px] text-[#3385FF]">
        송신대기
      </span>
    </div>
  );
};
