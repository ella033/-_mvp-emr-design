"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  createPopoutChannel,
  loadPopoutGeometry,
  addOpenPopout,
  removeOpenPopout,
  getOpenPopouts,
  type PopoutMessage,
} from "@/lib/popout-channel";

/** 열려 있는 팝아웃 창 참조 */
const popoutWindows = new Map<string, Window>();

export function usePopoutManager(options?: {
  onRedock?: (tabId: string) => void;
  onPopoutClosed?: (tabId: string) => void;
}) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const channel = createPopoutChannel();
    channelRef.current = channel;

    const handleMessage = (e: MessageEvent<PopoutMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "popout-opened":
          // 자식 창이 열렸음 확인
          addOpenPopout(msg.tabId);
          break;
        case "popout-closed":
          popoutWindows.delete(msg.tabId);
          removeOpenPopout(msg.tabId);
          optionsRef.current?.onPopoutClosed?.(msg.tabId);
          break;
        case "request-redock":
          popoutWindows.delete(msg.tabId);
          removeOpenPopout(msg.tabId);
          optionsRef.current?.onRedock?.(msg.tabId);
          break;
      }
    };
    channel.addEventListener("message", handleMessage);

    // 부모 창 닫힘 시 자식들에게 알림
    const handleBeforeUnload = () => {
      channel.postMessage({ type: "parent-closing" } satisfies PopoutMessage);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 기존 열린 팝아웃 목록 정리 (죽은 참조 제거)
    const openList = getOpenPopouts();
    for (const tabId of openList) {
      const win = popoutWindows.get(tabId);
      if (win && win.closed) {
        popoutWindows.delete(tabId);
        removeOpenPopout(tabId);
      }
    }

    return () => {
      channel.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      channel.close();
    };
  }, []);

  /** 팝아웃 창 열기 */
  const openPopoutWindow = useCallback((tabId: string) => {
    // 이미 열려 있으면 focus
    const existing = popoutWindows.get(tabId);
    if (existing && !existing.closed) {
      existing.focus();
      return;
    }

    // 저장된 geometry로 창 열기
    const geo = loadPopoutGeometry(tabId);
    const features = geo
      ? `left=${geo.x},top=${geo.y},width=${geo.w},height=${geo.h},resizable=yes`
      : "width=800,height=600,resizable=yes";

    const win = window.open(`/popout/${tabId}`, `popout-${tabId}`, features);
    if (win) {
      popoutWindows.set(tabId, win);
      addOpenPopout(tabId);
    }
  }, []);

  /** 팝아웃 창 닫기 */
  const closePopoutWindow = useCallback((tabId: string) => {
    const win = popoutWindows.get(tabId);
    if (win && !win.closed) {
      win.close();
    }
    popoutWindows.delete(tabId);
    removeOpenPopout(tabId);
  }, []);

  /** 해당 탭이 팝아웃 상태인지 확인 */
  const isTabInPopout = useCallback((tabId: string): boolean => {
    const win = popoutWindows.get(tabId);
    if (win && !win.closed) return true;
    // window 참조가 없지만 localStorage 목록에 있으면 다른 세션에서 열린 것
    return getOpenPopouts().includes(tabId);
  }, []);

  return {
    openPopoutWindow,
    closePopoutWindow,
    isTabInPopout,
  };
}
