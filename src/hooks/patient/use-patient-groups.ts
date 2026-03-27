import { useQuery, useMutation } from "@tanstack/react-query";
import { PatientGroupsService } from "@/services/patient-groups-service";
import type {
  CreatePatientGroupRequest,
  PatientGroup,
  UpdatePatientGroupRequest,
} from "@/types/patient-groups-types";
import type { Patient } from "@/types/patient-types";

export function usePatientGroups() {
  return useQuery<PatientGroup[]>({
    queryKey: ["patient-groups"],
    queryFn: () => PatientGroupsService.getPatientGroups(),
  });
}

export function usePatientGroupById(id: string, enabled: boolean = true) {
  return useQuery<PatientGroup>({
    queryKey: ["patient-group", id],
    queryFn: () => PatientGroupsService.getPatientGroupById(id),
    enabled: enabled && !!id,
  });
}

export function usePatientGroupDetailPatientsListById(
  id: string,
  enabled: boolean = true
) {
  return useQuery<Patient[]>({
    queryKey: ["patient-group", id, "patients"],
    queryFn: () =>
      PatientGroupsService.getPatientGroupDetailPatientsListById(id),
    enabled: enabled && !!id,
  });
}

export const useCreatePatientGroup = () => {
  return useMutation({
    mutationFn: (data: CreatePatientGroupRequest) =>
      PatientGroupsService.createPatientGroup(data),
  });
};

export const useUpdatePatientGroup = () => {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePatientGroupRequest;
    }) => PatientGroupsService.updatePatientGroup(id, data),
  });
};

export const useDeletePatientGroup = () => {
  return useMutation({
    mutationFn: (id: string) => PatientGroupsService.deletePatientGroup(id),
  });
};   

