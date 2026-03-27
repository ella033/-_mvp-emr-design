# 출력센터 (Print Center) 아키텍처 문서

## 개요

출력센터는 환자의 내원 기록에 대해 다양한 문서(처방전, 영수증, 진료비내역서 등)를 선택하여 PDF로 생성하고 출력하는 기능을 제공합니다.

### 주요 특징
- **백그라운드 사전 생성**: 체크박스 선택 시 즉시 PDF 생성 시작
- **캐싱**: 생성된 PDF를 메모리에 캐시하여 재사용
- **순차 생성**: 한 번에 1개의 PDF만 생성 (useReceptionPrintGenerator 제약)
- **디바운싱**: 빠른 체크박스 토글 시 불필요한 생성 방지 (300ms)
- **타임아웃**: PDF 생성 시작 시점부터 30초 초과 시 에러 처리

### 동시성 제어 (Race Condition 방지)
- **isCollectingRef 플래그**: `getSelectedPdfs` 실행 중 `processQueue`의 새로운 생성 시작을 차단
- **generationMutexRef**: `useReceptionPrintGenerator`에서 Promise 기반 mutex로 동시 호출 직렬화
- **captureTimerRef**: 이전 DOM 캡처 setTimeout을 추적하여 새 생성 시 취소

---

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PrintCenter Component                            │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │   MyGrid        │  │  checkboxState   │  │  ReceptionHiddenRenderer    │ │
│  │  (체크박스 UI)   │  │  (Map 상태관리)   │  │  (숨김 렌더러 - 필수 마운트) │ │
│  └────────┬────────┘  └────────┬─────────┘  └─────────────────────────────┘ │
│           │ onChange            │                                            │
│           ▼                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      handleDataChange                                 │   │
│  │  1. checkboxState 업데이트                                            │   │
│  │  2. requestGeneration() 또는 cancelGeneration() 호출                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       usePrintCenterPdfCache Hook                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  isCollectingRef (boolean)                                          │   │
│  │  - getSelectedPdfs 실행 중 true → processQueue 진입 차단            │   │
│  │  - getSelectedPdfs 완료 후 false → processQueue 재개                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [경로 1: 백그라운드 사전 생성]                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  requestGeneration(encounterId, documentType)                       │   │
│  │  1. 300ms 디바운스 적용                                              │   │
│  │  2. 큐에 추가 (status: "pending")                                   │   │
│  │  3. processQueue() 호출                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                    │                                                        │
│                    ▼                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  processQueue()                                                      │   │
│  │  - ⚠️ isCollectingRef가 true이면 즉시 return (차단)                  │   │
│  │  - 순차 생성 (maxConcurrent: 1)                                     │   │
│  │  - 큐에서 아이템 꺼내 generatePdfForType() 호출                      │   │
│  │  - 30초 타임아웃 적용                                                │   │
│  │  - .finally()에서 activeCount-- 후 processQueue() 재호출             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [경로 2: 출력 시 PDF 수집]                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  getSelectedPdfs(selections) - 6단계 순차 수집                       │   │
│  │  1. isCollectingRef = true (processQueue 차단)                       │   │
│  │  2. 선택 항목을 백그라운드 큐에서 일괄 제거                           │   │
│  │  3. 진행 중인 백그라운드 생성 완료 대기                               │   │
│  │  4. microtick 대기 (.finally() 콜백 실행 보장)                       │   │
│  │  5. 각 항목 순차 처리 (generatePdfForType 직접 호출)                  │   │
│  │  6. isCollectingRef = false + processQueue() 재개                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [공통]                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  generatePdfForType(encounterId, documentType)                       │   │
│  │  - DocumentType에 따라 적절한 build*Pdf 함수 호출                    │   │
│  │  - 생성 완료 시 캐시에 저장 (status: "completed")                    │   │
│  │  - 실패 시 캐시에 저장 (status: "error")                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  cacheRef (Map<string, CacheEntry>)                                  │   │
│  │  - key: "{encounterId}-{documentType}"                              │   │
│  │  - value: { status, pdf?, error?, timestamp, promise? }             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          usePrintService Hook                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  buildPrescriptionPdf(encounterId)                                   │   │
│  │  buildReceiptPdf(encounterId)                                        │   │
│  │  buildDetailedStatementPdf(encounterId)                              │   │
│  │  buildMedicalRecordPdfByEncounter(encounterId)                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  각 함수는:                                                                 │
│  1. API에서 데이터 조회 (DocumentsService, EncountersService)              │
│  2. React 컴포넌트 렌더링 (Receipt, MedicalExpense 등)                     │
│  3. generateReceptionPdf() 호출                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     useReceptionPrintGenerator Hook                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  generatePdf(reactNode) - 외부 인터페이스                            │   │
│  │  1. generationMutexRef를 통한 직렬화 (이전 작업 완료 대기)           │   │
│  │  2. generatePdfInternal() 호출                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  generatePdfInternal(reactNode) - 내부 생성 로직                     │   │
│  │  1. captureTimerRef로 이전 캡처 setTimeout 취소                      │   │
│  │  2. 이전 작업이 있으면 reject로 깨끗하게 정리                        │   │
│  │  3. Promise 생성 (resolve/reject ref 저장)                           │   │
│  │  4. setRenderTask(content) → HiddenRenderer 트리거                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  HiddenRenderer (숨김 div)                                           │   │
│  │  - position: fixed, left: -10000px (화면 밖)                         │   │
│  │  - React 컴포넌트를 실제 DOM으로 렌더링                               │   │
│  │  - handleCapture (ref 콜백)                                          │   │
│  │    - setTimeout ID를 captureTimerRef에 저장                          │   │
│  │    - 1초 대기 후 DOM 캡처                                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  createPdfBlobFromDom()                                              │   │
│  │  - DOM 요소를 이미지로 캡처                                          │   │
│  │  - 이미지를 PDF로 변환                                               │   │
│  │  - Blob 반환                                                         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 파일 구조

