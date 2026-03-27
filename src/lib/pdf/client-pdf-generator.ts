'use client';

// ── 성능 계측 타입 ──

export interface PdfPageMetrics {
  waitFramesMs: number;
  cloneMs: number;
  toJpegMs: number;
  imgSizeMs: number;
  addImageMs: number;
}

export interface PdfGenerationMetrics {
  totalMs: number;
  pageCount: number;
  fileSizeKB: number;
  pages: PdfPageMetrics[];
  outputMs: number;
  settings: { pixelRatio: number; quality: number; imageFormat: 'jpeg' | 'png' };
  /** 캡처된 페이지 이미지 data URL (collectDataUrls 옵션 활성화 시) */
  capturedDataUrls?: string[];
}

export interface ClientPdfCaptureOptions {
  fileName?: string;
  backgroundColor?: string;
  pixelRatio?: number;
  quality?: number;
  // 페이지 노드를 찾을 때 사용 (우선순위: printable-page → A4 → root)
  pageSelector?: string;
  /**
   * DOM 기반 캡처 시(스크롤 컨테이너/transform 영향) 페이지가 밀리는 현상을 방지하기 위해
   * 각 페이지 엘리먼트를 off-screen fixed 컨테이너로 복제하여 캡처할지 여부.
   * - createPdfBlobFromDom / createPdfBlobFromElements에서만 사용
   * - createPdfBlobFromHtml(ShadowRoot) / createPdfBlobFromCaptureTasks(PDF 캔버스)에는 적용하지 않음
   */
  isolateDomCapture?: boolean;
  orientation?: 'portrait' | 'landscape';
  /** 성능 메트릭 수집 콜백 — 테스트 페이지 등에서 구간별 소요시간을 받아 UI에 표시할 때 사용 */
  onMetrics?: (metrics: PdfGenerationMetrics) => void;
  /** 캡처 이미지 포맷 (jpeg: 빠르고 작음, png: 무손실) */
  imageFormat?: 'jpeg' | 'png';
  /** 캡처된 이미지 data URL을 메트릭에 포함 (테스트/품질 비교용) */
  collectDataUrls?: boolean;
  /** html-to-image 라이브러리 옵션 직접 전달 (pixelRatio, quality, backgroundColor 제외 — 이들은 전용 필드 사용) */
  htmlToImageOptions?: {
    skipFonts?: boolean;
    skipAutoScale?: boolean;
    cacheBust?: boolean;
    includeQueryParams?: boolean;
    preferredFontFormat?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  };
}

export async function createPdfBlobFromHtml(params: {
  html: string;
  options?: ClientPdfCaptureOptions;
}): Promise<Blob> {
  const { html, options } = params;

  let hostEl: HTMLDivElement | null = null;
  let shadowRoot: ShadowRoot | null = null;

  try {
    const tImportStart = performance.now();
    const imageFormat = options?.imageFormat ?? 'jpeg';
    const htmlToImage = await import('html-to-image');
    const toImage: HtmlToImageFn = imageFormat === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
    const { jsPDF } = await import('jspdf');
    const tImportEnd = performance.now();

    hostEl = document.createElement('div');
    hostEl.id = 'client-pdf-container';
    Object.assign(hostEl.style, {
      position: 'fixed',
      top: '0',
      left: '-10000px',
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: options?.backgroundColor ?? '#ffffff',
      zIndex: '-1',
    });
    document.body.appendChild(hostEl);

    const tShadowStart = performance.now();
    shadowRoot = hostEl.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = html;
    const tShadowEnd = performance.now();

    await waitForTwoAnimationFrames();

    const root = shadowRoot as unknown as ParentNode;
    const pages = findPagesFromRoot(root, options?.pageSelector);
    if (pages.length === 0) {
      throw new Error('클라이언트 PDF 생성 중 페이지를 찾을 수 없습니다.');
    }

    console.log(
      `[PDF-PERF] createPdfBlobFromHtml 준비 | format=${imageFormat} | import=${(tImportEnd - tImportStart).toFixed(0)}ms | shadowDOM+parse=${(tShadowEnd - tShadowStart).toFixed(0)}ms | pages=${pages.length}`,
    );

    return await createPdfBlobFromPages({
      pages,
      toImage,
      jsPDF,
      options,
      isolateDomCapture: false,
    });
  } finally {
    if (shadowRoot) {
      shadowRoot.innerHTML = '';
    }
    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
  }
}

