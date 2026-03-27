import { useQuery } from "@tanstack/react-query";
import { PatientsService } from "@/services/patients-service";

export const usePatient = (id: number) => {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      return PatientsService.getPatient(id);
    },
    enabled: !!id && typeof id === "number" && id > 0,
  });
};
