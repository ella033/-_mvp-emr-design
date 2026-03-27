"use client";

import React, { useState, useRef, useEffect } from "react";
import { Users, ChevronLeft, Settings, X, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HospitalChatsService } from "@/services/hospital-chats-service";
import { useHospitalUsersQuery } from "@/hooks/permissions/use-permission-queries";
import { useUserStore } from "@/store/user-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useQueryClient } from "@tanstack/react-query";
import type { HospitalChatRoom } from "@/types/hospital-chat-types";

interface Props {
  room: HospitalChatRoom;
  onBack: () => void;
}

export default function HospitalChatHeader({ room, onBack }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="shrink-0 flex items-center gap-2 border-b px-3 py-2 min-h-[44px]">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-accent md:hidden"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{room.name}</div>
          {room.description && (
            <div className="text-[11px] text-muted-foreground truncate">
              {room.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex -space-x-1">
            {/* {room.members.slice(0, 3).map((m) => (
              <Avatar key={m.userId} className="size-5 border-2 border-background">
                <AvatarFallback className="text-[9px]">
                  {m.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))} */}
            {room.members.length > 3 && (
              <div className="flex items-center justify-center size-5 rounded-full bg-muted text-[9px] border-2 border-background">
                +{room.members.length - 3}
              </div>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground ml-1">
            <Users size={12} className="inline" /> {room.members.length}
          </span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1 rounded hover:bg-accent transition-colors ml-1"
            title="채팅방 설정"
          >
            <Settings size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {settingsOpen && (
        <RoomSettingsPanel room={room} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

const ROOM_COLORS = [
  { value: "", label: "기본" },
  { value: "#3B82F6", label: "파랑" },
  { value: "#10B981", label: "초록" },
  { value: "#F59E0B", label: "노랑" },
  { value: "#EF4444", label: "빨강" },
  { value: "#8B5CF6", label: "보라" },
  { value: "#EC4899", label: "핑크" },
  { value: "#06B6D4", label: "청록" },
  { value: "#F97316", label: "주황" },
];

/** 채팅방 설정 인라인 모달 (PiP 호환) */
function RoomSettingsPanel({
  room,
  onClose,
}: {
  room: HospitalChatRoom;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { hospital } = useHospitalStore();
  const { data: hospitalUsers } = useHospitalUsersQuery(hospital.id);

  // 이름 수정
  const [roomName, setRoomName] = useState(room.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const nameChanged = roomName.trim() !== room.name;

  // 색상
  const [roomColor, setRoomColor] = useState(room.color ?? "");
  const [isSavingColor, setIsSavingColor] = useState(false);

  // 멤버 초대
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  const currentMemberIds = room.members.map((m) => m.userId);
  const invitableUsers = (hospitalUsers ?? []).filter(
    (u: any) => !currentMemberIds.includes(u.id)
  );

  const handleSaveName = async () => {
    if (!nameChanged || !roomName.trim()) return;
    setIsSavingName(true);
    try {
      await HospitalChatsService.updateRoom(room.id, { name: roomName.trim() });
      queryClient.invalidateQueries({ queryKey: ["hospital-chat-rooms"] });
    } finally {
      setIsSavingName(false);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleInvite = async () => {
    if (selectedUserIds.length === 0) return;
    setIsInviting(true);
    try {
      await HospitalChatsService.addMembers(room.id, selectedUserIds);
      queryClient.invalidateQueries({ queryKey: ["hospital-chat-rooms"] });
      setSelectedUserIds([]);
      setShowInvite(false);
    } finally {
      setIsInviting(false);
    }
  };

  // 바깥 클릭 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const doc = panelRef.current?.ownerDocument ?? document;
    doc.addEventListener("mousedown", handleClick);
    return () => doc.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  // ESC 닫기
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const doc = panelRef.current?.ownerDocument ?? document;
    doc.addEventListener("keydown", handleKey);
    return () => doc.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={panelRef}
        className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-5 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 opacity-70 hover:opacity-100"
        >
          <X size={16} />
        </button>

        <h3 className="text-sm font-semibold mb-4">채팅방 설정</h3>

        {/* 이름 수정 */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">
            채팅방 이름
          </label>
          <div className="flex gap-1.5">
            <input
              className="flex-1 border rounded px-3 py-1.5 text-sm bg-background"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
              }}
            />
            <button
              onClick={handleSaveName}
              disabled={!nameChanged || isSavingName}
              className="px-2 py-1.5 rounded bg-[var(--main-color-2-1)] text-white text-xs disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Check size={14} />
            </button>
          </div>
        </div>

        {/* 채팅방 색상 */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">
            채팅방 색상
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ROOM_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={async () => {
                  setRoomColor(c.value);
                  setIsSavingColor(true);
                  try {
                    await HospitalChatsService.updateRoom(room.id, {
                      color: c.value || undefined,
                    });
                    queryClient.invalidateQueries({ queryKey: ["hospital-chat-rooms"] });
                  } finally {
                    setIsSavingColor(false);
                  }
                }}
                className={cn(
                  "size-6 rounded-full border-2 transition-transform hover:scale-110",
                  roomColor === c.value
                    ? "border-foreground scale-110"
                    : "border-transparent"
                )}
                style={{ backgroundColor: c.value || "var(--background)" }}
                title={c.label}
              />
            ))}
            {isSavingColor && (
              <span className="text-[10px] text-muted-foreground">저장 중...</span>
            )}
          </div>
        </div>

        {/* 현재 멤버 */}
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1.5">
            멤버 ({room.members.length})
          </div>
          <div className="max-h-[120px] overflow-y-auto border rounded p-1.5 flex flex-col gap-0.5">
            {room.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-2 px-2 py-1 text-sm"
              >
                <Avatar className="size-5">
                  <AvatarFallback className="text-[9px]">
                    {m.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{m.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {m.type === 1 ? "의사" : m.type === 2 ? "간호사" : ""}
                </span>
                {m.userId === user?.id && (
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">나</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 멤버 초대 */}
        {!showInvite ? (
          <button
            onClick={() => setShowInvite(true)}
            disabled={invitableUsers.length === 0}
            className="flex items-center gap-1.5 text-xs text-[var(--main-color-2-1)] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            <UserPlus size={13} />
            멤버 초대
            {invitableUsers.length === 0 && (
              <span className="text-muted-foreground ml-1">(초대 가능한 멤버 없음)</span>
            )}
          </button>
        ) : (
          <div className="border rounded p-2">
            <div className="text-xs text-muted-foreground mb-1.5">초대할 멤버 선택</div>
            <div className="max-h-[140px] overflow-y-auto flex flex-col gap-0.5 mb-2">
              {invitableUsers.map((u: any) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{u.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {u.type === 1 ? "의사" : u.type === 2 ? "간호사" : ""}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleInvite}
                disabled={selectedUserIds.length === 0 || isInviting}
                className="flex-1 py-1.5 rounded bg-[var(--main-color-2-1)] text-white text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isInviting ? "초대 중..." : `${selectedUserIds.length}명 초대`}
              </button>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setSelectedUserIds([]);
                }}
                className="px-3 py-1.5 rounded border text-xs text-muted-foreground hover:bg-accent transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
