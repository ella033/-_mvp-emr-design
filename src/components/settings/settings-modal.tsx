"use client";

import React, { useState, useCallback } from "react";

import { useUIStore } from "@/store/ui-store";
import { UserSettingsContent } from "@/components/settings/user-settings-content";
import MyPopup from "@/components/yjg/my-pop-up";

export function SettingsModal() {
  const {
    isSettingsModalOpen: isOpen,
    closeSettingsModal: onClose,
    settingsModalView,
    settingsModalTab,
  } = useUIStore();
  const [isDirty, setIsDirty] = useState(false);

  const handleClose = useCallback(() => {
    if (isDirty) {
      // MyPopup handles outside click and ESC, but for dirty check we intercept onCloseAction
      const shouldSave = window.confirm("변경사항이 있습니다. 저장 후 종료하시겠습니까?");
      if (shouldSave) {
        // TODO: 저장 로직 실행 - 현재는 각 컴포넌트 내부에서 처리 필요 (ref 등 사용)
        // 여기서는 예시로 로그만 출력
        console.log("저장 후 종료");
      }
      // 저장 여부와 관계없이 모달 닫기 (취소 시 닫지 않으려면 early return 해야 함. 기획 확인 필요. 기존 코드는 닫음)
      // window.confirm은 예/아니오. '취소'를 누르면 닫지 않아야 한다면:
      // if (!shouldSave) return; // 하지만 기존 코드는 닫았음.
      onClose();
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  /* const modalTitle = settingsModalView === "system" ? "시스템 설정" : "사용자 설정"; */
  const modalTitle = "사용자 설정";

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={handleClose}
      title={modalTitle}
      width="60%"
      height="820px"
      minWidth="600px"
      localStorageKey="settings-modal-size" // 크기/위치 저장을 위해 키 추가
    >
      <div className="flex flex-1 h-full overflow-hidden">
        <UserSettingsContent
          onDirtyChange={setIsDirty}
          initialTab={settingsModalTab}
        />
      </div>
    </MyPopup>
  );
}

