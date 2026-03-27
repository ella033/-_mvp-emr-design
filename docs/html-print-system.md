# HTML 프린트 시스템 아키텍처

## 개요

NextGen EMR의 프린트 시스템은 **PDF 모드**와 **HTML 모드** 두 가지 출력 경로를 지원한다.
HTML 모드는 기존 래스터 PDF 대신 벡터 HTML을 사용하여 텍스트 선명도와 출력 속도를 개선한다.

**핵심 구조**: React 컴포넌트를 팝업 뷰어에 직접 렌더링(미리보기) → 출력/다운로드 시에만 HTML로 직렬화 → 서버 업로드 → Agent(WebView2)가 인쇄

---

## 1. 시스템 구조

### 파일 구성

| 파일 | 역할 |
|------|------|
| `src/store/print-popup-store.ts` | 팝업 상태 관리 (Zustand) |
| `src/components/document/document-print-popup.tsx` | 프린트 팝업 UI, 뷰어, 출력/다운로드 처리 |
| `src/hooks/document/use-print-service.tsx` | 문서 데이터 fetch, React 콘텐츠 빌더, 팝업 오프너 |
| `src/hooks/document/use-reception-html-generator.tsx` | 숨김 렌더러 (non-popup 직접 출력용, 레거시) |
| `src/lib/html/serialize-dom-to-html.ts` | DOM → self-contained HTML 직렬화 |
| `src/lib/html/build-print-html-template.ts` | HTML 문서 템플릿 (CSS, @page, 폰트) |
| `src/lib/printable/PrintableDocument.tsx` | A4 페이지 자동 분할 (pagination) |

### 계층 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│  print-popup-store (Zustand)                            │
│  - config, renderContent, generatePdf, callbacks        │
└──────────────────────┬──────────────────────────────────┘
                       │ openPrintPopup()
┌──────────────────────▼──────────────────────────────────┐
│  use-print-service.tsx                                  │
│  - renderXxxContent()  → RenderContentResult            │
│  - buildXxxHtml()      → string (레거시)                │
│  - openXxxPrintPopup() → store.openPrintPopup() 호출    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  document-print-popup.tsx                               │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ PDF 뷰어    │  │ HTML 직접   │  │ HTML iframe    │  │
│  │ (react-pdf) │  │ 렌더링 뷰어 │  │ 뷰어 (레거시)  │  │
│  └─────────────┘  └──────┬──────┘  └────────────────┘  │
│                          │ 출력 시                       │
│                 serializeDirectContent()                 │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  serialize-dom-to-html.ts                               │
│  DOM 클론 → form 값 동기화 → 이미지 base64 인라이닝    │
│  → 혼합 방향 감지 & 회전 → 템플릿 래핑                  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  build-print-html-template.ts                           │
│  완전한 HTML5 문서 생성 (폰트, CSS reset, @page,        │
│  @media print 규칙, 회전 CSS)                           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 두 가지 렌더링 경로

### 2-1. PDF 모드 (기존)

```
openPrintPopup({ generatePdf: () => buildXxxPdf(...) })
         │
         ▼
generatePdf() → Blob (PDF) → URL.createObjectURL()
         │
         ▼
react-pdf 뷰어로 미리보기 → 출력 시 서버 업로드 → Agent가 PDF 인쇄
```

- `generatePdf`가 `Blob`을 반환하면 PDF로 처리
- react-pdf 라이브러리로 페이지별 렌더링
- 래스터 이미지 기반이라 텍스트가 흐릿할 수 있음

### 2-2. HTML 모드 (신규 — 직접 렌더링)

```
openPrintPopup({ renderContent: () => renderXxxContent(...) })
         │
         ▼
renderContent() → { content: ReactNode, pageSelector? }
         │
         ▼
React 컴포넌트를 팝업 뷰어에 직접 마운트 (즉시 미리보기)
         │
         ▼ (출력/다운로드 버튼 클릭 시)
serializeDomToSelfContainedHtml() → HTML 문자열
         │
         ▼
서버 업로드 → Agent(WebView2)가 HTML 로드 → 인쇄
```

- `renderContent`가 React 노드를 반환
- **미리보기**: DOM에 직접 렌더링 (직렬화 없음, 즉시 표시)
- **출력 시에만** HTML로 직렬화 (이미지 base64 인라이닝 포함)

---

## 3. 동작 과정 상세