export async function createPdfBlobFromDom(params: {
  root: HTMLElement;
  options?: ClientPdfCaptureOptions;
}): Promise<Blob> {
  const { root, options } = params;
  await waitForTwoAnimationFrames();

  const pages = findPagesFromRoot(root, options?.pageSelector);
  const resolvedPages = pages.length > 0 ? pages : [root];

  return await createPdfBlobFromElements({
    elements: resolvedPages,
    options,
  });
}

export function triggerBrowserDownload(params: { blob: Blob; fileName: string }) {
  const { blob, fileName } = params;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 다운로드가 시작될 때까지 URL을 유지한 후 해제
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function createPdfBlobFromElements(params: {
  elements: HTMLElement[];
  options?: ClientPdfCaptureOptions;
}): Promise<Blob> {
  const { elements, options } = params;
  const imageFormat = options?.imageFormat ?? 'jpeg';
  const htmlToImage = await import('html-to-image');
  const toImage: HtmlToImageFn = imageFormat === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
  const { jsPDF } = await import('jspdf');

  return await createPdfBlobFromPages({
    pages: elements,
    toImage,
    jsPDF,
    options,
    isolateDomCapture: options?.isolateDomCapture ?? true,
  });
}

export async function createPdfBlobFromCaptureTasks(params: {
  captureTasks: Array<() => Promise<HTMLElement>>;
  options?: ClientPdfCaptureOptions;
}): Promise<Blob> {
  const { captureTasks, options } = params;
  const imageFormat = options?.imageFormat ?? 'jpeg';
  const htmlToImage = await import('html-to-image');
  const toImage: HtmlToImageFn = imageFormat === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
  const { jsPDF } = await import('jspdf');

  const elements: HTMLElement[] = [];
  for (const task of captureTasks) {
    const el = await task();
    elements.push(el);
  }

  return await createPdfBlobFromPages({
    pages: elements,
    toImage,
    jsPDF,
    options,
    isolateDomCapture: true,
  });
}

type HtmlToImageFn = (node: HTMLElement, options?: any) => Promise<string>;
type JsPdfCtor = new (options: any) => {
  addPage: (format?: string, orientation?: string) => void;
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  output: (type: 'blob') => Blob;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
};

async function createPdfBlobFromPages(params: {
  pages: HTMLElement[];
  toImage: HtmlToImageFn;
  jsPDF: JsPdfCtor;
  options?: ClientPdfCaptureOptions;
  isolateDomCapture: boolean;
}): Promise<Blob> {
  const { pages, toImage, jsPDF, options, isolateDomCapture } = params;

  const tTotal = performance.now();

  // CSS px → mm 변환 (브라우저 기본 96dpi 가정)
  const PX_PER_MM = 96 / 25.4;
  const pxToMm = (px: number) => px / PX_PER_MM;

  const quality = options?.quality ?? 1.0;
  const pixelRatio = options?.pixelRatio ?? 3;
  const backgroundColor = options?.backgroundColor ?? '#ffffff';
  const imageFormat = options?.imageFormat ?? 'jpeg';

  console.log(`[PDF-PERF] ──── PDF 생성 시작 ────`);
  console.log(`[PDF-PERF]   설정: pages=${pages.length} | pixelRatio=${pixelRatio} | quality=${quality} | format=${imageFormat} | isolate=${isolateDomCapture}`);

  const pageMetrics: PdfPageMetrics[] = [];
  const collectedDataUrls: string[] = [];
  const shouldCollect = options?.collectDataUrls ?? false;
  let doc: any = null;

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i];
    if (!pageEl) {
      continue;
    }

    // ── waitFrames 계측 ──
    const tWait0 = performance.now();
    await waitForTwoAnimationFrames();
    const tWait1 = performance.now();

    const shouldIsolate =
      isolateDomCapture &&
      pageEl.ownerDocument === document;

    // ── clone + toJpeg 계측 ──
    const tCapture0 = performance.now();
    let tCloneEnd = tCapture0; // isolate가 아닌 경우 clone 시간 = 0

    const imageOptions = {
      pixelRatio,
      backgroundColor,
      ...(imageFormat === 'jpeg' ? { quality } : {}),
      ...options?.htmlToImageOptions,
    };

    const dataUrl = shouldIsolate
      ? await captureIsolatedElementAsImageWithMetrics({
        element: pageEl,
        toImage,
        imageOptions,
        onCloneEnd: (t) => { tCloneEnd = t; },
      })
      : await toImage(pageEl, imageOptions);
    const tCapture1 = performance.now();

    if (shouldCollect) {
      collectedDataUrls.push(dataUrl);
    }

    // ── imgSize 계측 ──
    const tImg0 = performance.now();
    const imageSize = await resolveImageSize(dataUrl);
    const tImg1 = performance.now();
    const imageWidthPx = imageSize?.width ?? pageEl.offsetWidth;
    const imageHeightPx = imageSize?.height ?? pageEl.offsetHeight;

    if (!imageWidthPx || !imageHeightPx) {
      continue;
    }

    const imgWidthMm = pxToMm(imageWidthPx);
    const imgHeightMm = pxToMm(imageHeightPx);

    if (!doc) {
      const orientation: 'portrait' | 'landscape' = options?.orientation || (imgWidthMm > imgHeightMm ? 'landscape' : 'portrait');
      doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });
    } else {
      const currentOrientation: 'portrait' | 'landscape' = imgWidthMm > imgHeightMm ? 'landscape' : 'portrait';
      doc.addPage('a4', currentOrientation);
    }

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();

    const scaleByWidth = pdfWidth / imgWidthMm;
    const scaleByHeight = pdfHeight / imgHeightMm;
    const scale = Math.min(scaleByWidth, scaleByHeight);

    const targetWidth = imgWidthMm * scale;
    const targetHeight = imgHeightMm * scale;

    if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
      continue;
    }

    const offsetX = (pdfWidth - targetWidth) / 2;
    const offsetY = (pdfHeight - targetHeight) / 2;

    // ── addImage 계측 ──
    const tAdd0 = performance.now();
    doc.addImage(dataUrl, imageFormat.toUpperCase(), offsetX, offsetY, targetWidth, targetHeight);
    const tAdd1 = performance.now();

    const waitFramesMs = tWait1 - tWait0;
    const cloneMs = tCloneEnd - tCapture0;
    const toJpegMs = tCapture1 - tCloneEnd;
    const imgSizeMs = tImg1 - tImg0;
    const addImageMs = tAdd1 - tAdd0;
    const pageTotal = waitFramesMs + cloneMs + toJpegMs + imgSizeMs + addImageMs;

    pageMetrics.push({ waitFramesMs, cloneMs, toJpegMs, imgSizeMs, addImageMs });

    console.log(
      `[PDF-PERF]   [${i + 1}/${pages.length}] waitFrames=${waitFramesMs.toFixed(0)}ms | isolate+clone=${cloneMs.toFixed(0)}ms | toImage(${imageFormat})=${toJpegMs.toFixed(0)}ms | imgSize=${imgSizeMs.toFixed(0)}ms | addImage=${addImageMs.toFixed(0)}ms | 페이지합계=${pageTotal.toFixed(0)}ms`,
    );
  }

  if (!doc) {
    doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  // ── output 계측 ──
  const tOut0 = performance.now();
  const blob: Blob = doc.output('blob');
  const tOut1 = performance.now();
  const outputMs = tOut1 - tOut0;
  const totalMs = tOut1 - tTotal;
  const fileSizeKB = blob.size / 1024;

  console.log(`[PDF-PERF]   output=${outputMs.toFixed(0)}ms`);
  console.log(`[PDF-PERF] ──── PDF 생성 완료 ────`);
  console.log(`[PDF-PERF]   전체: ${totalMs.toFixed(0)}ms | 페이지당 평균: ${pages.length > 0 ? (totalMs / pages.length).toFixed(0) : 0}ms | 결과: ${fileSizeKB.toFixed(1)}KB`);

  // 구간별 합계 및 비율
  if (pageMetrics.length > 0) {
    const sum = (fn: (m: PdfPageMetrics) => number) => pageMetrics.reduce((a, m) => a + fn(m), 0);
    const sWait = sum((m) => m.waitFramesMs);
    const sClone = sum((m) => m.cloneMs);
    const sJpeg = sum((m) => m.toJpegMs);
    const sImg = sum((m) => m.imgSizeMs);
    const sAdd = sum((m) => m.addImageMs);
    const pct = (v: number) => totalMs > 0 ? `${((v / totalMs) * 100).toFixed(0)}%` : '0%';
    console.log(
      `[PDF-PERF]   구간별: waitFrames=${sWait.toFixed(0)}ms(${pct(sWait)}) | clone=${sClone.toFixed(0)}ms(${pct(sClone)}) | toJpeg=${sJpeg.toFixed(0)}ms(${pct(sJpeg)}) | imgSize=${sImg.toFixed(0)}ms(${pct(sImg)}) | addImage=${sAdd.toFixed(0)}ms(${pct(sAdd)}) | output=${outputMs.toFixed(0)}ms(${pct(outputMs)})`,
    );
  }

  // ── onMetrics 콜백 ──
  if (options?.onMetrics) {
    options.onMetrics({
      totalMs,
      pageCount: pageMetrics.length,
      fileSizeKB,
      pages: pageMetrics,
      outputMs,
      settings: { pixelRatio, quality, imageFormat },
      ...(shouldCollect ? { capturedDataUrls: collectedDataUrls } : {}),
    });
  }

  return blob;
}

