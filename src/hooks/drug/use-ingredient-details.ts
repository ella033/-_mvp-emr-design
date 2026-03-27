import { useQuery } from "@tanstack/react-query";
import { DrugsService } from "@/services/drugs-service";

export const useDrugIngredientDetails = (id: string) => {
  return useQuery({
    queryKey: ["drug-ingredient-details", id],
    queryFn: async () => {
      return await DrugsService.getDrugIngredientDetails(id);
    },
    enabled: !!id && !["undefined", "null"].includes(id),
  });
};
