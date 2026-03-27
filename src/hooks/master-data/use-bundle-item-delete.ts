import { useMutation } from "@tanstack/react-query";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";

export function useBundleItemDelete() {
  return useMutation({
    mutationFn: (id: number) => {
      return BundleItemsService.deleteBundle(id);
    },
  });
}
