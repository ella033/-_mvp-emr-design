import type { ExternalReception } from "./types";

export interface NotPaidProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
  isDisabled?: boolean;
}

/**
 * 미수 / 환불 탭 (TODO)
 */
export function NotPaid({ reception, isDisabled }: NotPaidProps) {
  return (
    <div className="flex flex-col w-full h-full p-2 text-[var(--gray-100)]">
      <div className="mb-2 text-sm font-semibold">미수/환불</div>
      {!reception && (
        <div className="text-xs text-[var(--gray-60)]">
          선택된 접수 정보가 없습니다.
        </div>
      )}
      {reception && (
        <div className="text-xs space-y-1">
          <div>환자명: {reception.patientBaseInfo?.name ?? "-"}</div>
          <div className="mt-1 text-[var(--negative)]">
            현재는 미수/환불 작업이 불가능한 상태입니다.
          </div>
        </div>
      )}
    </div>
  );
}


