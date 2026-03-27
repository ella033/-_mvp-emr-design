"use client";

import { useMemo } from "react";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";
import MyHorizontalScrollContainer from "@/components/yjg/my-horizontal-scroll-container";
import { filterQuickMenuTemplates } from "@/utils/template-code-utils";

interface TemplateCodeQuickBarProps {
  templateCodeType: TemplateCodeType;
  onTemplateClickAction: (template: TemplateCode) => void;
  className?: string;
}

export default function TemplateCodeQuickBar({
  templateCodeType,
  onTemplateClickAction,
  className,
}: TemplateCodeQuickBarProps) {
  const { data: templateCodes } = useTemplateCodes();

  // 해당 타입이고 isQuickMenu가 true인 템플릿 필터링
  const quickMenuTemplates = useMemo(() => {
    if (!templateCodes) return [];
    return filterQuickMenuTemplates(templateCodes, templateCodeType);
  }, [templateCodes, templateCodeType]);

  // 퀵 메뉴 템플릿이 없으면 렌더링하지 않음
  if (quickMenuTemplates.length === 0) {
    return null;
  }

  return (
    <MyHorizontalScrollContainer
      className={className}
      gap={2}
      hideButtonsWhenNoScroll
    >
      {quickMenuTemplates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onTemplateClickAction(template)}
          className="shrink-0 px-[3px] py-[1px] text-[10px] rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          {template.code}
        </button>
      ))}
    </MyHorizontalScrollContainer>
  );
}
