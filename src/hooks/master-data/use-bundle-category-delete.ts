import { useMutation } from "@tanstack/react-query";
import { BundleCategoriesService } from "@/services/master-data/bundle-categories-service";

export function useBundleCategoryDelete() {
  return useMutation({
    mutationFn: (id: number) => {
      return BundleCategoriesService.deleteCategory(id);
    },
  });
}
