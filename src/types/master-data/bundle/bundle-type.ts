import type { BundleItem } from "./bundle-items-type";
import type { PaymentMethod } from "@/constants/common/common-enum";
import type { BundlePriceType } from "@/constants/bundle-price-type";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { BundleItemDisease } from "./bundle-item-disease-type";
import type { BundleItemOrder } from "./bundle-item-order-type";

export interface Bundle {
  id?: number;
  parentId?: number | null;
  categoryId?: number | null;
  code?: string;
  name?: string;
  isActive?: boolean;
  sortNumber?: string | null;
  priceType?: BundlePriceType;
  price?: number;
  paymentMethod?: PaymentMethod;
  receiptPrintLocation?: number;
  isShowBundleName?: boolean;
  isHealthScreening?: boolean;
  isVerbal?: boolean;
  isClaim?: boolean; // 내원일 비청구
  isFavorite?: boolean;
  symptom?: string;
  specificDetail?: SpecificDetail[];
  createId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
  hospitalId?: number;

  parent?: null;
  children?: BundleItem[];
  // 추가된 필드들
  bundleCategory?: BundleCategory;
  bundleItemDiseases?: BundleItemDisease[];
  bundleItemOrders?: BundleItemOrder[];
  bundleItemChildren?: BundleItem[];
  childRelations?: BundleRelation[];
  parentRelations?: BundleRelation[];
}

// 추가된 타입들
export interface BundleCategory {
  id: number;
  hospitalId: number;
  parentId: number | null;
  sortNumber: string | null;
  name: string;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  isActive: boolean;
}

export interface BundleRelation {
  id: number;
  parentId: number;
  childId: number;
  sortNumber: string;
  child: Bundle;
}
