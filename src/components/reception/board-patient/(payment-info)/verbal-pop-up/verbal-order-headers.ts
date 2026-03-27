import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const LS_VERBAL_SCHEDULED_HEADERS_KEY = "verbal-scheduled-order-headers";
export const LS_VERBAL_GENERAL_HEADERS_KEY = "verbal-general-order-headers";
export const LS_VERBAL_SELECTED_HEADERS_KEY = "verbal-selected-order-headers";

// 일반처방 탭 헤더
export const VERBAL_GENERAL_ORDER_HEADERS: MyTreeGridHeaderType[] = [
    {
    key: "scheduledOrderApplyDate",
    name: "수행일",
    width: 120,
    minWidth: 0,
  },
  { key: "userCode", name: "사용자코드", width: 70, minWidth: 0, visible: true },
  { key: "name", name: "명칭", width: 200, minWidth: 0, visible: true },
  { key: "dose", name: "용량", align: "center", width: 30, minWidth: 0, visible: true },
  { key: "times", name: "일투", align: "center", width: 30, minWidth: 0, visible: true },
  { key: "days", name: "일수", align: "center", width: 30, minWidth: 0, visible: true },
  { key: "insurancePrice", name: "보험가", align: "right", width: 70, minWidth: 0, visible: true },
  { key: "generalPrice", name: "일반가", align: "right", width: 70, minWidth: 0, visible: true },
];

// 처방리스트 헤더
export const VERBAL_SELECTED_ORDER_HEADERS: MyTreeGridHeaderType[] = [
  { key: "inputType", name: "구분", align: "center", width: 60, visible: true },
  { key: "userCode", name: "사용자코드", width: 70, minWidth: 70, visible: true },
  { key: "name", name: "명칭", width: 200, minWidth: 100, visible: true },
  { key: "dose", name: "용량", align: "center", width: 30, minWidth: 30, visible: true },
  { key: "times", name: "일투", align: "center", width: 30, minWidth: 30, visible: true },
  { key: "days", name: "일수", align: "center", width: 30, minWidth: 30, visible: true },
  { key: "insurancePrice", name: "보험가", align: "right", width: 70, minWidth: 50, visible: true },
  { key: "generalPrice", name: "일반가", align: "right", width: 70, minWidth: 50, visible: true },
];
