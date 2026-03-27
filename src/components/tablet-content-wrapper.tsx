"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function TabletContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTabletPath = pathname?.includes("/tablet");
  // 서명 페이지에서만 pull-to-refresh 방지 (동의서 서명 중 터치 간섭 방지)
  const isConsentSignaturePage = pathname?.match(/\/tablet\/consent-form\/patient\/\d+\/consent\/\d+/) !== null;

  useEffect(() => {
    if (!isTabletPath) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBodyTouchAction = body.style.touchAction;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlTouchAction = html.style.touchAction;
    const prevHtmlOverscroll = html.style.overscrollBehavior;

    // 서명 페이지에서만 overscroll 방지
    if (isConsentSignaturePage) {
      body.style.touchAction = "pan-x pan-y";
      body.style.overscrollBehavior = "contain";
      html.style.touchAction = "pan-x pan-y";
      html.style.overscrollBehavior = "contain";
    }
    body.style.overflow = "auto";
    html.style.overflow = "auto";

    return () => {
      body.style.touchAction = prevBodyTouchAction;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.overflow = prevBodyOverflow;
      html.style.touchAction = prevHtmlTouchAction;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [isTabletPath, isConsentSignaturePage]);

  if (isTabletPath) {
    return <>{children}</>;
  }

  return <div className="flex flex-1 w-full min-w-0 min-h-0">{children}</div>;
}
