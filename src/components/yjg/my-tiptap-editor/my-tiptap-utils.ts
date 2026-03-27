/**
 * Tiptap 에디터(HTML) 내용에 상단고정(pinnedBox) 노드가 포함되어 있는지 여부
 */
export function hasPinnedBoxInHtml(html: string | null | undefined): boolean {
  if (!html || typeof html !== "string") return false;
  return html.includes('data-type="pinnedBox"') || html.includes("data-type='pinnedBox'");
}
