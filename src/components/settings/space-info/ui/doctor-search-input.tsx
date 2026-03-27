import { useState, useMemo, useRef, useEffect } from "react";
import { DoctorType } from "@/types/doctor-type";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoctorSearchInputProps {
  doctors: DoctorType[];
  assignedDoctorIds: number[];
  onAssign: (id: number) => void;
  onUnassign: (id: number) => void;
  className?: string;
}

export function DoctorSearchInput({
  doctors,
  assignedDoctorIds,
  onAssign,
  onUnassign,
  className,
}: DoctorSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter doctors: match name/email AND not already assigned
  const filteredDoctors = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();

    return doctors.filter((doc) => {
      const isAssigned = assignedDoctorIds.includes(doc.id);
      if (isAssigned) return false;

      // If search term is empty, show all unassigned
      if (!searchTerm) return true;

      const matchName = doc.name.toLowerCase().includes(lowerTerm);
      const matchEmail = doc.email?.toLowerCase().includes(lowerTerm);
      return matchName || matchEmail;
    });
  }, [doctors, assignedDoctorIds, searchTerm]);

  const handleSelect = (doc: DoctorType) => {
    onAssign(doc.id);
    setSearchTerm("");
    setIsOpen(false);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDoctors = doctors.filter(doc => assignedDoctorIds.includes(doc.id));

  return (
    <div className={cn("flex flex-col gap-3", className)} ref={containerRef}>
      {/* Search Input Container */}
      <div className="relative">
        <input
          type="text"
          className="w-full h-[40px] pl-[34px] pr-[12px] bg-background border border-border rounded-[6px] text-[13px] placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors text-foreground"
          placeholder="진료의 검색 (이름, 이메일)"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <Search className="absolute left-[10px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        {/* Custom Dropdown Results */}
        {isOpen && filteredDoctors.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-[6px] shadow-lg max-h-[200px] overflow-auto py-1">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col px-3 py-2 text-[13px] cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleSelect(doc)}
              >
                <span className="font-medium text-foreground">{doc.name}</span>
                <span className="text-[11px] text-muted-foreground">{doc.email}</span>
              </div>
            ))}
          </div>
        )}
        {isOpen && searchTerm && filteredDoctors.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-[6px] shadow-lg py-3 text-center text-[13px] text-muted-foreground">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* Selected Tags Area */}
      {selectedDoctors.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-[6px] border border-dashed border-border min-h-[40px]">
          {selectedDoctors.map((doc) => (
            <Badge key={doc.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1 text-[12px] font-normal bg-background border border-border hover:bg-background text-foreground">
              <span>{doc.name}</span>
              <span className="text-muted-foreground text-[11px] border-l border-border ml-1 pl-1">
                {doc.email}
              </span>
              <button
                type="button"
                className="ml-1 rounded-full p-0.5 hover:bg-muted/50 text-muted-foreground hover:text-destructive focus:outline-none transition-colors cursor-pointer"
                onClick={() => onUnassign(doc.id)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">삭제</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}


