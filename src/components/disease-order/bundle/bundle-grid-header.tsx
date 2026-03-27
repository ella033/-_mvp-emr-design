import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const LS_BUNDLE_GRID_HEADERS_KEY = "bundle-grid-headers";
export const LS_MEDICAL_BUNDLE_GRID_HEADERS_KEY = "medical-bundle-grid-headers";

const bundleGridHeaders: MyTreeGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 300,
  },
  {
    key: "price",
    name: "묶음가",
    align: "right",
  },
  {
    key: "receiptPrintLocation",
    name: "영수증항목",
  }
];

export const defaultBundleGridHeaders = bundleGridHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

const bundleViewGridHeaders: MyTreeGridHeaderType[] = [
  {
    key: "name",
    name: "명칭",
    width: 300,
    minWidth: 100,
  },
];

export const defaultBundleViewGridHeaders = bundleViewGridHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);