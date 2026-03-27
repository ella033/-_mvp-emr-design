"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import PatientMemoPanel from "@/app/reception/_components/panels/(patients-list)/patient-memo-panel";
import { usePatientChatUnread } from "@/hooks/patient-chat/use-patient-chat-unread";

export default function PatientChatPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const patientName = searchParams.get("patientName") ?? "";
  const gender = searchParams.get("gender");
  const age = searchParams.get("age");

  const { markAsRead } = usePatientChatUnread(patientId);

  const genderLabel = gender === "1" ? "남" : gender === "2" ? "여" : "";
  const titleParts = [patientName];
  if (genderLabel || age) {
    titleParts.push(
      `(${[genderLabel, age ? `${age}세` : ""].filter(Boolean).join("/")})`
    );
  }
  const title = titleParts.filter(Boolean).join(" ") || "환자 채팅";

  // 윈도우 타이틀 설정
  useEffect(() => {
    document.title = title;
  }, [title]);

  // 열릴 때 읽음 처리
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // 최소 창 크기 제한 (420x400)
  useEffect(() => {
    const MIN_W = 420;
    const MIN_H = 400;
    const handleResize = () => {
      const needsResize =
        window.outerWidth < MIN_W || window.outerHeight < MIN_H;
      if (needsResize) {
        window.resizeTo(
          Math.max(window.outerWidth, MIN_W),
          Math.max(window.outerHeight, MIN_H)
        );
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!patientId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-sm text-[var(--gray-400)] bg-[var(--bg-main)]">
        환자 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--bg-main)]">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center justify-between border-b border-[var(--border-2)] px-4 py-2 select-none">
        <span className="text-sm font-medium text-[var(--main-color)]">
          {title}
        </span>
      </div>
      {/* 채팅 패널 */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PatientMemoPanel patientId={patientId} onMessagesViewed={markAsRead} />
      </div>
    </div>
  );
}