```
src/
├── components/reception/(print-center)/
│   ├── print-center.tsx          # 메인 UI 컴포넌트
│   └── docs/
│       └── print-center-architecture.md  # 이 문서
├── hooks/document/
│   ├── use-print-service.tsx     # PDF 생성 서비스 훅
│   ├── use-print-center-pdf-cache.ts  # PDF 캐시 관리 훅
│   └── use-reception-print-generator.tsx  # DOM→PDF 변환 훅
├── lib/pdf/
│   ├── merge-pdfs.ts             # PDF 병합 유틸리티
│   └── client-pdf-generator.ts   # DOM→PDF 변환 라이브러리
├── services/
│   └── documents-service.ts      # 문서 API 서비스
└── store/
    └── print-popup-store.ts      # 출력 팝업 상태 관리
```

---

## 상세 플로우

### 1. 체크박스 클릭 시 (사전 생성)

```
사용자 체크박스 클릭
       │
       ▼
handleDataChange(rowKey, columnKey, value)
       │
       ├─► setCheckboxState() - UI 상태 업데이트
       │
       ▼
requestGeneration(encounterId, documentType)
       │
       ▼
디바운스 타이머 설정 (300ms)
       │
       ▼ (300ms 후)
캐시에 status: "pending" 설정 + 큐에 작업 추가 + processQueue()
       │
       ▼
isCollectingRef 확인
       │
       ├─► true: 즉시 return (getSelectedPdfs가 수집 중이므로 차단)
       │
       ▼
activeCount < maxConcurrent(1) 확인
       │
       ├─► YES: status: "generating" 설정 + generatePdfForType() 호출 (30초 타임아웃)
       │         │
       │         ▼
       │   build*Pdf() → API 데이터 조회
       │         │
       │         ▼
       │   generateReceptionPdf() → mutex 직렬화 → DOM 렌더링
       │         │
       │         ▼
       │   createPdfBlobFromDom() → PDF Blob 생성
       │         │
       │         ▼
       │   캐시에 저장 (status: "completed") + .finally() → processQueue()
       │
       └─► NO: 큐에서 대기 (status: "pending" 유지)
```

### 2. 출력 버튼 클릭 시