function findPagesFromRoot(root: ParentNode, preferredSelector?: string): HTMLElement[] {
  const selectors = resolvePageSelectors(preferredSelector);
  for (const selector of selectors) {
    const found = Array.from(root.querySelectorAll(selector)).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    if (found.length > 0) return found;
  }
  return [];
}

function resolvePageSelectors(preferredSelector?: string): string[] {
  const base = ['.printable-page', '.A4'];
  if (!preferredSelector) return base;
  const trimmed = preferredSelector.trim();
  if (!trimmed) return base;
  return [trimmed, ...base];
}

async function waitForTwoAnimationFrames(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * 요소의 전체 크기를 측정합니다.
 * 스크롤 컨테이너에 의해 클립된 경우에도 실제 콘텐츠 크기를 반환합니다.
 * canvas가 있으면 canvas의 CSS 렌더링 크기를 우선 사용합니다.
 */
function measureElementFullSize(element: HTMLElement): { width: number; height: number } {
  // canvas가 있으면 canvas의 intrinsic 크기 우선 사용 (비율 정확)
  const canvas = element.querySelector('canvas');
  if (canvas) {
    const intrinsicWidth = (canvas as HTMLCanvasElement).width;
    const intrinsicHeight = (canvas as HTMLCanvasElement).height;

    if (intrinsicWidth > 0 && intrinsicHeight > 0) {
      return {
        width: intrinsicWidth,
        height: intrinsicHeight,
      };
    }

    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width > 0 && canvasRect.height > 0) {
      return {
        width: Math.round(canvasRect.width),
        height: Math.round(canvasRect.height),
      };
    }
  }

  // scrollWidth/scrollHeight가 offsetWidth/offsetHeight보다 크면 사용
  const scrollWidth = element.scrollWidth;
  const scrollHeight = element.scrollHeight;
  const offsetWidth = element.offsetWidth;
  const offsetHeight = element.offsetHeight;

  const width = Math.max(scrollWidth, offsetWidth) || Math.round(element.getBoundingClientRect().width);
  const height = Math.max(scrollHeight, offsetHeight) || Math.round(element.getBoundingClientRect().height);

  return { width, height };
}

