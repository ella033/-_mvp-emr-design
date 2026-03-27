import type { OrderGridConvertToGridRowTypesParams } from "@/components/disease-order/order/order-grid-convert-params";
import type {
  MyTreeGridRowType,
  MyTreeGridRowCellType,
} from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { ScheduledOrder } from "@/types/scheduled-order-types";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";
import { toKRW } from "@/lib/patient-utils";
import { formatDate } from "@/lib/date-utils";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { useUserStore } from "@/store/user-store";
import { useUsersStore } from "@/store/users-store";
import {
  getRowKey,
  getCellValueAsString,
} from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { ScheduledOrderMemoIcon } from "@/components/custom-icons";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import type React from "react";

// ---- Types (verbal-order-popup.tsx에서 사용하는 것과 동일) ----

enum VerbalTabKey {
  Reservation = "reservation",
  General = "general",
}

const VERBAL_TAB_LABEL: Record<VerbalTabKey, string> = {
  [VerbalTabKey.Reservation]: "예약처방",
  [VerbalTabKey.General]: "일반처방",
};

type VerbalOrderItem = {
  id: string;
  userCode: string;
  name: string;
  dose: number | string;
  times: number | string;
  days: number | string;
  insurancePrice: number;
  generalPrice: number;
  itemType?: string;
  claimCode?: string;
  bundleItemId?: number;
};

type OrderAction = "create" | "update" | "delete";

type SelectedOrderItem = VerbalOrderItem & {
  uniqueKey: string;
  source: VerbalTabKey;
  orderId?: string;
  action?: OrderAction;
  prescriptionUserCode?: PrescriptionUserCodeType;
  scheduledOrder?: ScheduledOrder;
};

// ---- Helper ----

const getUserNameById = (userId?: number): string => {
  if (!userId) return "";
  const hospitalId = String(useUserStore.getState().user?.hospitalId || "");
  if (!hospitalId) return "";
  const user = useUsersStore.getState().getUserById(hospitalId, userId);
  return user?.name || "";
};

// ---- 1. 예약처방 Readonly Converter ----

export const convertScheduledOrdersToReadonlyTreeGrid = (
  params: OrderGridConvertToGridRowTypesParams
): MyTreeGridRowType[] => {
  const { data: orders, size } = params;
  if (!orders || !Array.isArray(orders)) return [];

  const result: MyTreeGridRowType[] = [];
  (orders as ScheduledOrder[]).forEach((order, index) => {
    if (!order) return;

    const isBundle =
      order.bundleItemId !== null && order.bundleItem !== null;
    const rowKey = getRowKey("verbal-scheduled", index);

    const userCode = order.prescriptionUserCode;
    const library = order.prescriptionLibrary;
    const bundleItem = order.bundleItem;

    const code = userCode?.code || "";
    const name =
      userCode?.name || library?.name || bundleItem?.name || "";
    const itemType = userCode?.itemType || library?.itemType || "";

    const libraryDetails =
      userCode?.library?.details || library?.details || [];
    const latestDetail =
      libraryDetails.length > 0 ? libraryDetails[0] : null;
    const insurancePrice = latestDetail?.price || 0;
    const claimCode = latestDetail?.claimCode || "";

    const userCodeDetails = userCode?.details || [];
    const latestUserCodeDetail =
      userCodeDetails.length > 0 ? userCodeDetails[0] : null;
    const generalPrice = latestUserCodeDetail?.normalPrice || 0;

    const createName = getUserNameById(order.createId);
    const memo = order.memo || "";

    const cells: MyTreeGridRowCellType[] = [
      {
        headerKey: "scheduledOrderApplyDate",
        value: order.applyDate ? formatDate(order.applyDate, "-") : "",
        inputType: "myDateTime",
      },
      { headerKey: "userCode", value: code },
      { headerKey: "name", value: name },
      {
        headerKey: "scheduledOrderMemo",
        value: memo,
        customRender: memo ? (
          <div className="flex items-center justify-center h-full">
            <MyTooltip content={memo}>
              <ScheduledOrderMemoIcon className="w-[14px] h-[14px]" />
            </MyTooltip>
          </div>
        ) : undefined,
      },
      {
        headerKey: "dose",
        value: isBundle ? "" : (order.dose || ""),
      },
      {
        headerKey: "times",
        value: isBundle ? "" : (order.times || ""),
      },
      {
        headerKey: "days",
        value: isBundle ? "" : (order.days || ""),
      },
      {
        headerKey: "insurancePrice",
        value: isBundle ? "" : toKRW(insurancePrice),
      },
      {
        headerKey: "generalPrice",
        value: isBundle ? "" : toKRW(generalPrice),
      },
      {
        headerKey: "scheduledOrderCreateDate",
        value: order.createDateTime
          ? formatDate(order.createDateTime, "-")
          : "",
      },
      { headerKey: "scheduledOrderCreateName", value: createName },
    ];

    result.push({
      rowKey,
      parentRowKey: null,
      type: "item" as const,
      orgData: {
        type: "verbal-scheduled-order",
        data: order,
      },
      isHighlight: false,
      iconBtn: itemType ? (
        <GetItemTypeCategoryIcon
          size={size || "sm"}
          itemType={itemType}
          claimCode={claimCode}
        />
      ) : isBundle ? (
        <GetItemTypeCategoryIcon size={size || "sm"} category="bundle" />
      ) : undefined,
      cells,
    });
  });
  return result;
};

