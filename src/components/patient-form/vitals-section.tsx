import { Input } from "@/components/ui/input";
import type { PatientFormType } from "@/types/patient-types";
import { VITAL_FIELDS } from "@/constants/form-options";

interface VitalsSectionProps {
  form: PatientFormType;
  onFieldChange: (field: keyof PatientFormType, value: string) => void;
}

export function VitalsSection({ form, onFieldChange }: VitalsSectionProps) {
  const handleVitalChange = (fieldKey: string, value: string) => {
    // vitals 객체 업데이트를 위한 특별한 핸들러
    const vitalKey = fieldKey.replace("2", ""); // BW2 -> BW로 변환
    onFieldChange("vitals", {
      ...form.vitals,
      [vitalKey]: value,
    } as any);
  };

  return (
    <div className="mt-6">
      <h3 className="font-bold text-[1rem] mb-4">바이탈 정보</h3>

      <div className="grid grid-cols-8 gap-2 text-[#999]">
        {VITAL_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col items-center gap-1">
            <span className="text-[0.75rem]">{field.label}</span>
            <Input
              name={field.key}
              className="text-[#333] text-center"
              value={form.vitals[field.key.replace("2", "")] || ""}
              onChange={(e) => handleVitalChange(field.key, e.target.value)}
              tabIndex={-1}
            />
          </div>
        ))}
      </div>

      {/* 바이탈 정보 설명 */}
      <div className="mt-2 text-[0.7rem] text-[#999]">
        <p>BT: 체온, BW: 체중, BP: 혈압, PR: 맥박, BH: 신장, BMI: 체질량지수</p>
      </div>
    </div>
  );
}