async function captureIsolatedElementAsImageWithMetrics(params: {
  element: HTMLElement;
  toImage: HtmlToImageFn;
  imageOptions: Record<string, unknown>;
  onCloneEnd?: (timestamp: number) => void;
}): Promise<string> {
  const { element, toImage, imageOptions, onCloneEnd } = params;
  const backgroundColor = (imageOptions.backgroundColor as string) ?? '#ffffff';

  const host = document.createElement('div');
  const { width: widthPx, height: heightPx } = measureElementFullSize(element);

  Object.assign(host.style, {
    position: 'fixed',
    top: '0',
    left: '-10000px',
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    overflow: 'visible',
    backgroundColor,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: '0',
    margin: '0',
    zIndex: '-1',
  } as Partial<CSSStyleDeclaration>);

  document.body.appendChild(host);

  try {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.transformOrigin = 'top left';

    if (window.getComputedStyle(element).display === 'none') {
      clone.style.display = resolveIsolatedDisplay(element);
    }

    host.appendChild(clone);
    syncFormControlValues({ sourceRoot: element, targetRoot: clone });
    syncCanvasData({ sourceRoot: element, targetRoot: clone });

    await waitForTwoAnimationFrames();

    // clone 완료 시점 기록 (성능 계측용)
    onCloneEnd?.(performance.now());

    // DEBUG: clone된 DOM에서 이미지 리소스 확인
    const imgs = clone.querySelectorAll('img');
    const bgEls = Array.from(clone.querySelectorAll('*')).filter((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      return bg && bg !== 'none';
    });
    console.log(`[PDF-DEBUG] clone 내 img 태그: ${imgs.length}개`);
    imgs.forEach((img, i) => {
      console.log(`[PDF-DEBUG]   img[${i}] src=${img.src?.substring(0, 200)} crossOrigin=${img.crossOrigin} naturalWidth=${img.naturalWidth}`);
    });
    console.log(`[PDF-DEBUG] clone 내 background-image 요소: ${bgEls.length}개`);
    bgEls.forEach((el, i) => {
      console.log(`[PDF-DEBUG]   bg[${i}] backgroundImage=${window.getComputedStyle(el).backgroundImage?.substring(0, 200)}`);
    });

    try {
      const result = await toImage(clone, imageOptions);
      return result;
    } catch (captureErr) {
      console.error('[PDF-DEBUG] toImage 실패:', captureErr);
      if (captureErr instanceof Error) {
        console.error('[PDF-DEBUG] toImage stack:', captureErr.stack);
      }
      throw captureErr;
    }
  } finally {
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  }
}

