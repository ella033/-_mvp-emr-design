import type {
  BundleItem,
  BundleItems,
} from "@/types/master-data/bundle/bundle-items-type";
import type { BundleCategory } from "@/types/master-data/bundle/bundle-category-type";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import { toKRW } from "@/lib/patient-utils";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export const convertBundleItemsToTreeGridRowType = (
  parentRowKey: string | null,
  bundleItems: BundleItems,
  RowAction?: (bundle: Bundle) => React.ReactNode
): MyTreeGridRowType[] => {
  if (!bundleItems || !Array.isArray(bundleItems)) {
    return [];
  }

  return bundleItems
    .map((bundleItem) => {
      return convertBundleItemToTreeGridRowType(parentRowKey, bundleItem, RowAction);
    })
    .filter((item) => item !== null);
};

export const convertBundleItemToTreeGridRowType = (
  parentRowKey: string | null,
  bundleItem: BundleItem,
  RowAction?: (bundle: Bundle) => React.ReactNode
): MyTreeGridRowType | null => {
  // BundleCategory는 categoryId가 없고, Bundle은 categoryId가 있음
  if (bundleItem.hasOwnProperty("categoryId")) {
    return convertBundleToTreeGridRowType(parentRowKey, bundleItem as Bundle, RowAction);
  } else {
    return convertBundleCategoryToTreeGridRowType(
      parentRowKey,
      bundleItem as BundleCategory,
      RowAction
    );
  }
};

const convertBundleCategoryToTreeGridRowType = (
  parentRowKey: string | null,
  bundleCategory: BundleCategory,
  RowAction?: (bundle: Bundle) => React.ReactNode
): MyTreeGridRowType => {
  const rowKey = getRowKey("bundle-category", bundleCategory.id);
  return {
    rowKey: rowKey,
    parentRowKey: parentRowKey,
    type: "folder",
    orgData: {
      type: "bundle-category",
      data: bundleCategory,
    },
    cells: [
      {
        headerKey: "name",
        value: bundleCategory.name,
        inputType: "text"
      },
      {
        headerKey: "price",
        value: null,
      },
      {
        headerKey: "isActive",
        value: null,
      },
    ],
    children: convertBundleItemsToTreeGridRowType(
      rowKey,
      bundleCategory.children || [],
      RowAction
    ),
  };
};

const convertBundleToTreeGridRowType = (
  parentRowKey: string | null,
  bundle: Bundle,
  RowAction?: (bundle: Bundle) => React.ReactNode
): MyTreeGridRowType | null => {
  if (!bundle.id) return null;
  const rowKey = getRowKey("bundle", `${parentRowKey}-${bundle.id}`);
  return {
    rowKey: rowKey,
    parentRowKey: parentRowKey,
    type: "package",
    orgData: {
      type: "bundle",
      data: bundle,
    },
    cells: [
      {
        headerKey: "name",
        value: bundle.name,
        inputType: "text",
      },
      {
        headerKey: "price",
        value: toKRW(bundle.price),
      },
      {
        headerKey: "isActive",
        value: bundle.isActive,
        inputType: "checkbox",
      },
    ],
    rowAction: RowAction ? RowAction(bundle) : undefined,
    children: convertBundleItemsToTreeGridRowType(
      rowKey,
      bundle.children || [],
      RowAction
    ),
  };
};
