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
import { useEffect } from "react";
import { convertHistoryOrdersToMyTreeGridType } from "./history-order-converter";
import { PC_HISTORY_PRESCRIPTION_HEADERS, defaultOrderHeaders } from "@/components/disease-order/order/order-header";
import { useState } from "react";
import { useCallback } from "react";
import type { Order } from "@/types/chart/order-types";
import { getPrescriptionDetailType } from "@/types/master-data/item-type";
import { getRepeatableOrders, isRepeatableOrder } from "@/lib/encounter-util";
import { useToastHelpers } from "@/components/ui/toast";
import { RepeatIcon } from "@/components/custom-icons";
import { HEADER_TEXT_CLASS } from "@/components/yjg/common/constant/class-constants";

const ENCOUNTER_HISTORY_ITEM_SIZE = "sm";

export default function EncounterHistoryItemPrescription({
  encounter,
  prescriptionHeaders,
  setPrescriptionHeaders,
  searchKeyword,
  isReception,
}: {
  encounter: Encounter;
  prescriptionHeaders: MyTreeGridHeaderType[];
  setPrescriptionHeaders: (headers: MyTreeGridHeaderType[]) => void;
  searchKeyword?: string;
  isReception: boolean;
}) {
  const { warning } = useToastHelpers();
  const { setNewOrders } = useEncounterStore();
  const [treeData, setTreeData] = useState<MyTreeGridRowType[]>([]);
  const [showRowIcon, setShowRowIcon] = useState(() =>
    getInitialShowRowIcon(PC_HISTORY_PRESCRIPTION_HEADERS)
  );

  // 데이터 초기화
  useEffect(() => {
    const newTreeData = convertHistoryOrdersToMyTreeGridType(
      null,
      encounter.orders || [],
      ENCOUNTER_HISTORY_ITEM_SIZE,
      onRepeatSameTypeOrders
    );
    setTreeData(newTreeData || []);
  }, [encounter.orders]);

  const handleDataChange = useCallback((newData: MyTreeGridRowType[]) => {
    setTreeData(newData);
  }, []);

  const getDirectChildrenOrders = (
    parentOrder: Order,
    allOrders: Order[]
  ): Order[] => {
    if (!parentOrder.sortNumber) return [];

    return allOrders.filter(
      (order) => order.parentSortNumber === parentOrder.sortNumber
    );
  };

  const getAllDescendants = (
    parentOrder: Order,
    allOrders: Order[]
  ): Order[] => {
    const directChildren = getDirectChildrenOrders(parentOrder, allOrders);
    let allDescendants: Order[] = [...directChildren];

    directChildren.forEach((child) => {
      allDescendants.push(...getAllDescendants(child, allOrders));
    });

    return allDescendants;
  };

  const handleRowClick = (row: MyTreeGridRowType) => {
    const order = row.orgData.data;
    if (!isRepeatableOrder(order)) {
      warning("리핏할 수 없는 처방입니다.");
      return;
    }
    const directChildrenOrders = getDirectChildrenOrders(
      order,
      encounter.orders || []
    );
    const hasChildren = directChildrenOrders.length > 0;
    if (hasChildren) {
      // 자식이 있는 경우, 모든 하위 order들을 포함
      const allDescendants = getAllDescendants(order, encounter.orders || []);
      setNewOrders([order, ...allDescendants]);
    } else {
      // 자식이 없는 경우, parentSortNumber와 parentBundleItemId를 제거
      const cleanOrder = {
        ...order,
        parentSortNumber: undefined,
        parentBundleItemId: undefined,
      };
      setNewOrders([cleanOrder]);
    }
  };

  const onRepeatSameTypeOrders = (itemType: string) => {
    const type = getPrescriptionDetailType(itemType);
    const sameTypeOrders: Order[] = [];
    for (const o of encounter.orders || []) {
      const oType = getPrescriptionDetailType(o.itemType);
      if (oType === type) {
        sameTypeOrders.push({
          ...o,
          parentSortNumber: undefined,
          parentBundleItemId: undefined,
        });
      }
    }
    setNewOrders(sameTypeOrders);
  };

  useEffect(() => {
    saveHeaders(PC_HISTORY_PRESCRIPTION_HEADERS, prescriptionHeaders);
  }, [prescriptionHeaders]);

  useEffect(() => {
    saveShowRowIcon(PC_HISTORY_PRESCRIPTION_HEADERS, showRowIcon);
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
                전체 처방을 리핏합니다.
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
              setNewOrders(getRepeatableOrders(encounter.orders || []));
            }}
          >
            <span className={HEADER_TEXT_CLASS}>처방</span>
            {!isReception && (
              <RepeatIcon className="w-[12px] h-[12px]" />
            )}
          </div>
        </MyTooltip>
      </div>
      <div className="rounded-sm [&_.my-scroll]:!overscroll-y-auto">
        <MyTreeGrid
          headers={prescriptionHeaders}
          setHeaders={setPrescriptionHeaders}
          settingButtonOptions={{
            title: "컬럼 설정",
            defaultHeaders: defaultOrderHeaders,
            showRowIconSetting: true,
            showRowIcon,
            onShowRowIconChange: setShowRowIcon,
          }}
          data={treeData}
          onDataChange={handleDataChange}
          onRowClick={handleRowClick}
          onDataChangeItem={() => { }}
          onSelectedRowsChange={() => { }}
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
