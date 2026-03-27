import { SpaceGroup } from "./space-group";
import { Facility } from "@/types/facility-types";
import { DoctorType } from "@/types/doctor-type";
import { Loader2 } from "lucide-react";
import { SpaceGroupData } from "../hooks/use-space-management";

interface SpaceListProps {
  loading: boolean;
  groupedSpaces: SpaceGroupData[];
  getAssignedDoctors: (facilityId: number) => DoctorType[];
  onEdit: (facility: Facility) => void;
  onDelete: (facility: Facility) => void;
}

export function SpaceList({
  loading,
  groupedSpaces,
  getAssignedDoctors,
  onEdit,
  onDelete
}: SpaceListProps) {

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full pb-20">
      {groupedSpaces.map((group) => (
        <SpaceGroup
          key={group.code}
          code={group.code}
          label={group.label}
          facilities={group.facilities}
          getAssignedDoctors={getAssignedDoctors}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
