import { useMutation } from "@tanstack/react-query";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";

export function useBundleItemMove() {
  return useMutation({
    mutationFn: ({
      id,
      parentType,
      parentId,
      prevSortNumber,
      nextSortNumber,
    }: {
      id: number;
      parentType: "category" | "bundle" | "root";
      parentId: number | null;
      prevSortNumber: number;
      nextSortNumber: number;
    }) => {
      return BundleItemsService.moveBundle(
        id,
        parentType,
        parentId,
        prevSortNumber,
        nextSortNumber
      );
    },
  });
}
