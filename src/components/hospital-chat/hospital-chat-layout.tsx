"use client";

import React, { useState, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import { useHospitalChatRooms } from "@/hooks/hospital-chat/use-hospital-chat-rooms";
import HospitalChatRoomList from "./hospital-chat-room-list";
import HospitalChatMessageArea from "./hospital-chat-message-area";

interface Props {
  onMentionClick: (patientId: number, patientName?: string) => void;
}

export default function HospitalChatLayout({ onMentionClick }: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const { rooms } = useHospitalChatRooms();
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  const handleBack = useCallback(() => setSelectedRoomId(null), []);

  return (
    <div className="flex h-full">
      <HospitalChatRoomList
        selectedRoomId={selectedRoomId}
        onSelectRoom={setSelectedRoomId}
      />
      <div className="flex-1 min-w-0">
        {selectedRoom ? (
          <HospitalChatMessageArea
            room={selectedRoom}
            onBack={handleBack}
            onMentionClick={onMentionClick}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare size={32} className="opacity-40" />
            <span className="text-sm">채팅방을 선택하세요</span>
          </div>
        )}
      </div>
    </div>
  );
}
