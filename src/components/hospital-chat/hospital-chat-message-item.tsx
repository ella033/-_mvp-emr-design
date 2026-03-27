"use client";

import React from "react";
import { Pencil, Trash2, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/store/user-store";
import type { HospitalChatMessage } from "@/types/hospital-chat-types";

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

interface Props {
  message: HospitalChatMessage;
  onEditStart: (message: HospitalChatMessage) => void;
  onDelete: (msgId: number) => void;
  onMentionClick: (patientId: number, patientName?: string) => void;
  onTogglePin: (msgId: number, isPinned: boolean) => void;
}

export default function HospitalChatMessageItem({
  message,
  onEditStart,
  onDelete,
  onMentionClick,
  onTogglePin,
}: Props) {
  const { user } = useUserStore();
  const isMe = message.authorId === user?.id;

  const handleContentClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest(
      '[data-type="patient-mention"]'
    );
    if (target) {
      const el = target as HTMLElement;
      const patientId = Number(el.dataset.patientId);
      const patientName = el.dataset.patientName || undefined;
      if (patientId) onMentionClick(patientId, patientName);
    }
  };

  const time = new Date(message.createDateTime).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn("group flex gap-2 px-3 py-1", isMe && "flex-row-reverse")}
    >
      {/* 아바타 (상대 메시지만) */}
      {!isMe && (
        <Avatar className="size-7 shrink-0 mt-4">
          <AvatarFallback
            className={cn(
              "text-[11px] font-medium text-white",
              getAvatarColor(message.authorId)
            )}
          >
            {message.authorName.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col gap-0.5 min-w-0",
          isMe ? "items-end" : "items-start"
        )}
      >
        {/* 작성자명 (상대만) */}
        {!isMe && (
          <span className="text-[11px] font-medium text-muted-foreground">
            {message.authorName}
          </span>
        )}

        <div
          className={cn(
            "flex items-end gap-1.5",
            isMe && "flex-row-reverse"
          )}
        >
          {/* 메시지 버블 */}
          <div
            className={cn(
              "max-w-[75%] rounded-lg px-3 py-2 text-[13px] leading-relaxed break-words [&_p]:m-0",
              isMe
                ? "bg-[var(--main-color-2-1)] text-white chat-bubble-mine"
                : "bg-muted text-foreground"
            )}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: message.content }}
          />

          {/* 핀 표시 (고정된 경우 항상) */}
          {message.isPinned && (
            <button
              onClick={() => onTogglePin(message.id, false)}
              className="shrink-0 rounded p-1 bg-[var(--main-color-2-1)] text-white"
              title="핀 해제"
            >
              <Pin size={11} fill="currentColor" />
            </button>
          )}

          {/* 액션 버튼 (hover 시) */}
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {!message.isPinned && (
              <button
                onClick={() => onTogglePin(message.id, true)}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                title="핀 설정"
              >
                <Pin size={12} />
              </button>
            )}
            {isMe && (
              <button
                onClick={() => onEditStart(message)}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                title="수정"
              >
                <Pencil size={12} />
              </button>
            )}
            {isMe && (
              <button
                onClick={() => onDelete(message.id)}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-red-500"
                title="삭제"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 시간 */}
        <span
          className={cn(
            "text-[10px] text-muted-foreground/60",
            isMe && "text-right"
          )}
        >
          {time}
          {message.updateDateTime && " (수정됨)"}
        </span>
      </div>
    </div>
  );
}
