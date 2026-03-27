import React from "react";
import type { Patient } from "@/types/patient-types";
import type { TemplateCode } from "@/types/template-code-types";
import MyPopup from "@/components/yjg/my-pop-up";
import { PatientBasicInfoBadge } from "../widgets/medical-patient-badge";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { MyButton } from "@/components/yjg/my-button";

export default function MedicalPatientListClinicMemo({
  patient,
  onClose,
  onSave,
}: {
  patient: Patient | null;
  onClose: () => void;
  onSave: (patient: Patient, clinicalMemo: string) => Promise<void>;
}) {
  const [content, setContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (patient) {
      setContent(patient.clinicalMemo ?? "");
    }
  }, [patient]);

  const handleTemplateClick = (template: TemplateCode) => {
    const newContent = `${content}${template.content}`;
    setContent(newContent);
  };

  const handleSave = async () => {
    if (!patient) return;
    setIsSaving(true);
    try {
      await onSave(patient, content);
    } finally {
      setIsSaving(false);
    }
  };

  if (!patient) return null;

  return (
    <MyPopup
      isOpen={true}
      onCloseAction={onClose}
      title="임상메모"
      fitContent={false}
      width="560px"
      height="400px"
    >
      <div className="flex flex-col gap-2 p-2 h-full w-full">
        <div className="flex items-center w-full bg-[var(--bg-1)] rounded px-2 py-1 gap-[4px]">
          <PatientBasicInfoBadge patient={patient} />
        </div>
        <div
          className="flex-1 min-h-0 flex flex-col border border-[var(--border-1)] rounded-md overflow-hidden"
        >
          <MyTiptapEditor
            templateCodeType={TemplateCodeType.임상메모}
            placeholder="임상메모를 입력해주세요."
            content={content}
            onChange={setContent}
            imageCategory="patient_clinic_memo"
            imageEntityType="patient"
            imageEntityId={String(patient.id)}
          />
          <TemplateCodeQuickBar
            templateCodeType={TemplateCodeType.임상메모}
            onTemplateClickAction={handleTemplateClick}
            className="p-[3px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <MyButton variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </MyButton>
          <MyButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
