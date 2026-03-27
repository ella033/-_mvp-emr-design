import { useQuery } from "@tanstack/react-query";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";

export function useGetBundleItemDetail(id: number) {
  return useQuery({
    queryKey: ["bundle-items", "detail", "get", id],
    queryFn: async () => {
      return await BundleItemsService.getBundle(id);
    },
    enabled: id !== 0,
  });
}
