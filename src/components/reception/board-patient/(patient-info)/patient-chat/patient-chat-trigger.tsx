"use client";

import React, { useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatientChatUnread } from "@/hooks/patient-chat/use-patient-chat-unread";

// 싱글톤: 채팅 PiP/팝업 창은 항상 1개만 유지
let pipWindow: Window | null = null;

function buildChatUrl(
  patientId: string | number,
  patientName?: string,
  gender?: number,
  age?: number
) {
  const params = new URLSearchParams();
  params.set("patientId", String(patientId));
  if (patientName) params.set("patientName", patientName);
  if (gender != null) params.set("gender", String(gender));
  if (age != null) params.set("age", String(age));
  return `/patient-chat?${params.toString()}`;
}

interface PatientChatTriggerProps {
  patientId: number | string | undefined | null;
  patientName?: string;
  gender?: number;
  age?: number;
}

export default function PatientChatTrigger({
  patientId,
  patientName,
  gender,
  age,
}: PatientChatTriggerProps) {
  const { unreadCount, markAsRead } = usePatientChatUnread(patientId);
  // 환자 변경 시 열린 팝업 창 자동 업데이트
  useEffect(() => {
    if (!patientId) return;
    if (pipWindow && !pipWindow.closed) {
      const url = buildChatUrl(patientId, patientName, gender, age);
      pipWindow.location.href = url;
      markAsRead();
    }
  }, [patientId]);

  const handleOpen = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!patientId) return;

      // 이미 열려있으면 포커스
      if (pipWindow && !pipWindow.closed) {
        pipWindow.focus();
        markAsRead();
        return;
      }

      // 새 창으로 열기
      const url = buildChatUrl(patientId, patientName, gender, age);
      const popup = window.open(
        url,
        "patient-chat",
        [
          "width=420",
          "height=600",
          "top=0",
          "left=0",
          "menubar=no",
          "toolbar=no",
          "location=no",
          "status=no",
          "resizable=yes",
          "scrollbars=no",
        ].join(",")
      );
      if (popup) {
        pipWindow = popup;
        markAsRead();
      }
    },
    [patientId, patientName, gender, age, markAsRead]
  );

  if (!patientId) return null;

  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleOpen}
        className={cn(
          "relative inline-flex items-center justify-center rounded p-0.5 transition-colors",
          "text-[var(--gray-400)] hover:text-[var(--main-color-2-1)] hover:bg-[var(--bg-2)]"
        )}
        title="환자 채팅"
      >
        <MessageCircle size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
