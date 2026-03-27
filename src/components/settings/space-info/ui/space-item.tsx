import { Facility } from "@/types/facility-types";
import { DoctorType } from "@/types/doctor-type";
import { 공간코드 } from "@/constants/common/common-enum";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface SpaceItemProps {
  facility: Facility;
  assignedDoctors?: DoctorType[];
  onEdit: (facility: Facility) => void;
  onDelete: (facility: Facility) => void;
}

export function SpaceItem({ facility, assignedDoctors, onEdit, onDelete }: SpaceItemProps) {
  const isDiagnosisRoom = facility.facilityCode === 공간코드.진료;

  return (
    <div
      className={cn(
        "relative flex flex-col items-start p-[12px] pr-[8px] rounded-[6px] border border-border bg-card transition-all h-[85px] justify-between group",
        "hover:border-primary/50"
      )}
    >
      {/* Header: Name & Actions */}
      <div className="flex justify-between items-start w-full">
        <span className="font-bold text-[16px] leading-[19px] truncate pr-8 mt-1" title={facility.name}>
          {facility.name}
        </span>

        {/* Actions Dropdown */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[100px]">
              <DropdownMenuItem onClick={() => onEdit(facility)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                <span>수정</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(facility)}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>삭제</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content: Assigned Doctors (Diagnosis only) - Figma styled chips */}
      <div className="flex flex-wrap gap-[6px] w-full overflow-hidden items-end content-end">
        {isDiagnosisRoom && assignedDoctors && assignedDoctors.length > 0 ? (
          assignedDoctors.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-center items-start h-[28px] pl-[10px] pr-[8px] bg-background border border-border rounded-[20px]"
            >
              <span className="text-[13px] leading-[16px] font-normal text-foreground whitespace-nowrap">
                {doc.name}
              </span>
            </div>
          ))
        ) : (
          isDiagnosisRoom && (
            <span className="text-[13px] text-muted-foreground pl-[2px] pb-[4px]">배정된 의사 없음</span>
          )
        )}
      </div>
    </div>
  );
}
