/**
 * HTML 문자열을 블록 요소 단위로 분할합니다.
 *
 * TipTap 등에서 생성된 HTML(p, ul, ol, div, h1-h6, table, blockquote 등)을
 * 개별 블록으로 분리하여, PrintableDocument의 자식으로 각각 전달하면
 * 단락 단위 페이지 분할이 가능합니다.
 *
 * @param html - 분할할 HTML 문자열
 * @returns 블록 요소별 HTML 문자열 배열. 빈 문자열이나 빈 요소는 제외됩니다.
 */
export function splitHtmlIntoBlocks(html: string): string[] {
  if (!html || typeof html !== "string") {
    return [];
  }

  const trimmed = html.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (typeof document === "undefined") {
    return [trimmed];
  }

  const container = document.createElement("div");
  container.innerHTML = trimmed;

  const blocks: string[] = [];

  for (const child of Array.from(container.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const outerHtml = el.outerHTML.trim();
      if (outerHtml.length > 0) {
        blocks.push(outerHtml);
      }
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim() ?? "";
      if (text.length > 0) {
        blocks.push(`<p>${text}</p>`);
      }
    }
  }

  // 파싱 결과가 비어있으면 원본 반환
  return blocks.length > 0 ? blocks : [trimmed];
}
