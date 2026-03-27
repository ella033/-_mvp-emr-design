"use client";

import { useCallback, useRef, useEffect } from "react";
import { DocumentType } from "@/components/reception/(print-center)/print-center-types";
import { PrescriptionPurposeLabel } from "@/lib/prescription/build-prescription-html-client";

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────

/** 캐시 엔트리 상태 */
type CacheStatus = "pending" | "generating" | "completed" | "skipped" | "error";

/** 캐시 엔트리 */
interface CacheEntry {
  status: CacheStatus;
  pdf?: Blob;
  error?: Error;
  timestamp: number;
  /** generating 상태일 때 완료를 대기할 수 있는 Promise */
  promise?: Promise<Blob | null>;
}

type PrescriptionPdfOptions = {
  useFormPaper?: boolean;
  purposeLabel?: PrescriptionPurposeLabel;
};

/** 캐시 맵 타입 */
type PdfCache = Map<string, CacheEntry>;

/** 큐 아이템 타입 */
interface QueueItem {
  encounterId: string;
  documentType: DocumentType;
}

/** PDF 생성 함수들 타입 - usePrintService에서 전달받는 함수 인터페이스 */
interface PrintServiceFunctions {
  buildPrescriptionPdf: (encounterId: string, options?: PrescriptionPdfOptions) => Promise<Blob | string | null>;
  buildDetailedStatementPdf: (encounterId: string) => Promise<Blob>;
  buildReceiptPdf: (encounterId: string) => Promise<Blob>;
  buildMedicalRecordPdfByEncounter: (encounterId: string) => Promise<Blob>;
}

/** 훅 옵션 */
interface UsePrintCenterPdfCacheOptions {
  /** 동시 생성 제한 (기본: 1, useReceptionPrintGenerator 제약으로 1 필수) */
  maxConcurrent?: number;
  /** 디바운스 시간 (기본: 300ms) */
  debounceMs?: number;
}

/** 훅 반환 타입 */
interface UsePrintCenterPdfCacheReturn {
  requestGeneration: (encounterId: string, documentType: DocumentType) => void;
  cancelGeneration: (encounterId: string, documentType: DocumentType) => void;
  cancelByDocumentType: (documentType: DocumentType) => void;
  getCachedPdf: (encounterId: string, documentType: DocumentType) => Blob | null;
  getStatus: (encounterId: string, documentType: DocumentType) => CacheStatus | null;
  getSelectedPdfs: (
    selections: Array<{ encounterId: string; documentType: DocumentType }>,
    onProgress?: (current: number, total: number) => void
  ) => Promise<Blob[]>;
  pauseQueue: () => Promise<void>;
  resumeQueue: () => void;
  clearCache: () => void;
}

// ─────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────

/** 캐시 키 생성 헬퍼: "{encounterId}-{documentType}" 형태 */
function makeCacheKey(encounterId: string, documentType: DocumentType): string {
  return `${encounterId}-${documentType}`;
}

/** 타임아웃이 있는 Promise 래퍼 - 지정 시간 초과 시 reject */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), ms)
    ),
  ]);
}

/** PDF 생성 타임아웃 (30초) */
const PDF_GENERATION_TIMEOUT_MS = 30000;

/** DocumentType별 처방전 용도 라벨 매핑 */
const PRESCRIPTION_PURPOSE_BY_DOCUMENT_TYPE = {
  [DocumentType.PHARMACY_PRESCRIPTION]: PrescriptionPurposeLabel.Pharmacy,
  [DocumentType.PATIENT_PRESCRIPTION]: PrescriptionPurposeLabel.Patient,
} as const;

// ─────────────────────────────────────────────
// 메인 훅
// ─────────────────────────────────────────────

/**
 * 출력센터 PDF 캐시 관리 훅
 *
 * 체크박스 선택 시 백그라운드에서 PDF를 사전 생성하고 캐시하며,
 * 출력 버튼 클릭 시 캐시된 PDF를 순차적으로 수집합니다.
 *
 * ## 동시성 제어
 * - `processQueue`: 백그라운드 사전 생성 (maxConcurrent=1)
 * - `getSelectedPdfs`: 출력 시 PDF 수집 (processQueue 차단 후 단독 실행)
 * - `isCollectingRef`: getSelectedPdfs 실행 중 processQueue 차단 플래그
 *
 * 이 구조로 processQueue와 getSelectedPdfs가 동시에 generatePdfForType을
 * 호출하는 Race Condition을 방지합니다.
 */
