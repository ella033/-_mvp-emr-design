"use client";

import { use, useEffect, useRef } from "react";
import {
  POPOUT_COMPONENT_MAP,
  isValidPopoutTabId,
  getPopoutTabTitle,
} from "@/components/ui/my-rc-dock/popout-component-map";
import {
  createPopoutChannel,
  savePopoutGeometry,
  removeOpenPopout,
  type PopoutMessage,
} from "@/lib/popout-channel";
import { MedicalUiProvider } from "@/app/medical/contexts/medical-ui-context";

interface PageProps {
  params: Promise<{ tabId: string }>;
}

export default function PopoutPage({ params }: PageProps) {
  const { tabId } = use(params);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!isValidPopoutTabId(tabId)) return;

    const channel = createPopoutChannel();
    channelRef.current = channel;

    // 부모에게 열림 알림
    channel.postMessage({
      type: "popout-opened",
      tabId,
    } satisfies PopoutMessage);

    // 창 제목 설정
    document.title = getPopoutTabTitle(tabId);

    // 부모 메시지 수신
    const handleMessage = (e: MessageEvent<PopoutMessage>) => {
      if (e.data.type === "parent-closing") {
        saveGeometry();
        window.close();
      }
    };
    channel.addEventListener("message", handleMessage);

    // 창 닫힘 시 geometry 저장 + 알림
    const handleBeforeUnload = () => {
      saveGeometry();
      channel.postMessage({
        type: "popout-closed",
        tabId,
        geometry: getCurrentGeometry(),
      } satisfies PopoutMessage);
      removeOpenPopout(tabId);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      channel.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      channel.close();
    };
  }, [tabId]);

  function getCurrentGeometry() {
    return {
      x: window.screenX,
      y: window.screenY,
      w: window.outerWidth,
      h: window.outerHeight,
    };
  }

  function saveGeometry() {
    savePopoutGeometry(tabId, getCurrentGeometry());
  }


  if (!isValidPopoutTabId(tabId)) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        알 수 없는 탭: {tabId}
      </div>
    );
  }

  const content = POPOUT_COMPONENT_MAP[tabId];

  return (
    <MedicalUiProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* 팝아웃 상단 바 */}
        <div className="flex items-center justify-between shrink-0 px-3 py-1.5 border-b bg-muted/50">
          <span className="text-sm font-medium">
            {getPopoutTabTitle(tabId)}
          </span>
        </div>
        {/* 탭 콘텐츠 */}
        <div className="flex-1 min-h-0 w-full overflow-auto [&>*]:w-full [&>*]:h-full">{content}</div>
      </div>
    </MedicalUiProvider>
  );
}
