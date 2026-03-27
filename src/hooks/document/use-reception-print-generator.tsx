'use client';

import { useState, useCallback, ReactNode, useRef } from 'react';
import { createPdfBlobFromDom } from '@/lib/pdf/client-pdf-generator';

type ReceptionPrintOptions = {
  pageSelector?: string;
};

// ── 튜닝 파라미터 (값을 바꿔가며 비교 테스트용) ──
/**
 * 페이지네이션 안정을 위한 DOM 캡처 대기 프레임 수.
 * PrintableDocument 내부 체인: ResizeObserver → measureVersion → rAF → paginateItems → render
 * 이 전체 과정이 2-3프레임(~50ms)에 완료되므로 3프레임이면 충분합니다.
 */
const CAPTURE_WAIT_FRAMES = 3;
/** toJpeg 캡처 해상도 배율 (1=96dpi, 2=192dpi, 3=288dpi) */
const PIXEL_RATIO = 3;

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
 * React 컴포넌트를 숨김 DOM에 렌더링한 후 PDF Blob으로 변환하는 훅.
 *
 * ## 동시성 보호 (방어적 직렬화)
 *
 * 이 훅은 단일 `renderTask` state와 단일 `resolveRef`를 사용하므로
 * **동시에 1개의 생성만 처리**할 수 있습니다.
 *
 * 만약 두 번째 호출이 첫 번째 완료 전에 들어오면:
 * - (기존 문제) 첫 번째의 resolve가 덮어쓰여 promise가 영원히 미결
 * - (기존 문제) handleCapture의 setTimeout이 잘못된 promise에 결과 전달
 *
 * 이를 방지하기 위해:
 * 1. `generationMutexRef`: Promise 기반 mutex로 호출을 직렬화
 * 2. `captureTimerRef`: 이전 캡처 setTimeout을 추적하여 취소 가능
 * 3. 이전 작업이 남아있으면 reject로 깨끗하게 정리
 *
 * 주요 호출처인 `usePrintCenterPdfCache`에서 이미 순차 호출을 보장하지만,
 * 이 훅 자체적으로도 방어합니다 (Defense in Depth).
 */
