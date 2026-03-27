import { useMutation } from "@tanstack/react-query";
import { BundleCategoriesService } from "@/services/master-data/bundle-categories-service";

export function useBundleCategoryMove() {
  return useMutation({
    mutationFn: ({
      id,
      parentId,
      prevSortNumber,
      nextSortNumber,
    }: {
      id: number;
      parentId: number | null;
      prevSortNumber: number;
      nextSortNumber: number;
    }) => {
      return BundleCategoriesService.moveCategory(
        id,
        parentId,
        prevSortNumber,
        nextSortNumber
      );
    },
  });
}
