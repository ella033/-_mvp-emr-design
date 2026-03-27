"use client";

import { memo, useMemo } from "react";
import { Pencil, Pin, Trash2, User } from "lucide-react";
import type { PatientChatMessage } from "@/types/patient-chat-types";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
];

function getAvatarColor(authorId: number) {
  return AVATAR_COLORS[Math.abs(authorId) % AVATAR_COLORS.length];
}

interface PatientMessageItemProps {
  message: PatientChatMessage;
  currentUserId: number;
  onTogglePin: (id: number, isPinned: boolean) => void;
  onDelete: (id: number) => void;
  onEditStart?: (message: PatientChatMessage) => void;
}

export default memo(function PatientMessageItem({
  message,
  currentUserId,
  onTogglePin,
  onDelete,
  onEditStart,
}: PatientMessageItemProps) {
  const isMine = message.authorId === currentUserId;

  const time = useMemo(
    () =>
      new Date(message.createDateTime).toLocaleString("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.createDateTime],
  );

  return (
    <div className="group border-b border-[var(--border-2)] px-3 py-2.5 hover:bg-[var(--bg-2)] transition-colors">
      {/* 헤더: 아바타 + 이름 + 시간 + 액션 */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-white ${getAvatarColor(message.authorId)}`}
        >
          <User size={14} strokeWidth={2.5} />
        </div>
        <span className="text-xs font-semibold text-[var(--main-color)]">
          {message.authorName}
        </span>
        <span className="text-[10px] text-[var(--gray-400)]">
          {time}
          {message.updateDateTime && " (수정됨)"}
        </span>

        {/* 핀 표시 */}
        {message.isPinned && (
          <Pin size={10} className="text-[var(--main-color-2-1)] fill-[var(--main-color-2-1)]" />
        )}

        {/* 액션 버튼 (hover) */}
        <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onTogglePin(message.id, !message.isPinned)}
            className="rounded p-1 text-[var(--gray-400)] hover:bg-[var(--bg-2)] hover:text-[var(--gray-500)]"
            title={message.isPinned ? "핀 해제" : "핀 설정"}
          >
            <Pin size={11} className={message.isPinned ? "fill-current" : ""} />
          </button>
          {isMine && onEditStart && (
            <button
              onClick={() => onEditStart(message)}
              className="rounded p-1 text-[var(--gray-400)] hover:bg-[var(--bg-2)] hover:text-[var(--gray-500)]"
              title="수정"
            >
              <Pencil size={11} />
            </button>
          )}
          {isMine && (
            <button
              onClick={() => onDelete(message.id)}
              className="rounded p-1 text-[var(--gray-400)] hover:bg-[var(--bg-2)] hover:text-red-500"
              title="삭제"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div
        className="pl-8 text-[13px] leading-relaxed text-[var(--main-color)] [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: message.content }}
      />
    </div>
  );
});
