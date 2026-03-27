import type { Encounter } from "@/types/chart/encounter-types";
import { useEncounterStore } from "@/store/encounter-store";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { cn } from "@/lib/utils";
import type {
  MyTreeGridHeaderType,
  MyTreeGridRowType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import {
  getInitialShowRowIcon,
  saveHeaders,
  saveShowRowIcon,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import MyTreeGrid from "@/components/yjg/my-tree-grid/my-tree-grid";
import { PC_HISTORY_DIAGNOSIS_HEADERS, defaultDiseaseHeaders } from "@/components/disease-order/disease/disease-header";
import { useEffect, useState } from "react";
import { convertHistoryDiseasesToMyTreeGridType } from "./history-disease-converter";
import { RepeatIcon } from "@/components/custom-icons";
import { HEADER_TEXT_CLASS } from "@/components/yjg/common/constant/class-constants";

const ENCOUNTER_HISTORY_ITEM_SIZE = "sm";

export default function EncounterHistoryItemDiagnosis({
  encounter,
  diagnosisHeaders,
  setDiagnosisHeaders,
  searchKeyword,
  isReception,
}: {
  encounter: Encounter;
  diagnosisHeaders: MyTreeGridHeaderType[];
  setDiagnosisHeaders: (headers: MyTreeGridHeaderType[]) => void;
  searchKeyword?: string;
  isReception: boolean;
}) {
  const [showRowIcon, setShowRowIcon] = useState(() =>
    getInitialShowRowIcon(PC_HISTORY_DIAGNOSIS_HEADERS)
  );
  const { setNewDiseases } = useEncounterStore();

  const handleRowClick = (row: MyTreeGridRowType) => {
    setNewDiseases([row.orgData.data]);
  };

  useEffect(() => {
    saveHeaders(PC_HISTORY_DIAGNOSIS_HEADERS, diagnosisHeaders);
  }, [diagnosisHeaders]);

  useEffect(() => {
    saveShowRowIcon(PC_HISTORY_DIAGNOSIS_HEADERS, showRowIcon);
  }, [showRowIcon]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between">
        <MyTooltip
          side="right"
          content={
            isReception ? (
              ""
            ) : (
              <div>
                전체 진단을 리핏합니다.
                <br />
                <span className="text-[12px] text-[var(--gray-700)]">
                  (개별 리핏은 리스트에서 클릭)
                </span>
              </div>
            )
          }
        >
          <div
            className={cn(
              "flex flex-row items-center justify-between flex-1 p-[4px]",
              isReception
                ? "cursor-default"
                : "cursor-pointer hover:text-[var(--blue-2)] hover:bg-[var(--blue-1)] rounded-sm"
            )}
            onClick={(e) => {
              if (isReception) return;
              e.stopPropagation();
              setNewDiseases(encounter.diseases || []);
            }}
          >
            <span className={HEADER_TEXT_CLASS}>진단</span>
            {!isReception && (
              <RepeatIcon className="w-[12px] h-[12px]" />
            )}
          </div>
        </MyTooltip>
      </div>
      <div className="rounded-sm [&_.my-scroll]:!overscroll-y-auto">
        <MyTreeGrid
          headers={diagnosisHeaders}
          setHeaders={setDiagnosisHeaders}
          settingButtonOptions={{
            title: "진단 컬럼 설정",
            defaultHeaders: defaultDiseaseHeaders,
            showRowIconSetting: true,
            showRowIcon,
            onShowRowIconChange: setShowRowIcon,
          }}
          data={convertHistoryDiseasesToMyTreeGridType(
            ENCOUNTER_HISTORY_ITEM_SIZE,
            encounter.diseases || []
          )}
          onRowClick={handleRowClick}
          onDataChange={() => { }}
          showContextMenu={false}
          hideBorder={true}
          multiSelect={false}
          searchKeyword={searchKeyword}
          size={ENCOUNTER_HISTORY_ITEM_SIZE}
          showRowIcon={showRowIcon}
        />
      </div>
    </div>
  );
}
