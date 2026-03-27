import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_SPECIFIC_DETAIL_HEADERS_KEY = "specific-detail-headers";

const specificDetailHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
    width: 100,
    minWidth: 80,
  },
  {
    key: "name",
    name: "명칭",
    width: 250,
    minWidth: 100,
  },
  {
    key: "enrolled",
    name: "등록",
    align: "center",
    width: 35,
    minWidth: 35,
  }
];

export const defaultSpecificDetailHeaders = specificDetailHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

