import type { Bundle } from "./bundle-type";
import type { BundleCategory } from "./bundle-category-type";

// 유니온 타입
export type BundleItem = BundleCategory | Bundle;
// 배열 타입
export type BundleItems = BundleItem[];
