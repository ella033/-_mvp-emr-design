import { Facility } from "@/types/facility-types";
import { DoctorType } from "@/types/doctor-type";
import { SpaceItem } from "./space-item";
import { cn } from "@/lib/utils";
import { 공간코드 } from "@/constants/common/common-enum";

interface SpaceGroupProps {
  label: string;
  code: 공간코드;
  facilities: Facility[];
  getAssignedDoctors: (facilityId: number) => DoctorType[];
  onEdit: (facility: Facility) => void;
  onDelete: (facility: Facility) => void;
}

export function SpaceGroup({
  label,
  code,
  facilities,
  getAssignedDoctors,
  onEdit,
  onDelete
}: SpaceGroupProps) {
  // Empty state rendering is handled by the parent or just empty grid
  // Design says "등록된 공간이 없습니다." if empty.

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 font-bold text-base leading-[140%] tracking-[-0.16px] text-[16px]">
          <span className="text-foreground">{label}</span>
          <span className="text-[#4F29E5] ">
            {facilities.length}
          </span>
        </div>
        <div className="text-[#989BA2] text-sm font-medium leading-[125%] tracking-[-0.14px] mt-[10px]">
          {code === 공간코드.진료 && (
            <p className="">
              진료 유형의 공간은 의사 사용자들의 진료실로 지정할 수 있습니다.
            </p>
          )}
        </div>
      </div>


      {/* Grid */}
      {
        facilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {facilities.map((facility) => (
              <SpaceItem
                key={facility.id}
                facility={facility}
                assignedDoctors={getAssignedDoctors(facility.id)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 border border-dashed rounded-lg bg-secondary/20">
            <span className="text-muted-foreground text-sm">등록된 공간이 없습니다.</span>
          </div>
        )
      }
    </div >
  );
}
