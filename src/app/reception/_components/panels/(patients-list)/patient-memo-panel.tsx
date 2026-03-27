"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Loader2, Pin } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePatientChat } from "@/hooks/patient-chat/use-patient-chat";
import { usePatientChatUnread } from "@/hooks/patient-chat/use-patient-chat-unread";
import { useUserStore } from "@/store/user-store";
import type { PatientChatMessage } from "@/types/patient-chat-types";
import PatientMessageItem from "@/components/patient-chat/patient-message-item";
import PatientChatInput, { type EditingMessage } from "@/components/reception/board-patient/(patient-info)/patient-chat/patient-chat-input";

// ===== 날짜 구분선 + 가상화 아이템 타입 =====

type VirtualRow =
  | { kind: "date"; date: string; key: string }
  | { kind: "memo"; message: PatientChatMessage; key: string };

function toDateString(dateTime: string) {
  const d = new Date(dateTime);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const toYmd = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

  if (dateStr === toYmd(today)) return "오늘";
  if (dateStr === toYmd(yesterday)) return "어제";

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${dayNames[d.getDay()]}요일`;
}

function buildVirtualRows(messages: PatientChatMessage[]): VirtualRow[] {
  const rows: VirtualRow[] = [];
  let lastDate = "";

  for (const msg of messages) {
    const date = toDateString(msg.createDateTime);
    if (date !== lastDate) {
      rows.push({ kind: "date", date, key: `date-${date}` });
      lastDate = date;
    }
    rows.push({ kind: "memo", message: msg, key: `msg-${msg.id}` });
  }

  return rows;
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="shrink-0 text-[11px] font-medium text-gray-400">
        {formatDateLabel(date)}
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

// ===== 메인 패널 =====

interface PatientMemoPanelProps {
  patientId: number | string | undefined | null;
  onMessagesViewed?: () => void;
  hideInput?: boolean;
}

export default function PatientMemoPanel({
  patientId,
  onMessagesViewed,
  hideInput = false,
}: PatientMemoPanelProps) {
  const {
    messages,
    pinnedMessages,
    isLoading,
    sendMessage,
    updateMessage,
    deleteMessage,
    isSending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePatientChat(patientId);

  const { user } = useUserStore();
  const currentUserId = user?.id ?? 0;
  const { markAsRead } = usePatientChatUnread(patientId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const shouldScrollRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initialScrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [pinnedVisible, setPinnedVisible] = useState(true);
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(null);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);

  // patientId 변경 시 리셋
  useEffect(() => {
    setIsInitialScrollDone(false);
    prevMessageCountRef.current = 0;
    clearTimeout(initialScrollTimerRef.current);
  }, [patientId]);

  const sortedMessages = useMemo(() => [...messages].reverse(), [messages]);
  const virtualRows = useMemo(() => buildVirtualRows(sortedMessages), [sortedMessages]);

  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (virtualRows[index]?.kind === "date" ? 32 : 64),
    overscan: 10,
    getItemKey: (index) => virtualRows[index]?.key ?? index,
  });

  // 메모 스크롤 관리: 초기 로드 시 opacity 패턴으로 점프 방지
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = sortedMessages.length;
    prevMessageCountRef.current = currentCount;

    if (currentCount === 0) return;

    const isInitialLoad = prevCount === 0;
    const isNewMessageAtBottom = currentCount > prevCount && prevCount > 0;

    if (isInitialLoad) {
      // 초기 로드: 스크롤 위치 잡은 후 보여주기
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(virtualRows.length - 1, { align: "end" });
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
          // measurement 안정화 후 최종 보정
          initialScrollTimerRef.current = setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
            setIsInitialScrollDone(true);
          }, 50);
        });
      });
    } else if (shouldScrollRef.current || (isAtBottomRef.current && isNewMessageAtBottom)) {
      // 새 메시지: 기존 방식
      shouldScrollRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      });
    }

    markAsRead();
    onMessagesViewed?.();
  }, [messages.length, markAsRead]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;

    // 스크롤 중 핀 숨김 → 멈추면 다시 표시
    setPinnedVisible(false);
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setPinnedVisible(true), 400);

    if (scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      const prevScrollHeight = scrollRef.current.scrollHeight;
      fetchNextPage().then(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            scrollRef.current.scrollTop += newScrollHeight - prevScrollHeight;
          }
        });
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSend = async (content: string) => {
    shouldScrollRef.current = true;
    await sendMessage(content);
  };

  const handleTogglePin = (id: number, isPinned: boolean) => {
    updateMessage({ id, data: { isPinned } });
  };

  const handleDelete = (id: number) => {
    deleteMessage(id);
  };

  const handleEditStart = (msg: PatientChatMessage) => {
    setEditingMessage({ id: msg.id, content: msg.content });
  };

  const handleSaveEdit = (id: number, content: string) => {
    updateMessage({ id, data: { content } });
    setEditingMessage(null);
  };

  return (
    <div className="flex h-full flex-col bg-[var(--bg-main)]">
      {/* 메모 리스트 (가상화) */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto"
        style={{ opacity: isInitialScrollDone || isLoading || virtualRows.length === 0 ? 1 : 0 }}
      >
        {/* 핀된 메모 — sticky, 스크롤 방향에 따라 표시/숨김 */}
        {pinnedMessages.length > 0 && (
          <div
            className="sticky top-0 z-10 border-b border-[var(--border-2)] bg-[var(--bg-2)] transition-transform duration-200"
            style={{ transform: pinnedVisible ? "translateY(0)" : "translateY(-100%)" }}
          >
            <button
              onClick={() => setPinnedOpen((prev) => !prev)}
              className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-[var(--gray-400)]"
            >
              <Pin size={12} />
              <span>핀된 메시지 ({pinnedMessages.length})</span>
              {pinnedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {pinnedOpen && (
              <div className="max-h-32 overflow-y-auto px-3 pb-2">
                {pinnedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="mb-1 rounded border-l-2 border-[var(--main-color-2-1)] bg-[var(--bg-main)] px-2 py-1 text-xs"
                  >
                    <span className="font-medium text-[var(--gray-400)]">
                      {msg.authorName}
                    </span>
                    <div
                      className="text-[var(--main-color)] [&_p]:m-0"
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-2">
            <Loader2 size={14} className="animate-spin text-gray-400" />
            <span className="ml-1 text-xs text-gray-400">이전 메모 로딩...</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            로딩 중...
          </div>
        ) : virtualRows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            메모가 없습니다.
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const row = virtualRows[virtualItem.index];
              if (!row) return null;
              return (
                <div
                  key={row.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {row.kind === "date" ? (
                    <DateSeparator date={row.date} />
                  ) : (
                    <PatientMessageItem
                      message={row.message}
                      currentUserId={currentUserId}
                      onTogglePin={handleTogglePin}
                      onDelete={handleDelete}
                      onEditStart={handleEditStart}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 입력 */}
      {!hideInput && (
        <PatientChatInput
          onSend={handleSend}
          isSending={isSending}
          editingMessage={editingMessage}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingMessage(null)}
        />
      )}
    </div>
  );
}
