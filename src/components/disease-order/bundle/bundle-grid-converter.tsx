import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import type { BundleRelation } from "@/types/master-data/bundle/bundle-type";
import { GetItemTypeCategoryIcon } from "@/types/master-data/item-type";
import { toKRW } from "@/lib/patient-utils";
import { RECEIPT_PRINT_LOCATION_OPTIONS } from "@/constants/common/common-option";
import {
  BUNDLE_PRICE_TYPE_OPTIONS,
  BundlePriceType,
} from "@/constants/bundle-price-type";
import { getRowKey } from "@/components/yjg/my-tree-grid/my-tree-grid-util";

export const convertBundleRelationToMyTreeGridType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  parentRelations: BundleRelation[]
): MyTreeGridRowType[] => {
  return parentRelations.map((relation, index) => ({
    rowKey: getRowKey("bundle-relation", index),
    parentRowKey: null,
    type: "item",
    orgData: {
      type: "bundle-relation",
      data: relation,
    },
    iconBtn: <GetItemTypeCategoryIcon size={size} category="bundle" />,
    cells: [
      {
        headerKey: "code",
        value: relation.child.code,
      },
      {
        headerKey: "name",
        value: relation.child.name,
      },
      {
        headerKey: "price",
        value:
          relation.child.priceType === BundlePriceType.직접입력
            ? toKRW(relation.child.price)
            : BUNDLE_PRICE_TYPE_OPTIONS.find(
              (option) =>
                option.value === relation.child.priceType?.toString()
            )?.label,
      },
      {
        headerKey: "receiptPrintLocation",
        value: RECEIPT_PRINT_LOCATION_OPTIONS.find(
          (option) =>
            option.value === Number(relation.child.receiptPrintLocation)
        )?.label,
      }
    ],
  }));
};

export const convertBundleLibraryToMyTreeGridType = (
  size: "xs" | "sm" | "default" | "lg" | "xl",
  bundleLibrary: any
): MyTreeGridRowType | null => {
  if (!bundleLibrary || typeof bundleLibrary !== "object") return null;

  const rowKey = getRowKey("bundle-library");

  return {
    rowKey,
    parentRowKey: null,
    type: "item",
    orgData: {
      type: "bundle-library",
      data: bundleLibrary,
    },
    iconBtn: <GetItemTypeCategoryIcon size={size} category="bundle" />,
    cells: [
      {
        headerKey: "code",
        value: bundleLibrary.code,
      },
      {
        headerKey: "name",
        value: bundleLibrary.name,
      },
      {
        headerKey: "price",
        value: toKRW(bundleLibrary.price),
      },
      {
        headerKey: "receiptPrintLocation",
        value: RECEIPT_PRINT_LOCATION_OPTIONS.find(
          (option) =>
            option.value === Number(bundleLibrary.receiptPrintLocation)
        )?.label,
      }
    ],
  };
};

export const convertMedicalBundleRelationToMyTreeGridType = (
  parentRelations: BundleRelation[]
): MyTreeGridRowType[] => {
  return parentRelations.map((relation, index) => ({
    rowKey: getRowKey("bundle-relation", index),
    parentRowKey: null,
    type: "item",
    orgData: {
      type: "bundle-relation",
      data: relation,
    },
    cells: [
      {
        headerKey: "code",
        value: relation.child.code,
      },
      {
        headerKey: "name",
        value: relation.child.name,
      },
      {
        headerKey: "price",
        value:
          relation.child.priceType === BundlePriceType.직접입력
            ? toKRW(relation.child.price)
            : BUNDLE_PRICE_TYPE_OPTIONS.find(
              (option) =>
                option.value === relation.child.priceType?.toString()
            )?.label,
      },
    ],
  }));
};