import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BundleItemsService } from "@/services/master-data/bundle-items-service";
import type { operations } from "@/generated/api/types";

type ToggleFavoriteParams = {
  id: operations["BundleItemsController_toggleFavorite"]["parameters"]["path"]["id"];
  isFavorite: operations["BundleItemsController_toggleFavorite"]["parameters"]["query"]["isFavorite"];
};

export function useBundleItemToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: ToggleFavoriteParams) => {
      return BundleItemsService.toggleFavorite(id, isFavorite);
    },
    onSuccess: () => {
      // bundle-items 관련 쿼리들을 무효화하여 데이터 새로고침
      queryClient.invalidateQueries({
        queryKey: ["bundle-items"],
      });
    },
  });
}