function resolveIsolatedDisplay(element: HTMLElement): 'block' | 'flex' {
  if (element.classList.contains('printable-page')) {
    return 'flex';
  }
  return 'block';
}

function syncFormControlValues(params: { sourceRoot: HTMLElement; targetRoot: HTMLElement }) {
  const { sourceRoot, targetRoot } = params;

  const sourceInputs = Array.from(sourceRoot.querySelectorAll<HTMLInputElement>('input'));
  const targetInputs = Array.from(targetRoot.querySelectorAll<HTMLInputElement>('input'));
  for (let i = 0; i < Math.min(sourceInputs.length, targetInputs.length); i++) {
    const source = sourceInputs[i];
    const target = targetInputs[i];
    if (!source || !target) continue;

    // checkbox/radio
    if (source.type === 'checkbox' || source.type === 'radio') {
      target.checked = source.checked;
      continue;
    }
    target.value = source.value;
  }

  const sourceTextareas = Array.from(sourceRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  const targetTextareas = Array.from(targetRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  for (let i = 0; i < Math.min(sourceTextareas.length, targetTextareas.length); i++) {
    const source = sourceTextareas[i];
    const target = targetTextareas[i];
    if (!source || !target) continue;
    target.value = source.value;
  }

  const sourceSelects = Array.from(sourceRoot.querySelectorAll<HTMLSelectElement>('select'));
  const targetSelects = Array.from(targetRoot.querySelectorAll<HTMLSelectElement>('select'));
  for (let i = 0; i < Math.min(sourceSelects.length, targetSelects.length); i++) {
    const source = sourceSelects[i];
    const target = targetSelects[i];
    if (!source || !target) continue;
    target.value = source.value;
  }
}

function syncCanvasData(params: { sourceRoot: HTMLElement; targetRoot: HTMLElement }) {
  const { sourceRoot, targetRoot } = params;

  const sourceCanvases = Array.from(sourceRoot.querySelectorAll<HTMLCanvasElement>('canvas'));
  const targetCanvases = Array.from(targetRoot.querySelectorAll<HTMLCanvasElement>('canvas'));

  for (let i = 0; i < Math.min(sourceCanvases.length, targetCanvases.length); i++) {
    const source = sourceCanvases[i];
    const target = targetCanvases[i];
    if (!source || !target) continue;

    // 원본 canvas 크기로 타겟 canvas 설정
    target.width = source.width;
    target.height = source.height;

    const ctx = target.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, 0, 0);
    }
  }
}

function resolveImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}


