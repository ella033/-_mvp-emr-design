import { type CSSProperties, type ReactElement } from "react";
import { splitHtmlIntoBlocks } from "./split-html-blocks";

type RenderHtmlBlocksOptions = {
  /** 분할할 HTML 문자열 */
  html: string;
  /** React key 접두사 */
  keyPrefix: string;
  /** 연속 블록의 border 색상 */
  borderColor: string;
  /** 각 블록의 padding (기본: '2px 8px') */
  padding?: string;
  /** 추가 className (기본: 'tiptap') */
  className?: string;
  /** 기본 텍스트 스타일 */
  style?: CSSProperties;
};

/**
 * HTML 문자열을 블록 단위로 분할하여 PrintableDocument의 자식으로 사용할 수 있는
 * ReactElement 배열을 반환합니다.
 *
 * 각 블록에 `printable-contiguous-block` 클래스가 적용되어 연속 블록 사이의
 * CSS gap이 제거되고, 좌우 border가 끊기지 않고 연속적으로 표시됩니다.
 *
 * @example
 * ```tsx
 * <PrintableDocument>
 *   <div style={SECTION_TITLE_STYLE}>증상</div>
 *   {...renderHtmlBlocks({
 *     html: encounter.symptomText,
 *     keyPrefix: `${encounter.encounterId}-symptoms`,
 *     borderColor: COLORS.BORDER,
 *     style: BASE_TEXT_STYLE,
 *   })}
 * </PrintableDocument>
 * ```
 */
export function renderHtmlBlocks({
  html,
  keyPrefix,
  borderColor,
  padding = "2px 8px",
  className = "tiptap",
  style,
}: RenderHtmlBlocksOptions): ReactElement[] {
  return splitHtmlIntoBlocks(html).map((blockHtml, idx, arr) => {
    const isFirst = idx === 0;
    const isLast = idx === arr.length - 1;
    return (
      <div
        key={`${keyPrefix}-${idx}`}
        className={`${className} printable-contiguous-block`}
        style={{
          borderLeft: `1px solid ${borderColor}`,
          borderRight: `1px solid ${borderColor}`,
          borderTop: isFirst ? `1px solid ${borderColor}` : "none",
          borderBottom: isLast ? `1px solid ${borderColor}` : "none",
          padding,
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: blockHtml }}
      />
    );
  });
}