export function useReceptionPrintGenerator() {
  const [renderTask, setRenderTask] = useState<ReactNode | null>(null);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);
  const rejectRef = useRef<((reason?: any) => void) | null>(null);
  const optionsRef = useRef<ReceptionPrintOptions | null>(null);

  /** 현재 pending인 캡처 작업의 abort flag - 새 생성 시작 시 취소할 수 있도록 추적 */
  const captureAbortRef = useRef<{ aborted: boolean } | null>(null);

  /**
   * 직렬화 mutex: 이전 생성이 완료될 때까지 다음 생성을 대기시킵니다.
   * 항상 resolve 상태를 유지하며, 현재 진행 중인 생성의 Promise를 체이닝합니다.
   */
  const generationMutexRef = useRef<Promise<unknown>>(Promise.resolve());

  // ─────────────────────────────────────────────
  // 내부 생성 함수: 실제 렌더링 + 캡처 로직
  // ─────────────────────────────────────────────

  /**
   * React 컴포넌트를 숨김 DOM에 렌더링하고 PDF로 캡처합니다.
   * 이 함수는 generatePdf의 mutex를 통해서만 호출되어야 합니다.
   */
  const generatePdfInternal = useCallback(async (
    content: ReactNode,
    options?: ReceptionPrintOptions
  ): Promise<Blob> => {
    // ── 이전 캡처 작업 취소 ──
    // 이전 호출의 handleCapture rAF 체인이 아직 pending이면 abort합니다.
    if (captureAbortRef.current) {
      captureAbortRef.current.aborted = true;
      captureAbortRef.current = null;
      console.log('[ReceptionPrintGenerator] 이전 캡처 작업 취소');
    }

    // ── 이전 작업이 남아있으면 reject로 정리 ──
    // resolve를 null로 만드는 것이 아니라 reject하여 이전 Promise를 깨끗하게 종료합니다.
    // 이렇게 해야 이전 호출자가 타임아웃 없이 즉시 에러를 받을 수 있습니다.
    if (rejectRef.current) {
      console.warn('[ReceptionPrintGenerator] 이전 생성 작업 reject 처리 (새 작업으로 대체)');
      rejectRef.current(new Error('새로운 PDF 생성 작업으로 인해 이전 작업이 취소되었습니다.'));
      resolveRef.current = null;
      rejectRef.current = null;
      optionsRef.current = null;
      setRenderTask(null);
    }

    // ── 새 생성 Promise 생성 ──
    // setRenderTask로 HiddenRenderer를 트리거하고, handleCapture에서 resolve합니다.
    return new Promise<Blob>((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      optionsRef.current = options ?? null;
      setRenderTask(content);
      console.log('[ReceptionPrintGenerator] 렌더 태스크 설정, DOM 캡처 대기 중');
    });
  }, []);

  // ─────────────────────────────────────────────
  // generatePdf: 외부 인터페이스 (mutex 직렬화 적용)
  // ─────────────────────────────────────────────

  /**
   * React 컴포넌트를 PDF Blob으로 변환합니다.
   *
   * mutex를 사용하여 동시 호출을 직렬화합니다.
   * 이전 생성이 완료(성공/실패)된 후에 다음 생성이 시작됩니다.
   */
  const generatePdf = useCallback(async (
    content: ReactNode,
    options?: ReceptionPrintOptions
  ): Promise<Blob> => {
    // mutex를 통한 직렬화: 이전 작업 완료 후 실행
    // 이전 작업의 성공/실패와 무관하게 다음 작업을 시작합니다.
    const result = generationMutexRef.current.then(
      () => generatePdfInternal(content, options),
      () => generatePdfInternal(content, options) // 이전 에러 무시
    );

    // mutex 체인 유지: 현재 작업의 Promise를 mutex에 등록
    // catch로 에러를 무시하여 체인이 끊어지지 않도록 합니다.
    generationMutexRef.current = result.catch(() => { });

    return result;
  }, [generatePdfInternal]);

  // ─────────────────────────────────────────────
  // handleCapture: DOM 렌더링 완료 후 PDF 캡처
  // ─────────────────────────────────────────────

  /**
   * HiddenRenderer의 ref 콜백으로, DOM 요소가 마운트되면 호출됩니다.
   * PrintableDocument의 페이지네이션(ResizeObserver → rAF → paginateItems)이
   * 완료될 때까지 N프레임 대기 후 DOM을 캡처합니다.
   */
  const handleCapture = useCallback((el: HTMLElement | null) => {
    if (!el || !resolveRef.current) return;

    const abortToken = { aborted: false };
    captureAbortRef.current = abortToken;

    const t0 = performance.now();

    // 동기 ref 콜백 안에서 비동기 캡처를 fire-and-forget으로 실행
    const doCapture = async () => {
      await waitForFrames(CAPTURE_WAIT_FRAMES);

      // abort 체크: 새 생성이 시작되어 이전 작업이 취소된 경우
      if (abortToken.aborted) return;
      captureAbortRef.current = null;

      const t1 = performance.now();

      try {
        // 측정 포털 블록 높이 진단 (HTML generator와 비교용)
        const pageSelector = optionsRef.current?.pageSelector ?? '.printable-page';
        const pages = el.querySelectorAll(pageSelector);
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
          `[PDF-DEBUG] contentH=${contentHPx.toFixed(1)}px marginPx=${marginPx.toFixed(1)}px headerH=${headerH}px footerH=${footerH}px | availableH=${availableH.toFixed(1)}px safeH=${safeH.toFixed(1)}px totalBlockH=${totalBlockH.toFixed(1)}px | overflow=${(totalBlockH - safeH).toFixed(1)}px | pages=${pages.length}`
        );
        console.log(`[PDF-DEBUG] blocks: ${blockDetails.join(' ')}`);

        console.log(`[PDF-PERF] 캡처 시작 | waitFrames=${CAPTURE_WAIT_FRAMES}(실제 ${(t1 - t0).toFixed(0)}ms) | pixelRatio=${PIXEL_RATIO}`);
        const blob = await createPdfBlobFromDom({
          root: el,
          options: {
            pixelRatio: PIXEL_RATIO,
            backgroundColor: '#ffffff',
            pageSelector: optionsRef.current?.pageSelector ?? '.printable-page',
          },
        });
        const t2 = performance.now();
        console.log(`[PDF-PERF] 캡처 완료 | toJpeg+jsPDF=${(t2 - t1).toFixed(0)}ms | 전체=${(t2 - t0).toFixed(0)}ms | ${(blob.size / 1024).toFixed(1)}KB | waitFrames=${CAPTURE_WAIT_FRAMES} pixelRatio=${PIXEL_RATIO}`);

        if (resolveRef.current) {
          resolveRef.current(blob);
        }
      } catch (err) {
        console.error('[ReceptionPrintGenerator] DOM 캡처 실패:', err);
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

  // ─────────────────────────────────────────────
  // HiddenRenderer: 숨김 DOM 렌더러 컴포넌트
  // ─────────────────────────────────────────────

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

  return { generatePdf, HiddenRenderer };
}
