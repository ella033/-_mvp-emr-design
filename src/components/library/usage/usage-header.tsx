import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_USAGE_HEADERS_KEY = "usage-headers";

const usageHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "사용자코드",
    width: 70,
    minWidth: 70,
  },
  {
    key: "usage",
    name: "용법",
    width: 350,
  },
  {
    key: "times",
    name: "일투",
    width: 35,
    minWidth: 35,
  }
];

export const defaultUsageHeaders = usageHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);