```
사용자 "출력" 버튼 클릭
       │
       ▼
handlePrint() - setIsPrinting(true) → 버튼 "처리중..." 표시
       │
       ▼
checkboxState에서 선택된 항목 수집
       │
       ▼
getSelectedPdfs(selections) - 6단계 순차 수집
       │
       │ Step 1: isCollectingRef = true (processQueue 차단)
       │ Step 2: 선택 항목을 백그라운드 큐에서 일괄 제거
       │ Step 3: 진행 중인 generating 작업 완료 대기
       │ Step 4: microtick 대기 (.finally() 실행 보장)
       │
       │ Step 5: 각 항목 순차 처리 ─┐
       │                            │
       │   ├─► completed → 캐시에서 즉시 반환
       │   ├─► generating → Promise 대기
       │   ├─► error → generatePdfForType 직접 호출로 재시도
       │   └─► pending/없음 → generatePdfForType 직접 호출로 생성
       │                            │
       │ Step 6: isCollectingRef = false + processQueue() 재개
       │
       ▼
mergePdfs(pdfs) - pdf-lib 사용하여 여러 PDF를 하나로 병합
       │
       ▼
openPrintPopup({ generatePdf: async () => mergedPdf })
       │
       ▼
setIsPrinting(false) → 버튼 "출력" 복구
       │
       ▼
출력 팝업 표시 (미리보기 + 인쇄)
```

---

## 동시성 제어 상세

### Race Condition 방지 구조 (2계층)

```
┌─────────────────────────────────────────────────────────────────┐
│  계층 1: usePrintCenterPdfCache (근본 방지)                     │
│                                                                  │
│  processQueue (백그라운드)    getSelectedPdfs (출력 시)          │
│       │                           │                              │
│       │  isCollectingRef 확인     │  isCollectingRef = true      │
│       │  true → 즉시 return      │  (processQueue 차단)         │
│       │  false → 생성 시작        │                              │
│       │                           │  선택 항목 큐에서 제거        │
│       │                           │  generating 대기              │
│       │                           │  microtick 대기               │
│       │                           │  generatePdfForType 직접 호출 │
│       │                           │  (activeCount 미사용)         │
│       │                           │                              │
│       │                           │  isCollectingRef = false     │
│       │  ◄── processQueue() ─────│  (차단 해제 + 재개)           │
│       │                           │                              │
│  ※ 두 경로가 동시에 generatePdfForType을 호출하지 않음          │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  계층 2: useReceptionPrintGenerator (방어적 직렬화)             │
│                                                                  │
│  generatePdf(content)                                           │
│       │                                                          │
│       ▼                                                          │
│  generationMutexRef를 통한 직렬화                                │
│  (이전 작업 완료/실패 후 다음 작업 시작)                         │
│       │                                                          │
│       ▼                                                          │
│  generatePdfInternal(content)                                    │
│  1. captureTimerRef로 이전 setTimeout 취소                       │
│  2. 이전 작업 있으면 reject로 정리                               │
│  3. 새 렌더 태스크 설정                                          │
│                                                                  │
│  ※ 계층 1에서 이미 순차 보장하지만, 이 계층에서 한 번 더 보호    │
│  ※ (Defense in Depth)                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 기존 문제 (수정 전)

`getSelectedPdfs`가 `generatePdfImmediate`를 호출할 때:

1. `waitForActiveGeneration()`으로 진행 중인 생성 완료 대기
2. 완료 → processQueue의 `.finally()`가 큐에서 다른 항목 시작
3. `waitForActiveGeneration()` 반환 후 `generatePdfImmediate`도 생성 시작
4. **두 개의 생성이 동시에 `generateReceptionPdf` 호출**
5. 두 번째 호출이 `renderTask`/`resolveRef`를 덮어쓰기
6. `handleCapture`의 setTimeout이 잘못된 Promise에 결과 전달
7. **결과: 서로 다른 encounter인데 같은 내용의 PDF 생성**

### 수정 후 보장 사항

- `processQueue`와 `getSelectedPdfs`가 동시에 `generatePdfForType`을 호출하지 않음
- `getSelectedPdfs`는 processQueue를 차단한 후 직접 `generatePdfForType`을 호출
- `useReceptionPrintGenerator`는 mutex로 동시 호출을 직렬화 (방어)
- 이전 캡처 타이머는 새 생성 시 명시적으로 취소

---

## 캐시 상태 흐름

```
┌─────────────┐     requestGeneration()     ┌─────────────┐
│   (없음)     │ ─────────────────────────► │   pending   │
└─────────────┘                             └──────┬──────┘
                                                   │
                        processQueue() 또는        │
                        getSelectedPdfs()에서       │
                        generatePdfForType 직접 호출│
                                                   ▼
                                            ┌─────────────┐
                                            │  generating │
                                            └──────┬──────┘
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                        │                          │                          │
                        ▼                          ▼                          ▼
                 ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
                 │  completed  │           │    error    │           │  (타임아웃)  │
                 │  (성공)      │           │  (실패)      │           │  → error    │
                 └─────────────┘           └─────────────┘           └─────────────┘
