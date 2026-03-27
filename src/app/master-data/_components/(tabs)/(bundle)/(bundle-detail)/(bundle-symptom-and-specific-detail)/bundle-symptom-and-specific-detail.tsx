import { useState, useEffect } from "react";
import MySplitPane from "@/components/yjg/my-split-pane";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import { BundleDetailTitleContainer } from "../bundle-detail-common";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import { INPUT_FOCUS_CLASS } from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";
import TemplateCodeQuickBar from "../../../(template-code)/template-code-quick-bar";
import { TemplateCodeType } from "@/components/settings/space-info/model";
import type { TemplateCode } from "@/types/template-code-types";
import { stripHtmlTags } from "@/utils/template-code-utils";

interface BundleSymptomAndSpecificDetailProps {
  selectedBundle: Bundle;
  onSymptomChange: (symptom: string) => void;
  onMx999Change: (specificDetail: string) => void;
}

export default function BundleSymptomAndSpecificDetail({
  selectedBundle,
  onSymptomChange,
  onMx999Change,
}: BundleSymptomAndSpecificDetailProps) {
  return (
    <div className="flex flex-col w-full h-full">
      <MySplitPane
        splitPaneId="symptom-and-specific-detail"
        isVertical={false}
        initialRatios={[0.5, 0.5]}
        panes={[
          <Symptom
            selectedBundle={selectedBundle}
            onSymptomChange={onSymptomChange}
          />,
          <SpecificDetail
            selectedBundle={selectedBundle}
            onMx999Change={onMx999Change}
          />,
        ]}
      />
    </div>
  );
}

function Symptom({
  selectedBundle,
  onSymptomChange,
}: {
  selectedBundle: Bundle;
  onSymptomChange: (symptom: string) => void;
}) {
  const handleTemplateClick = (template: TemplateCode) => {
    const newContent = `${selectedBundle.symptom}${template.content}`;
    onSymptomChange(newContent);
  };

  return (
    <div className="flex flex-col gap-[5px] w-full h-full py-[4px] pr-[4px]">
      <BundleDetailTitleContainer title="증상"></BundleDetailTitleContainer>
      <div className="flex flex-col w-full h-full border border-[var(--border-1)] rounded-sm">
        <div
          className={cn(
            "overflow-y-auto flex-1 rounded-sm",
            INPUT_FOCUS_CLASS
          )}
        >
          <MyTiptapEditor
            content={selectedBundle.symptom}
            onChange={onSymptomChange}
            imageCategory="bundle_symptom"
            imageEntityType="bundle"
            imageEntityId={selectedBundle.id?.toString() ?? ""}
          />
        </div>
        <TemplateCodeQuickBar
          templateCodeType={TemplateCodeType.증상}
          onTemplateClickAction={handleTemplateClick}
          className="p-[5px]"
        />
      </div>
    </div>
  );
}

function SpecificDetail({
  selectedBundle,
  onMx999Change,
}: {
  selectedBundle: Bundle;
  onMx999Change: (specificDetail: string) => void;
}) {
  const [mx999, setMx999] = useState<string>("");

  useEffect(() => {
    const mx999Detail = selectedBundle.specificDetail?.find(
      (detail) => detail.code === "MX999"
    );
    setMx999(mx999Detail?.content || "");
  }, [selectedBundle.specificDetail]);

  const handleMx999Change = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // 700바이트 제한 체크
    const encoder = new TextEncoder();
    const encoded = encoder.encode(value);

    if (encoded.length <= 700) {
      setMx999(value);
      onMx999Change(value);
    }
  };

  // 현재 바이트 수 계산
  const getCurrentByteLength = (text: string) => {
    const encoder = new TextEncoder();
    return encoder.encode(text).length;
  };

  const currentByteLength = getCurrentByteLength(mx999);

  const handleTemplateClick = (template: TemplateCode) => {
    const strippedContent = stripHtmlTags(template.content);
    const newContent = `${mx999}${strippedContent}`;
    setMx999(newContent);
    onMx999Change(newContent);
  };

  return (
    <div className="flex flex-col gap-[5px] w-full h-full py-[4px] pl-[4px]">
      <BundleDetailTitleContainer title="특정내역(MX999)">
        <div className="text-xs text-[var(--text-secondary)]">
          {currentByteLength}/700 bytes
        </div>
      </BundleDetailTitleContainer>
      <div className="flex flex-col w-full h-full border border-[var(--border-1)] rounded-sm">
        <textarea
          className={cn(
            "w-full h-full p-2 resize-none outline-none my-scroll",
            INPUT_FOCUS_CLASS
          )}
          value={mx999}
          onChange={handleMx999Change}
          placeholder="특정내역(MX999)을 입력해주세요."
          maxLength={700} // HTML 속성으로도 제한 (추가 보안)
        />
        <TemplateCodeQuickBar
          templateCodeType={TemplateCodeType.특정내역}
          onTemplateClickAction={handleTemplateClick}
          className="p-[5px]"
        />
      </div>
    </div>
  );
}
