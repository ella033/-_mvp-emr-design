"use client";

import { useCallback, useState, useEffect, useRef } from "react";

// 싱글톤: 환자 채팅 PiP 창은 항상 1개만 유지
let patientPipWindow: Window | null = null;

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

function buildChatUrl(patientId: number, patientName?: string) {
  const params = new URLSearchParams();
  params.set("patientId", String(patientId));
  if (patientName) params.set("patientName", patientName);
  return `/patient-chat?${params.toString()}`;
}

export interface PatientChatPipState {
  container: HTMLElement | null;
  patientId: number | null;
  patientName: string | null;
}

/**
 * 환자 채팅 PiP/팝업을 여는 재사용 가능한 hook.
 * Document PiP를 우선 시도하고, 실패 시 window.open fallback.
 *
 * PiP 모드에서는 pipState를 반환하여 호출측에서 createPortal로 렌더링.
 */
export function useOpenPatientChat() {
  const [pipState, setPipState] = useState<PatientChatPipState>({
    container: null,
    patientId: null,
    patientName: null,
  });
  const isPipOwnerRef = useRef(false);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isPipOwnerRef.current && patientPipWindow && !patientPipWindow.closed) {
        patientPipWindow.close();
        patientPipWindow = null;
      }
    };
  }, []);

  const openPatientChat = useCallback(
    async (patientId: number, patientName?: string) => {
      if (!patientId) return;

      // 이미 PiP가 열려 있으면 환자만 교체
      if (patientPipWindow && !patientPipWindow.closed) {
        // PiP 모드(portal)인 경우 state만 업데이트
        if (isPipOwnerRef.current && pipState.container) {
          setPipState((prev) => ({
            ...prev,
            patientId,
            patientName: patientName ?? null,
          }));
          patientPipWindow.focus();
          return;
        }
        // fallback(window.open) 모드인 경우 URL 교체
        const url = buildChatUrl(patientId, patientName);
        patientPipWindow.location.href = url;
        patientPipWindow.focus();
        return;
      }

      // Document PiP 시도
      if ("documentPictureInPicture" in window) {
        try {
          const pip: Window = await (
            window as any
          ).documentPictureInPicture.requestWindow({
            width: 420,
            height: 600,
          });

          patientPipWindow = pip;
          isPipOwnerRef.current = true;

          copyStylesToPip(pip);

          pip.document.body.style.margin = "0";
          pip.document.body.style.overflow = "hidden";
          pip.document.title = patientName
            ? `${patientName} - 환자 채팅`
            : "환자 채팅";

          const container = pip.document.createElement("div");
          container.style.width = "100%";
          container.style.height = "100vh";
          pip.document.body.appendChild(container);

          setPipState({
            container,
            patientId,
            patientName: patientName ?? null,
          });

          pip.addEventListener("pagehide", () => {
            patientPipWindow = null;
            isPipOwnerRef.current = false;
            setPipState({
              container: null,
              patientId: null,
              patientName: null,
            });
          });
          return;
        } catch (err) {
          console.warn("Document PiP 실패, window.open 대체:", err);
        }
      }

      // Fallback: window.open
      const url = buildChatUrl(patientId, patientName);
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
        patientPipWindow = popup;
      }
    },
    [pipState.container]
  );

  return { openPatientChat, pipState };
}
