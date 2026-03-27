'use client';

import { buildPrintHtmlTemplate } from './build-print-html-template';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * serialize-dom-to-html.ts
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * 렌더링된 DOM 서브트리를 **self-contained HTML 문서**로 직렬화합니다.
 * 생성된 HTML은 원본 CSS/이미지/폰트 없이도 **단독으로 열어 동일하게 렌더링**됩니다.
 *
 * ## 왜 필요한가 — 배경
 *
 * EMR 서식(영수증, 진료기록사본, 처방전 등)은 React 컴포넌트로 렌더링됩니다.
 * 이 컴포넌트를 출력하려면, Agent PC의 프린트 엔진(Edge/WebView2)에 전달할
 * **독립적인 HTML 파일**이 필요합니다. 브라우저의 React 앱 컨텍스트 밖에서
 * 열리므로, 모든 리소스(이미지, CSS, 폼 값)를 HTML 내부에 임베딩해야 합니다.
 *
 * ## 직렬화 파이프라인 (전체 흐름)
 *
 * ```
 * 원본 DOM (React 렌더링 결과)
 *   │
 *   ├─ 1. cloneNode(true) — DOM 깊은 복사 (원본 훼손 방지)
 *   ├─ 1.5. canvas → <img> — canvas 픽셀을 PNG data URL로 변환
 *   ├─ 1.6. blob: URL → data URL — 브라우저 메모리 전용 URL을 영속적 data URL로 변환
 *   ├─ 2. form 값 동기화 — input.value, textarea.value → HTML attribute로 베이크
 *   ├─ 3. 이미지 인라이닝 — <img src>, background-image → base64 data URL
 *   ├─ 4. 클린업 — 불필요한 스타일, <script> 태그 제거
 *   ├─ 5. 페이지 크기/방향 — @page 규칙 생성, 혼합 방향 시 CSS 회전 적용
 *   ├─ 5.5. CSS 추출 — document.styleSheets에서 관련 CSS 규칙 동적 추출
 *   ├─ 6. 콘텐츠 추출 — 래퍼 div 제거, innerHTML만 추출
 *   └─ 7. 템플릿 래핑 — buildPrintHtmlTemplate()으로 완전한 HTML5 문서 생성
 * ```
 *
 * ## CSS 추출이 핵심인 이유
 *
 * React 앱에서는 Tailwind CSS가 전역으로 로드되어 있어 `<p>`, `<img>` 등의
 * 브라우저 기본 스타일이 preflight로 리셋됩니다 (예: `p { margin: 0 }`).
 * 직렬화된 HTML에 이 CSS가 없으면, 브라우저 기본값이 적용되어
 * 원본과 레이아웃이 달라집니다 (영수증이 짧아지거나, 진료기록이 넘침).
 *
 * 이전에는 build-print-html-template.ts에 필요한 CSS를 수동으로 복사했으나,
 * 누락이 반복적으로 발생했습니다. 이를 근본적으로 해결하기 위해
 * **document.styleSheets API로 브라우저가 실제 사용 중인 CSS를 동적으로 추출**합니다.
 *
 * ## 출력 구조 (생성되는 HTML)
 *
 * ```
 * <head>
 *   <style> 추출된 CSS (Tailwind preflight, 유틸리티, 앱 스타일) </style>
 *   <style> 템플릿 구조 CSS (printable 레이아웃, @page, @media print) </style>
 *   <style> 추가 CSS (@page 크기 규칙 등) </style>
 * </head>
 * <body>
 *   직렬화된 DOM (이미지 base64, 폼 값 베이크 완료)
 * </body>
 * ```
 */
