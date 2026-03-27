import { useMutation } from "@tanstack/react-query";
import { BundleCategoriesService } from "@/services/master-data/bundle-categories-service";
import type { BundleCategoryInsert } from "@/types/master-data/bundle/bundle-category-type";

export function useBundleCategoryCreate() {
  return useMutation({
    mutationFn: (category: BundleCategoryInsert) => {
      return BundleCategoriesService.createCategory(category);
    },
  });
}
