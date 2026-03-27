import { ApiClient } from "@/lib/api/api-client";
import { bundleCategoriesApi } from "@/lib/api/routes/bundle-categories-api";
import type {
  BundleCategory,
  BundleCategoryInsert,
} from "@/types/master-data/bundle/bundle-category-type";

export class BundleCategoriesService {
  static async getCategories(): Promise<BundleCategory[]> {
    return await ApiClient.get<BundleCategory[]>(bundleCategoriesApi.list);
  }

  static async createCategory(
    category: BundleCategoryInsert
  ): Promise<BundleCategory> {
    return await ApiClient.post<BundleCategory>(
      bundleCategoriesApi.create,
      category
    );
  }

  static async updateCategory(
    category: BundleCategory
  ): Promise<BundleCategory> {
    return await ApiClient.put<BundleCategory>(
      bundleCategoriesApi.update(category.id),
      category
    );
  }

  static async moveCategory(
    id: number,
    parentId: number | null,
    prevSortNumber: number,
    nextSortNumber: number
  ): Promise<BundleCategory> {
    return await ApiClient.patch<BundleCategory>(bundleCategoriesApi.move(id), {
      parentId: parentId ? parentId : null,
      prevSortNumber,
      nextSortNumber,
    });
  }

  static async deleteCategory(id: number): Promise<void> {
    return await ApiClient.delete<void>(bundleCategoriesApi.delete(id));
  }
}
