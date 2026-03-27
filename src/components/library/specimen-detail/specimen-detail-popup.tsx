import MyPopup from "@/components/yjg/my-pop-up";
import MySplitPane from "@/components/yjg/my-split-pane";
import SpecimenDetailMasterGrid from "./specimen-detail-master-grid";
import SpecimenDetailRegisteredGrid, {
  type SpecimenDetailRegisteredGridRef,
} from "./specimen-detail-registered-grid";
import { MyButton } from "@/components/yjg/my-button";
import { useState, useEffect, useRef } from "react";
import type { SpecimenDetail } from "@/types/chart/specimen-detail-code-type";

// localStorage 키
const SPECIMEN_DETAIL_MAIN_POPUP_STORAGE_KEY =
  "specimen-detail-main-popup-settings";

interface SpecimenDetailPopupProps {
  setOpen: (open: boolean) => void;
  specimenDetails: SpecimenDetail[];
  setSpecimenDetails: (specimenDetail: SpecimenDetail[]) => void;
}

export default function SpecimenDetailPopup({
  setOpen,
  specimenDetails,
  setSpecimenDetails,
}: SpecimenDetailPopupProps) {
  const [localSpecimen, setLocalSpecimen] = useState<SpecimenDetail[]>([]);
  const registeredGridRef = useRef<SpecimenDetailRegisteredGridRef>(null);

  useEffect(() => {
    setLocalSpecimen([...specimenDetails]);
  }, [specimenDetails]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleApply = () => {
    setSpecimenDetails([...localSpecimen]);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSpecimen([...specimenDetails]);
    setOpen(false);
  };

  return (
    <MyPopup
      isOpen={true}
      closeOnOutsideClick={false}
      onCloseAction={handleClose}
      title="검체코드 등록"
      width="600px"
      height="600px"
      minWidth="600px"
      minHeight="600px"
      localStorageKey={SPECIMEN_DETAIL_MAIN_POPUP_STORAGE_KEY}
    >
      <div className="flex h-full w-full flex-col">
        <MySplitPane
          splitPaneId="disease-link-main"
          initialRatios={[0.5, 0.5]}
          panes={[
            <SpecimenDetailMasterGrid
              localSpecimen={localSpecimen}
              setLocalSpecimen={setLocalSpecimen}
            />,
            <SpecimenDetailRegisteredGrid
              ref={registeredGridRef}
              localSpecimen={localSpecimen}
              setLocalSpecimen={setLocalSpecimen}
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
