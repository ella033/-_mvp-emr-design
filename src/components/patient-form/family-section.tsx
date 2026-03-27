import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/patient-form/form-select";
import type { PatientFormType } from "@/types/patient-types";
import { FAMILY_OPTIONS } from "@/constants/form-options";

interface FamilySectionProps {
  form: PatientFormType;
  onFieldChange: (field: keyof PatientFormType, value: string) => void;
  openSelect: string | null;
  setOpenSelect: (select: string | null) => void;
}

export function FamilySection({
  form,
  onFieldChange,
  openSelect,
  setOpenSelect,
}: FamilySectionProps) {
  return (
    <div className="mt-6">
      <h3 className="font-bold text-[1rem] mb-4">가족 정보</h3>

      <div className="grid grid-cols-3 gap-2">
        <FormSelect
          label="가족 선택"
          placeholder="가족"
          value={form.family}
          onValueChange={(value) => onFieldChange("family", value)}
          items={FAMILY_OPTIONS.map((option) => ({
            value: option.value.toString(),
            label: option.label,
          }))}
          open={openSelect === "family"}
          onOpenChange={(open) => setOpenSelect(open ? "family" : null)}
        />

        <div className="flex flex-col gap-1">
          <span>가족명</span>
          <Input
            name="가족명"
            placeholder="가족명"
            className="placeholder:text-[#999] text-[#333]"
            value={form.familyName}
            onChange={(e) => onFieldChange("familyName", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span>연락처</span>
          <Input
            name="가족연락처"
            placeholder="010-0000-0000"
            className="placeholder:text-[#999] text-[#333]"
            value={form.familyPhone}
            onChange={(e) => onFieldChange("familyPhone", e.target.value)}
          />
        </div>
      </div>

      {/* 가족 정보 입력 안내 */}
      <div className="mt-2 text-[0.7rem] text-[#999]">
        <p>가족 관계를 선택하고 가족명과 연락처를 입력해주세요.</p>
      </div>
    </div>
  );
}
