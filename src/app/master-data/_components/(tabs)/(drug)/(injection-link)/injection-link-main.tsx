import MyPopup from "@/components/yjg/my-pop-up";
import MySplitPane from "@/components/yjg/my-split-pane";
import InjectionLinkMasterGrid from "./injection-link-master-grid";
import InjectionLinkRegisteredGrid, { type InjectionLinkRegisteredGridRef } from "./injection-link-registered-grid";
import { MyButton } from "@/components/yjg/my-button";
import { useState, useEffect, useRef } from "react";
import type { InjectionLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";

// localStorage 키
const INJECTION_LINK_POPUP_STORAGE_KEY = "injection-link-popup-settings";

interface InjectionLinkMainProps {
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
  setOpen: (open: boolean) => void;
}

export default function InjectionLinkMain({
  masterDataDetail,
  setMasterDataDetail,
  setOpen,
}: InjectionLinkMainProps) {
  // 로컬 상태로 diseaseLink 관리
  const [localInjectionLink, setLocalInjectionLink] = useState<InjectionLinkType[]>([]);
  const registeredGridRef = useRef<InjectionLinkRegisteredGridRef>(null);

  // masterDataDetail에서 초기값 로드
  useEffect(() => {
    setLocalInjectionLink([
      ...(masterDataDetail.drugMasterData?.injectionLink || []),
    ]);
  }, [masterDataDetail.drugMasterData?.injectionLink]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleApply = () => {
    // 로컬 상태를 실제 스토어에 반영
    setMasterDataDetail({
      ...masterDataDetail,
      drugMasterData: {
        ...masterDataDetail.drugMasterData!,
        injectionLink: localInjectionLink,
      },
    });
    setOpen(false);
  };

  const handleCancel = () => {
    // 기존 값으로 복원
    setLocalInjectionLink([
      ...(masterDataDetail.drugMasterData?.injectionLink || []),
    ]);
    setOpen(false);
  };

  return (
    <MyPopup
      isOpen={true}
      closeOnOutsideClick={false}
      onCloseAction={handleClose}
      title="주사 연결코드"
      width="800px"
      height="800px"
      minWidth="600px"
      minHeight="600px"
      localStorageKey={INJECTION_LINK_POPUP_STORAGE_KEY}
    >
      <div className="flex h-full w-full flex-col">
        <MySplitPane
          splitPaneId="injection-link"
          initialRatios={[0.5, 0.5]}
          panes={[
            <InjectionLinkMasterGrid
              localInjectionLink={localInjectionLink}
              setLocalInjectionLink={setLocalInjectionLink}
            />,
            <InjectionLinkRegisteredGrid
              ref={registeredGridRef}
              localInjectionLink={localInjectionLink}
              setLocalInjectionLink={setLocalInjectionLink}
            />,
          ]}
        />
        <div className="flex flex-row items-center justify-between gap-2 px-2 pt-1 pb-2">
          <div className="flex flex-row items-center gap-2">
            <MyButton
              className="px-4"
              variant="outline"
              onClick={() => registeredGridRef.current?.handleDelete()}
            >
              삭제
            </MyButton>
          </div>
          <div className="flex flex-row items-center gap-2">
            <MyButton className="px-4" onClick={handleCancel} variant="outline">
              취소
            </MyButton>
            <MyButton className="px-4" onClick={handleApply}>적용</MyButton>
          </div>
        </div>
      </div>
    </MyPopup>
  );
}
