import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labManagementApi } from "../api/lab-management.api";
import type { ExternalLab } from "../model";

export function useExternalLab() {
  const queryClient = useQueryClient();

  const { data: labs, isLoading } = useQuery({
    queryKey: ["external-lab", "labs"],
    queryFn: () => labManagementApi.getExternalLabs(),
  });

  const sortedLabs = useMemo(() => {
    if (!labs || labs.length === 0) return [];

    const sorted: ExternalLab[] = [];

    // System provided (enabled first)
    const enabledSystemLabs = labs.filter(
      (lab) => lab.isSystemProvided && lab.isEnabled
    );
    const disabledSystemLabs = labs.filter(
      (lab) => lab.isSystemProvided && !lab.isEnabled
    );
    sorted.push(...enabledSystemLabs, ...disabledSystemLabs);

    // Hospital added (enabled first)
    const enabledHospitalLabs = labs.filter(
      (lab) => !lab.isSystemProvided && lab.isEnabled
    );
    const disabledHospitalLabs = labs.filter(
      (lab) => !lab.isSystemProvided && !lab.isEnabled
    );
    sorted.push(...enabledHospitalLabs, ...disabledHospitalLabs);

    return sorted;
  }, [labs]);

  const updateLabMapping = useMutation({
    mutationFn: (data: { externalLabId: string; isEnabled: boolean }) =>
      labManagementApi.updateLabMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab", "labs"] });
      queryClient.invalidateQueries({ queryKey: ["medical-examine-all-labs"] });
    },
  });

  const createLab = useMutation({
    mutationFn: (data: { code: string; name: string }) =>
      labManagementApi.createLab(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab", "labs"] });
      queryClient.invalidateQueries({ queryKey: ["medical-examine-all-labs"] });
    },
  });

  const deleteLab = useMutation({
    mutationFn: (id: string) => labManagementApi.deleteLab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab", "labs"] });
      queryClient.invalidateQueries({ queryKey: ["medical-examine-all-labs"] });
    },
  });

  const updateLab = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; code: string } }) =>
      labManagementApi.updateLab(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab", "labs"] });
      queryClient.invalidateQueries({ queryKey: ["medical-examine-all-labs"] });
    }
  });

  const createLabGrade = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { qualityGrade: number; isPathologyCertified: boolean; isNuclearMedicineCertified: boolean; applyDate: string } }) =>
      labManagementApi.createLabGrade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab", "labs"] });
    }
  });

  // Note: updateLabGrade signature in API expects (id, gradeId, data)
  const updateLabGrade = useMutation({
    mutationFn: ({ id, gradeId, data }: { id: string; gradeId: string; data: { qualityGrade: number; isPathologyCertified: boolean; isNuclearMedicineCertified: boolean } }) =>
      labManagementApi.updateLabGrade(id, gradeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab", "labs"] });
    }
  });

  return {
    labs: sortedLabs,
    isLoading,
    updateLabMapping,
    createLab,
    deleteLab,
    updateLab,
    createLabGrade,
    updateLabGrade
  };
}
