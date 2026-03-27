"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp, Loader2, Pin } from "lucide-react";
import { useHospitalChat } from "@/hooks/hospital-chat/use-hospital-chat";
import { useHospitalChatRooms } from "@/hooks/hospital-chat/use-hospital-chat-rooms";
import { HospitalChatsService } from "@/services/hospital-chats-service";
import HospitalChatHeader from "./hospital-chat-header";
import HospitalChatMessageItem from "./hospital-chat-message-item";
import HospitalChatInput, { type HospitalEditingMessage } from "./hospital-chat-input";
import type { HospitalChatRoom, HospitalChatMessage, PatientMention } from "@/types/hospital-chat-types";

interface Props {
  room: HospitalChatRoom;
  onBack: () => void;
  onMentionClick: (patientId: number, patientName?: string) => void;
}

export default function HospitalChatMessageArea({
  room,
  onBack,
  onMentionClick,
}: Props) {
  const {
    messages,
    pinnedMessages,
    isLoading,
    sendMessage,
    updateMessage,
    deleteMessage,
    togglePin,
    isSending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHospitalChat(room.id);

  const { invalidateRooms, clearRoomUnread } = useHospitalChatRooms();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevMessageCountRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [pinnedVisible, setPinnedVisible] = useState(true);
  const [editingMessage, setEditingMessage] = useState<HospitalEditingMessage | null>(null);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);

  // 메시지를 시간순(오래된 것부터)으로 표시
  const sortedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // room 변경 시 리셋
  useEffect(() => {
    setIsInitialScrollDone(false);
    prevMessageCountRef.current = 0;
  }, [room.id]);

  // 메시지 스크롤: 초기 로드 시 instant, 새 메시지 시 smooth
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = sortedMessages.length;
    prevMessageCountRef.current = currentCount;

    if (currentCount === 0) return;

    if (prevCount === 0) {
      // 초기 로드: instant 스크롤 후 보여주기
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "instant" });
        setIsInitialScrollDone(true);
      });
    } else if (isAtBottomRef.current) {
      // 새 메시지 + 하단에 있을 때만: smooth 스크롤
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sortedMessages.length]);

  // 읽음 처리: 방 진입 시 + 새 메시지 수신 시
  useEffect(() => {
    if (!room.id) return;

    clearRoomUnread(room.id);
    HospitalChatsService.markAsRead(room.id).then(() => {
      invalidateRooms();
    });
  }, [room.id, messages.length, invalidateRooms, clearRoomUnread]);

  // 무한 스크롤 + 핀 섹션 스크롤 시 숨김/멈추면 표시
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;

    if (!isFetchingNextPage && hasNextPage && scrollTop < 50) {
      fetchNextPage();
    }

    setPinnedVisible(false);
    clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => setPinnedVisible(true), 400);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleSend = async (content: string, mentions?: PatientMention[]) => {
    await sendMessage({ content, mentions });
    // 서버에서 발신자 자동 읽음처리하므로 rooms만 갱신하면 unreadCount: 0 반영됨
    invalidateRooms();
  };

  const handleEditStart = (msg: HospitalChatMessage) => {
    setEditingMessage({ id: msg.id, content: msg.content });
  };

  const handleSaveEdit = async (id: number, content: string) => {
    await updateMessage({ msgId: id, content });
    setEditingMessage(null);
  };

  const handleDelete = async (msgId: number) => {
    await deleteMessage(msgId);
  };

  const handleTogglePin = async (msgId: number, isPinned: boolean) => {
    await togglePin({ msgId, isPinned });
  };

  // 날짜 구분용: 메시지별 날짜 키 (YYYY-MM-DD)
  const getDateKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(d, today)) return "오늘";
    if (isSameDay(d, yesterday)) return "어제";

    const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
  };

  // 배경색 스타일
  const bgStyle = room.color
    ? { backgroundColor: `${room.color}10` }
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <HospitalChatHeader room={room} onBack={onBack} />

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ ...bgStyle, opacity: isInitialScrollDone || isLoading || sortedMessages.length === 0 ? 1 : 0 }}
        onScroll={handleScroll}
      >
        {/* 핀된 메시지 — sticky, 스크롤 시 숨김/멈추면 표시 */}
        {pinnedMessages.length > 0 && (
          <div
            className="sticky top-0 z-10 border-b bg-muted/30 transition-transform duration-200"
            style={{ transform: pinnedVisible ? "translateY(0)" : "translateY(-100%)" }}
          >
            <button
              onClick={() => setPinnedOpen((prev) => !prev)}
              className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground"
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
                    className="mb-1 rounded border-l-2 border-[var(--main-color-2-1)] bg-background px-2 py-1 text-xs"
                  >
                    <span className="font-medium text-muted-foreground">
                      {msg.authorName}
                    </span>
                    <div
                      className="text-foreground [&_p]:m-0"
                      onClick={(e) => {
                        const target = (e.target as HTMLElement).closest(
                          '[data-type="patient-mention"]'
                        );
                        if (target) {
                          const el = target as HTMLElement;
                          const patientId = Number(el.dataset.patientId);
                          const patientName = el.dataset.patientName || undefined;
                          if (patientId) onMentionClick(patientId, patientName);
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: msg.content }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            메시지가 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          <div className="py-2">
            {sortedMessages.map((msg, idx) => {
              const curDate = getDateKey(msg.createDateTime);
              const prevDate = idx > 0 ? getDateKey(sortedMessages[idx - 1].createDateTime) : null;
              const showDateSeparator = curDate !== prevDate;

              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="flex-1 border-t border-muted-foreground/20" />
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDateLabel(msg.createDateTime)}
                      </span>
                      <div className="flex-1 border-t border-muted-foreground/20" />
                    </div>
                  )}
                  <HospitalChatMessageItem
                    message={msg}
                    onEditStart={handleEditStart}
                    onDelete={handleDelete}
                    onMentionClick={onMentionClick}
                    onTogglePin={handleTogglePin}
                  />
                </React.Fragment>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <HospitalChatInput
        onSend={handleSend}
        disabled={isSending}
        editingMessage={editingMessage}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