export async function serializeDomToSelfContainedHtml(params: {
  root: HTMLElement;
  pageSelector?: string;
  extraCss?: string;
  mode?: 'preview' | 'print';
}): Promise<string> {
  const { root, pageSelector, extraCss, mode } = params;

  // 1. DOM 클론
  const clone = root.cloneNode(true) as HTMLElement;

  // 1.5. canvas → img 변환 (source canvas에서 toDataURL 호출)
  convertCanvasesToImages(root, clone);

  // 1.6. blob URL 이미지 → data URL 변환 (source img에서 canvas draw)
  // blob: URL은 fetch()가 실패할 수 있으므로 이미 로드된 source img를 canvas로 읽음
  inlineBlobUrlImages(root, clone);

  // 2. form 값 동기화 (원본 → 클론)
  syncFormControlValues(root, clone);

  // 3. 이미지 base64 인라이닝 (병렬)
  // 폰트는 Agent PC에 사전 설치된 시스템 폰트를 사용하므로 임베딩하지 않음
  await Promise.all([
    inlineImages(clone),
    inlineBackgroundImages(clone),
  ]);

  // 4. 불필요한 속성 제거
  cleanupClone(clone);

  // 5. 각 .printable-page에 named page 클래스 부여 + @page 규칙 생성
  // 혼합 방향(가로+세로) 문서에서 각 페이지가 올바른 크기로 인쇄되도록 처리
  const pageSizeCss = applyNamedPageRules(clone);

  // 5.5. 실행 중인 페이지의 스타일시트에서 관련 CSS 추출
  // → self-contained HTML이 원본 페이지와 동일하게 렌더링되도록 보장
  const extractedCss = extractMatchedStyles(clone);

  // 6. 래퍼 div를 제거하고 실제 페이지 콘텐츠만 추출
  // HiddenRenderer의 래퍼 div(width: 210mm)가 포함되면 landscape 페이지가 제약받음
  const bodyHtml = extractPageContent(clone, pageSelector);

  // 7. 템플릿으로 래핑
  const combinedExtraCss = [pageSizeCss, extraCss].filter(Boolean).join('\n');
  return buildPrintHtmlTemplate({
    bodyHtml,
    extractedCss: extractedCss || undefined,
    extraCss: combinedExtraCss || undefined,
    mode,
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// canvas → img 변환
// ──────────────────────────────────────────────────────────────────────────────

/**
 * source DOM의 canvas 픽셀 데이터를 clone의 canvas → <img>로 변환합니다.
 *
 * ## 왜 필요한가
 *
 * cloneNode(true)로 DOM을 복사하면 canvas 태그는 복사되지만,
 * **canvas 내부의 픽셀 데이터(2D 컨텍스트)는 복사되지 않습니다.**
 * 따라서 clone의 canvas는 빈 흰색 사각형이 됩니다.
 *
 * ## 처리 방식
 *
 * 1. source(원본)의 canvas에서 toDataURL('image/png') 호출 → base64 PNG 획득
 * 2. <img src="data:image/png;base64,..."> 요소를 생성
 * 3. clone의 canvas를 이 <img>로 교체 (replaceWith)
 *
 * source↔clone의 canvas 순서가 동일하다는 전제 하에 인덱스 매칭을 사용합니다.
 *
 * ## 한계
 *
 * - CORS로 보호된 이미지가 canvas에 그려진 경우 toDataURL()이 실패합니다.
 *   이 경우 try-catch로 원본 canvas를 그대로 유지합니다 (빈 canvas로 출력됨).
 */
export function convertCanvasesToImages(source: HTMLElement, clone: HTMLElement): void {
  const sourceCanvases = source.querySelectorAll<HTMLCanvasElement>('canvas');
  const cloneCanvases = clone.querySelectorAll<HTMLCanvasElement>('canvas');

  for (let i = 0; i < Math.min(sourceCanvases.length, cloneCanvases.length); i++) {
    const srcCanvas = sourceCanvases[i];
    const clnCanvas = cloneCanvases[i];
    if (!srcCanvas || !clnCanvas) continue;

    try {
      const dataUrl = srcCanvas.toDataURL('image/png');
      const img = clone.ownerDocument.createElement('img');
      img.src = dataUrl;
      img.width = srcCanvas.width;
      img.height = srcCanvas.height;
      img.style.display = 'block';
      // canvas의 인라인 스타일 복사 (width/height CSS 등)
      img.style.cssText = clnCanvas.style.cssText;
      img.style.display = 'block';
      clnCanvas.replaceWith(img);
    } catch {
      // CORS 등으로 toDataURL 실패 시 원본 유지
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// blob URL 이미지 → data URL 변환
// ──────────────────────────────────────────────────────────────────────────────

/**
 * source DOM에서 이미 로드된 blob: URL 이미지를 data URL로 변환합니다.
 *
 * ## 왜 필요한가
 *
 * blob: URL (예: `blob:http://localhost:8080/abc-123`)은
 * **브라우저 메모리에만 존재하는 임시 URL**입니다.
 * HTML 파일로 내보내면 이 URL이 유효하지 않아 이미지가 깨집니다.
 * 또한 fetch()로도 blob: URL을 가져올 수 없는 경우가 있습니다.
 *
 * ## 처리 방식
 *
 * source(원본)의 <img>는 이미 로드 완료 상태이므로,
 * canvas에 drawImage → toDataURL로 픽셀 데이터를 base64 PNG로 변환합니다.
 * (fetch 대신 이미 렌더링된 이미지 데이터를 직접 읽는 방식)
 *
 * convertCanvasesToImages와 동일한 source↔clone 인덱스 매칭 패턴을 사용합니다.
 */
export function inlineBlobUrlImages(source: HTMLElement, clone: HTMLElement): void {
  const sourceImgs = source.querySelectorAll<HTMLImageElement>('img[src^="blob:"]');
  const cloneImgs = clone.querySelectorAll<HTMLImageElement>('img[src^="blob:"]');

  for (let i = 0; i < Math.min(sourceImgs.length, cloneImgs.length); i++) {
    const srcImg = sourceImgs[i];
    const clnImg = cloneImgs[i];
    if (!srcImg || !clnImg) continue;

    // 이미지가 로드되지 않았으면 스킵 (inlineImages의 fetch 폴백에 맡김)
    if (!srcImg.complete || !srcImg.naturalWidth) continue;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = srcImg.naturalWidth;
      canvas.height = srcImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(srcImg, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      clnImg.setAttribute('src', dataUrl);
    } catch {
      // tainted canvas (CORS) 등 실패 시 원본 유지 → inlineImages에서 재시도
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// DOM fragment 직렬화
// ──────────────────────────────────────────────────────────────────────────────

/**
 * PDF 렌더 타입 서식에서 **한 페이지씩** DOM을 직렬화하기 위한 함수.
 *
 * ## serializeDomToSelfContainedHtml과의 차이
 *
 * - serializeDomToSelfContainedHtml: 전체 문서를 한 번에 직렬화 → 완전한 HTML 문서 반환
 * - serializeDomFragmentToHtml:     한 페이지의 innerHTML만 반환 → 호출자가 래핑
 *
 * ## 사용 경로
 *
 * DocumentToolbar의 generateHtmlFromPdfRenderType()에서 사용:
 * 1. 페이지를 순회하며 setCurrentPage(i) → waitForPdfRenderStable()
 * 2. 각 페이지의 DOM을 이 함수로 직렬화 (canvas→img, form 동기화, 이미지 인라인)
 * 3. 모든 페이지 fragment를 합쳐서 buildPrintHtmlTemplate()으로 래핑
 *
 * cleanupClone은 호출하지 않음 — data-client-pdf-root의
 * position: relative (클래스)와 background-color (인라인)을 유지해야 합니다.
 */
export async function serializeDomFragmentToHtml(params: {
  source: HTMLElement;
}): Promise<string> {
  const { source } = params;
  const clone = source.cloneNode(true) as HTMLElement;

  convertCanvasesToImages(source, clone);
  inlineBlobUrlImages(source, clone);
  syncFormControlValues(source, clone);

  await Promise.all([
    inlineImages(clone),
    inlineBackgroundImages(clone),
  ]);

  // 불필요한 요소 제거
  clone.querySelectorAll('script').forEach((s) => s.remove());
  // react-pdf 텍스트/어노테이션 레이어 제거 (PDF 텍스트가 중복 표시되는 것 방지)
  clone.querySelectorAll('.react-pdf__Page__textContent, .react-pdf__Page__annotations').forEach((el) => el.remove());

  return clone.innerHTML;
}

// ──────────────────────────────────────────────────────────────────────────────
// 이미지 인라이닝
// ──────────────────────────────────────────────────────────────────────────────
//
// <img src="/api/proxy/..."> 같은 상대/절대 URL 이미지를
// fetch → Blob → FileReader.readAsDataURL로 base64 data URL로 변환합니다.
// background-image: url(...)도 동일하게 처리합니다.
//
// 이미 data: URL인 이미지는 스킵합니다 (convertCanvasesToImages, inlineBlobUrlImages에서 변환된 것).
// ──────────────────────────────────────────────────────────────────────────────

async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = root.querySelectorAll<HTMLImageElement>('img[src]');
  const promises = Array.from(imgs).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;

    try {
      const dataUrl = await fetchAsDataUrl(src);
      if (dataUrl) {
        img.setAttribute('src', dataUrl);
      }
    } catch {
      // 변환 실패 시 원본 유지
    }
  });

  await Promise.all(promises);
}

async function inlineBackgroundImages(root: HTMLElement): Promise<void> {
  const allElements = root.querySelectorAll<HTMLElement>('*');
  const promises = Array.from(allElements).map(async (el) => {
    const bg = el.style.backgroundImage;
    if (!bg || bg === 'none') return;

    const match = bg.match(/url\(["']?((?!data:)[^"')]+)["']?\)/);
    if (!match?.[1]) return;

    try {
      const dataUrl = await fetchAsDataUrl(match[1]);
      if (dataUrl) {
        el.style.backgroundImage = `url("${dataUrl}")`;
      }
    } catch {
      // 변환 실패 시 원본 유지
    }
  });

  await Promise.all(promises);
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// form 값 동기화
// ──────────────────────────────────────────────────────────────────────────────
//
// ## 왜 필요한가
//
// DOM을 cloneNode(true)로 복사하면 HTML attribute만 복사됩니다.
// 그런데 사용자가 입력한 값은 JavaScript 프로퍼티(input.value)에만 존재하고,
// HTML attribute(input의 value="...")에는 반영되지 않은 경우가 많습니다.
// (React는 controlled component로 동작하므로 DOM attribute와 프로퍼티가 불일치)
//
// ## 처리 방식
//
// source(원본)의 각 form 요소에서 JavaScript 프로퍼티 값을 읽어,
// clone(복사본)의 HTML attribute로 "베이크"합니다:
// - input[text/number/...]: setAttribute('value', source.value)
// - input[checkbox/radio]:  setAttribute('checked', 'checked') 또는 removeAttribute('checked')
// - textarea:               textContent = source.value
// - select > option:        setAttribute('selected', 'selected')
//
// 이렇게 하면 clone.outerHTML 직렬화 시 값이 HTML에 포함됩니다.
// ──────────────────────────────────────────────────────────────────────────────

function syncFormControlValues(source: HTMLElement, target: HTMLElement) {
  // input 동기화
  const sourceInputs = Array.from(source.querySelectorAll<HTMLInputElement>('input'));
  const targetInputs = Array.from(target.querySelectorAll<HTMLInputElement>('input'));
  for (let i = 0; i < Math.min(sourceInputs.length, targetInputs.length); i++) {
    const src = sourceInputs[i];
    const tgt = targetInputs[i];
    if (!src || !tgt) continue;

    if (src.type === 'checkbox' || src.type === 'radio') {
      if (src.checked) {
        tgt.setAttribute('checked', 'checked');
      } else {
        tgt.removeAttribute('checked');
      }
      continue;
    }
    // 텍스트/숫자 등: value attribute로 베이크
    tgt.setAttribute('value', src.value);
  }

  // textarea 동기화
  const sourceTextareas = Array.from(source.querySelectorAll<HTMLTextAreaElement>('textarea'));
  const targetTextareas = Array.from(target.querySelectorAll<HTMLTextAreaElement>('textarea'));
  for (let i = 0; i < Math.min(sourceTextareas.length, targetTextareas.length); i++) {
    const src = sourceTextareas[i];
    const tgt = targetTextareas[i];
    if (!src || !tgt) continue;
    // textarea는 textContent로 값을 표현
    tgt.textContent = src.value;
  }

  // select 동기화
  const sourceSelects = Array.from(source.querySelectorAll<HTMLSelectElement>('select'));
  const targetSelects = Array.from(target.querySelectorAll<HTMLSelectElement>('select'));
  for (let i = 0; i < Math.min(sourceSelects.length, targetSelects.length); i++) {
    const src = sourceSelects[i];
    const tgt = targetSelects[i];
    if (!src || !tgt) continue;

    // 모든 option의 selected attribute를 동기화
    const srcOptions = src.options;
    const tgtOptions = tgt.options;
    for (let j = 0; j < Math.min(srcOptions.length, tgtOptions.length); j++) {
      if (srcOptions[j]?.selected) {
        tgtOptions[j]?.setAttribute('selected', 'selected');
      } else {
        tgtOptions[j]?.removeAttribute('selected');
      }
    }
  }
}

// ── 페이지 크기 감지 & 혼합 방향 처리 ──

/**
 * 클론된 DOM의 모든 .printable-page 요소를 분석하여 @page 규칙을 생성합니다.
 *
 * Edge/WebView2의 프린트 엔진은 문서 내 혼합 페이지 크기(named pages)를
 * 지원하지 않아, 모든 페이지가 동일한 크기로 출력됩니다.
 *
 * 따라서 혼합 방향 문서의 경우:
 * 1. 다수 방향(세로/가로)을 기본 @page 크기로 결정
 * 2. 소수 방향 페이지의 콘텐츠를 CSS transform으로 90° 회전하여
 *    기본 방향 페이지에 맞춤
 *
 * 단일 방향 문서의 경우 단순히 @page { size: W H } 규칙만 생성합니다.
 *
 * ⚠️ extractPageContent 전에 호출해야 DOM 변경이 innerHTML에 포함됩니다.
 */
function applyNamedPageRules(clone: HTMLElement): string {
  const pages = clone.querySelectorAll<HTMLElement>('.printable-page');
  if (pages.length === 0) return '';

  // 1. 각 페이지의 크기 정보 수집
  type PageInfo = { el: HTMLElement; w: number; h: number; wStr: string; hStr: string };
  const infos: PageInfo[] = [];

  pages.forEach((page) => {
    const wStr = page.style.width;
    const hStr = page.style.height;
    if (!wStr || !hStr) return;
    infos.push({ el: page, w: parseFloat(wStr), h: parseFloat(hStr), wStr, hStr });
  });

  if (infos.length === 0) return '';

  // 2. 방향 분류
  const landscapePages = infos.filter((p) => p.w > p.h);
  const portraitPages = infos.filter((p) => p.w <= p.h);

  // 단일 방향 → 간단한 @page 규칙
  if (landscapePages.length === 0 || portraitPages.length === 0) {
    const first = infos[0]!;
    return `@page { size: ${first.wStr} ${first.hStr}; margin: 0; }`;
  }

  // 3. 혼합 방향 → 다수 방향을 기본으로, 소수 방향을 회전
  const usePortraitBase = portraitPages.length >= landscapePages.length;
  const baseInfo = (usePortraitBase ? portraitPages[0] : landscapePages[0])!;
  const pagesToRotate = usePortraitBase ? landscapePages : portraitPages;

  pagesToRotate.forEach((info) => {
    rotatePage(info.el, info.wStr, info.hStr, baseInfo.wStr, baseInfo.hStr, usePortraitBase);
  });

  return `@page { size: ${baseInfo.wStr} ${baseInfo.hStr}; margin: 0; }`;
}

/**
 * 페이지의 콘텐츠를 래퍼로 감싸고, @media print에서만 회전하도록 준비합니다.
 *
 * screen(미리보기): 원본 가로 방향 그대로 표시 (inline width/height 유지)
 * print(인쇄):      CSS custom properties + @media print 규칙으로 회전 적용
 *
 * 가로→세로 (usePortraitBase=true):  .rotate-cw  — rotate(90deg)
 * 세로→가로 (usePortraitBase=false): .rotate-ccw — rotate(-90deg)
 */
function rotatePage(
  page: HTMLElement,
  origW: string,
  origH: string,
  baseW: string,
  baseH: string,
  usePortraitBase: boolean,
) {
  const doc = page.ownerDocument;

  // CSS custom properties: @media print에서 회전 시 사용할 치수 저장
  // screen에서는 페이지의 원본 inline width/height가 그대로 적용됨
  page.style.setProperty('--orig-w', origW);
  page.style.setProperty('--orig-h', origH);
  page.style.setProperty('--base-w', baseW);
  page.style.setProperty('--base-h', baseH);
  page.style.setProperty('--orig-padding', page.style.padding || '0');

  // 래퍼: 회전 방향 클래스만 부여 (모든 스타일은 CSS에서 @media print로 처리)
  const wrapper = doc.createElement('div');
  wrapper.className = `print-rotate-wrapper ${usePortraitBase ? 'rotate-cw' : 'rotate-ccw'}`;

  // 자식 노드를 래퍼로 이동
  while (page.firstChild) {
    wrapper.appendChild(page.firstChild);
  }
  page.appendChild(wrapper);

  // 페이지에 회전 마커 클래스 추가 (inline width/height 변경 없음 → screen에서 원본 크기 유지)
  page.classList.add('print-rotated-page');
}

// ── 콘텐츠 추출 ──

/**
 * 클론된 래퍼 div에서 실제 페이지 콘텐츠만 추출합니다.
 *
 * HiddenRenderer는 `<div style="width: 210mm; ...">` 래퍼로 콘텐츠를 감싸는데,
 * 이 래퍼가 직렬화에 포함되면 landscape 페이지(297mm)가 210mm에 갇히게 됩니다.
 *
 * 전략: clone.innerHTML로 래퍼 div 자체만 제거하고 내부 콘텐츠는 모두 보존.
 * 이렇게 하면 단일 문서, 합본(처방전+영수증+내역서+진료기록), 처방전 등
 * 모든 케이스에서 안전하게 동작합니다.
 */
function extractPageContent(clone: HTMLElement, _pageSelector?: string): string {
  return clone.innerHTML;
}

// ──────────────────────────────────────────────────────────────────────────────
// 페이지 스타일시트 CSS 추출
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 실행 중인 페이지의 스타일시트에서 DOM 클론에 적용되는 CSS 규칙을 추출합니다.
 *
 * ## 왜 필요한가 — 문제 상황
 *
 * React 앱에서는 Tailwind CSS v4가 전역으로 로드되어 있습니다.
 * Tailwind의 preflight(기본값 리셋)가 브라우저 기본 스타일을 덮어쓰므로,
 * 앱 내에서는 `<p>` 태그에 margin이 없고, `<img>`는 display: block입니다.
 *
 * 그런데 직렬화된 self-contained HTML을 별도 창에서 열면,
 * Tailwind CSS가 없으므로 **브라우저 기본값이 그대로 적용**됩니다:
 * - `<p>` 태그에 margin: 16px → 영수증이 원본보다 길어짐
 * - `<img>`가 inline → 의도치 않은 공백 발생
 * - Tailwind 유틸리티 클래스(flex, text-sm 등) 정의 없음 → 레이아웃 깨짐
 *
 * 이전에는 build-print-html-template.ts에 필요한 CSS를 수동으로 복사했으나,
 * 누락이 반복적으로 발생했습니다 (p { margin: 0 } 누락 → 영수증 높이 불일치 등).
 *
 * ## 해결 방식 — document.styleSheets API
 *
 * 수동 관리 대신, **브라우저가 실제 로드한 CSS를 런타임에 동적으로 추출**합니다:
 * 1. document.styleSheets를 순회하여 모든 CSSRule에 접근
 * 2. 각 CSSStyleRule의 selector가 클론 DOM의 요소와 매칭되는지 확인
 * 3. 매칭되는 규칙만 수집하여 CSS 문자열로 반환
 *
 * 이렇게 하면 앱에 CSS가 추가/변경되어도 자동으로 캡처되므로,
 * 케이스별로 누락을 찾아 수정할 필요가 없습니다.
 *
 * ## 추출 대상
 *
 * - Tailwind preflight: p { margin: 0 }, img { display: block } 등 브라우저 기본값 리셋
 * - Tailwind 유틸리티: .flex { display: flex }, .text-sm { font-size: ... } 등
 * - CSS custom properties: :root { --color-primary: ... } 등 (Tailwind v4 테마 변수)
 * - 앱 커스텀 CSS: globals.css 등에서 정의한 스타일
 * - @media print 규칙: 프린트 시에만 적용되는 스타일
 *
 * ## 제외 대상
 *
 * - @font-face: self-contained HTML은 Agent PC에 설치된 시스템 폰트를 사용
 * - 매칭되지 않는 규칙: 클론 DOM에 없는 클래스/태그를 대상으로 하는 규칙
 *
 * ## 최적화
 *
 * 앱 전체의 CSS 규칙 수는 수천 개에 달할 수 있으므로,
 * querySelector 호출 전에 **클래스명 사전 필터링**으로 불필요한 호출을 줄입니다:
 * 1. 클론 DOM의 모든 요소에서 class 속성 수집 → Set<string>
 * 2. 셀렉터에 참조된 클래스가 모두 Set에 없으면 → querySelector 호출 없이 스킵
 *
 * ## 주의사항
 *
 * - Cross-origin 스타일시트: cssRules 접근 시 SecurityError → try-catch로 스킵
 *   (이 프로젝트는 동일 origin만 사용하므로 실질적 영향 없음)
 * - @layer 플래트닝: Tailwind v4는 @layer base/utilities를 사용하지만,
 *   standalone HTML에서는 다른 layer가 없으므로 플래트닝해도 cascade 순서에 영향 없음
 * - 추출된 CSS는 buildPrintHtmlTemplate에서 template CSS **앞에** 배치되어,
 *   template의 구조적 스타일(font-family, .printable-page 등)이 우선합니다
 */
export function extractMatchedStyles(clone: HTMLElement): string {
  if (typeof document === 'undefined') return '';

  // 클론에 사용된 클래스명 수집 — 셀렉터 사전 필터링용
  const usedClasses = new Set<string>();
  clone.classList.forEach((c) => usedClasses.add(c));
  clone.querySelectorAll('[class]').forEach((el) => {
    el.classList.forEach((c) => usedClasses.add(c));
  });

  const output: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      collectMatchingRules(sheet.cssRules, clone, usedClasses, output);
    } catch {
      // Cross-origin 스타일시트는 cssRules 접근 시 SecurityError 발생
    }
  }

  return output.join('\n');
}

/**
 * CSSRuleList를 재귀적으로 순회하며 클론 DOM에 매칭되는 규칙을 수집합니다.
 *
 * CSS 규칙 타입별 처리:
 * - CSSStyleRule:     selector가 DOM에 매칭되면 포함 (doesRuleApply로 판단)
 * - CSSMediaRule:     @media print → 제외 (앱 전용 print 규칙이 standalone HTML을 깨뜨림)
 *                     그 외 @media → 내부 규칙을 재귀 수집하여 래핑
 * - CSSFontFaceRule:  제외 (시스템 폰트 사용)
 * - CSSKeyframesRule: 무조건 포함 (어떤 요소가 참조하는지 판단 어려움)
 * - @layer/@supports: 내부 규칙을 재귀 수집 → 플래트닝 (래퍼 제거)
 */
function collectMatchingRules(
  rules: CSSRuleList,
  root: HTMLElement,
  usedClasses: Set<string>,
  output: string[],
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;

    if (rule instanceof CSSStyleRule) {
      if (doesRuleApply(rule.selectorText, root, usedClasses)) {
        output.push(rule.cssText);
      }
    } else if (rule instanceof CSSMediaRule) {
      // @media print 제외 — self-contained HTML은 build-print-html-template.ts에
      // 자체 @media print 규칙이 있음. 앱의 @media print 규칙은 앱 컨텍스트 전용이며
      // (예: DocumentCenter.print.scss의 `body * { display: none }` → 앱 UI 숨김),
      // standalone HTML에 포함되면 모든 콘텐츠가 숨겨져 백지로 출력됨.
      if (rule.conditionText === 'print') continue;

      const nested: string[] = [];
      collectMatchingRules(rule.cssRules, root, usedClasses, nested);
      if (nested.length > 0) {
        output.push(`@media ${rule.conditionText} { ${nested.join(' ')} }`);
      }
    } else if (rule instanceof CSSFontFaceRule) {
      // @font-face 제외 — self-contained HTML은 Agent PC 시스템 폰트 사용
    } else if (rule instanceof CSSKeyframesRule) {
      output.push(rule.cssText);
    } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
      // @layer, @supports 등 — 내부 규칙만 수집하고 래퍼는 제거 (플래트닝)
      // standalone HTML에서는 다른 layer가 없으므로 cascade 영향 없음
      const nested: string[] = [];
      collectMatchingRules(
        (rule as CSSGroupingRule).cssRules,
        root,
        usedClasses,
        nested,
      );
      output.push(...nested);
    }
  }
}

/**
 * CSS 셀렉터가 클론된 DOM 트리의 요소와 매칭되는지 판단합니다.
 *
 * 3단계 필터링:
 *
 * 1단계 — 전역 셀렉터 감지:
 *   :root, html, body 셀렉터는 클론(분리된 div 서브트리)에 매칭되지 않지만,
 *   CSS custom properties(Tailwind v4 테마 변수)와 base 스타일에 필수이므로
 *   무조건 포함합니다.
 *
 * 2단계 — 클래스명 사전 필터 (성능 최적화):
 *   셀렉터에 참조된 모든 클래스가 클론 DOM에 존재하지 않으면,
 *   비용이 큰 querySelector 호출 없이 즉시 스킵합니다.
 *   예: .some-unused-class { ... } → 클론에 해당 클래스가 없으면 스킵
 *   단, 콤마로 분리된 복합 셀렉터(`.a, .b`)는 부분 매칭이 가능하므로 이 최적화를 적용하지 않습니다.
 *
 * 3단계 — querySelector 정확한 매칭:
 *   root.matches(selector) 또는 root.querySelector(selector)로
 *   클론 DOM 트리에 실제 매칭되는 요소가 있는지 확인합니다.
 *   유효하지 않은 셀렉터는 try-catch로 처리하며, 안전을 위해 포함합니다.
 */
function doesRuleApply(
  selector: string,
  root: HTMLElement,
  usedClasses: Set<string>,
): boolean {
  // 1. 문서 레벨 셀렉터 — 분리된 클론에서는 매칭 불가하지만 CSS 변수/기본 스타일에 필수
  if (/(?:^|,)\s*(:root|html|body)\b/.test(selector)) {
    return true;
  }

  // 2. 사전 필터: 콤마 없는 단일 셀렉터에서 모든 클래스 참조가 미사용이면 스킵
  if (selector.includes('.') && !selector.includes(',')) {
    const classRefs = [...selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)];
    if (classRefs.length > 0 && classRefs.every((m) => !usedClasses.has(m[1]!))) {
      return false;
    }
  }

  // 3. querySelector로 정확한 매칭 확인
  try {
    return root.matches(selector) || root.querySelector(selector) !== null;
  } catch {
    // 유효하지 않은 셀렉터 — 안전을 위해 포함
    return true;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 클린업
// ──────────────────────────────────────────────────────────────────────────────

function cleanupClone(clone: HTMLElement) {
  // 숨김 컨테이너의 position/visibility/width 스타일 제거
  clone.style.position = '';
  clone.style.left = '';
  clone.style.top = '';
  clone.style.zIndex = '';
  clone.style.visibility = '';
  clone.style.width = '';

  // script 태그 제거
  const scripts = clone.querySelectorAll('script');
  scripts.forEach((s) => s.remove());
}
