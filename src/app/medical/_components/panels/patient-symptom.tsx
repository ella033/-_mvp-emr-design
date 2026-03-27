"use client";

import { useEffect } from "react";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import { useEncounterStore } from "@/store/encounter-store";
import { NoneSelectedPatient } from "../widgets/none-patient";
import { INPUT_FOCUS_CLASS } from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import TemplateCodeQuickBar from "@/app/master-data/_components/(tabs)/(template-code)/template-code-quick-bar";

// 증상
export default function PatientSymptom() {
  const selectedEncounter = useEncounterStore(
    (state) => state.selectedEncounter
  );
  const draftSymptom = useEncounterStore((state) => state.draftSymptom);
  const setDraftSymptom = useEncounterStore((state) => state.setDraftSymptom);
  const newSymptom = useEncounterStore((state) => state.newSymptom);
  const setNewSymptom = useEncounterStore((state) => state.setNewSymptom);

  // 템플릿 클릭 시 내용 추가
  const handleTemplateClick = (template: TemplateCode) => {
    const newContent = `${draftSymptom}${template.content}`;
    setDraftSymptom(newContent);
  };

  // newSymptom 처리 (다른 컴포넌트에서 증상 추가 시)
  useEffect(() => {
    if (newSymptom) {
      const content = `${draftSymptom}${newSymptom}`;
      setDraftSymptom(content);
      setNewSymptom(null);
    }
  }, [newSymptom, draftSymptom, setDraftSymptom, setNewSymptom]);

  if (!selectedEncounter) {
    return <NoneSelectedPatient />;
  }

  return (
    <div className="flex flex-col p-1 h-full">
      <div
        className={cn("overflow-y-auto flex-1 rounded-sm", INPUT_FOCUS_CLASS)}
      >
        <MyTiptapEditor
          templateCodeType={TemplateCodeType.증상}
          placeholder="증상을 입력해주세요."
          content={draftSymptom}
          onChange={setDraftSymptom}
          isUseImageUpload={true}
          imageCategory="symptom"
          imageEntityType="encounter"
          imageEntityId={selectedEncounter.id.toString()}
        />
      </div>
      <TemplateCodeQuickBar
        templateCodeType={TemplateCodeType.증상}
        onTemplateClickAction={handleTemplateClick}
        className="pt-1"
      />
    </div>
  );
}