### 3-1. 팝업 열기

```typescript
// use-print-service.tsx — 예: 영수증 HTML 팝업
openPrintPopup({
  config: {
    title: "영수증",
    outputTypeCode: OutputTypeCode.RECEIPT,
    fileNamePrefix: "receipt",
    outputMode: 'html',
  },
  renderContent: () => renderReceiptContent(encounterId),
});
```

`renderReceiptContent`는 API에서 데이터를 fetch한 뒤 React 컴포넌트를 반환한다:

```typescript
const renderReceiptContent = async (encounterId: string): Promise<RenderContentResult> => {
  const receiptDetail = await queryClient.fetchQuery({
    queryKey: ["documents", "medical-bill-receipt", encounterId],
    queryFn: () => DocumentsService.getMedicalBillReceipt(encounterId),
  });
  return { content: <Receipt receiptDetail={receiptDetail} /> };
};
```

### 3-2. 미리보기 표시

`document-print-popup.tsx`의 `resetViewerState`에서:

1. `renderContent()` 호출 → API 데이터 fetch (이 동안 "미리보기 준비 중..." 로더 표시)
2. 반환된 `ReactNode`를 `setReactContent()`로 상태에 저장
3. React가 `directRenderRef` div 안에 컴포넌트를 마운트

### 3-3. 페이지 측정

`measureDirectRenderPages` useEffect:

```
reactContent 마운트
    │
    ▼ document.fonts.ready (폰트 로드 대기)
    │
    ▼ requestAnimationFrame × 3 (PrintableDocument 페이지네이션 안정화 대기)
    │
    ▼ 모든 페이지 display 복원 (showCurrentHtmlPage가 숨긴 페이지 복원)
    │
    ▼ .printable-page 요소들의 offsetWidth/offsetHeight 측정
    │
    ▼ htmlPageSizeMap에 저장 → 첫 페이지만 표시
```

- 3프레임 대기 이유: `PrintableDocument`가 ResizeObserver → measureVersion → useLayoutEffect → rAF → 페이지네이션 순서로 동작하므로, 이 체인이 완료될 때까지 기다려야 정확한 페이지 수와 크기를 얻을 수 있음
- 측정 전 모든 페이지를 `display: ''`로 복원하는 이유: `showCurrentHtmlPage` (useLayoutEffect)가 `measureDirectRenderPages` (useEffect)보다 먼저 실행되어 비-첫 페이지를 `display: none`으로 만들 수 있고, 숨겨진 요소의 `offsetWidth`/`offsetHeight`는 0을 반환함

### 3-4. 페이지 네비게이션

`showCurrentHtmlPage` useLayoutEffect:

```typescript
pages.forEach((page, i) => {
  (page as HTMLElement).style.display = i === targetIndex ? '' : 'none';
});
```

- useLayoutEffect 사용 이유: 브라우저 페인트 전에 실행되어 이전 페이지가 잠깐 보이는 깜빡임 방지
- 사전 측정된 `htmlPageSizeMap`에서 현재 페이지 크기를 조회하여 fitScale 계산

### 3-5. 줌 & fitScale

```
fitScale = min(containerWidth / pageWidth, containerHeight / pageHeight)
effectiveScale = fitScale × userZoom
visualWidth = pageWidth × effectiveScale
visualHeight = pageHeight × effectiveScale
```

외부 div에 `width: visualW, height: visualH`를 설정하고,
내부 div에 `transform: scale(effectiveScale)`을 적용하여 확대/축소.

### 3-6. 출력 (Print)

```
handlePrintClick()
    │
    ▼ serializeDirectContent()
    │   ├─ 모든 페이지 display 복원
    │   ├─ serializeDomToSelfContainedHtml()
    │   │   ├─ DOM deep clone
    │   │   ├─ form 값 → attribute로 베이크
    │   │   ├─ <img src>, background-image → base64 data URL 변환
    │   │   ├─ applyNamedPageRules() — 혼합 방향 감지 & 회전 처리
    │   │   └─ buildPrintHtmlTemplate() — HTML5 문서로 래핑
    │   └─ 페이지 display 원복
    │
    ▼ new Blob([html]) → new File()
    │
    ▼ FileService.uploadFileV2() → storagePath
    │
    ▼ createPrintJobMutation({ contentType: "text/html", contentUrl: storagePath })
    │
    ▼ Agent(WebView2)가 HTML 다운로드 → NavigateToString() → PrintAsync()
```

