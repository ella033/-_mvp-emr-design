import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_USAGE_HEADERS_KEY = "usage-headers";

const usageHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    width: 120,
    minWidth: 60,
  },
  {
    key: "usage",
    name: "용법",
    width: 400,
    minWidth: 200,
  },
  {
    key: "category",
    name: "카테고리",
    width: 100,
    minWidth: 50,
  },
  {
    key: "times",
    name: "일투",
    width: 70,
    minWidth: 35,
  },
];

export const defaultUsageHeaders = usageHeaders.map((header, index) => ({
  ...header,
  visible: true,
  sortNumber: index,
}));
