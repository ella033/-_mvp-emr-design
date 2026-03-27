"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { HospitalChatRoom } from "@/types/hospital-chat-types";

interface Props {
  room: HospitalChatRoom;
  isSelected: boolean;
  onClick: () => void;
}

export default function HospitalChatRoomItem({
  room,
  isSelected,
  onClick,
}: Props) {
  // HTML 태그 제거 (lastMessage content)
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  const lastMsg = room.lastMessage;
  const timeStr = lastMsg
    ? new Date(lastMsg.createDateTime).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors cursor-pointer",
        !room.color && (isSelected ? "bg-accent" : "hover:bg-accent/50")
      )}
      style={
        room.color
          ? {
              backgroundColor: isSelected
                ? `${room.color}30`
                : `${room.color}15`,
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (room.color && !isSelected) {
          e.currentTarget.style.backgroundColor = `${room.color}25`;
        }
      }}
      onMouseLeave={(e) => {
        if (room.color && !isSelected) {
          e.currentTarget.style.backgroundColor = `${room.color}15`;
        }
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[12px] font-medium truncate flex-1">
          {room.name}
        </span>
        {room.unreadCount > 0 && (
          <span className="flex items-center justify-center h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shrink-0">
            {room.unreadCount > 99 ? "99+" : room.unreadCount}
          </span>
        )}
      </div>
      {lastMsg && (
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate flex-1">
            {lastMsg.authorName}: {stripHtml(lastMsg.content)}
          </span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0">
            {timeStr}
          </span>
        </div>
      )}
    </button>
  );
}
