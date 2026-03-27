import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { convertBundleItemOrdersToMyTreeGridType } from "./bundle-item-order-converter";
import { InputSource } from "@/types/chart/order-types";
import type { AuthUserType } from "@/types/auth-types";
import type { User } from "@/types/user-types";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { getIconBtn, getRowType, getBundleOrderCells, getScheduledOrderCells } from "./order-common-converter-util";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { 보험구분상세 } from "@/constants/common/common-enum";

export const convertBundleToMyTreeGridType = (
  parentRowKey: string | null,
  bundle: Bundle,
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void,
  isScheduledOrder: boolean = false,
  scheduledOrderMemo: string = "",
  insuranceType?: 보험구분상세,
): MyTreeGridRowType | null => {
  if (!bundle) return null;
  const rowKey = getRowKey("bundle");

  return {
    rowKey: rowKey,
    parentRowKey: parentRowKey,
    type: getRowType(true, parentRowKey),
    orgData: {
      type: "bundle",
      data: bundle,
    },
    iconBtn: getIconBtn(
      true,
      size,
      "",
      "",
      "",
      isScheduledOrder,
      scheduledOrderMemo
    ),
    className: isScheduledOrder ? "bg-[var(--yellow-4)]" : "",
    cells: getBundleOrderCells({
      inputSource: isScheduledOrder ? InputSource.예약처방 : InputSource.없음,
      userCode: bundle.code || "",
      name: bundle.isShowBundleName ? bundle.name || "" : "",
      bundlePrice: bundle.price,
      bundleItemId: bundle.id,
      bundlePriceType: bundle.priceType,
      receiptPrintLocation: bundle.receiptPrintLocation,
    }),
    children: convertBundleItemOrdersToMyTreeGridType({
      parentRowKey: rowKey,
      data: bundle.bundleItemOrders || [],
      size,
      onCellDataChange,
      bundle,
      insuranceType,
    }),
  };
};

export const convertBundleTitleOnlyToMyTreeGridType = (
  bundle: Bundle,
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void,
  user: AuthUserType | User
): MyTreeGridRowType | null => {
  if (!bundle) return null;

  const rowKey = getRowKey("bundle-title-only");

  return {
    rowKey: rowKey,
    parentRowKey: null,
    type: "item",
    orgData: {
      type: "bundle",
      data: bundle,
    },
    iconBtn: <GetItemTypeCategoryIcon size={size} category="bundle" />,
    cells: [
      ...getBundleOrderCells({
        inputSource: InputSource.없음,
        userCode: bundle.code || "",
        name: bundle.isShowBundleName ? bundle.name || "" : "",
        bundlePrice: bundle.price,
        bundleItemId: bundle.id,
        bundlePriceType: bundle.priceType,
        receiptPrintLocation: bundle.receiptPrintLocation,
      }),
      ...getScheduledOrderCells(rowKey, user, onCellDataChange),
    ],
  };
};
