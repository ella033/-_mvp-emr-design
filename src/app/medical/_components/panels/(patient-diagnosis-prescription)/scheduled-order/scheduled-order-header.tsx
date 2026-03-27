import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const LS_SCHEDULED_ORDER_HEADERS_KEY = "scheduled-order-headers";

const scheduledOrderHeaders: MyTreeGridHeaderType[] = [
  {
    key: "scheduledOrderApplyDate",
    name: "수행일",
    width: 120,
    minWidth: 120,
  },
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
    key: "scheduledOrderMemo",
    name: "메모",
    align: "center",
    width: 40,
    minWidth: 40,
    maxWidth: 40,
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
    key: "insurancePrice",
    name: "보험가",
    align: "right",
    width: 70,
    minWidth: 50,
  },
  {
    key: "generalPrice",
    name: "일반가",
    align: "right",
    width: 70,
    minWidth: 50,
  },
  {
    key: "scheduledOrderCreateDate",
    name: "등록일",
    width: 75,
    minWidth: 75,
  },
  {
    key: "scheduledOrderCreateName",
    name: "등록자",
    width: 75,
    minWidth: 75,
  },
];

export const defaultScheduledOrderHeaders = scheduledOrderHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);
