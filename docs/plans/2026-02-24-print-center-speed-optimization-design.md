# 출력센터 PDF 생성 속도 최적화 설계

**날짜**: 2026-02-24
**상태**: 승인됨
**접근법**: A (튜닝 + UX 개선)

## 배경

출력센터(`print-center.tsx`)에서 여러 서식을 체크하여 PDF 생성 시 속도가 느림.
추후 서버 사이드 PDF 생성으로 전환 예정이므로 최소한의 노력으로 개선한다.

### 현재 병목 분석

1건 PDF 생성 시간: ~2.0~2.5초 (직렬)

| 단계 | 소요시간 | 비고 |
|------|----------|------|
| 디바운스 | 300ms | 체크 후 사전생성 시작 지연 |
| API 호출 | 200~500ms | encounter 데이터 fetch |
| CAPTURE_DELAY | 1000ms | PrintableDocument 페이지네이션 대기 (고정) |
| toJpeg 캡처 | 400~800ms | pixelRatio=3, CPU 바운드 |

3건 선택 시 ~6.6초, "처리중..." 텍스트만 표시되어 체감이 나쁨.

### 제약 조건

- `maxConcurrent=1`: HiddenRenderer가 1개이므로 직렬 생성 필수
- JS 싱글스레드: toJpeg은 메인 스레드에서 실행
- 추후 서버 전환 예정: 큰 리팩토링 불가

## 변경 사항

### 1. pixelRatio 3 → 2

**파일**: `src/hooks/document/use-reception-print-generator.tsx:145`

288dpi → 192dpi. 일반 프린터 출력에 충분한 품질.
캔버스 크기가 9배(3x3) → 4배(2x2)로 줄어 캡처 시간 ~40% 단축.

### 2. CAPTURE_DELAY_MS 1000 → 500ms

**파일**: `src/hooks/document/use-reception-print-generator.tsx:11`

PrintableDocument 페이지네이션은 대부분 200~300ms 내 완료.
500ms는 충분한 안전 마진.

### 3. debounceMs 300 → 100ms

**파일**: `src/hooks/document/use-print-center-pdf-cache.ts` (호출 시 옵션 또는 기본값)

체크박스 → 백그라운드 PDF 생성 시작까지의 지연 축소.

### 4. getSelectedPdfs에 onProgress 콜백 추가

**파일**: `src/hooks/document/use-print-center-pdf-cache.ts`

```typescript
getSelectedPdfs: (
  selections: Array<{ encounterId: string; documentType: DocumentType }>,
  onProgress?: (current: number, total: number) => void
) => Promise<Blob[]>;
```

내부 for 루프에서 PDF 하나 완료마다 콜백 호출.

### 5. 출력 버튼 진행률 표시

**파일**: `src/components/reception/(print-center)/print-center.tsx`

```typescript
type ProgressState = {
  current: number;
  total: number;
  phase: 'generating' | 'merging';
} | null;
```

버튼 텍스트: `"1/3 생성 중..."` → `"2/3 생성 중..."` → `"병합 중..."` → 팝업

## 변경하지 않는 것

- `maxConcurrent=1` 구조 (HiddenRenderer 병렬화 안 함)
- API prefetch (불필요한 서버 부하, 이미 체크 시 사전생성이 prefetch 역할)
- 합본 로직, 캐시 구조, Race Condition 방어 등 기존 아키텍처

## 예상 결과

| 지표 | Before | After |
|------|--------|-------|
| 1건 PDF 생성 | ~2.2초 | ~1.2초 |
| 3건 직렬 생성 | ~6.6초 | ~3.6초 |
| 사용자 피드백 | "처리중..." 고정 | "1/3 생성 중..." 실시간 |
| 체감 | 멈춘 것 같은 느낌 | 진행 확인 가능 |

## 리스크

- **CAPTURE_DELAY 500ms**: 복잡한 서식(다페이지)에서 페이지네이션이 500ms 안에 완료되지 않을 가능성. 실제 테스트로 확인 필요. 문제 시 600~700ms로 조정.
- **pixelRatio 2**: 고밀도 텍스트 서류에서 시각적 차이 확인 필요. 문제 시 2.5로 타협 가능.