### 3-7. 다운로드

직렬화된 HTML을 Blob으로 만들어 `<a download>` 클릭으로 로컬 저장.
다운로드된 HTML은 이미지가 base64로 인라이닝되어 있어 오프라인에서도 열 수 있음.

---

## 4. HTML 직렬화 파이프라인

`serializeDomToSelfContainedHtml()`의 처리 순서:

| 단계 | 함수 | 설명 |
|------|------|------|
| 1 | `root.cloneNode(true)` | 라이브 DOM을 변경하지 않기 위해 deep clone |
| 2 | `syncFormControlValues()` | 원본 DOM의 input/textarea/select 값을 클론의 HTML attribute로 베이크 |
| 3 | `inlineImages()` | `<img src="...">` → `fetch()` → `FileReader.readAsDataURL()` → data URL |
| 4 | `inlineBackgroundImages()` | `style.backgroundImage: url(...)` → data URL |
| 5 | `cleanupClone()` | 숨김 컨테이너 스타일 제거, `<script>` 태그 제거 |
| 6 | `applyNamedPageRules()` | 페이지 방향 분석 → 혼합 시 회전 처리 → `@page` CSS 생성 |
| 7 | `extractPageContent()` | 래퍼 div 제거, 내부 HTML만 추출 |
| 8 | `buildPrintHtmlTemplate()` | 완전한 HTML5 문서로 래핑 |

### 폰트 처리

시스템 폰트를 사용하므로 웹폰트 임베딩 없음:
```
"Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif
```
Agent PC에 나눔고딕이 사전 설치되어 있다는 전제.

### form 값 동기화

React의 controlled component는 DOM property(`.value`)로 값을 관리하지만,
`innerHTML` 직렬화 시에는 HTML attribute만 포함된다.
따라서 원본 DOM의 `.value`를 클론의 `setAttribute('value', ...)`로 베이크해야 한다.

| 요소 | 원본 | 클론 처리 |
|------|------|-----------|
| `input[text]` | `.value` | `setAttribute('value', src.value)` |
| `input[checkbox/radio]` | `.checked` | `setAttribute('checked', 'checked')` 또는 `removeAttribute` |
| `textarea` | `.value` | `.textContent = src.value` |
| `select > option` | `.selected` | `setAttribute('selected', 'selected')` 또는 `removeAttribute` |

---

## 5. PrintableDocument 페이지네이션

`PrintableDocument`는 React 자식 요소를 A4 크기 페이지로 자동 분할한다.

### 동작 원리

1. **아이템 분류**: `<table>`은 행 단위 분할 가능, 나머지는 블록 단위
2. **DOM 측정**: 보이지 않는 측정용 DOM을 Portal로 렌더링, ResizeObserver로 크기 감시
3. **페이지 할당**: 사용 가능한 높이를 계산하고 아이템을 페이지에 배치
4. **렌더링**: `.printable-page` 클래스를 가진 페이지 요소들 생성

### 페이지 요소 구조

```html
<div class="printable-document">
  <div class="printable-pages">
    <div class="printable-page" style="width: 210mm; height: 297mm; padding: 15mm;">
      <div class="printable-page-header">...</div>
      <div class="printable-page-body">
        <!-- 자동 분배된 콘텐츠 -->
      </div>
      <div class="printable-page-footer">...</div>
    </div>
    <!-- 추가 페이지... -->
  </div>
</div>
```

### 측정 타이밍

```
ResizeObserver 감지
    ↓ setMeasureVersion (state 업데이트)
    ↓ useLayoutEffect: calculatePagination 실행
    ↓ requestAnimationFrame: DOM 측정 + 페이지네이션 결과 적용
    ↓ React 렌더 → DOM 업데이트 완료
```

이 체인이 완료되려면 최소 3프레임이 필요하므로, 프린트 팝업에서는 `measureDirectRenderPages`에서 3프레임을 대기한 후 페이지 수를 측정한다.

---

## 6. WebView2 프린트 렌더링 이슈

### 문제: Named Pages 미지원

WebView2(Chromium 기반)의 프린트 엔진은 CSS의 named pages 기능을 완전히 지원하지 않는다:

```css
/* 이 방식은 WebView2에서 동작하지 않음 */
@page portrait-page { size: 210mm 297mm; }
@page landscape-page { size: 297mm 210mm; }

.portrait  { page: portrait-page; }
.landscape { page: landscape-page; }
```

