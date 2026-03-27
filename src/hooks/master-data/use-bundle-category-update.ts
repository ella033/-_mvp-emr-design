import { useMutation } from "@tanstack/react-query";
import { BundleCategoriesService } from "@/services/master-data/bundle-categories-service";
import type { BundleCategory } from "@/types/master-data/bundle/bundle-category-type";

export function useBundleCategoryUpdate() {
  return useMutation({
    mutationFn: (category: BundleCategory) => {
      return BundleCategoriesService.updateCategory(category);
    },
  });
}
