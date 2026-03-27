import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const LS_BUNDLE_LIST_HEADERS_KEY = "bundle-list-headers";
export const LS_MEDICAL_BUNDLE_LIST_HEADERS_KEY = "medical-bundle-list-headers";

const bundleListHeaders: MyTreeGridHeaderType[] = [
  {
    key: "name",
    name: "명칭",
    align: "left",
    width: 300,
  },
  {
    key: "price",
    name: "가격",
    align: "right",
  },
  {
    key: "isActive",
    name: "사용",
    align: "center",
  },
];

export const defaultBundleListHeaders = bundleListHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

const medicalBundleListHeaders: MyTreeGridHeaderType[] = [
  {
    key: "name",
    name: "명칭",
    align: "left",
    width: 600,
  },
];

export const defaultMedicalBundleListHeaders = medicalBundleListHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);