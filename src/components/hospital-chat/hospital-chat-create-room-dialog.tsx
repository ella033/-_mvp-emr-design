"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { HospitalChatsService } from "@/services/hospital-chats-service";
import { useQueryClient } from "@tanstack/react-query";
import { useHospitalUsersQuery } from "@/hooks/permissions/use-permission-queries";
import { useUserStore } from "@/store/user-store";
import { useHospitalStore } from "@/store/hospital-store";

interface Props {
  onCreated?: (roomId: number) => void;
}

export default function HospitalChatCreateRoomDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { hospital } = useHospitalStore();
  const { data: hospitalUsers } = useHospitalUsersQuery(hospital.id);
  const panelRef = useRef<HTMLDivElement>(null);

  const otherUsers = (hospitalUsers ?? []).filter(
    (u: any) => u.id !== user?.id
  );

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedUserIds.length === 0) return;
    setIsCreating(true);
    try {
      const room = await HospitalChatsService.createRoom(
        name.trim(),
        selectedUserIds
      );
      queryClient.invalidateQueries({ queryKey: ["hospital-chat-rooms"] });
      setOpen(false);
      setName("");
      setSelectedUserIds([]);
      if (onCreated) onCreated((room as any).id);
    } finally {
      setIsCreating(false);
    }
  };

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // ownerDocument를 사용하여 PiP 윈도우에서도 동작
    const doc = panelRef.current?.ownerDocument ?? document;
    doc.addEventListener("mousedown", handleClick);
    return () => doc.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const doc = panelRef.current?.ownerDocument ?? document;
    doc.addEventListener("keydown", handleKey);
    return () => doc.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button
        className="p-1 rounded hover:bg-accent transition-colors"
        title="채팅방 만들기"
        onClick={() => setOpen(true)}
      >
        <Plus size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={panelRef}
            className="bg-background border rounded-lg shadow-lg w-full max-w-sm p-6 relative"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>

            <h3 className="text-sm font-semibold mb-4">새 채팅방</h3>

            <div className="flex flex-col gap-3">
              <input
                className="border rounded px-3 py-2 text-sm bg-background"
                placeholder="채팅방 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <div className="text-xs text-muted-foreground">멤버 선택</div>
              <div className="max-h-[200px] overflow-y-auto border rounded p-1.5 flex flex-col gap-0.5">
                {otherUsers.length === 0 && (
                  <div className="text-xs text-muted-foreground p-2">
                    초대 가능한 멤버가 없습니다.
                  </div>
                )}
                {otherUsers.map((u: any) => (
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
              <button
                onClick={handleCreate}
                disabled={!name.trim() || selectedUserIds.length === 0 || isCreating}
                className="w-full py-2 rounded bg-[var(--main-color-2-1)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isCreating ? "생성 중..." : "채팅방 만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
