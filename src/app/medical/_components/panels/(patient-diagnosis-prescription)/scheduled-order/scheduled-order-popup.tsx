import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import {
  LS_SCHEDULED_ORDER_HEADERS_KEY,
  defaultScheduledOrderHeaders,
} from "./scheduled-order-header";
import { useRef, useState } from "react";
import OrderGrid, {
  OrderGridRef,
} from "@/components/disease-order/order/order-grid";
import {
  convertScheduledOrdersToMyTreeGridType,
  convertToApiScheduledOrder,
  addScheduledOrderToOrderGrid,
} from "./scheduled-order-converter";
import { useScheduledOrderDeleteUpsertMany } from "@/hooks/scheduled-order/use-scheduled-order-delete-upsert-many";
import { useToastHelpers } from "@/components/ui/toast";
import type { ScheduledOrder } from "@/types/scheduled-order-types";
import { MyPopupMsg } from "@/components/yjg/my-pop-up";
import type { Encounter } from "@/types/chart/encounter-types";
import { formatDate } from "@/lib/date-utils";
import { useQueryClient } from "@tanstack/react-query";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export default function ScheduledOrderPopup({
  encounter,
  scheduledOrders,
  addOrderLibrary,
  setOpen,
}: {
  encounter: Encounter;
  scheduledOrders: ScheduledOrder[];
  addOrderLibrary: (
    order: any,
    isScheduledOrder: boolean,
    scheduledOrderMemo: string
  ) => void;
  setOpen: (open: boolean) => void;
}) {
  const orderGridRef = useRef<OrderGridRef>(null);
  const { mutate: deleteUpsertScheduledOrders } =
    useScheduledOrderDeleteUpsertMany();
  const { error } = useToastHelpers();
  const [isOpenAddPrescription, setIsOpenAddPrescription] = useState(false);
  const queryClient = useQueryClient();

  const saveScheduledOrders = (
    treeData: MyTreeGridRowType[],
    onComplete?: () => void
  ) => {
    if (!treeData) {
      onComplete?.();
      return;
    }
    const apiScheduledOrders = convertToApiScheduledOrder(treeData);
    deleteUpsertScheduledOrders(
      {
        patientId: encounter.patientId || -1,
        request: {
          items: apiScheduledOrders,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [
              "scheduled-orders",
              "patient",
              encounter.patientId,
              formatDate(encounter.encounterDateTime || "", "-"),
            ],
          });
          onComplete?.();
        },
        onError: (err) => {
          console.error(err);
          error("예약처방 저장 오류", err.message);
        },
      }
    );
  };

  const handleClose = () => {
    const treeData = orderGridRef.current?.getTreeData();
    saveScheduledOrders(treeData || [], () => {
      setOpen(false);
    });
  };

  const handleRowDoubleClick = (row: MyTreeGridRowType) => {
    const treeData = orderGridRef.current?.getTreeData();
    const restTreeData = treeData?.filter((r) => r.rowKey !== row.rowKey);

    saveScheduledOrders(restTreeData || [], () => {
      addScheduledOrderToOrderGrid([row], addOrderLibrary);
    });
  };

  const handleAddPrescription = () => {
    const selectedRows = orderGridRef.current?.getSelectedRows();
    if (selectedRows?.length === 0) {
      setIsOpenAddPrescription(true);
      return;
    }

    const treeData = orderGridRef.current?.getTreeData();
    const restTreeData = treeData?.filter(
      (row) =>
        !selectedRows?.some((selectedRow) => selectedRow.rowKey === row.rowKey)
    );

    saveScheduledOrders(restTreeData || [], () => {
      addScheduledOrderToOrderGrid(selectedRows || [], addOrderLibrary);
      setOpen(false);
    });
  };

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={handleClose}
      title="예약처방"
      width="820px"
      height="450px"
      minWidth="820px"
      minHeight="450px"
      localStorageKey={"scheduled-order-popup-settings"}
    >
      <div className="flex flex-col gap-2 p-2 h-full w-full">
        <div className="flex-1 flex w-full h-full p-[1px] overflow-hidden">
          <OrderGrid
            ref={orderGridRef}
            headerLsKey={LS_SCHEDULED_ORDER_HEADERS_KEY}
            defaultHeaders={defaultScheduledOrderHeaders}
            data={scheduledOrders || []}
            onConvertToGridRowTypes={convertScheduledOrdersToMyTreeGridType}
            bundleTitleOnly={true}
            isCheckProhibitedDrug={true}
            onRowDoubleClick={handleRowDoubleClick}
            disableCommandOrder={true}
          />
        </div>
        <div className="flex flex-row flex-shrink-0 justify-end gap-2">
          <div className="flex flex-row items-center gap-2">
            <div className="text-sm text-[var(--gray-400)] whitespace-pre-line">
              더블클릭으로도 처방할 수 있습니다.
            </div>
            <MyButton className="px-6" onClick={handleAddPrescription}>
              처방
            </MyButton>
            <MyPopupMsg
              isOpen={isOpenAddPrescription}
              onCloseAction={() => setIsOpenAddPrescription(false)}
              title="처방"
              hideHeader={true}
              msgType="warning"
              message=""
              confirmText="닫기"
            >
              <div className="flex flex-col gap-1">
                <div className="text-base text-[var(--text-primary)] whitespace-pre-line">
                  처방할 예약처방을 선택해주세요.
                </div>
                <div className="text-sm text-[var(--gray-400)] whitespace-pre-line">
                  (ctrl or shift 키를 활용하여 다중 선택할 수 있습니다.)
                </div>
              </div>
            </MyPopupMsg>
          </div>
        </div>
      </div>
    </MyPopup>
  );
}
