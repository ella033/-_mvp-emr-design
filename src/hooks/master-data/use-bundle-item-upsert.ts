import { useMutation } from "@tanstack/react-query";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";

export function useBundleItemUpsert() {
  return useMutation({
    mutationFn: (bundle: Bundle) => {
      return BundleItemsService.upsertBundle(bundle);
    },
  });
}
