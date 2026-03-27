"use client";

import { useUIStore } from "@/store/ui-store";
import TemplateCodePopup from "@/app/medical/_components/panels/template-code-popup";

/**
 * 전역 상용구 설정 팝업을 현재 라우트(화면)에 렌더합니다.
 * 루트 레이아웃에 두어 /reception, /medical 등 어디서 열어도 해당 화면에서 표시됩니다.
 */
export default function TemplateCodePopupGate() {
  const isTemplateCodePopupOpen = useUIStore(
    (state) => state.isTemplateCodePopupOpen
  );
  const closeTemplateCodePopup = useUIStore(
    (state) => state.closeTemplateCodePopup
  );

  if (!isTemplateCodePopupOpen) return null;

  return <TemplateCodePopup setOpen={closeTemplateCodePopup} />;
}
