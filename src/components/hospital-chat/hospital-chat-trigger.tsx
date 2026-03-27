"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageSquare } from "lucide-react";
import { useHospitalChatUnread } from "@/hooks/hospital-chat/use-hospital-chat-unread";
import HospitalChatLayout from "./hospital-chat-layout";

// 싱글톤: 그룹 채팅 PiP/팝업 창은 항상 1개만 유지
let pipWindow: Window | null = null;

/** 메인 문서의 스타일을 PiP 윈도우에 복사 */
function copyStylesToPip(pip: Window) {
  const base = pip.document.createElement("base");
  base.href = window.location.origin;
  pip.document.head.appendChild(base);

  const srcHtml = document.documentElement;
  pip.document.documentElement.className = srcHtml.className;
  for (const attr of srcHtml.attributes) {
    if (attr.name.startsWith("data-") || attr.name === "style") {
      pip.document.documentElement.setAttribute(attr.name, attr.value);
    }
  }

  document
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((el) => {
      pip.document.head.appendChild(el.cloneNode(true));
    });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node instanceof HTMLStyleElement ||
          (node instanceof HTMLLinkElement && node.rel === "stylesheet")
        ) {
          pip.document.head.appendChild(node.cloneNode(true));
        }
      }
    }
  });
  observer.observe(document.head, { childList: true });
  pip.addEventListener("pagehide", () => observer.disconnect());
}

// 환자 채팅 팝업 싱글톤
let patientPopup: Window | null = null;

function buildPatientChatUrl(patientId: number, patientName?: string) {
  const params = new URLSearchParams();
  params.set("patientId", String(patientId));
  if (patientName) params.set("patientName", patientName);
  return `/patient-chat?${params.toString()}`;
}

export default function HospitalChatTrigger() {
  const { totalUnread } = useHospitalChatUnread();
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const isPipOwnerRef = useRef(false);

  // @mention 클릭 → window.open으로 환자 채팅 팝업
  const handleMentionClick = useCallback((patientId: number, patientName?: string) => {
    if (!patientId) return;

    const url = buildPatientChatUrl(patientId, patientName);

    // 이미 열려 있으면 URL만 교체 후 포커스
    if (patientPopup && !patientPopup.closed) {
      patientPopup.location.href = url;
      patientPopup.focus();
      return;
    }

    patientPopup = window.open(
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
  }, []);

  // 컴포넌트 언마운트 시 PiP 정리
  useEffect(() => {
    return () => {
      if (isPipOwnerRef.current && pipWindow && !pipWindow.closed) {
        pipWindow.close();
        pipWindow = null;
      }
    };
  }, []);

  const handleOpen = useCallback(async () => {
    // 이미 열려있으면 포커스
    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();
      return;
    }

    // Document PiP 시도
    if ("documentPictureInPicture" in window) {
      try {
        const pip: Window = await (
          window as any
        ).documentPictureInPicture.requestWindow({
          width: 600,
          height: 700,
        });

        pipWindow = pip;
        isPipOwnerRef.current = true;

        copyStylesToPip(pip);

        pip.document.body.style.margin = "0";
        pip.document.body.style.overflow = "hidden";
        pip.document.title = "그룹 채팅";

        const container = pip.document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100vh";
        pip.document.body.appendChild(container);

        setPipContainer(container);

        pip.addEventListener("pagehide", () => {
          pipWindow = null;
          isPipOwnerRef.current = false;
          setPipContainer(null);
        });
        return;
      } catch (err) {
        console.warn("Document PiP 실패, window.open 대체:", err);
      }
    }

    // Fallback: window.open
    const popup = window.open(
      "/hospital-chat",
      "hospital-chat",
      [
        "width=600",
        "height=700",
        "top=100",
        "left=100",
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
    }
  }, []);

  // Ctrl+L 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        handleOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex items-center justify-center p-1.5 rounded-md transition-colors hover:bg-accent/50 cursor-pointer"
        title="그룹 채팅 (Ctrl+L)"
      >
        <MessageSquare size={18} />
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* PiP 모드: React Portal로 채팅 레이아웃 렌더링 */}
      {pipContainer &&
        createPortal(
          <div className="flex flex-col h-full bg-background">
            <HospitalChatLayout onMentionClick={handleMentionClick} />
          </div>,
          pipContainer
        )}
    </>
  );
}