**결과**: 문서 내 모든 페이지가 첫 번째 `@page` 크기로 통일되어 출력됨.
가로 방향(297×210mm) 페이지가 세로(210×297mm)로 찍히면 콘텐츠가 잘리거나 축소됨.

### 해결: CSS Transform 회전

혼합 방향 문서에서 소수 방향 페이지의 콘텐츠를 90° 회전하여 기본 방향 페이지에 맞춘다.

#### 방향 판단 로직

```
모든 .printable-page의 width/height 수집
    │
    ├─ 전부 세로(w ≤ h) → @page { size: 210mm 297mm } (회전 없음)
    ├─ 전부 가로(w > h) → @page { size: 297mm 210mm } (회전 없음)
    └─ 혼합 →
        ├─ 세로 페이지가 더 많으면: 세로 기준, 가로 페이지를 시계방향 90° 회전
        └─ 가로 페이지가 더 많으면: 가로 기준, 세로 페이지를 반시계방향 90° 회전
```

#### DOM 변환 (직렬화 시)

소수 방향 페이지에 대해 `rotatePage()` 함수가 실행:

```html
<!-- 변환 전 (가로 페이지) -->
<div class="printable-page" style="width: 297mm; height: 210mm; padding: 15mm;">
  <div class="printable-page-body">콘텐츠...</div>
</div>

<!-- 변환 후 -->
<div class="printable-page print-rotated-page"
     style="width: 297mm; height: 210mm;
            --orig-w: 297mm; --orig-h: 210mm;
            --base-w: 210mm; --base-h: 297mm;
            --orig-padding: 15mm;">
  <div class="print-rotate-wrapper rotate-cw">
    <div class="printable-page-body">콘텐츠...</div>
  </div>
</div>
```

#### CSS 규칙

```css
/* 화면(미리보기)에서는 아무것도 하지 않음 — 원본 inline style 유지 */

@media print {
  /* 회전 대상 페이지: 기본 방향 크기로 강제 변경 */
  .printable-page.print-rotated-page {
    width: var(--base-w) !important;    /* 210mm */
    height: var(--base-h) !important;   /* 297mm */
    padding: 0 !important;
    overflow: hidden !important;
    position: relative !important;
    contain: size layout paint !important;
  }

  /* 래퍼: 원본 크기를 유지하면서 회전 */
  .print-rotate-wrapper {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: var(--orig-w) !important;    /* 297mm */
    height: var(--orig-h) !important;   /* 210mm */
    padding: var(--orig-padding, 0) !important;
    transform-origin: top left !important;
  }

  /* 가로→세로: 시계방향 90° */
  .print-rotate-wrapper.rotate-cw {
    transform: translateX(var(--orig-h)) rotate(90deg) !important;
  }

  /* 세로→가로: 반시계방향 90° */
  .print-rotate-wrapper.rotate-ccw {
    transform: translateY(var(--orig-w)) rotate(-90deg) !important;
  }
}
```

#### 동작 원리

**시계방향 90° 회전 (가로→세로 기준)**:

```
변환 전 (297×210mm 가로):        변환 후 (210×297mm 세로 안에):
┌───────────────────────┐        ┌─────────────────┐
│                       │        │ ┌─────────────┐ │
│     가로 콘텐츠       │  →     │ │  가 로 콘   │ │
│                       │        │ │  텐 츠 (90° │ │
└───────────────────────┘        │ │  회전됨)    │ │
                                 │ └─────────────┘ │
                                 └─────────────────┘
```

1. `.print-rotated-page`가 외부 페이지를 `210×297mm`로 강제
2. `.print-rotate-wrapper`는 원본 `297×210mm` 크기 유지
3. `transform: translateX(210mm) rotate(90deg)`: 왼쪽 위를 기준으로 90° 회전 후 X축 이동
4. `contain: size layout paint`: CSS containment로 회전이 다른 페이지에 영향을 주지 않도록 격리

#### 화면 vs 인쇄 분리

| 상태 | 페이지 크기 | 콘텐츠 방향 |
|------|-------------|-------------|
| 미리보기 (screen) | inline style 유지 (297×210mm) | 원본 가로 방향 |
| 인쇄 (print) | `--base-w × --base-h` (210×297mm) | 90° 회전 |