```

---

## 주요 컴포넌트 설명

### PrintCenter (`print-center.tsx`)

메인 UI 컴포넌트로, 다음 기능을 담당합니다:

- **날짜 범위 선택**: 조회할 내원 기록의 기간 설정
- **그리드 표시**: 내원 기록별 문서 체크박스 표시
- **체크박스 상태 관리**: `Map<receptionId, Map<DocumentType, boolean>>`
- **출력 버튼**: 선택된 문서 PDF 생성 및 출력
- **HiddenRenderer 마운트**: PDF 생성을 위해 필수

```typescript
// 문서 유형
enum DocumentType {
  PHARMACY_PRESCRIPTION = "pharmacyPrescription",  // 약국용 처방전
  PATIENT_PRESCRIPTION = "patientPrescription",    // 환자용 처방전
  RECEIPT = "receipt",                              // 영수증
  STATEMENT = "statement",                          // 진료비내역서
  MEDICAL_RECORD = "medicalRecord",                // 진료기록사본
  TEST_RESULT = "testResult",                      // 검사결과 (미구현)
  VISIT_CONFIRMATION = "visitConfirmation",        // 통원확인서 (미구현)
}
```

### usePrintCenterPdfCache (`use-print-center-pdf-cache.ts`)

PDF 캐시 및 생성 큐를 관리하는 훅입니다:

```typescript
interface UsePrintCenterPdfCacheReturn {
  requestGeneration: (encounterId, documentType) => void;       // 생성 요청
  cancelGeneration: (encounterId, documentType) => void;        // 생성 취소
  getCachedPdf: (encounterId, documentType) => Blob | null;     // 캐시 조회
  getStatus: (encounterId, documentType) => CacheStatus | null; // 상태 조회
  getSelectedPdfs: (selections) => Promise<Blob[]>;             // 선택된 PDF 수집
  clearCache: () => void;                                       // 캐시 초기화
}

