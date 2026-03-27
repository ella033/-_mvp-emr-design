import { MyPopupMsg } from "@/components/yjg/my-pop-up";
import type { DurCheckResult } from "@/services/agent/agent-dur-service";

export default function DurInfoPopup({
  durResult,
  setOpen
}: {
  durResult: DurCheckResult | null,
  setOpen: (open: boolean) => void
}) {
  return (
    <MyPopupMsg
      isOpen={true}
      onCloseAction={() => setOpen(false)}
      onConfirmAction={() => setOpen(false)}
      title="DUR 안내"
      msgType="error"
    >
      <div className="flex flex-col gap-[15px] max-w-[30vw]">
        {durResult?.DurMessage && (
          <div className="flex flex-col gap-[10px] bg-[var(--bg-1)] px-[16px] py-[12px] rounded-[5px]">
            <div className="flex flex-row items-center gap-[10px]">
              <span className="text-[12px] text-[var(--text-secondary)]">
                에러 코드
              </span>
              <span className="text-[12px] text-[var(--text-primary)]  whitespace-pre-line">
                {durResult?.ResultCode}
              </span>
            </div>
            <div className="flex flex-row items-center gap-[10px]">
              <span className="text-[12px] text-[var(--text-secondary)]">
                에러 내용
              </span>
              <span className="text-[12px] text-[var(--text-primary)]  whitespace-pre-line">
                {durResult.DurMessage}
              </span>
            </div>
          </div>
        )}
        {durResult?.AgentMessage && (
          <div className="text-[12px] bg-[var(--bg-1)] text-gray-600 whitespace-pre-line">
            [Agent 오류] {durResult?.AgentMessage}
          </div>
        )}
        <div className="flex flex-col gap-[10px] border border-[var(--border-1)] px-[16px] py-[12px] rounded-[5px]">
          <div className="text-[12px] text-[var(--text-primary)] font-bold">
            건강보험심사평가원 고객센터
          </div>
          <div className="flex flex-row items-center gap-[10px]">
            <span className="text-[12px] text-[var(--text-secondary)]">
              전화번호
            </span>
            <span className="text-[12px] text-[var(--text-primary)]  whitespace-pre-line">
              1644-2000 (내선: 평일 1번 / 주말 4번)
            </span>
          </div>
          <div className="flex flex-row items-center gap-[10px]">
            <span className="text-[12px] text-[var(--text-secondary)]">
              상담시간
            </span>
            <span className="text-[12px] text-[var(--text-primary)]  whitespace-pre-line">
              09:00 ~ 21:00 (월~토)
            </span>
          </div>
        </div>
      </div>
    </MyPopupMsg>
  )
}