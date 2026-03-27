# 출력센터 PDF 속도 최적화 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 출력센터 PDF 생성 속도를 1건당 ~2.2초 → ~1.2초로 단축하고, 프로그레스 UI로 체감 속도를 추가 개선한다.

**Architecture:** 기존 직렬 파이프라인(maxConcurrent=1) 구조를 유지하면서, pixelRatio/captureDelay/debounce 튜닝으로 실제 속도를 줄이고, onProgress 콜백 + 버튼 진행률 표시로 UX를 개선한다.

**Tech Stack:** React 19, TypeScript, html-to-image(toJpeg), jsPDF, pdf-lib

**설계 문서:** `docs/plans/2026-02-24-print-center-speed-optimization-design.md`

---

### Task 1: pixelRatio 및 CAPTURE_DELAY 튜닝

**Files:**
- Modify: `src/hooks/document/use-reception-print-generator.tsx:11` (CAPTURE_DELAY_MS)
- Modify: `src/hooks/document/use-reception-print-generator.tsx:145` (pixelRatio)

**Step 1: CAPTURE_DELAY_MS 1000 → 500 변경**

```typescript
// src/hooks/document/use-reception-print-generator.tsx:11
// Before:
const CAPTURE_DELAY_MS = 1000;
// After:
const CAPTURE_DELAY_MS = 500;
```

**Step 2: pixelRatio 3 → 2 변경**

```typescript
// src/hooks/document/use-reception-print-generator.tsx:145
// Before:
pixelRatio: 3,
// After:
pixelRatio: 2,
```

**Step 3: 빌드 확인**

Run: `pnpm run check-types`
Expected: 타입 에러 없음

**Step 4: 커밋**

```bash
git add src/hooks/document/use-reception-print-generator.tsx
git commit -m "perf: 출력센터 PDF 캡처 속도 최적화 (pixelRatio 3→2, captureDelay 1000→500)"
```

---

### Task 2: debounceMs 300 → 100 변경

**Files:**
- Modify: `src/hooks/document/use-print-center-pdf-cache.ts:119` (debounceMs 기본값)

**Step 1: debounceMs 기본값 변경**

```typescript
// src/hooks/document/use-print-center-pdf-cache.ts:119
// Before:
const { maxConcurrent = 1, debounceMs = 300 } = options ?? {};
// After:
const { maxConcurrent = 1, debounceMs = 100 } = options ?? {};
```

**Step 2: 빌드 확인**

Run: `pnpm run check-types`
Expected: 타입 에러 없음

**Step 3: 커밋**

```bash
git add src/hooks/document/use-print-center-pdf-cache.ts
git commit -m "perf: 출력센터 PDF 사전생성 디바운스 300→100ms 단축"
```

---

### Task 3: getSelectedPdfs에 onProgress 콜백 추가

**Files:**
- Modify: `src/hooks/document/use-print-center-pdf-cache.ts:54-66` (반환 타입)
- Modify: `src/hooks/document/use-print-center-pdf-cache.ts:449-616` (getSelectedPdfs 구현)

**Step 1: UsePrintCenterPdfCacheReturn 타입에 onProgress 시그니처 추가**

```typescript
// src/hooks/document/use-print-center-pdf-cache.ts:60-62
// Before:
  getSelectedPdfs: (
    selections: Array<{ encounterId: string; documentType: DocumentType }>
  ) => Promise<Blob[]>;
// After:
  getSelectedPdfs: (
    selections: Array<{ encounterId: string; documentType: DocumentType }>,
    onProgress?: (current: number, total: number) => void
  ) => Promise<Blob[]>;
```

**Step 2: getSelectedPdfs 함수 시그니처에 onProgress 파라미터 추가**

```typescript
// src/hooks/document/use-print-center-pdf-cache.ts:449-452
// Before:
  const getSelectedPdfs = useCallback(
    async (
      selections: Array<{ encounterId: string; documentType: DocumentType }>
    ): Promise<Blob[]> => {
// After:
  const getSelectedPdfs = useCallback(
    async (
      selections: Array<{ encounterId: string; documentType: DocumentType }>,
      onProgress?: (current: number, total: number) => void
    ): Promise<Blob[]> => {
```

**Step 3: for 루프 내부에서 PDF 완료마다 onProgress 호출**

for 루프(`for (const { encounterId, documentType } of selections)`) 내부, 각 분기의 `pdfs.push(...)` 직후에 progress 콜백을 호출한다.

루프 시작 전에 카운터 변수를 추가하고, `pdfs.push` 또는 `continue`(스킵) 후마다 카운터를 증가시켜 콜백을 호출한다:

```typescript
// for 루프 바로 앞에 추가:
let completedCount = 0;

// for 루프 내부, 각 분기 끝(pdfs.push 또는 continue 직전)에 추가:
completedCount++;
onProgress?.(completedCount, selections.length);
```

구체적으로 5곳:
1. `if (entry?.status === "skipped")` 분기의 `continue` 직전
2. `else if (entry?.status === "completed" && entry.pdf)` 분기의 `pdfs.push` 직후
3. `else if (entry?.status === "generating" && entry.promise)` 분기 — try 내 `pdfs.push` 직후 + catch 내 `pdfs.push` 직후
4. `else if (entry?.status === "error")` 분기의 `pdfs.push` 직후
5. `else` (pending/캐시 없음) 분기의 `pdfs.push` 직후

**Step 4: 빌드 확인**

Run: `pnpm run check-types`
Expected: 타입 에러 없음

**Step 5: 커밋**

```bash
git add src/hooks/document/use-print-center-pdf-cache.ts
git commit -m "feat: getSelectedPdfs에 onProgress 콜백 추가"
```

---

### Task 4: print-center.tsx에 프로그레스 UI 적용

