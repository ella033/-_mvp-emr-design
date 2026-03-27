import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const PC_PRESCRIPTION_HEADERS = "prescription-headers";
export const PC_HISTORY_PRESCRIPTION_HEADERS = "history-prescription-headers";
export const PC_BUNDLE_ORDER_HEADERS = "bundle-order-headers";
export const PC_MEDICAL_BUNDLE_ORDER_HEADERS = "medical-bundle-order-headers";

const orderHeaders: MyTreeGridHeaderType[] = [
  {
    key: "userCode",
    name: "사용자코드",
    width: 70,
    minWidth: 70,
  },

  {
    key: "name",
    name: "명칭",
    width: 200,
    minWidth: 100,
  },
  {
    key: "dose",
    name: "용량",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "times",
    name: "일투",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "days",
    name: "일수",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "usage",
    name: "용법",
    width: 30,
    minWidth: 30,
  },
  {
    key: "specificDetail",
    name: "특정내역",
    width: 50,
    minWidth: 50,
  },
  {
    key: "isClaim",
    name: "청구",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "paymentMethod",
    name: "수납방법",
    align: "left",
    width: 60,
    minWidth: 60,
  },
  {
    key: "specimenDetail",
    name: "검체",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "price",
    name: "단가",
    align: "right",
    width: 70,
    minWidth: 30,
  },
  {
    key: "specificationAndUnit",
    name: "단위",
    width: 60,
    minWidth: 60,
  },
  {
    key: "claimCode",
    name: "청구코드",
    width: 70,
    minWidth: 70,
  },
  {
    key: "exceptionCode",
    name: "예외",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "inOutType",
    name: "원내",
    align: "center",
    width: 32,
    minWidth: 32,
  },
  {
    key: "isPowder",
    name: "가루",
    align: "center",
    width: 30,
    minWidth: 30,
  },
];

export const defaultOrderHeaders = orderHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

const orderViewHeaders: MyTreeGridHeaderType[] = [
  {
    key: "name",
    name: "명칭",
    width: 300,
    minWidth: 100,
  },
];

export const defaultOrderViewHeaders = orderViewHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);