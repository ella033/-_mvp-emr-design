"use client";
import { cn } from "@/lib/utils";
import type { AuthUserHospital } from "@/types/auth-types";

interface HospitalSelectProps {
  hospitals: AuthUserHospital[];
  onHospitalSelectAction: (hospitalId: number) => void;
  onCreateHospitalAction?: () => void;
  hideCreateHospital?: boolean;
}

export function HospitalSelect({
  hospitals,
  onHospitalSelectAction,
  onCreateHospitalAction,
  hideCreateHospital = false,
}: HospitalSelectProps) {
  // hospitalId가 0인 항목은 목록에서 제외 (로그인 후 병원 선택 리스트)
  const visibleHospitals = (hospitals ?? []).filter((h) => h.hospitalId !== 0);

  return (
    <div className="w-full max-w-md" data-testid="login-hospital-selection">
      {/* 제목 */}
      <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2" data-testid="login-hospital-selection-title">
        병원 선택
      </h1>
      <p className="text-base text-[var(--gray-500)] mb-8">
        아래 리스트 중 접속할 병원을 선택해주세요.
      </p>

      {/* 병원이 없을 때 표시되는 박스 */}
      {visibleHospitals.length === 0 && (
        <div
          className={cn(
            "w-full h-[120px] flex items-center justify-center text-[var(--gray-500)] text-base mb-8",
            "px-3 py-[10px] gap-[6px] rounded-md border-0 border-solid border-[var(--border-1)]",
            "bg-[var(--bg-1)]"
          )}
        >
          <label className="text-sm font-medium text-[var(--gray-300)]">
            소속된 병원이 없습니다
          </label>
        </div>
      )}

      {/* 병원 리스트 */}
      {visibleHospitals.length > 0 && (
        <div
          className="w-full h-[144px] overflow-y-auto mb-8 border border-solid border-[var(--border-1)] rounded-md flex items-start px-2 py-2"
          data-testid="login-hospital-list"
        >
          {visibleHospitals.map((h) => (
            <div
              key={h.hospitalId}
              onClick={() => onHospitalSelectAction(h.hospitalId)}
              data-testid="login-hospital-option"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 cursor-pointer transition-colors",
                "text-[var(--gray-100)] text-base",
                "hover:rounded hover:bg-[var(--violet-1)]"
              )}
            >
              {h.hospitalName} {h.isActive ? "" : "(정지)"}
            </div>
          ))}
        </div>
      )}

      {/* 병원 생성하기 링크 */}
      {!hideCreateHospital && (
        <div className="text-center mt-4">
          <span className="text-sm text-[var(--gray-500)] transition-colors">
            새로운 병원을 등록하시겠습니까?{" "}
            <button
              type="button"
              className="text-sm text-[var(--second-color)] underline cursor-pointer transition-colors"
              onClick={onCreateHospitalAction}
            >
              병원 생성하기
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
