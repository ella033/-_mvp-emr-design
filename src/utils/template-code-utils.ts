import { TemplateCodeType } from "@/constants/common/common-enum";
import type { TemplateCode } from "@/types/template-code-types";

/**
 * templateCodeType에 맞는 템플릿 코드 필터링
 * - templateCodeType이 '전체'인 경우 모든 템플릿 반환
 * - 그 외의 경우 템플릿의 type에 '전체' 또는 해당 templateCodeType이 포함된 것만 반환
 */
export const filterTemplatesByType = (
  templateCodes: TemplateCode[],
  templateCodeType: TemplateCodeType
): TemplateCode[] => {
  return templateCodes.filter((tc) => {
    if (templateCodeType === TemplateCodeType.전체) {
      return true;
    }
    return (
      tc.type === null ||
      tc.type.includes(TemplateCodeType.전체) ||
      tc.type.includes(templateCodeType)
    );
  });
};

/**
 * isQuickMenu가 true인 항목이 먼저 오도록 정렬
 */
export const sortTemplatesByQuickMenu = (
  templateCodes: TemplateCode[]
): TemplateCode[] => {
  return [...templateCodes].sort((a, b) => {
    if (a.isQuickMenu === b.isQuickMenu) return 0;
    return a.isQuickMenu ? -1 : 1;
  });
};

/**
 * 템플릿 필터링 + 정렬 (isQuickMenu 우선)
 */
export const filterAndSortTemplates = (
  templateCodes: TemplateCode[],
  templateCodeType: TemplateCodeType
): TemplateCode[] => {
  const filtered = filterTemplatesByType(templateCodes, templateCodeType);
  return sortTemplatesByQuickMenu(filtered);
};

/**
 * 퀵 메뉴 템플릿만 필터링 (isQuickMenu가 true이고 타입이 맞는 것)
 */
export const filterQuickMenuTemplates = (
  templateCodes: TemplateCode[],
  templateCodeType: TemplateCodeType
): TemplateCode[] => {
  return templateCodes.filter(
    (tc) =>
      tc.isQuickMenu &&
      (tc.type.includes(TemplateCodeType.전체) ||
        tc.type.includes(templateCodeType))
  );
};

/**
 * HTML 태그를 제거하고 순수 텍스트만 추출하는 함수
 * @param html HTML을 포함한 문자열
 * @returns HTML 태그가 제거된 순수 텍스트
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  // 클라이언트 환경에서는 DOMParser 사용 (더 정확함)
  if (typeof window !== "undefined") {
    // 태그를 공백으로 대체한 후 파싱
    const htmlWithSpaces = html.replace(/<[^>]*>/g, " ");
    const doc = new DOMParser().parseFromString(htmlWithSpaces, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  // SSR 환경에서는 정규식 사용 (fallback)
  return html
    .replace(/<[^>]*>/g, " ") // HTML 태그 -> 공백으로 대체
    .replace(/&nbsp;/g, " ") // &nbsp; -> 공백
    .replace(/&amp;/g, "&") // &amp; -> &
    .replace(/&lt;/g, "<") // &lt; -> <
    .replace(/&gt;/g, ">") // &gt; -> >
    .replace(/&quot;/g, '"') // &quot; -> "
    .replace(/&#39;/g, "'") // &#39; -> '
    .replace(/\s+/g, " ") // 연속 공백 -> 단일 공백
    .trim();
};