**Files:**
- Modify: `src/components/reception/(print-center)/print-center.tsx:178-181` (state 추가)
- Modify: `src/components/reception/(print-center)/print-center.tsx:511` (handlePrint 내부)
- Modify: `src/components/reception/(print-center)/print-center.tsx:573` (getSelectedPdfs 호출부)
- Modify: `src/components/reception/(print-center)/print-center.tsx:586` (병합 단계)
- Modify: `src/components/reception/(print-center)/print-center.tsx:606-608` (finally)
- Modify: `src/components/reception/(print-center)/print-center.tsx:662-668` (버튼 텍스트)

**Step 1: ProgressState 타입 및 state 추가**

`isPrinting` state 선언 바로 아래(line 181 부근)에 추가:

```typescript
type PrintProgress = {
  current: number;
  total: number;
  phase: 'generating' | 'merging';
};

// 기존 isPrinting state 아래에 추가
const [printProgress, setPrintProgress] = useState<PrintProgress | null>(null);
```

NOTE: `type PrintProgress`는 컴포넌트 함수 밖, 파일 상단의 타입 정의 영역(line 34~44 부근)에 위치시킨다.

**Step 2: handlePrint 내부에서 progress 관리**

`setIsPrinting(true)` (line 511) 직후에 total 계산 및 초기 progress 설정:

```typescript
setIsPrinting(true);

// 합본 대상은 개별 progress에서 제외하므로 나중에 다시 계산함
// 일단 전체 선택 수로 시작
setPrintProgress({ current: 0, total: allSelections.length, phase: 'generating' });
```

합본/개별 분리 후, `individualSelections`가 확정된 시점(line 562 직후)에서 total을 재계산:

```typescript
// 합본 건수 + 개별 건수로 total 재계산
const combinedCount = (hasCombinedReceipt ? 1 : 0) + (hasCombinedStatement ? 1 : 0);
const totalCount = combinedCount + individualSelections.length;
let progressCount = 0;
```

합본 PDF 각각 완료 직후(`console.log("[PrintCenter] 합본 영수증 생성 완료")` 등) progress 업데이트:

```typescript
progressCount++;
setPrintProgress({ current: progressCount, total: totalCount, phase: 'generating' });
```

`getSelectedPdfs` 호출부(line 573)에 onProgress 콜백 전달:

```typescript
// Before:
individualPdfs = await getSelectedPdfs(individualSelections);
// After:
individualPdfs = await getSelectedPdfs(individualSelections, (current) => {
  setPrintProgress({ current: progressCount + current, total: totalCount, phase: 'generating' });
});
```

`mergePdfs` 호출 직전(line 586)에 phase 변경:

```typescript
setPrintProgress((prev) => prev ? { ...prev, phase: 'merging' } : null);
const mergedPdf = await mergePdfs(allPdfs);
```

`finally` 블록(line 606-608)에서 progress 초기화:

```typescript
} finally {
  resumeQueue();
  setIsPrinting(false);
  setPrintProgress(null);  // 추가
}
```

**Step 3: 버튼 텍스트를 progress 기반으로 변경**

```typescript
// src/components/reception/(print-center)/print-center.tsx:662-668
// Before:
<MyButton
  onClick={handlePrint}
  disabled={isPrinting}
  className="w-16 h-8"
>
  {isPrinting ? "처리중..." : "출력"}
</MyButton>

// After:
<MyButton
  onClick={handlePrint}
  disabled={isPrinting}
  className="min-w-16 h-8"
>
  {printProgress
    ? printProgress.phase === 'merging'
      ? '병합 중...'
      : `${printProgress.current}/${printProgress.total} 생성 중...`
    : '출력'}
</MyButton>
```

NOTE: `className="w-16"` → `"min-w-16"`로 변경. "1/3 생성 중..." 텍스트가 고정 64px에 들어가지 않으므로 최소 너비로 전환한다.

**Step 4: handlePrint의 useCallback deps에 setPrintProgress는 React setState이므로 추가 불필요 확인**

React의 `useState` setter는 stable reference이므로 deps 배열에 추가할 필요 없다. 기존 deps 유지.

**Step 5: 빌드 확인**

Run: `pnpm run check-types`
Expected: 타입 에러 없음

**Step 6: 커밋**

```bash
git add src/components/reception/(print-center)/print-center.tsx
git commit -m "feat: 출력센터 PDF 생성 프로그레스 UI 추가"
```

---

### Task 5: 수동 테스트 및 최종 검증

**Step 1: 개발 서버 실행**

Run: `pnpm run dev`

**Step 2: 테스트 시나리오**

1. 접수 화면에서 환자 선택 → 출력센터 열기
2. 1건 체크 → 출력 버튼 클릭 → 프린트 팝업이 기존보다 빠르게 뜨는지 확인
3. 3건 체크 → 출력 버튼 클릭 → "1/3 생성 중..." → "2/3 생성 중..." → "병합 중..." → 팝업 확인
4. 합본 영수증 체크 + 개별 처방전 체크 → 혼합 출력 → progress 카운트 정상 확인
5. PDF 품질 확인: pixelRatio 2에서 텍스트가 읽기 좋은지 확인
6. 다페이지 서식(진료기록사본 등) → CAPTURE_DELAY 500ms에서 페이지 누락 없는지 확인

**Step 3: 문제 발견 시 조정**

- 페이지 누락 발생 시: `CAPTURE_DELAY_MS`를 600~700으로 상향
- 품질 불만족 시: `pixelRatio`를 2.5로 상향

**Step 4: 최종 커밋 (조정 사항 있을 경우)**

```bash
git add -A
git commit -m "fix: 출력센터 PDF 속도 최적화 미세 조정"
```
