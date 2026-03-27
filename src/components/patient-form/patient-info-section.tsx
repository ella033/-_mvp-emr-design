import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/patient-form/form-select";
import { genderLabel } from "@/constants/patient";
import { insuranceTypeLabel } from "@/constants/patient";
import type { PatientFormType } from "@/types/patient-types";

interface PatientInfoSectionProps {
  form: PatientFormType;
  onFieldChange: (field: keyof PatientFormType, value: string) => void;
  openSelect: string | null;
  setOpenSelect: (select: string | null) => void;
  isEdit?: boolean;
}

export function PatientInfoSection({
  form,
  onFieldChange,
  openSelect,
  setOpenSelect,
  isEdit = false,
}: PatientInfoSectionProps) {
  const genderOptions = Object.entries(genderLabel).map(([value, label]) => ({
    value,
    label,
  }));

  const insuranceOptions = Object.entries(insuranceTypeLabel).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        <div className="flex flex-col gap-1">
          <span>환자명</span>
          <Input
            name="환자명"
            placeholder="홍길동"
            required
            className="placeholder:text-[#999] text-[#333]"
            value={form.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
            tabIndex={isEdit ? -1 : undefined}
          />
        </div>
        <div className="flex flex-col col-span-3 gap-1">
          <span>생년월일</span>
          <div className="grid grid-cols-3 gap-1">
            <Input
              name="생년"
              placeholder="YYYY"
              required
              className="placeholder:text-[#999] text-[#333]"
              value={form.birthYear}
              onChange={(e) => onFieldChange("birthYear", e.target.value)}
              tabIndex={-1}
            />
            <Input
              name="생월"
              placeholder="MM"
              required
              className="placeholder:text-[#999] text-[#333]"
              value={form.birthMonth}
              onChange={(e) => onFieldChange("birthMonth", e.target.value)}
              tabIndex={-1}
            />
            <Input
              name="생일"
              placeholder="DD"
              required
              className="placeholder:text-[#999] text-[#333]"
              value={form.birthDay}
              onChange={(e) => onFieldChange("birthDay", e.target.value)}
              tabIndex={-1}
            />
          </div>
        </div>
        <FormSelect
          label="성별"
          placeholder="성별"
          value={String(form.gender)}
          onValueChange={(value) => onFieldChange("gender", value)}
          items={genderOptions}
          open={openSelect === "gender"}
          onOpenChange={(open) => setOpenSelect(open ? "gender" : null)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span>연락처</span>
          <Input
            name="연락처"
            placeholder="010-0000-0000"
            required
            className="placeholder:text-[#999] text-[#333]"
            value={form.phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            tabIndex={-1}
          />
        </div>
        <FormSelect
          label="보험 여부"
          placeholder="보험 여부"
          value={form.insuranceType}
          onValueChange={(value) => onFieldChange("insuranceType", value)}
          items={insuranceOptions}
          open={openSelect === "insurance"}
          onOpenChange={(open) => setOpenSelect(open ? "insurance" : null)}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-[#999]">
        <div className="flex flex-col gap-1">
          <span>우편번호</span>
          <Input
            name="우편번호"
            placeholder="368474"
            className="placeholder:text-[#999] text-[#333]"
            value={form.zipcode}
            onChange={(e) => onFieldChange("zipcode", e.target.value)}
            tabIndex={-1}
          />
        </div>
        <div className="flex flex-col col-span-3 gap-1">
          <span>주소</span>
          <Input
            name="주소"
            placeholder="상세 주소까지 모두 입력"
            className="placeholder:text-[#999] text-[#333]"
            value={form.address}
            onChange={(e) => onFieldChange("address", e.target.value)}
            tabIndex={-1}
          />
        </div>
      </div>
    </>
  );
}