미리보기에서는 `@media print` 규칙이 적용되지 않으므로 원본 방향 그대로 보이고,
인쇄 시에만 회전이 적용되어 모든 페이지가 동일한 `@page` 크기로 출력됨.

### 추가 이슈: CSS Containment

회전 적용 시 `contain: size layout paint`가 없으면 일부 브라우저에서
transform된 요소의 overflow가 다음 페이지의 레이아웃에 영향을 줄 수 있다.
containment를 적용하면 해당 요소의 레이아웃/페인트가 외부에 영향을 주지 않도록 격리됨.

### 추가 이슈: @page margin

```css
@page { margin: 0; }
```

`margin: 0`으로 설정하는 이유: `.printable-page`가 자체 padding으로 여백을 관리하므로,
브라우저/WebView2의 기본 @page margin과 중복되지 않도록 제거.

---

## 7. 합본 문서 처리

출력센터에서 여러 문서를 하나로 합쳐서 출력할 때:

```typescript
// 영수증 합본 + 내역서 합본 + 개별 문서들
const allNodes: ReactNode[] = [];
allNodes.push(<Receipt receiptDetail={mergedReceipts} />);      // 합본 영수증
allNodes.push(<MedicalExpense data={mergedStatements} />);       // 합본 내역서
allNodes.push(<PrescriptionHtmlDocument html={rxHtml} />);       // 처방전
allNodes.push(<MedicalRecordCopy patient={...} encounters={...} />); // 진료기록

return {
  content: <div>{allNodes}</div>,
  pageSelector: '.printable-page, .A4',  // 두 가지 페이지 클래스 지원
};
```

`pageSelector`를 `'.printable-page, .A4'`로 지정하여 서로 다른 페이지 클래스를 가진 문서들도 하나의 뷰어에서 페이지 단위로 탐색 가능.

---

## 8. Agent 출력 흐름

```
프론트엔드                        백엔드                    Agent (Windows)
    │                              │                          │
    │ POST /printers               │                          │
    │ { contentType: "text/html",  │                          │
    │   contentUrl: "storage/..." }│                          │
    │ ─────────────────────────────▶                          │
    │                              │ 프린트 작업 큐에 등록     │
    │                              │ ─────────────────────────▶
    │                              │                          │
    │                              │              HTML 파일 다운로드
    │                              │              WebView2.NavigateToString(html)
    │                              │              WebView2.PrintAsync()
    │                              │                          │
    │                              │              물리 프린터로 출력
```

- `contentType: "text/html"`: Agent가 HTML 모드로 처리
- `contentType: "application/pdf"`: Agent가 PDF 모드로 처리
- Agent는 WebView2(Chromium 기반)를 사용하여 HTML을 렌더링하고 인쇄

---

## 9. PDF 모드 vs HTML 모드 비교

| 항목 | PDF 모드 | HTML 모드 |
|------|----------|-----------|
| 미리보기 | react-pdf (캔버스 렌더링) | React 직접 렌더링 |
| 미리보기 속도 | PDF 생성 시간 필요 (수 초) | API fetch 후 즉시 (수백 ms) |
| 텍스트 품질 | 래스터 (해상도 의존) | 벡터 (항상 선명) |
| 출력 시 처리 | 서버 업로드 | DOM 직렬화 → 서버 업로드 |
| Agent 렌더링 | PDF 뷰어 | WebView2 (Chromium) |
| 혼합 방향 | PDF가 자체 처리 | CSS transform 회전 |
| store 필드 | `generatePdf` | `renderContent` |
| config | `outputMode: 'pdf'` | `outputMode: 'html'` |

---

## 10. 지원 문서 유형

| 문서 | PDF 모드 | HTML 모드 | 비고 |
|------|----------|-----------|------|
| 처방전 | O | O | HTML 모드에서도 `buildPrescriptionHtml()`로 HTML 생성 후 `dangerouslySetInnerHTML`로 삽입 |
| 영수증 | O | O | `<Receipt>` 컴포넌트 |
| 진료비 내역서 | O | O | `<MedicalExpense>` 컴포넌트 |
| 진료기록 사본 | O | O | `<MedicalRecordCopy>` 컴포넌트 |
| 출력센터 일괄 | O | O | 위 문서들의 합본 |
| 출력센터 선택 | - | O | 체크박스로 선택한 문서만 합본 |
| 수납 영수증/내역서 | - | O | 수납 완료 후 자동 출력 |
