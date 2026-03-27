"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const documentSettingsSchema = z.object({
  diagnosisType: z.enum(["all", "primary", "secondary"]),
  prescriptionItems: z.array(z.string()),
  maskResidentNumber: z.boolean(),
  diagnosisLang: z.enum(["ko", "en"]),
  prescriptionLang: z.enum(["ko", "en"]),
});

type DocumentSettingsFormValues = z.infer<typeof documentSettingsSchema>;

interface DocumentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESCRIPTION_ITEMS = [
  { id: "test", label: "검사" },
  { id: "radiology", label: "방사선" },
  { id: "testResult", label: "검사결과" },
  { id: "inHospital", label: "원내처방" },
  { id: "outHospital", label: "원외처방" },
  { id: "nonCovered", label: "비급여항목" },
  { id: "symptom", label: "증상" },
  { id: "vitalSign", label: "바이탈사인" },
];

export default function DocumentSettingsDialog({
  open,
  onOpenChange,
}: DocumentSettingsDialogProps) {
  const { control, handleSubmit } = useForm<DocumentSettingsFormValues>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: {
      diagnosisType: "all",
      prescriptionItems: [
        "test",
        "radiology",
        "testResult",
        "inHospital",
        "outHospital",
        "nonCovered",
        "symptom",
        "vitalSign",
      ],
      maskResidentNumber: true,
      diagnosisLang: "ko",
      prescriptionLang: "ko",
    },
  });

  function onSubmit(data: DocumentSettingsFormValues) {
    console.log("Settings updated:", data);
    // 실지 적용 로직은 추후 필요시 추가
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-lg">
        <DialogHeader className="px-5 py-4 bg-white">
          <DialogTitle className="text-[16px] font-bold text-[#171719] text-left">
            서식발급 환경설정
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col bg-white"
        >
          <div className="px-5 pt-0 pb-6 flex flex-col gap-6">
            {/* 진료기록사본 출력 항목 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[14px] font-bold text-[var(--gray-100)] h-8 flex items-center">
                진료기록사본 출력 항목
              </h3>

              <div className="flex flex-col gap-3">
                {/* 상병 */}
                <div className="flex items-center h-8">
                  <span className="w-20 text-[13px] font-medium text-[var(--gray-100)]">
                    상병
                  </span>
                  <Controller
                    name="diagnosisType"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="all" id="diag-all" />
                          <Label
                            htmlFor="diag-all"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            전체
                          </Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="primary" id="diag-primary" />
                          <Label
                            htmlFor="diag-primary"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            주상병
                          </Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="secondary" id="diag-secondary" />
                          <Label
                            htmlFor="diag-secondary"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            부상병
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                {/* 처방 */}
                <div className="flex items-start py-1">
                  <span className="w-20 text-[13px] font-medium text-[var(--gray-100)] mt-0.5">
                    처방
                  </span>
                  <div className="flex-1 flex flex-wrap gap-x-3 gap-y-3">
                    {PRESCRIPTION_ITEMS.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5"
                      >
                        <Controller
                          name="prescriptionItems"
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id={`presc-${item.id}`}
                              checked={field.value.includes(item.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, item.id]);
                                } else {
                                  field.onChange(
                                    field.value.filter((id) => id !== item.id)
                                  );
                                }
                              }}
                            />
                          )}
                        />
                        <Label
                          htmlFor={`presc-${item.id}`}
                          className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                        >
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 환자정보 */}
                <div className="flex items-center h-8">
                  <span className="w-20 text-[13px] font-medium text-[var(--gray-100)]">
                    환자정보
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Controller
                      name="maskResidentNumber"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="mask-resident"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label
                      htmlFor="mask-resident"
                      className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                    >
                      주민번호 마스킹
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* 출력 언어 선택 */}
            <div className="flex flex-col gap-3">
              <h3 className="text-[14px] font-bold text-[var(--gray-100)] h-8 flex items-center">
                출력 언어 선택
              </h3>

              <div className="flex flex-col gap-3">
                {/* 상병명 */}
                <div className="flex items-center h-8">
                  <span className="w-20 text-[13px] font-medium text-[var(--gray-100)]">
                    상병명
                  </span>
                  <Controller
                    name="diagnosisLang"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="ko" id="diag-lang-ko" />
                          <Label
                            htmlFor="diag-lang-ko"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            국문
                          </Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="en" id="diag-lang-en" />
                          <Label
                            htmlFor="diag-lang-en"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            영문
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                {/* 처방명 */}
                <div className="flex items-center h-8">
                  <span className="w-20 text-[13px] font-medium text-[var(--gray-100)]">
                    처방명
                  </span>
                  <Controller
                    name="prescriptionLang"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="ko" id="presc-lang-ko" />
                          <Label
                            htmlFor="presc-lang-ko"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            국문
                          </Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="en" id="presc-lang-en" />
                          <Label
                            htmlFor="presc-lang-en"
                            className="text-[13px] font-normal text-[var(--gray-300)] cursor-pointer"
                          >
                            영문
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

