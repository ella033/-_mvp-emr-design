"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useClear } from "@/contexts/ClearContext";
import type { Reception } from "@/types/common/reception-types";
import { useMemoInfoReception } from "@/hooks/reception/patient-info/use-memo-info-reception";
import { cn } from "@/lib/utils";
import { usePatientChat } from "@/hooks/patient-chat/use-patient-chat";
import PatientChatTrigger from "./patient-chat/patient-chat-trigger";

interface MemoInfoProps {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
  /**
   * 카드(컨테이너) 라운딩 변형
   * - standalone: 단독 카드
   * - mergedTop: 아래 카드와 붙는 상단 카드(하단 라운딩 제거)
   * - mergedBottom: 위 카드와 붙는 하단 카드(상단 라운딩 제거)
   */
  cardVariant?: "standalone" | "mergedTop" | "mergedBottom";
  /** 루트 컨테이너 클래스 확장 */
  className?: string;
  /** 마지막 포커스 섹션 하이라이트 */
  isHighlighted?: boolean;
  /** 각 메모(환자 메모/접수메모) 영역 높이(px). basic-info와 병합모드일 때는 100 그 외는 150 권장 */
  memoHeightPx?: number;
}

export default function MemoInfo({
  reception: externalReception,
  receptionId: externalReceptionId,
  isDisabled = false,
  onUpdateReception,
  cardVariant = "standalone",
  className,
  isHighlighted = false,
  memoHeightPx = 150,
}: MemoInfoProps) {
  const {
    currentReception,
    markChangedOnce,
    updateReceptionMemo,
    clearMemoInfoToReception,
  } = useMemoInfoReception({
    reception: externalReception,
    receptionId: externalReceptionId,
    onUpdateReception,
  });

  const patientId = currentReception?.patientBaseInfo?.patientId;

  // 환자 채팅 데이터
  const { messages } = usePatientChat(patientId);

  // 가장 마지막 메시지 1개
  const lastMessage = useMemo(() => {
    if (messages.length === 0) return null;
    // messages는 최신순(desc) → 첫 번째가 가장 최근
    return messages[0];
  }, [messages]);

  // 접수 메모 로컬 상태
  const [localReceptionMemo, setLocalReceptionMemo] = useState("");

  // 초기값 refs (Dirty 감지용)
  const initialReceptionMemoRef = useRef<string>("");

  // Clear Context 등록
  const { registerMyClear, unregisterMyClear } = useClear("memo-info");

  // Clear 함수 정의
  const clearMemoInfo = useCallback(() => {
    setLocalReceptionMemo("");
    clearMemoInfoToReception();
  }, [clearMemoInfoToReception]);

  // Clear 함수 등록/해제
  useEffect(() => {
    registerMyClear(clearMemoInfo);
    return () => {
      unregisterMyClear();
    };
  }, [registerMyClear, unregisterMyClear, clearMemoInfo]);

  // 접수 메모 동기화 (props reception 우선) + 초기값 저장
  useEffect(() => {
    const patientInfo = currentReception?.patientBaseInfo;
    const memo = patientInfo?.receptionMemo || "";
    setLocalReceptionMemo(memo);
    initialReceptionMemoRef.current = memo;
  }, [currentReception?.patientBaseInfo?.receptionMemo]);

  const editableBgClass = isDisabled ? "bg-[var(--bg-3)]" : "bg-[var(--bg-main)]";

  const cardClassName = cn(
    "flex flex-col w-full p-1",
    cardVariant === "standalone" &&
    "rounded-md bg-[var(--bg-1)] border border-transparent transition-colors focus-within:border-[var(--main-color-2-1)] focus-within:bg-[var(--bg-base1)]",
    cardVariant === "standalone" &&
    isHighlighted &&
    "border-[var(--main-color-2-1)] bg-[var(--bg-base1)]",
    cardVariant === "mergedBottom" && "rounded-b-md rounded-t-none",
    className
  );

  return (
    <div className={cardClassName}>
      <div className="p-2 pt-0">
        <div className="flex gap-4 w-full">
          {/* 환자 메모 (채팅 미리보기) */}
          <div
            data-focus-target="patient-memo"
            className={cn(
              "flex flex-col gap-1 flex-1",
              isDisabled && "pointer-events-none opacity-90"
            )}
          >
            <div className="flex items-center gap-1">
              <label className="text-sm text-[var(--gray-300)]">환자 메모</label>
              <div className="pointer-events-auto">
                <PatientChatTrigger
                  patientId={patientId}
                  patientName={currentReception?.patientBaseInfo?.name}
                  gender={currentReception?.patientBaseInfo?.gender}
                  age={currentReception?.patientBaseInfo?.age}
                />
              </div>
            </div>
            <div
              className={cn(
                "flex flex-col text-sm border border-[var(--border-2)] rounded-md w-full overflow-hidden",
                editableBgClass
              )}
              style={{ height: `${memoHeightPx}px` }}
            >
              {/* 마지막 메시지 */}
              <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1">
                {!lastMessage ? (
                  <div className="flex items-center justify-center h-full text-[11px] text-[var(--gray-500)]">
                    메시지가 없습니다
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div
                      className="flex-1 text-[12px] text-[var(--main-color)] [&_p]:m-0 break-words overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: lastMessage.content }}
                    />
                    <div className="shrink-0 text-[10px] text-[var(--gray-500)] text-right mt-1">
                      {lastMessage.authorName} · {new Date(lastMessage.createDateTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 접수 메모 */}
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm text-[var(--gray-300)]">접수메모</label>
            <textarea
              placeholder="접수메모"
              value={localReceptionMemo}
              onFocus={(e) => {
                e.target.setAttribute("data-previous-value", localReceptionMemo);
              }}
              onChange={(e) => {
                if (document.activeElement === e.target) {
                  const value = e.target.value;
                  setLocalReceptionMemo(value);
                  markChangedOnce();
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value !== initialReceptionMemoRef.current) {
                  updateReceptionMemo(value);
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" && e.ctrlKey) || e.key === "Tab") {
                  if (localReceptionMemo !== initialReceptionMemoRef.current) {
                    updateReceptionMemo(localReceptionMemo);
                  }
                }
              }}
              className={`text-sm text-[var(--main-color)] border border-[var(--border-2)] rounded-md p-2 resize-none w-full overflow-y-auto ${editableBgClass}`}
              style={{
                height: `${memoHeightPx}px`,
                outline: "none",
              }}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
