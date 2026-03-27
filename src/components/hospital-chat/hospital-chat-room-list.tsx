"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useHospitalChatRooms } from "@/hooks/hospital-chat/use-hospital-chat-rooms";
import HospitalChatRoomItem from "./hospital-chat-room-item";
import HospitalChatCreateRoomDialog from "./hospital-chat-create-room-dialog";

interface Props {
  selectedRoomId: number | null;
  onSelectRoom: (roomId: number) => void;
}

export default function HospitalChatRoomList({
  selectedRoomId,
  onSelectRoom,
}: Props) {
  const { rooms, isLoading } = useHospitalChatRooms();

  return (
    <div className="flex flex-col h-full border-r w-[180px] shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-[12px] font-semibold">채팅방</span>
        <HospitalChatCreateRoomDialog
          onCreated={(roomId) => onSelectRoom(roomId)}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-[12px] text-muted-foreground p-4">
            채팅방이 없습니다.
            <br />
            새 채팅방을 만들어보세요!
          </div>
        ) : (
          rooms.map((room) => (
            <HospitalChatRoomItem
              key={room.id}
              room={room}
              isSelected={room.id === selectedRoomId}
              onClick={() => onSelectRoom(room.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