// 캐시 상태
type CacheStatus = "pending" | "generating" | "completed" | "error";
```

**설정 옵션**:
- `maxConcurrent`: 동시 생성 제한 (기본: 1, useReceptionPrintGenerator 제약으로 1 필수)
- `debounceMs`: 디바운스 시간 (기본: 300ms)

**내부 Refs**:
- `cacheRef`: PDF 캐시 맵
- `queueRef`: 백그라운드 생성 대기 큐
- `activeCountRef`: 현재 processQueue에서 생성 중인 작업 수
- `isCollectingRef`: getSelectedPdfs 실행 중 processQueue 차단 플래그
- `debounceTimerRef`: 디바운스 타이머 맵

**핵심 동작**:
- `processQueue`: 체크박스 선택 시 백그라운드 사전 생성 (isCollectingRef가 true이면 차단)
- `getSelectedPdfs`: 출력 시 isCollectingRef로 processQueue를 차단한 후, generatePdfForType을 직접 호출하여 순차 생성

### usePrintService (`use-print-service.tsx`)

각 문서 유형별 PDF 생성 함수를 제공합니다:

| 함수 | 문서 유형 | API 엔드포인트 |
|------|----------|---------------|
| `buildPrescriptionPdf` | 처방전 | `/documents/encounters/{id}/external-prescription` |
| `buildReceiptPdf` | 영수증 | `/v1/documents/encounters/{id}/medical-bill-receipt` |
| `buildDetailedStatementPdf` | 진료비내역서 | `/v1/documents/encounters/{id}/detailed-statement` |
| `buildMedicalRecordPdfByEncounter` | 진료기록사본 | `/encounters/{id}` |

**중요**: 이 훅의 함수들은 `PrintCenter`에서 호출한 `usePrintService` 인스턴스와 동일해야 함.
`usePrintCenterPdfCache`는 이 함수들을 파라미터로 받아서 사용.

### useReceptionPrintGenerator (`use-reception-print-generator.tsx`)

React 컴포넌트를 PDF로 변환하는 핵심 훅입니다:

1. `generatePdf(reactNode)` 호출 (외부 인터페이스)
2. `generationMutexRef`를 통한 직렬화 (이전 작업 완료 대기)
3. `generatePdfInternal()` 호출:
   - `captureTimerRef`로 이전 캡처 setTimeout 취소
   - 이전 작업 있으면 reject로 정리
   - `renderTask` 상태 설정 → `HiddenRenderer` 트리거
4. `HiddenRenderer`가 DOM에 컴포넌트 렌더링
5. `handleCapture`: setTimeout ID를 `captureTimerRef`에 저장, 1초 대기 후 DOM 캡처
6. Promise resolve로 Blob 반환

**내부 보호 메커니즘**:
- `generationMutexRef`: Promise 기반 mutex로 동시 호출 직렬화
- `captureTimerRef`: 이전 캡처 setTimeout 추적 및 취소
- 이전 작업 reject: 이전 Promise를 reject하여 미결 상태 방지

**제약사항**:
- `HiddenRenderer`가 컴포넌트 트리에 **반드시 마운트**되어 있어야 함
- 내부적으로 직렬화하지만, 호출 측에서도 순차 호출을 보장하는 것이 권장됨

---

## 체크박스 활성화 조건

| 조건 | 처방전 | 영수증 | 진료비내역서 | 진료기록사본 | 검사결과 | 통원확인서 |
|------|--------|--------|-------------|-------------|---------|-----------|
| encounterId 존재 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| hasReceipt = true | - | ✓ | - | - | - | - |
| 구현 여부 | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## 에러 처리

### 타임아웃
- PDF 생성 시작 시점부터 30초 초과 시 에러 발생
- 백그라운드 생성과 출력 버튼 클릭 시 모두 동일한 30초 적용
- 타임아웃 시 `status: "error"` 설정, 큐 다음 아이템 처리 진행

### 생성 실패
- API 에러, 렌더링 에러 등
- 캐시에 `status: "error"` 저장
- 출력 시도 시 재생성 시도

### 선택 항목 없음
- "출력할 항목을 선택해주세요" 경고 토스트 표시

### 출력 처리 실패
- 토스트 메시지로 에러 내용 표시
- 버튼 "출력"으로 복구 (finally 블록에서 처리)

---

## 성능 최적화

### 구현된 최적화
1. **사전 생성**: 체크박스 선택 시 즉시 백그라운드 생성 시작
2. **캐싱**: 동일 문서 재요청 시 캐시에서 반환
3. **디바운싱**: 빠른 토글 시 불필요한 생성 방지 (300ms)
4. **순차 처리**: useReceptionPrintGenerator 제약으로 인해 한 번에 1개씩 생성
5. **isCollectingRef 차단**: getSelectedPdfs 실행 중 processQueue 간섭 방지

### 알려진 제한사항
1. `checkboxState` 변경 시 `gridData` 전체 재계산
2. 모든 행이 리렌더링됨 (React.memo 미적용)
3. PDF 생성이 순차적이므로 여러 개 선택 시 대기 시간 발생

---

## 디버깅

### 로그 태그
| 태그 | 위치 | 설명 |
|------|------|------|
| `[PrintCenter]` | print-center.tsx | UI 이벤트, 체크박스 변경 |
| `[PdfCache]` | use-print-center-pdf-cache.ts | 캐시 작업, 큐 처리, 수집 |
| `[PrintService]` | use-print-service.tsx | PDF 생성 함수 |
| `[ReceptionPrintGenerator]` | use-reception-print-generator.tsx | DOM 렌더링, 캡처 |
| `[MergePdfs]` | merge-pdfs.ts | PDF 병합 |

### 예시 로그 흐름 (정상 케이스 - 사전 생성)
```
[PrintCenter] 체크박스 변경: {rowKey: '670', columnKey: 'receipt', value: true}
[PrintCenter] PDF 사전 생성 요청: 381 receipt
[PdfCache] 생성 요청 (디바운스 후): 381-receipt
[PdfCache] 큐에서 처리 시작: 381-receipt
[PdfCache] PDF 생성 시작: 381-receipt
[PrintService] buildReceiptPdf 시작: 381
[PrintService] 진료비 영수증 데이터 조회 시작
[PrintService] 진료비 영수증 데이터 조회 완료: {...}
[ReceptionPrintGenerator] 렌더 태스크 설정, DOM 캡처 대기 중
[ReceptionPrintGenerator] DOM 캡처 시작
[ReceptionPrintGenerator] DOM 캡처 완료 (245.3KB)
[PrintService] buildReceiptPdf 완료: 1523ms
[PdfCache] PDF 생성 완료: 381-receipt (1523ms, 245.3KB)
[PdfCache] 캐시 저장 완료: 381-receipt
```

### 예시 로그 흐름 (출력 버튼 클릭 - getSelectedPdfs)
```
[PrintCenter] 출력 버튼 클릭
[PrintCenter] 선택된 항목: 3개 [...]
[PdfCache] 선택된 PDF 수집 시작: 3개
[PdfCache] processQueue 차단 (isCollectingRef = true)
[PdfCache] 백그라운드 큐에서 1개 항목 제거
[PdfCache] 진행 중인 백그라운드 생성 완료 대기: 1개
[PdfCache] 백그라운드 생성 완료 대기 완료
[PdfCache] 캐시에서 가져옴: 381-pharmacyPrescription
[PdfCache] 캐시에서 가져옴: 381-receipt
[PdfCache] 큐에서 대기 중, 직접 생성: 381-statement
[PdfCache] PDF 생성 시작: 381-statement
[PrintService] buildDetailedStatementPdf 시작: 381
...
[PdfCache] 직접 생성 완료, 캐시 저장: 381-statement
[PdfCache] PDF 수집 완료: 3개 (5234ms)
[PdfCache] processQueue 차단 해제 (isCollectingRef = false)
[MergePdfs] 병합 시작: 3개 PDF
[MergePdfs] 병합 완료: 총 5페이지, 1234.5KB (123ms)
[PrintCenter] 출력 처리 완료: 5500ms
```

---

## 관련 타입

```typescript
// 출력 항목
interface PrintItem {
  receptionId: string | number;
  encounterId: string;
  receptionDateTime?: string | Date;
  doctorName?: string;
  insuranceType?: string;
  hasReceipt?: boolean;
}

