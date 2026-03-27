'use client';

import { useState, useCallback, type ReactNode, useRef } from 'react';
import { serializeDomToSelfContainedHtml } from '@/lib/html/serialize-dom-to-html';

type ReceptionHtmlOptions = {
  pageSelector?: string;
  extraCss?: string;
  mode?: 'preview' | 'print';
};

/**
 * 페이지네이션 안정을 위한 DOM 캡처 대기 프레임 수.
 * PrintableDocument 내부 체인: ResizeObserver → measureVersion → rAF → paginateItems → render
 * 이 전체 과정이 2-3프레임(~50ms)에 완료되므로 3프레임이면 충분합니다.
 */
const CAPTURE_WAIT_FRAMES = 3;

/** N프레임 대기 후 resolve되는 Promise */
function waitForFrames(n: number): Promise<void> {
  return new Promise((resolve) => {
    let count = 0;
    function step() {
      if (++count >= n) resolve();
      else requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/**
 * React 컴포넌트를 숨김 DOM에 렌더링한 후 self-contained HTML 문자열로 변환하는 훅.
 *
 * use-reception-print-generator.tsx와 동일한 패턴이지만:
 * - createPdfBlobFromDom() 대신 serializeDomToSelfContainedHtml() 호출
 * - 반환 타입: Blob → string
 * - html-to-image, jsPDF 의존성 없음
 *
 * ## 동시성 보호 (방어적 직렬화)
 * 기존 PDF generator와 동일한 mutex 패턴으로 동시 호출을 직렬화합니다.
 */
export function useReceptionHtmlGenerator() {
  const [renderTask, setRenderTask] = useState<ReactNode | null>(null);
  const resolveRef = useRef<((html: string) => void) | null>(null);
  const rejectRef = useRef<((reason?: unknown) => void) | null>(null);
  const optionsRef = useRef<ReceptionHtmlOptions | null>(null);
  const captureAbortRef = useRef<{ aborted: boolean } | null>(null);
  const generationMutexRef = useRef<Promise<unknown>>(Promise.resolve());

  const generateHtmlInternal = useCallback(async (
    content: ReactNode,
    options?: ReceptionHtmlOptions
  ): Promise<string> => {
    // 이전 캡처 rAF 체인이 아직 pending이면 abort
    if (captureAbortRef.current) {
      captureAbortRef.current.aborted = true;
      captureAbortRef.current = null;
      console.log('[ReceptionHtmlGenerator] 이전 캡처 작업 취소');
    }

    // 이전 작업이 남아있으면 reject로 정리
    if (rejectRef.current) {
      console.warn('[ReceptionHtmlGenerator] 이전 생성 작업 reject 처리 (새 작업으로 대체)');
      rejectRef.current(new Error('새로운 HTML 생성 작업으로 인해 이전 작업이 취소되었습니다.'));
      resolveRef.current = null;
      rejectRef.current = null;
      optionsRef.current = null;
      setRenderTask(null);
    }

    return new Promise<string>((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      optionsRef.current = options ?? null;
      setRenderTask(content);
    });
  }, []);

  const generateHtml = useCallback(async (
    content: ReactNode,
    options?: ReceptionHtmlOptions
  ): Promise<string> => {
    const result = generationMutexRef.current.then(
      () => generateHtmlInternal(content, options),
      () => generateHtmlInternal(content, options)
    );

    generationMutexRef.current = result.catch(() => {});

    return result;
  }, [generateHtmlInternal]);

  const handleCapture = useCallback((el: HTMLElement | null) => {
    if (!el || !resolveRef.current) return;

    const abortToken = { aborted: false };
    captureAbortRef.current = abortToken;

    const t0 = performance.now();

    // 동기 ref 콜백 안에서 비동기 캡처를 fire-and-forget으로 실행
    const doCapture = async () => {
      // 폰트 로딩 완료를 기다린 후 rAF 대기를 시작합니다.
      await document.fonts.ready;
      await waitForFrames(CAPTURE_WAIT_FRAMES);

      // abort 체크: 새 생성이 시작되어 이전 작업이 취소된 경우
      if (abortToken.aborted) return;
      captureAbortRef.current = null;

      const t1 = performance.now();

      try {
        // 직렬화 전 페이지/블록 정보 확인 (디버그용)
        const pageSelector = optionsRef.current?.pageSelector ?? '.printable-page';
        const pages = el.querySelectorAll(pageSelector);
        const pageInfo = Array.from(pages).map((p, i) => {
          const s = (p as HTMLElement).style;
          return `P${i + 1}[${s.width}×${s.height}]`;
        }).join(' ');

        // 측정 포털 블록 높이 진단 (document.body에 createPortal된 요소)
        const measureBlocks = Array.from(document.querySelectorAll('[data-print-block]'));
        const headerEl = document.querySelector('[data-measure="header"]') as HTMLElement | null;
        const footerEl = document.querySelector('[data-measure="footer"]') as HTMLElement | null;
        const headerH = headerEl?.offsetHeight ?? 0;
        const footerH = footerEl?.offsetHeight ?? 0;
        let totalBlockH = 0;
        const blockDetails: string[] = [];
        measureBlocks.forEach((b, i) => {
          const blk = b as HTMLElement;
          const rawH = blk.offsetHeight;
          const next = measureBlocks[i + 1] as HTMLElement | undefined;
          let spacing = 0;
          if (next) {
            const innerCur = blk.querySelector('[data-print-inner]') ?? blk;
            const innerNext = next.querySelector('[data-print-inner]') ?? next;
            const curRect = innerCur.getBoundingClientRect();
            const nextRect = innerNext.getBoundingClientRect();
            const gap = nextRect.top - curRect.bottom;
            if (gap > 0) spacing = gap;
          }
          const effectiveH = rawH + spacing;
          totalBlockH += effectiveH;
          blockDetails.push(`B${i}[${blk.dataset.printKind}:${rawH}px${spacing > 0 ? `+${spacing.toFixed(0)}sp` : ''}=${effectiveH}px]`);
        });
        const contentHPx = pages.length > 0
          ? parseFloat((pages[0] as HTMLElement).style.height) / 25.4 * 96
          : 0;
        const marginPx = pages.length > 0
          ? parseFloat(((pages[0] as HTMLElement).style.padding ?? '').split(' ')[0] ?? '0') / 25.4 * 96
          : 0;
        const availableH = contentHPx - 2 * marginPx - headerH - footerH;
        const safeH = availableH - 2; // SUB_PIXEL_TOLERANCE
        console.log(
          `[HTML-DEBUG] contentH=${contentHPx.toFixed(1)}px marginPx=${marginPx.toFixed(1)}px headerH=${headerH}px footerH=${footerH}px | availableH=${availableH.toFixed(1)}px safeH=${safeH.toFixed(1)}px totalBlockH=${totalBlockH.toFixed(1)}px | overflow=${(totalBlockH - safeH).toFixed(1)}px`
        );
        console.log(`[HTML-DEBUG] blocks: ${blockDetails.join(' ')}`);

        console.log(
          `[HTML-PERF] 직렬화 시작 | waitFrames=${CAPTURE_WAIT_FRAMES}(실제 ${(t1 - t0).toFixed(0)}ms) | pages=${pages.length} | ${pageInfo}`
        );

        const html = await serializeDomToSelfContainedHtml({
          root: el,
          pageSelector,
          extraCss: optionsRef.current?.extraCss,
          mode: optionsRef.current?.mode ?? 'preview',
        });

        const t2 = performance.now();
        const sizeKB = (new Blob([html]).size / 1024).toFixed(1);
        console.log(
          `[HTML-PERF] 직렬화 완료 | serialize=${(t2 - t1).toFixed(0)}ms | 전체=${(t2 - t0).toFixed(0)}ms | ${sizeKB}KB`
        );

        if (resolveRef.current) {
          resolveRef.current(html);
        }
      } catch (err) {
        console.error('[ReceptionHtmlGenerator] DOM 직렬화 실패:', err);
        if (rejectRef.current) {
          rejectRef.current(err);
        }
      } finally {
        resolveRef.current = null;
        rejectRef.current = null;
        optionsRef.current = null;
        setRenderTask(null);
      }
    };

    doCapture();
  }, []);

  const HiddenRenderer = useCallback(() => {
    if (!renderTask) return null;

    return (
      <div
        ref={handleCapture}
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '210mm', // A4 너비
          zIndex: -9999,
          visibility: 'hidden',
        }}
      >
        {renderTask}
      </div>
    );
  }, [renderTask, handleCapture]);

  return { generateHtml, HiddenRenderer };
}
