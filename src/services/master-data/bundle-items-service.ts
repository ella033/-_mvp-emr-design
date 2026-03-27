import { ApiClient } from "@/lib/api/api-client";
import { bundleItemsApi } from "@/lib/api/routes/bundle-items-api";
import { BundleItems } from "@/types/master-data/bundle/bundle-items-type";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { operations } from "@/generated/api/types";
import { formatDate } from "@/lib/date-utils";

export class BundleItemsService {
  static async getBundle(
    id: number,
    baseDate: string = formatDate(new Date(), "-")
  ): Promise<Bundle> {
    return await ApiClient.get<Bundle>(bundleItemsApi.detail(id, baseDate));
  }

  static async getItems(keyword?: string): Promise<BundleItems> {
    return await ApiClient.get<BundleItems>(
      bundleItemsApi.list(keyword ? `keyword=${keyword}` : "")
    );
  }

  static async upsertBundle(bundle: Bundle): Promise<Bundle> {
    const existingId = bundle.id?.toString();
    return await ApiClient.post<Bundle>(
      bundleItemsApi.upsert(existingId),
      bundle
    );
  }

  static async moveBundle(
    id: number,
    parentType: "category" | "bundle" | "root",
    parentId: number | null,
    prevSortNumber: number,
    nextSortNumber: number
  ): Promise<Bundle> {
    return await ApiClient.patch<Bundle>(bundleItemsApi.move(id), {
      parentType,
      parentId: parentId ? parentId : null,
      prevSortNumber,
      nextSortNumber,
    });
  }

  static async deleteBundle(id: number): Promise<void> {
    return await ApiClient.delete<void>(bundleItemsApi.delete(id));
  }

  static async toggleFavorite(
    id: number,
    isFavorite: boolean
  ): Promise<
    operations["BundleItemsController_toggleFavorite"]["responses"]["200"]
  > {
    const params = new URLSearchParams();
    params.append("isFavorite", isFavorite.toString());

    return await ApiClient.patch<
      operations["BundleItemsController_toggleFavorite"]["responses"]["200"]
    >(`${bundleItemsApi.toggleFavorite(id)}?${params.toString()}`);
  }
}
