import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { Order } from "@/types/chart/order-types";
import { GetCustomOrderRow } from "@/components/disease-order/order/order-action-row/order-action-command";
import {
  getRowType,
  getIconBtn,
  getDirectChildrenOrders,
  getPriceView,
  getBundlePriceView,
} from "@/components/disease-order/order/converter/order-common-converter-util";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import { InOut, InOutLabel } from "@/constants/master-data-enum";
import { PAYMENT_METHOD_OPTIONS } from "@/constants/common/common-option";
import { ItemTypeCode } from "@/constants/library-option/item-type-option";

export const convertHistoryOrdersToMyTreeGridType = (
  parentRowKey: string | null,
  orders: Order[],
  size: "xs" | "sm" | "default" | "lg" | "xl",
  onRepeatSameTypeOrders: (itemType: string) => void,
  allOrders?: Order[]
): MyTreeGridRowType[] => {
  if (!orders || !Array.isArray(orders)) {
    return [];
  }

  // 최상위 레벨인 경우 (parentRowKey가 null), parentSortNumber가 있는 order들은 제외
  const filteredOrders =
    parentRowKey === null
      ? orders.filter((order) => !order.parentSortNumber)
      : orders;

  return filteredOrders
    .map((order) => {
      return convertOrderToMyTreeGridType({
        parentRowKey,
        order,
        size,
        onRepeatSameTypeOrders,
        allOrders: allOrders || orders,
      });
    })
    .filter((item) => item !== null);
};

// 특정 order의 직접적인 children을 찾는 헬퍼 함수


const convertOrderToMyTreeGridType = ({
  parentRowKey,
  order,
  size,
  onRepeatSameTypeOrders,
  allOrders
}: {
  parentRowKey: string | null;
  order: Order;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  onRepeatSameTypeOrders: (itemType: string) => void;
  allOrders?: Order[];
}): MyTreeGridRowType | null => {
  if (!order) return null;

  const rowKey = getRowKey("history-order", order.id);

  // 직접적인 children이 있는지 확인
  const directChildrenOrders = allOrders
    ? getDirectChildrenOrders(order, allOrders)
    : [];
  const hasChildren = directChildrenOrders.length > 0;

  const isSystemExternalLab =
    order.externalLabData?.externalLab?.isSystemProvided || order.itemType === ItemTypeCode.검사료_위탁검사 ? true : false;
  const userCode = order.userCode;
  const claimCode = order.claimCode;
  const name = order.name;
  const dose = order.dose;
  const times = order.times;
  const days = order.days;
  const isPowder = order.isPowder;
  const usage = order.usage;
  const specification = order.specification;
  const unit = order.unit;
  const exceptionCode = order.exceptionCode;
  const specimenDetail = order.specimenDetail;
  const paymentMethod = order.paymentMethod;
  const insurancePrice = order.insurancePrice;
  const generalPrice = order.generalPrice;
  const actualPrice = order.actualPrice;
  const isClaim = order.isClaim;
  const specificDetail = order.specificDetail;
  const inOutType = order.inOutType;
  const bundlePriceType = order.bundlePriceType;
  const bundlePrice = order.bundlePrice;
  const priceView = hasChildren ? getBundlePriceView({ bundlePriceType, bundlePrice }) : getPriceView({ paymentMethod, insurancePrice, generalPrice, actualPrice });
  const orgData = { type: "history-order", data: order };

  return {
    rowKey: rowKey,
    parentRowKey: parentRowKey,
    type: getRowType(hasChildren, parentRowKey),
    orgData,
    iconBtn: getIconBtn(
      hasChildren,
      size,
      order.userCode,
      order.itemType,
      order.claimCode,
      false,
    ),
    cells: hasChildren ? [
      {
        headerKey: "userCode",
        value: userCode,
      },
      {
        headerKey: "name",
        value: name,
      },
      {
        headerKey: "price",
        value: priceView,
      },
    ] : [
      {
        headerKey: "userCode",
        value: userCode,
      },
      {
        headerKey: "name",
        value: name,
      },
      {
        headerKey: "dose",
        value: dose,
      },
      {
        headerKey: "times",
        value: times,
      },
      {
        headerKey: "days",
        value: days,
      },
      {
        headerKey: "usage",
        value: usage,
        inputType: "usage",
        readonly: true,
      },
      {
        headerKey: "specificDetail",
        value: specificDetail ? JSON.stringify(specificDetail) : null,
        inputType: "specific-detail",
        readonly: true,
      },
      {
        headerKey: "isClaim",
        value: isClaim,
      },
      {
        headerKey: "paymentMethod",
        value: PAYMENT_METHOD_OPTIONS.find(option => option.value === paymentMethod)?.label || "",
      },
      {
        headerKey: "specimenDetail",
        value: specimenDetail ? JSON.stringify(specimenDetail) : null,
        inputType: isSystemExternalLab ? "specimen-detail-external" : "specimen-detail",
        readonly: true,
      },
      {
        headerKey: "price",
        value: priceView,
      },
      {
        headerKey: "specificationAndUnit",
        value: `${specification || ""} ${unit || ""}`,
      },
      {
        headerKey: "claimCode",
        value: claimCode,
      },
      {
        headerKey: "exceptionCode",
        value: exceptionCode,
        inputType: "exception-code",
        readonly: true,
      },
      {
        headerKey: "inOutType",
        value: inOutType === InOut.External ? InOutLabel[inOutType] : inOutType === InOut.In ? true : false,
      },
      {
        headerKey: "isPowder",
        value: isPowder,
      },
    ],
    customRender: GetCustomOrderRow(rowKey, size, order.userCode, order.name),
    isExpanded: hasChildren ? false : undefined,
    children: hasChildren
      ? convertHistoryOrdersToMyTreeGridType(
        rowKey,
        directChildrenOrders,
        size,
        onRepeatSameTypeOrders,
        allOrders
      )
      : undefined,
  };
};