export function usePrintCenterPdfCache(
  printService: PrintServiceFunctions,
  options?: UsePrintCenterPdfCacheOptions
): UsePrintCenterPdfCacheReturn {
  // maxConcurrent는 1로 고정 - useReceptionPrintGenerator가 동시에 1개만 처리 가능
  const { maxConcurrent = 1, debounceMs = 100 } = options ?? {};

  // ─── Mutable State (Refs) ───
  const cacheRef = useRef<PdfCache>(new Map());
  const queueRef = useRef<QueueItem[]>([]);
  const activeCountRef = useRef(0);
  const debounceTimerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isMountedRef = useRef(true);

  /**
   * getSelectedPdfs 실행 중 processQueue 차단 플래그.
   *
   * getSelectedPdfs가 PDF를 순차 수집하는 동안 processQueue가 새로운 생성을
   * 시작하면 useReceptionPrintGenerator에 동시 호출이 발생하여 Race Condition이
   * 발생합니다. 이 플래그로 processQueue의 진입을 차단합니다.
   */
  const isCollectingRef = useRef(false);

  // ─── Print Service 함수 참조 ───
  const {
    buildPrescriptionPdf,
    buildDetailedStatementPdf,
    buildReceiptPdf,
    buildMedicalRecordPdfByEncounter,
  } = printService;

  // ─────────────────────────────────────────────
  // generatePdfForType: DocumentType에 따른 PDF 생성 분기
  // ─────────────────────────────────────────────

  const generatePdfForType = useCallback(
    async (encounterId: string, documentType: DocumentType): Promise<Blob | null> => {
      try {
        let pdf: Blob;

        switch (documentType) {
          case DocumentType.PHARMACY_PRESCRIPTION:
          case DocumentType.PATIENT_PRESCRIPTION: {
            const purposeLabel = PRESCRIPTION_PURPOSE_BY_DOCUMENT_TYPE[documentType];
            // 출력센터에서는 항상 양식지 없이 출력 (프린터 설정과 무관)
            const result = await buildPrescriptionPdf(encounterId, { useFormPaper: false, purposeLabel });
            // null: 처방 데이터 없음 → skip
            if (result === null) {
              return null;
            }
            if (typeof result === "string") {
              throw new Error("처방전 PDF 생성 결과가 문자열입니다.");
            }
            pdf = result;
            break;
          }
          case DocumentType.RECEIPT:
            pdf = await buildReceiptPdf(encounterId);
            break;
          case DocumentType.STATEMENT:
            pdf = await buildDetailedStatementPdf(encounterId);
            break;
          case DocumentType.MEDICAL_RECORD:
            pdf = await buildMedicalRecordPdfByEncounter(encounterId);
            break;
          case DocumentType.TEST_RESULT:
          case DocumentType.VISIT_CONFIRMATION:
            // 이번 구현 스펙에서 제외 - 체크박스가 readonly이므로 호출되지 않음
            throw new Error(`${documentType} PDF 생성은 현재 지원되지 않습니다.`);
          default:
            throw new Error(`지원하지 않는 문서 유형: ${documentType}`);
        }

        return pdf;
      } catch (error) {
        console.error(`[PdfCache] PDF 생성 실패: ${encounterId}-${documentType}`, error);
        throw error;
      }
    },
    [buildPrescriptionPdf, buildDetailedStatementPdf, buildReceiptPdf, buildMedicalRecordPdfByEncounter]
  );

  // ─────────────────────────────────────────────
  // processQueue: 백그라운드 큐 처리 (체크박스 선택 시 사전 생성)
  // ─────────────────────────────────────────────

  /**
   * 큐에 대기 중인 PDF 생성 작업을 순차적으로 처리합니다.
   *
   * ## 차단 조건
   * - 언마운트 상태: 더 이상 처리하지 않음
   * - isCollectingRef가 true: getSelectedPdfs가 PDF를 수집 중이므로 새로운 생성 차단
   *   (getSelectedPdfs 완료 후 processQueue가 재호출됩니다)
   */
  const processQueue = useCallback(() => {
    // 언마운트 상태에서는 큐 처리 중단
    if (!isMountedRef.current) return;

    // getSelectedPdfs 실행 중에는 새로운 생성 시작을 차단합니다.
    if (isCollectingRef.current) return;

    while (activeCountRef.current < maxConcurrent && queueRef.current.length > 0) {
      const item = queueRef.current.shift()!;
      const cacheKey = makeCacheKey(item.encounterId, item.documentType);

      // 이미 완료/스킵되었거나 생성 중인 경우 스킵
      const existing = cacheRef.current.get(cacheKey);
      const isAlreadyHandled = existing?.status === "completed" || existing?.status === "generating" || existing?.status === "skipped";
      if (isAlreadyHandled) continue;

      activeCountRef.current++;

      // Promise를 저장하여 나중에 대기할 수 있도록 함 (타임아웃 적용)
      const generationPromise = withTimeout(
        generatePdfForType(item.encounterId, item.documentType),
        PDF_GENERATION_TIMEOUT_MS,
        `PDF 생성 타임아웃: ${cacheKey}`
      );

      cacheRef.current.set(cacheKey, {
        status: "generating",
        timestamp: Date.now(),
        promise: generationPromise,
      });

      generationPromise
        .then((pdf) => {
          if (!isMountedRef.current) return;

          if (pdf === null) {
            cacheRef.current.set(cacheKey, {
              status: "skipped",
              timestamp: Date.now(),
            });
          } else {
            cacheRef.current.set(cacheKey, {
              status: "completed",
              pdf,
              timestamp: Date.now(),
            });
          }
        })
        .catch((error) => {
          if (!isMountedRef.current) return;

          cacheRef.current.set(cacheKey, {
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
            timestamp: Date.now(),
          });
          console.error(`[PdfCache] 백그라운드 생성 실패: ${cacheKey}`, error);
        })
        .finally(() => {
          activeCountRef.current--;
          // 다음 큐 아이템 처리 시도 (isCollectingRef 체크로 안전)
          processQueue();
        });
    }
  }, [generatePdfForType, maxConcurrent]);

  // ─────────────────────────────────────────────
  // requestGeneration: 체크박스 체크 시 PDF 사전 생성 요청
  // ─────────────────────────────────────────────

  const requestGeneration = useCallback(
    (encounterId: string, documentType: DocumentType) => {
      const cacheKey = makeCacheKey(encounterId, documentType);

      // 기존 디바운스 타이머 취소
      const existingTimer = debounceTimerRef.current.get(cacheKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // 디바운스 적용 - 빠른 체크/해제 반복 시 불필요한 생성 방지
      const timer = setTimeout(() => {
        // 이미 완료/스킵되었거나 생성 중인 경우 스킵
        const existing = cacheRef.current.get(cacheKey);
        const isAlreadyHandled = existing?.status === "completed" || existing?.status === "generating" || existing?.status === "skipped";
        if (isAlreadyHandled) return;

        // pending 상태로 설정하고 큐에 추가
        cacheRef.current.set(cacheKey, { status: "pending", timestamp: Date.now() });
        queueRef.current.push({ encounterId, documentType });
        processQueue();
      }, debounceMs);

      debounceTimerRef.current.set(cacheKey, timer);
    },
    [debounceMs, processQueue]
  );

  // ─────────────────────────────────────────────
  // cancelGeneration: 체크박스 해제 시 PDF 생성 취소
  // ─────────────────────────────────────────────

  const cancelGeneration = useCallback((encounterId: string, documentType: DocumentType) => {
    const cacheKey = makeCacheKey(encounterId, documentType);

    // 디바운스 타이머 취소
    const timer = debounceTimerRef.current.get(cacheKey);
    if (timer) {
      clearTimeout(timer);
      debounceTimerRef.current.delete(cacheKey);
    }

    // 큐에서 제거
    queueRef.current = queueRef.current.filter(
      (item) => !(item.encounterId === encounterId && item.documentType === documentType)
    );

    // 캐시에서 제거 (pending 상태만 - generating은 완료될 때까지 유지)
    const entry = cacheRef.current.get(cacheKey);
    if (entry?.status === "pending") {
      cacheRef.current.delete(cacheKey);
    }
    // generating 상태인 경우: 완료 후 캐시에 남지만 체크 해제되어 사용되지 않음
  }, []);

  // ─────────────────────────────────────────────
  // cancelByDocumentType: 특정 문서 타입의 모든 대기 작업 일괄 취소
  // ─────────────────────────────────────────────

  /**
   * 합본 출력 체크 시 호출: 해당 문서 타입의 모든 대기/예약 작업을 취소합니다.
   * 합본 모드에서는 개별 PDF가 필요 없으므로 불필요한 백그라운드 생성을 중단합니다.
   *
   * - 디바운스 타이머 취소
   * - 큐에서 해당 타입 제거
   * - pending 상태의 캐시 엔트리 삭제
   * - generating 상태는 완료될 때까지 유지 (사용되지 않을 뿐)
   */
  const cancelByDocumentType = useCallback((documentType: DocumentType) => {
    // 해당 타입의 디바운스 타이머 일괄 취소
    debounceTimerRef.current.forEach((timer, key) => {
      if (key.endsWith(`-${documentType}`)) {
        clearTimeout(timer);
        debounceTimerRef.current.delete(key);
      }
    });

    // 큐에서 해당 타입 제거
    queueRef.current = queueRef.current.filter(
      (item) => item.documentType !== documentType
    );

    // pending 상태의 캐시 엔트리 삭제
    cacheRef.current.forEach((entry, key) => {
      if (key.endsWith(`-${documentType}`) && entry.status === "pending") {
        cacheRef.current.delete(key);
      }
    });
  }, []);

  // ─────────────────────────────────────────────
  // getCachedPdf / getStatus: 캐시 조회
  // ─────────────────────────────────────────────

  const getCachedPdf = useCallback(
    (encounterId: string, documentType: DocumentType): Blob | null => {
      const cacheKey = makeCacheKey(encounterId, documentType);
      const entry = cacheRef.current.get(cacheKey);
      return entry?.pdf ?? null;
    },
    []
  );

  const getStatus = useCallback(
    (encounterId: string, documentType: DocumentType): CacheStatus | null => {
      const cacheKey = makeCacheKey(encounterId, documentType);
      const entry = cacheRef.current.get(cacheKey);
      return entry?.status ?? null;
    },
    []
  );

  // ─────────────────────────────────────────────
  // getSelectedPdfs: 출력 버튼 클릭 시 선택된 PDF 수집
  // ─────────────────────────────────────────────

  /**
   * 선택된 항목의 PDF를 순차적으로 수집합니다.
   *
   * ## Race Condition 방지 전략
   *
   * 1. isCollectingRef를 true로 설정하여 processQueue의 새로운 생성 시작을 차단
   * 2. 선택된 항목을 백그라운드 큐에서 일괄 제거 (중복 생성 방지)
   * 3. 현재 processQueue에서 생성 중인 작업이 있으면 완료 대기
   * 4. microtick 대기로 processQueue의 .finally() 콜백 실행을 보장
   * 5. 이후 모든 미완료 항목을 generatePdfForType으로 직접 순차 생성
   *    - processQueue/activeCount를 거치지 않으므로 간섭 불가
   * 6. 수집 완료 후 isCollectingRef를 해제하고 processQueue 재개
   */
  const getSelectedPdfs = useCallback(
    async (
      selections: Array<{ encounterId: string; documentType: DocumentType }>,
      onProgress?: (current: number, total: number) => void
    ): Promise<Blob[]> => {
      // ── Step 1: processQueue 차단 ──
      isCollectingRef.current = true;

      try {
        // ── Step 2: 선택된 항목을 백그라운드 큐에서 일괄 제거 ──
        const selectedKeySet = new Set(
          selections.map(({ encounterId, documentType }) =>
            makeCacheKey(encounterId, documentType)
          )
        );
        queueRef.current = queueRef.current.filter(
          (item) => !selectedKeySet.has(makeCacheKey(item.encounterId, item.documentType))
        );

        // ── Step 3: 현재 진행 중인 백그라운드 생성 완료 대기 ──
        const generatingEntries = Array.from(cacheRef.current.entries())
          .filter(([, entry]) => entry.status === "generating" && entry.promise);

        if (generatingEntries.length > 0) {
          await Promise.allSettled(
            generatingEntries.map(([, entry]) => entry.promise)
          );
        }

        // ── Step 4: microtick 대기 ──
        await Promise.resolve();

        // ── Step 5: 순차적으로 PDF 수집/생성 ──

        /**
         * PDF를 직접 생성하고 캐시에 저장하는 헬퍼.
         * processQueue를 거치지 않고 generatePdfForType을 직접 호출합니다.
         */
        const generateAndCache = async (
          encounterId: string,
          documentType: DocumentType,
          cacheKey: string
        ): Promise<Blob | null> => {
          try {
            const pdf = await withTimeout(
              generatePdfForType(encounterId, documentType),
              PDF_GENERATION_TIMEOUT_MS,
              `PDF 생성 타임아웃: ${cacheKey}`
            );

            if (pdf === null) {
              cacheRef.current.set(cacheKey, {
                status: "skipped",
                timestamp: Date.now(),
              });
              return null;
            }

            cacheRef.current.set(cacheKey, {
              status: "completed",
              pdf,
              timestamp: Date.now(),
            });

            return pdf;
          } catch (error) {
            cacheRef.current.set(cacheKey, {
              status: "error",
              error: error instanceof Error ? error : new Error(String(error)),
              timestamp: Date.now(),
            });
            console.error(`[PdfCache] 직접 생성 실패: ${cacheKey}`, error);
            throw error;
          }
        };

        const pdfs: Blob[] = [];
        let completedCount = 0;

        for (const { encounterId, documentType } of selections) {
          const cacheKey = makeCacheKey(encounterId, documentType);
          const entry = cacheRef.current.get(cacheKey);

          if (entry?.status === "skipped") {
            completedCount++;
            onProgress?.(completedCount, selections.length);
            continue;
          } else if (entry?.status === "completed" && entry.pdf) {
            pdfs.push(entry.pdf);
            completedCount++;
            onProgress?.(completedCount, selections.length);
          } else if (entry?.status === "generating" && entry.promise) {
            try {
              const pdf = await entry.promise;
              if (pdf !== null) {
                pdfs.push(pdf);
              }
              completedCount++;
              onProgress?.(completedCount, selections.length);
            } catch (error) {
              console.error(`[PdfCache] 대기 중 오류, 재생성 시도: ${cacheKey}`, error);
              const pdf = await generateAndCache(encounterId, documentType, cacheKey);
              if (pdf !== null) {
                pdfs.push(pdf);
              }
              completedCount++;
              onProgress?.(completedCount, selections.length);
            }
          } else if (entry?.status === "error") {
            const pdf = await generateAndCache(encounterId, documentType, cacheKey);
            if (pdf !== null) {
              pdfs.push(pdf);
            }
            completedCount++;
            onProgress?.(completedCount, selections.length);
          } else {
            const pdf = await generateAndCache(encounterId, documentType, cacheKey);
            if (pdf !== null) {
              pdfs.push(pdf);
            }
            completedCount++;
            onProgress?.(completedCount, selections.length);
          }
        }

        return pdfs;
      } finally {
        // ── Step 6: processQueue 차단 해제 및 재개 ──
        isCollectingRef.current = false;
        processQueue();
      }
    },
    [generatePdfForType, processQueue]
  );

  // ─────────────────────────────────────────────
  // pauseQueue / resumeQueue: 외부에서 processQueue를 제어
  // ─────────────────────────────────────────────

  /**
   * processQueue를 차단하고 진행 중인 백그라운드 생성이 완료될 때까지 대기합니다.
   *
   * 합본 PDF 생성 전 호출하여, buildCombinedXxxPdf가 generateReceptionPdf를
   * 사용하는 동안 processQueue가 동시에 generateReceptionPdf를 호출하는
   * Race Condition을 방지합니다.
   *
   * 반드시 작업 완료 후 resumeQueue()를 호출하여 차단을 해제해야 합니다.
   */
  const pauseQueue = useCallback(async () => {
    isCollectingRef.current = true;

    // 현재 generating 상태인 작업이 완료될 때까지 대기
    const generatingEntries = Array.from(cacheRef.current.entries())
      .filter(([, entry]) => entry.status === "generating" && entry.promise);

    if (generatingEntries.length > 0) {
      await Promise.allSettled(
        generatingEntries.map(([, entry]) => entry.promise)
      );
    }

    // microtick 대기: processQueue의 .finally() 콜백이 실행되어 activeCountRef가 감소하도록 보장
    await Promise.resolve();
  }, []);

  /**
   * pauseQueue로 차단된 processQueue를 재개합니다.
   * 이미 해제 상태여도 안전하게 호출할 수 있습니다 (idempotent).
   */
  const resumeQueue = useCallback(() => {
    if (!isCollectingRef.current) return; // 이미 해제 상태
    isCollectingRef.current = false;
    processQueue();
  }, [processQueue]);

  // 캐시 초기화
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    queueRef.current = [];
    debounceTimerRef.current.forEach((timer) => clearTimeout(timer));
    debounceTimerRef.current.clear();
  }, []);

  // 언마운트 시 정리
  useEffect(function cleanupOnUnmount() {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // 타이머 정리
      debounceTimerRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimerRef.current.clear();

      // 캐시 초기화
      cacheRef.current.clear();

      // 큐 초기화
      queueRef.current = [];
    };
  }, []);

  return {
    requestGeneration,
    cancelGeneration,
    cancelByDocumentType,
    getCachedPdf,
    getStatus,
    getSelectedPdfs,
    pauseQueue,
    resumeQueue,
    clearCache,
  };
}