// 캐시 엔트리
interface CacheEntry {
  status: CacheStatus;
  pdf?: Blob;
  error?: Error;
  timestamp: number;
  promise?: Promise<Blob>;
}

// PDF 생성 함수 인터페이스
interface PrintServiceFunctions {
  buildPrescriptionPdf: (encounterId: string, options?: PrescriptionPdfOptions) => Promise<Blob | string>;
  buildDetailedStatementPdf: (encounterId: string) => Promise<Blob>;
  buildReceiptPdf: (encounterId: string) => Promise<Blob>;
  buildMedicalRecordPdfByEncounter: (encounterId: string) => Promise<Blob>;
}
```

---

## 주의사항 및 트러블슈팅

### 1. "처리중..." 버튼이 복구되지 않음
- **원인**: PDF 생성 Promise가 resolve되지 않음
- **확인**: `[PdfCache] PDF 생성 완료` 로그가 출력되는지 확인
- **해결**: `ReceptionHiddenRenderer`가 마운트되어 있는지 확인

### 2. 서로 다른 encounter인데 같은 내용의 PDF 생성 (해결됨)
- **원인**: `processQueue`의 `.finally()` → `processQueue()` 재호출이 `getSelectedPdfs`의 직접 생성과 동시에 `useReceptionPrintGenerator`를 호출하는 Race Condition
- **해결**:
  - (계층 1) `isCollectingRef` 플래그로 `getSelectedPdfs` 실행 중 `processQueue` 차단
  - (계층 2) `generationMutexRef`로 `useReceptionPrintGenerator` 동시 호출 직렬화
  - (계층 2) `captureTimerRef`로 이전 캡처 setTimeout 명시적 취소

### 3. 체크박스 연속 클릭 시 딜레이
- **원인**: `checkboxState` 변경 시 전체 그리드 리렌더링
- **해결**: 추후 React.memo 적용 또는 상태 관리 최적화 필요
