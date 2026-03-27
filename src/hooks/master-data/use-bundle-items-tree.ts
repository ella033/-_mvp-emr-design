import { useQuery } from "@tanstack/react-query";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";

export function useGetBundleItemsTree(keyword?: string) {
  return useQuery({
    queryKey: ["bundle-items", "tree", "get", keyword],
    queryFn: async () => {
      return await BundleItemsService.getItems(keyword);
    },
  });
}
