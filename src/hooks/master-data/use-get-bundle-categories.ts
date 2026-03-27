import { useQuery } from "@tanstack/react-query";
import { BundleCategoriesService } from "@/services/master-data/bundle-categories-service";

export function useGetBundleCategories() {
  return useQuery({
    queryKey: ["bundle-categories"],
    queryFn: () => BundleCategoriesService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}