// ---- 2. 일반처방 Readonly Converter ----

export const convertVerbalOrdersToReadonlyTreeGrid = (
  params: OrderGridConvertToGridRowTypesParams
): MyTreeGridRowType[] => {
  const { data: orders, size } = params;
  if (!orders || !Array.isArray(orders)) return [];

  return (orders as PrescriptionUserCodeType[]).map(
    (prescriptionUserCode, index) => {
      const rowKey = getRowKey("verbal-general", index);

      const drugUserCode = prescriptionUserCode.drugUserCode;
      const libraryDetails =
        prescriptionUserCode.library?.details || [];
      const latestLibraryDetail =
        libraryDetails.length > 0 ? libraryDetails[0] : null;
      const insurancePrice = latestLibraryDetail?.price || 0;

      const userCodeDetails = prescriptionUserCode.details || [];
      const latestUserCodeDetail =
        userCodeDetails.length > 0 ? userCodeDetails[0] : null;
      const generalPrice = latestUserCodeDetail?.normalPrice || 0;

      const itemType = prescriptionUserCode.itemType || "";
      const claimCode = latestLibraryDetail?.claimCode || "";

      const cells: MyTreeGridRowCellType[] = [
        { headerKey: "userCode", value: prescriptionUserCode.code || "" },
        { headerKey: "name", value: prescriptionUserCode.name || "" },
        { headerKey: "dose", value: drugUserCode?.dose || "1" },
        { headerKey: "times", value: drugUserCode?.times || "1" },
        { headerKey: "days", value: drugUserCode?.days || "1" },
        { headerKey: "insurancePrice", value: toKRW(insurancePrice) },
        { headerKey: "generalPrice", value: toKRW(generalPrice) },
      ];

      return {
        rowKey,
        parentRowKey: null,
        type: "item" as const,
        orgData: {
          type: "verbal-general-order",
          data: prescriptionUserCode,
        },
        isHighlight: false,
        iconBtn: itemType ? (
          <GetItemTypeCategoryIcon
            size={size || "sm"}
            itemType={itemType}
            claimCode={claimCode}
          />
        ) : undefined,
        cells,
      };
    }
  );
};

// ---- 3. 처방리스트 Editable Converter (factory) ----

export const createSelectedOrdersConverter = (
  editsRef: React.MutableRefObject<
    Map<string, { dose?: string; times?: string; days?: string }>
  >
) => {
  return (
    params: OrderGridConvertToGridRowTypesParams
  ): MyTreeGridRowType[] => {
    const { data: orders } = params;
    if (!orders || !Array.isArray(orders)) return [];

    return (orders as SelectedOrderItem[])
      .filter((item) => item.action !== "delete")
      .map((item) => {
        const rowKey = `verbal-selected-${item.uniqueKey}`;
        const edits = editsRef.current.get(item.uniqueKey);
        const inputTypeText = VERBAL_TAB_LABEL[item.source];

        const cells: MyTreeGridRowCellType[] = [
            { headerKey: "inputType", value: inputTypeText },
            { headerKey: "userCode", value: item.userCode },
            { headerKey: "name", value: item.name },
            {
              headerKey: "dose",
              value: edits?.dose ?? String(item.dose ?? ""),
              inputType: "textNumber",
              textNumberOption: {
                min: 0,
                max: 1000000000,
                pointPos: 8,
              },
            },
            {
              headerKey: "times",
              value: edits?.times ?? String(item.times ?? ""),
              inputType: "textNumber",
              textNumberOption: {
                min: 0,
                max: 99,
                pointPos: 0,
              },
            },
            {
              headerKey: "days",
              value: edits?.days ?? String(item.days ?? ""),
              inputType: "textNumber",
              textNumberOption: {
                min: 0,
                max: 999,
                pointPos: 0,
              },
            },
            { headerKey: "insurancePrice", value: toKRW(item.insurancePrice) },
            { headerKey: "generalPrice", value: toKRW(item.generalPrice) },
          ];

        return {
          rowKey,
          parentRowKey: null,
          type: "item" as const,
          orgData: {
            type: "verbal-selected-order",
            data: item,
          },
          isHighlight: false,
          cells,
        };
      });
  };
};

// ---- 4. 편집값 추출 Helper ----

export const extractSelectedOrderEdits = (
  treeData: MyTreeGridRowType[]
): Map<string, { dose?: string; times?: string; days?: string }> => {
  const edits = new Map<
    string,
    { dose?: string; times?: string; days?: string }
  >();
  for (const row of treeData) {
    const item = row.orgData?.data as SelectedOrderItem | undefined;
    if (!item?.uniqueKey) continue;
    edits.set(item.uniqueKey, {
      dose: getCellValueAsString(row, "dose") ?? undefined,
      times: getCellValueAsString(row, "times") ?? undefined,
      days: getCellValueAsString(row, "days") ?? undefined,
    });
  }
  return edits;
};
