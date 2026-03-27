import type { BundleItem } from "./bundle-items-type";

export interface BundleCategory {
  id: number;
  hospitalId?: number;
  parentId?: number | null;
  sortNumber?: number | null;
  name?: string;
  createId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
  isActive?: boolean;
  children?: BundleItem[];
}

export interface BundleCategoryInsert {
  name: string;
  parentId: number | null;
}
