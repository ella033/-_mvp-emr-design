'use client';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * build-print-html-template.ts
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 직렬화된 HTML body를 **완전한 self-contained HTML5 문서**로 래핑합니다.
 *
 * ## 이 파일의 역할
 *
 * serialize-dom-to-html.ts가 DOM을 직렬화하면 body 콘텐츠만 생성됩니다.
 * 이 함수가 <!DOCTYPE html>, <head>, <style>, <body> 등을 추가하여
 * 독립적으로 열 수 있는 완전한 HTML 문서를 만듭니다.
 *
 * ## CSS 우선순위 구조 (3개 레이어)
 *
 * 생성되는 HTML의 <head>에는 최대 3개의 <style> 태그가 포함됩니다:
 *
 * ```
 * ┌─ 1. extractedCss (가장 낮은 우선순위) ──────────────────────────────┐
 * │ document.styleSheets에서 동적 추출한 CSS                            │
 * │ - Tailwind preflight: p { margin: 0 }, img { display: block } 등   │
 * │ - Tailwind 유틸리티: .flex { display: flex } 등                    │
 * │ - CSS custom properties: :root { --color-primary: ... } 등         │
 * │ - 앱 커스텀 CSS                                                    │
 * │                                                                     │
 * │ → 브라우저에서 보이는 것과 동일한 렌더링을 보장하기 위한 핵심 CSS    │
 * │ → serialize-dom-to-html.ts의 extractMatchedStyles()가 생성          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ 2. template CSS (중간 우선순위) ───────────────────────────────────┐
 * │ 이 파일에 하드코딩된 구조적 CSS                                     │
 * │ - 폰트 설정: font-family 강제 (Agent PC 시스템 폰트)               │
 * │ - printable 레이아웃: .printable-page, .printable-edit-only 등     │
 * │ - @page 규칙: 프린트 엔진용 페이지 설정                            │
 * │ - @media print: 프린트 시 레이아웃 조정, 페이지 넘김               │
 * │ - 회전 페이지: 혼합 방향 문서의 CSS transform 회전                 │
 * │                                                                     │
 * │ → extractedCss보다 뒤에 위치하여 구조적 스타일이 우선               │
 * │ → 예: template의 font-family가 Tailwind의 font-family를 덮어씀     │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌─ 3. extraCss (가장 높은 우선순위) ──────────────────────────────────┐
 * │ 호출자가 전달하는 추가 CSS                                          │
 * │ - @page { size: 210mm 297mm } 등 페이지 크기 규칙                  │
 * │ - 서식별 특수 스타일                                                │
 * │                                                                     │
 * │ → 모든 CSS보다 뒤에 위치하여 최종 오버라이드 가능                   │
 * └─────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * 같은 specificity의 CSS 규칙은 **문서 내 나중에 선언된 것이 우선**하므로,
 * 이 순서가 올바른 우선순위를 보장합니다.
 */

const FONT_FAMILY =
  '"Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif';

/**
 * self-contained HTML 문서를 생성합니다.
 *
 * @param bodyHtml     - 래핑할 HTML body 문자열 (이미 직렬화된 DOM)
 * @param extractedCss - 런타임 추출 CSS (document.styleSheets 기반) — template CSS보다 **앞에** 배치
 * @param extraCss     - 추가 CSS 문자열 (처방전 자체 style, @page 규칙 등) — template CSS보다 **뒤에** 배치
 * @param mode         - 'preview' (기본값): 미리보기용 시각 구분 / 'print': 프린트 엔진용
 */
export function buildPrintHtmlTemplate(params: {
  bodyHtml: string;
  extractedCss?: string;
  extraCss?: string;
  mode?: 'preview' | 'print';
}): string {
  const { bodyHtml, extractedCss, extraCss, mode = 'preview' } = params;

  const isPreview = mode === 'preview';

  // 미리보기용 body 스타일
  // display: block을 사용하여 landscape 등 다양한 크기의 페이지가 제약받지 않도록 함
  const bodyStyle = isPreview
    ? 'margin: 0; background: #e5e5e5; padding: 16px 0;'
    : 'margin: 0; background: white;';

  // 미리보기용 페이지 시각 구분
  const previewPageCss = isPreview
    ? `
    .printable-page, .A4 {
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      margin-bottom: 16px;
    }
    `
    : '';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${extractedCss ? `<style>\n/* 런타임 추출 CSS (Tailwind preflight, 유틸리티, 앱 스타일) */\n${extractedCss}\n  </style>` : ''}
  <style>
    /* 1. 기본 스타일 (폰트는 Agent PC에 사전 설치된 시스템 폰트 사용) */
    :root, html, body {
      margin: 0;
      padding: 0;
      font-family: ${FONT_FAMILY};
    }

    *, *::before, *::after {
      box-sizing: border-box;
      font-family: ${FONT_FAMILY};
    }

    /* Tailwind preflight의 heading 리셋을 재현 — 직렬화된 HTML에서
       heading 태그가 user-agent 기본 font-size(2em 등)로 렌더링되는 것을 방지 */
    h1, h2, h3, h4, h5, h6 {
      font-size: inherit;
      font-weight: inherit;
    }

    .printable-document {
      position: relative;
      width: 100%;
      font-family: ${FONT_FAMILY};
    }

    .printable-pages {
      width: 100%;
      align-items: center;
      font-family: ${FONT_FAMILY};
    }

    .printable-page {
      background: white;
      color: inherit;
      border: none;
      display: flex;
      flex-direction: column;
      margin: 0 auto;
      box-sizing: border-box;
      font-family: ${FONT_FAMILY};
    }

    /* 문서 전체에서 진짜 마지막 페이지만 page-break 해제 */
    body > :last-child .printable-pages:last-child > .printable-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .printable-page-body {
      min-height: 0;
      width: 100%;
    }

    .printable-page-body > * + * {
      margin-top: 8px;
    }

    .printable-page-body > .printable-block:has(> .printable-contiguous-block) + .printable-block:has(> .printable-contiguous-block) {
      margin-top: 0;
    }

    .printable-block {
      width: 100%;
    }

    .printable-measure {
      overflow: hidden;
    }

    /* 편집 전용 요소: self-contained에서는 프린트 모드로 처리 */
    .printable-edit-only {
      display: none;
    }

    .printable-edit-only input,
    input.printable-edit-only {
      display: block;
      background-color: transparent;
      border: none;
      outline: none;
      padding: 0;
      margin: 0;
      appearance: none;
      box-shadow: none;
      color: inherit;
      font: inherit;
      width: 100%;
    }

    .printable-edit-only textarea,
    textarea.printable-edit-only {
      display: block;
      width: 100%;
      background-color: transparent;
      border: none;
      outline: none;
      padding: 4px 8px;
      margin: 0;
      resize: none;
      appearance: none;
      box-shadow: none;
      color: inherit;
      font: inherit;
      line-height: 1.375;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
      overflow: visible;
    }

    .printable-textarea-wrapper .printable-edit-only textarea,
    .printable-textarea-wrapper textarea.printable-edit-only {
      display: none !important;
    }

    .printable-textarea-display {
      border: none !important;
      background: transparent !important;
      padding: 4px 8px !important;
      margin: 0 !important;
      box-shadow: none !important;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: break-word;
      color: inherit;
      font: inherit;
      line-height: 1.375;
    }

    .printable-only {
      display: block;
    }

    .printable-edit-only button,
    button.printable-edit-only {
      display: none;
    }

    .printable-edit-only label,
    label.printable-edit-only {
      display: none;
    }

    .printable-page input {
      background-color: transparent !important;
      border: none !important;
      outline: none !important;
    }

    /* 회전 페이지: screen에서는 원본 가로 방향 그대로 표시 */
    .print-rotate-wrapper {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    /* 3. @page 규칙 (프린트 엔진용) */
    /* size는 지정하지 않음 — 각 PrintableDocument가 인라인으로 설정한 페이지 크기를 존중 */
    /* @page 내에서 !important는 비표준이므로 사용하지 않음 */
    @page {
      margin: 0;
    }

    /* 4. 프린트 엔진용 @media print */
    /* body inline style(preview 모드의 padding/background)을 확실히 덮어쓰기 위해 !important 사용 */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        margin: 0 !important;
        background: white !important;
        padding: 0 !important;
        display: block !important;
      }

      .printable-page, .A4, .print-rotate-wrapper {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }

      /* 문서 전체에서 진짜 마지막 페이지만 page-break 해제 */
      body > :last-child .printable-pages:last-child > .printable-page:last-child,
      body > :last-child .printable-pages:last-child > .A4:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }

      /* 회전 페이지: 프린트 시에만 소수 방향을 회전하여 기본 방향에 맞춤 */
      .printable-page.print-rotated-page {
        width: var(--base-w) !important;
        height: var(--base-h) !important;
        padding: 0 !important;
        overflow: hidden !important;
        position: relative !important;
        contain: size layout paint !important;
      }

      .print-rotate-wrapper {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: var(--orig-w) !important;
        height: var(--orig-h) !important;
        padding: var(--orig-padding, 0) !important;
        transform-origin: top left !important;
      }

      .print-rotate-wrapper.rotate-cw {
        transform: translateX(var(--orig-h)) rotate(90deg) !important;
      }

      .print-rotate-wrapper.rotate-ccw {
        transform: translateY(var(--orig-w)) rotate(-90deg) !important;
      }
    }

    /* 5. 미리보기용 시각 구분 */
    ${previewPageCss}
  </style>
  ${extraCss ? `<style>${extraCss}</style>` : ''}
</head>
<body style="${bodyStyle}">
  ${bodyHtml}
</body>
</html>`;
}
