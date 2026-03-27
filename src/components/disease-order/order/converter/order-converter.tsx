import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { Order } from "@/types/chart/order-types";
import type { OrderGridConvertToGridRowTypesParams } from "@/components/disease-order/order/order-grid-convert-params";
import { GetCustomOrderRow } from "@/components/disease-order/order/order-action-row/order-action-command";
import {
  getRowType,
  getIconBtn,
  getOrderCells,
  getBundleOrderCells,
  getDirectChildrenOrders,
} from "./order-common-converter-util";
import { InputType, InputSource } from "@/types/chart/order-types";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";
import type { 보험구분상세 } from "@/constants/common/common-enum";

export const convertOrdersToMyTreeGridType = (
  params: OrderGridConvertToGridRowTypesParams
): MyTreeGridRowType[] => {
  const {
    parentRowKey = null,
    data: orders,
    size,
    onCellDataChange,
    allOrders,
    insuranceType,
  } = params;

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
        size: size!,
        onCellDataChange: onCellDataChange!,
        allOrders: allOrders || orders,
        insuranceType,
      });
    })
    .filter((item) => item !== null);
};

const convertOrderToMyTreeGridType = ({
  parentRowKey,
  order,
  size,
  onCellDataChange,
  allOrders,
  insuranceType,
}: {
  parentRowKey: string | null;
  order: Order;
  size: "xs" | "sm" | "default" | "lg" | "xl";
  onCellDataChange: (
    rowKey: string,
    headerKey: string,
    value: string | number | boolean
  ) => void;
  allOrders?: Order[];
  insuranceType?: 보험구분상세;
}): MyTreeGridRowType | null => {
  if (!order) return null;

  const rowKey = getRowKey("order", order.id);

  // 직접적인 children이 있는지 확인
  const directChildrenOrders = allOrders
    ? getDirectChildrenOrders(order, allOrders)
    : [];
  const hasChildren = directChildrenOrders.length > 0;

  const itemType = order.itemType;
  const codeType = order.codeType;
  const isSystemExternalLab =
    order.externalLabData?.externalLab?.isSystemProvided ?? false;
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
  const isClaim = order.isClaim;
  const paymentMethod = order.paymentMethod;
  const specificDetail = order.specificDetail;
  const prescriptionType = order.type;
  const typePrescriptionLibraryId = order.typePrescriptionLibraryId;
  const prescriptionLibraryId = order.prescriptionLibraryId;
  const userCodeId = order.userCodeId;
  const classificationCode = order.classificationCode;
  const oneTwoType = order.oneTwoType;
  const inOutType = order.inOutType;
  const drugAtcCode = order.drugAtcCode;
  const relativeValueScore = order.relativeValueScore;
  const insurancePrice = order.insurancePrice;
  const generalPrice = order.generalPrice;
  const isNormalPrice = order.generalPrice > 0 ? true : undefined;
  const actualPrice = order.actualPrice;
  const additionalPrice = order.incentivePrice;
  const inputType = order.inputType || InputType.일반;
  const inputSource = order.inputSource || InputSource.없음;
  const bundleItemId = order.bundleItemId;
  const parentBundleItemId = order.parentBundleItemId;
  const bundlePriceType = order.bundlePriceType;
  const receiptPrintLocation = order.receiptPrintLocation;
  const bundlePrice = order.bundlePrice;

  const orgData = { type: "order", data: order };

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
      false
    ),
    cells: hasChildren ? getBundleOrderCells({
      inputSource,
      userCode,
      name,
      bundlePrice,
      bundleItemId,
      bundlePriceType,
      receiptPrintLocation,
    }) : getOrderCells({
      inputType,
      inputSource,
      itemType,
      codeType,
      isSystemExternalLab,
      userCode,
      claimCode,
      name,
      dose,
      times,
      days,
      isPowder,
      usage,
      specification,
      unit,
      exceptionCode,
      specimenDetail,
      isClaim,
      paymentMethod,
      specificDetail,
      prescriptionType,
      typePrescriptionLibraryId,
      prescriptionLibraryId,
      userCodeId,
      classificationCode,
      oneTwoType,
      inOutType,
      drugAtcCode,
      relativeValueScore,
      insurancePrice,
      generalPrice,
      actualPrice,
      additionalPrice,
      bundleItemId,
      parentBundleItemId,
      receiptPrintLocation,
      insuranceType,
      isNormalPrice,
    }),
    customRender: GetCustomOrderRow(
      rowKey,
      size,
      order.userCode,
      order.name,
      onCellDataChange
    ),
    children: hasChildren
      ? convertOrdersToMyTreeGridType({
        parentRowKey: rowKey,
        data: directChildrenOrders,
        size,
        onCellDataChange,
        allOrders,
        insuranceType,
      })
      : undefined,
  };
};
