"use client";

import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import MySplitPane from "@/components/yjg/my-split-pane";
import type { Encounter } from "@/types/chart/encounter-types";
import MedicalBillTable from "@/app/medical/_components/panels/(medical-bill)/medical-bill-table";
import MedicalBillDetail from "@/app/medical/_components/panels/(medical-bill)/medical-bill-detail";

interface MedicalBillCalculatorProps {
  isOpen: boolean;
  onCloseAction: () => void;
  encounter: Encounter;
  onSaveAndTransmit?: () => void;
  onPrintAndTransmit?: () => void;
  hideActionButtons?: boolean;
}

export default function MedicalBillInfo({
  isOpen,
  onCloseAction,
  encounter,
  onSaveAndTransmit,
  onPrintAndTransmit,
  hideActionButtons = false,
}: MedicalBillCalculatorProps) {
  const calcResultData = (encounter as any)?.calcResultData;

  const handleSaveAndDeliver = () => {
    onSaveAndTransmit?.();
    onCloseAction();
  };

  const handlePrintAndDeliver = () => {
    onPrintAndTransmit?.();
    onCloseAction();
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onCloseAction}
      title="진료비 계산"
      width="1200px"
      height="90vh"
      minWidth="800px"
      minHeight="400px"
      localStorageKey="medical-bill-calculator"
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* 메인 컨텐츠: 좌(테이블) / 우(상세) 스플릿 */}
        <div className="flex flex-1 min-h-0">
          <MySplitPane
            splitPaneId="medical-bill-calculator"
            isVertical={false}
            panes={[
              <MedicalBillTable
                key="table"
                calcResultData={calcResultData}
              />,
              <MedicalBillDetail
                key="detail"
                calcResultData={calcResultData}
                className="p-[12px]"
              />,
            ]}
            initialRatios={[0.65, 0.35]}
            minPaneRatio={0.15}
            gap={5}
          />
        </div>

        {/* 하단 버튼 */}
        {!hideActionButtons && (
          <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
            <MyButton variant="outline" onClick={handleSaveAndDeliver}>
              저장전달
            </MyButton>
            <MyButton onClick={handlePrintAndDeliver}>
              출력전달
            </MyButton>
          </div>
        )}
      </div>
    </MyPopup>
  );
}
