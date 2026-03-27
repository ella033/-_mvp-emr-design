import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spaceInfoApi } from "../api/space-info.api";
import { useDoctorsStore } from "@/store/doctors-store"; // Keep using store for doctors or refactor?
// Original used useDoctorsStore. Doctors list is likely global. 
// Refactoring doctors is a separate task (Task 8).
// So I will keep useDoctorsStore for now.

import { 공간코드, 공간코드라벨 } from "../model";
import type { SpaceGroupData, Facility } from "../model";

export function useSpaceManagement(hospitalId: string) {
  const queryClient = useQueryClient();
  const { doctors } = useDoctorsStore();



  const { data: facilities = [], isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ["facilities", hospitalId],
    queryFn: () => spaceInfoApi.getFacilities(hospitalId),
    enabled: !!hospitalId,
  });

  const createMutation = useMutation({
    mutationFn: spaceInfoApi.createFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities", hospitalId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (variables: { id: number; data: any }) =>
      spaceInfoApi.updateFacility(variables.id, variables.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities", hospitalId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: spaceInfoApi.deleteFacility,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities", hospitalId] });
    },
  });

  // Grouping logic
  const groupedSpaces = useMemo(() => {
    const groups: SpaceGroupData[] = Object.values(공간코드)
      .filter((v) => typeof v === "number")
      .map((code) => ({
        code: code as number,
        label: 공간코드라벨[code as 공간코드] || "기타",
        facilities: [],
      }));

    facilities.forEach((facility) => {
      // Filter by hospital if API returns mix? API call filtered by hospitalId so should be fine.
      // Original code filtered by hospitalId again.
      if (facility.hospitalId && hospitalId && facility.hospitalId !== Number(hospitalId)) return;

      const group = groups.find((g) => g.code === facility.facilityCode);
      if (group) {
        group.facilities.push(facility);
      }
    });

    return groups;
  }, [facilities, hospitalId]);

  const handleAddSpace = async (name: string, type: number, doctorIds?: number[]) => {
    const payload = {
      hospitalId: parseInt(hospitalId),
      name,
      facilityCode: type,
      doctorIds,
    };

    const newFacility = await createMutation.mutateAsync(payload);

    // Mock assignment removed
    // Invalidate queries will refresh the list with backend data
    return true;
  };

  const handleUpdateSpace = async (id: number, name: string, type: number, doctorIds?: number[]) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        name,
        facilityCode: type,
        hospitalId: parseInt(hospitalId),
        doctorIds, // Added missing field
      }
    });

    return true;
  };

  const handleDeleteSpace = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    return true;
  };

  const getAssignedDoctors = (facilityId: number) => {
    const facility = facilities.find(f => f.id === facilityId);
    if (!facility || !facility.appointmentRooms) return [];

    // Map appointmentRooms users to DoctorType
    return facility.appointmentRooms
      .map(room => room.user)
      .filter(user => !!user) as import("@/types/doctor-type").DoctorType[];
  };

  return {
    loading: isFacilitiesLoading || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    groupedSpaces,
    doctors,
    actions: {
      addSpace: handleAddSpace,
      updateSpace: handleUpdateSpace,
      deleteSpace: handleDeleteSpace,
      getAssignedDoctors,
    }
  };
}
