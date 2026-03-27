import { useEffect, useState } from "react";
import { DoctorSearchInput } from "./doctor-search-input";
import MyPopUp from "@/components/yjg/my-pop-up";
import { Loader2 } from "lucide-react";

import { Facility, DoctorType, 공간코드, 공간코드라벨 } from "../model";

interface ManageSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFacility?: Facility | null;
  assignedDoctors?: DoctorType[]; // For editing
  doctors: DoctorType[]; // All available doctors
  onSave: (name: string, type: 공간코드, doctorIds?: number[]) => Promise<boolean>;
}

export function ManageSpaceModal({
  isOpen,
  onClose,
  editingFacility,
  assignedDoctors = [],
  doctors,
  onSave
}: ManageSpaceModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or editing facility changes
  useEffect(() => {
    if (isOpen) {
      if (editingFacility) {
        setName(editingFacility.name);
        setType(editingFacility.facilityCode.toString());
        // Map assigned doctors to IDs
        setSelectedDoctorIds(assignedDoctors.map(d => d.id));
      } else {
        setName("");
        setType("");
        setSelectedDoctorIds([]);
      }
    }
  }, [isOpen, editingFacility, assignedDoctors]);

  const handleSubmit = async () => {
    if (!name || !type) return;

    setIsSubmitting(true);
    try {
      const typeNum = parseInt(type) as 공간코드;
      // Use IDs directly
      const success = await onSave(name, typeNum, selectedDoctorIds);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to save space:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDiagnosis = parseInt(type) === 공간코드.진료;

  const handleAssign = (id: number) => {
    if (!selectedDoctorIds.includes(id)) {
      setSelectedDoctorIds(prev => [...prev, id]);
    }
  };

  const handleUnassign = (id: number) => {
    setSelectedDoctorIds(prev => prev.filter(prevId => prevId !== id));
  };

  return (
    <MyPopUp
      isOpen={isOpen}
      onCloseAction={onClose}
      title={editingFacility ? "공간 정보 수정" : "공간 정보 등록"}
      fitContent={true}
    >
      <div className="flex flex-col w-[450px] min-h-[240px]">
        <div className="flex flex-1 flex-col gap-[20px] p-[14px]">
          {/* Space Type */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-bold text-foreground leading-[16px]">
              공간 유형 <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!!editingFacility && editingFacility.facilityCode !== 공간코드.진료 && false}
                style={{
                  color: type ? "inherit" : "var(--muted-foreground)"
                }}
              >
                <option value="" disabled className="text-muted-foreground">공간 유형을 선택해주세요</option>
                {Object.values(공간코드)
                  .filter(v => typeof v === "number")
                  .map(code => (
                    <option key={code} value={code.toString()} className="text-foreground">
                      {공간코드라벨[code as 공간코드]}
                    </option>
                  ))
                }
              </select>
              {/* Dropdown Arrow */}
              <div className="absolute right-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.5 6L8 10.5L12.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Space Name */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-bold text-foreground leading-[16px]">
              공간명 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className="w-full h-[40px] px-[12px] bg-background border border-border rounded-[6px] text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
              placeholder="예) 진료실1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Assigned Doctors (Only for Diagnosis) */}
          {isDiagnosis && (
            <div className="flex flex-col gap-[6px]">
              <label className="text-[13px] font-bold text-foreground leading-[16px]">
                진료의
              </label>
              <DoctorSearchInput
                doctors={doctors}
                assignedDoctorIds={selectedDoctorIds}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
              />
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex justify-end gap-[8px] p-[16px]">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="h-[32px] px-[12px] border border-border rounded-[4px] bg-background text-[13px] text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !type || isSubmitting}
            className="h-[32px] px-[12px] rounded-[4px] bg-primary text-[13px] text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px] cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "저장"}
          </button>
        </div>

      </div>
    </MyPopUp>
  );
}
