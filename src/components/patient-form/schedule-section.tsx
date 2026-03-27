import { FormSelect } from "@/components/patient-form/form-select";
import type { PatientFormType } from "@/types/patient-types";
import type { Hospital } from "@/types/hospital-types";
import {
  SCHEDULE_OPTIONS,
  DATE_OPTIONS,
  TIME_OPTIONS,
  VISIT_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
} from "@/constants/form-options";

interface ScheduleSectionProps {
  form: PatientFormType;
  onFieldChange: (field: keyof PatientFormType, value: string) => void;
  openSelect: string | null;
  setOpenSelect: (select: string | null) => void;
  hospital?: Hospital;
}

export function ScheduleSection({
  form,
  onFieldChange,
  openSelect,
  setOpenSelect,
  hospital,
}: ScheduleSectionProps) {
  // 병원 시설 목록 생성
  const roomPanelOptions = [
    { value: "none", label: "선택안함" },
    ...(hospital?.facilities ?? []).map((facility: any, index: number) => {
      // facility가 객체인 경우와 문자열인 경우를 모두 처리
      const facilityValue = typeof facility === 'string' ? facility : (facility?.name || facility?.id || `진료실${index + 1}`);
      const facilityLabel = typeof facility === 'string' ? facility : (facility?.name || facility?.label || `진료실${index + 1}`);

      return {
        value: String(facilityValue), // 문자열로 변환하여 key 문제 방지
        label: String(facilityLabel),
      };
    }),
  ];
  return (
    <>
      <div className="mt-6">
        <h3 className="font-bold text-[1rem] mb-4">스케쥴 정보</h3>

        <div className="grid grid-cols-4 gap-2">
          <FormSelect
            label="스케쥴"
            placeholder="스케쥴"
            value={form.schedule}
            onValueChange={(value) => onFieldChange("schedule", value)}
            items={SCHEDULE_OPTIONS}
            open={openSelect === "schedule"}
            onOpenChange={(open) => setOpenSelect(open ? "schedule" : null)}
          />

          <FormSelect
            label="진료실"
            placeholder="진료실"
            value={form.roomPanel}
            onValueChange={(value) => onFieldChange("roomPanel", value)}
            items={roomPanelOptions}
            open={openSelect === "roomPanel"}
            onOpenChange={(open) => setOpenSelect(open ? "roomPanel" : null)}
          />

          <FormSelect
            label="진료날짜"
            placeholder="날짜"
            value={form.date}
            onValueChange={(value) => onFieldChange("date", value)}
            items={DATE_OPTIONS}
            open={openSelect === "date"}
            onOpenChange={(open) => setOpenSelect(open ? "date" : null)}
          />

          <FormSelect
            label="진료시간"
            placeholder="시간"
            value={form.time}
            onValueChange={(value) => onFieldChange("time", value)}
            items={TIME_OPTIONS}
            open={openSelect === "time"}
            onOpenChange={(open) => setOpenSelect(open ? "time" : null)}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <FormSelect
            label="방문목적"
            placeholder="방문목적"
            value={form.visitType}
            onValueChange={(value) => onFieldChange("visitType", value)}
            items={VISIT_TYPE_OPTIONS}
            open={openSelect === "visitType"}
            onOpenChange={(open) => setOpenSelect(open ? "visitType" : null)}
          />

          <div className="flex flex-col col-span-3 gap-1">
            <FormSelect
              label="세부목적"
              placeholder="세부목적을 선택해주세요"
              value={form.purpose}
              onValueChange={(value) => onFieldChange("purpose", value)}
              items={PURPOSE_OPTIONS}
              open={openSelect === "purpose"}
              onOpenChange={(open) => setOpenSelect(open ? "purpose" : null)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-4">
          <span>예약메모</span>
          <textarea
            name="예약메모"
            placeholder="메모를 입력해주세요"
            className="w-full min-h-[60px] border border-[#EEEEEE] rounded-[4px] p-2 text-[12px] text-[#333] placeholder:text-[#DDDDDD] placeholder:text-[12px] placeholder:align-top resize-none focus:outline-none focus:ring-0"
            value={form.memo}
            onChange={(e) => onFieldChange("memo", e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
