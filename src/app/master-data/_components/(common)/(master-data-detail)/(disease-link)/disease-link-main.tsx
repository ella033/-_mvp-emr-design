import MyPopup from "@/components/yjg/my-pop-up";
import MySplitPane from "@/components/yjg/my-split-pane";
import DiseaseLinkMasterGrid from "./disease-link-master-grid";
import DiseaseLinkRegisteredGrid, { type DiseaseLinkRegisteredGridRef } from "./disease-link-registered-grid";
import { MyButton } from "@/components/yjg/my-button";
import { useState, useEffect } from "react";
import type { DiseaseLinkType } from "@/types/master-data/prescription-user-codes/prescription-user-codes-upsert-type";
import type { MasterDataDetailType } from "@/types/master-data/master-data-detail-type";
import { useRef } from "react";

// localStorage 키
const DISEASE_LINK_MAIN_POPUP_STORAGE_KEY = "disease-link-main-popup-settings";

interface DiseaseLinkMainProps {
  setOpen: (open: boolean) => void;
  masterDataDetail: MasterDataDetailType;
  setMasterDataDetail: (masterDetail: MasterDataDetailType) => void;
}

export default function DiseaseLinkMain({
  setOpen,
  masterDataDetail,
  setMasterDataDetail,
}: DiseaseLinkMainProps) {
  // 로컬 상태로 diseaseLink 관리
  const [localDiseaseLink, setLocalDiseaseLink] = useState<DiseaseLinkType[]>([]);
  const registeredGridRef = useRef<DiseaseLinkRegisteredGridRef>(null);

  // masterDataDetail에서 초기값 로드
  useEffect(() => {
    setLocalDiseaseLink([...masterDataDetail.diseaseLink]);
  }, [masterDataDetail.diseaseLink]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleApply = () => {
    // 로컬 상태를 실제 스토어에 반영
    setMasterDataDetail({
      ...masterDataDetail,
      diseaseLink: localDiseaseLink,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    // 기존 값으로 복원
    setLocalDiseaseLink([...masterDataDetail.diseaseLink]);
    setOpen(false);
  };

  return (
    <MyPopup
      isOpen={true}
      closeOnOutsideClick={false}
      onCloseAction={handleClose}
      title="상병 연결코드"
      width="800px"
      height="800px"
      minWidth="600px"
      minHeight="600px"
      localStorageKey={DISEASE_LINK_MAIN_POPUP_STORAGE_KEY}
    >
      <div className="flex h-full w-full flex-col">
        <MySplitPane
          splitPaneId="disease-link-main"
          initialRatios={[0.5, 0.5]}
          panes={[
            <DiseaseLinkMasterGrid
              localDiseaseLink={localDiseaseLink}
              setLocalDiseaseLink={setLocalDiseaseLink}
            />,
            <DiseaseLinkRegisteredGrid
              ref={registeredGridRef}
              localDiseaseLink={localDiseaseLink}
              setLocalDiseaseLink={setLocalDiseaseLink}
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
