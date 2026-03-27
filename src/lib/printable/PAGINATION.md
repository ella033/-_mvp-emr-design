# PrintableDocument 페이지 분할 시스템

> `src/lib/printable/` 디렉토리의 동작 원리와 사용법을 설명합니다.

## 목차

1. [개요](#개요)
2. [파일 구조](#파일-구조)
3. [전체 처리 흐름](#전체-처리-흐름)
4. [Step 1: 자식 요소 분류 (printableItems)](#step-1-자식-요소-분류-printableitems)
5. [Step 2: DOM 측정 (measureBlocks + calculatePagination)](#step-2-dom-측정)
6. [Step 3: 페이지 배치 (paginateItems)](#step-3-페이지-배치-paginateitems)
7. [Step 4: 렌더링 (renderPages)](#step-4-렌더링-renderpages)
8. [테이블 행 분할](#테이블-행-분할)
9. [래퍼 내부 테이블 자동 감지](#래퍼-내부-테이블-자동-감지)
10. [안전 장치](#안전-장치)
11. [헬퍼 함수](#헬퍼-함수)
12. [CSS 규칙](#css-규칙)
13. [서식 템플릿 작성 가이드](#서식-템플릿-작성-가이드)
14. [트러블슈팅](#트러블슈팅)

---

## 개요

`PrintableDocument`는 A4 등 인쇄 용지 크기에 맞춰 React children을 자동으로 페이지 분할하는 컴포넌트입니다.

**핵심 특징**:
- 자식 요소를 DOM에서 **실제 측정**하여 페이지 분할 (CSS `break-after` 미사용)
- `<table>`은 **행(row) 단위**로 분할 가능 — thead를 매 페이지 반복
- `<section>` 등 래퍼 내부의 `<table>`을 자동 감지하여 분할
- 환경별 서브픽셀 오차에 강건한 안전 장치 내장

---

## 파일 구조

```
src/lib/printable/
├── PrintableDocument.tsx   # 핵심 컴포넌트 + 페이지네이션 로직
├── PrintPageBreak.tsx      # 수동 페이지 나눔 마커
├── PrintTablePageInfo.tsx  # 테이블 분할 시 "1/3" 같은 페이지 번호 표시
├── render-html-blocks.tsx  # HTML → 블록 분할 후 ReactElement[] 반환 헬퍼
├── split-html-blocks.ts    # HTML 문자열을 블록 요소 단위로 분리
├── paper.ts                # 용지 크기 정의 (A4, A3, Letter 등)
├── types.ts                # PrintableDocumentProps 타입 정의
├── utils.ts                # mm↔px 변환, margin 해석, 반복 렌더러 생성
├── styles.css              # 인쇄/미리보기 CSS + 웹폰트 로드
└── index.ts                # public exports
```

---

## 전체 처리 흐름

```
children (JSX)
    │
    ▼
┌──────────────────────────────┐
│ Step 1: printableItems       │  children → PrintableItem[] 분류
│ (useMemo)                    │  block / table / page-break
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Step 2: measureBlocks        │  각 item을 숨겨진 DOM에 렌더링하여
│ + calculatePagination        │  offsetHeight, thead/row 높이 측정
│ (useLayoutEffect)            │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Step 3: paginateItems        │  측정값 기반으로 페이지 배치 결정
│                              │  → PaginatedPage[] 생성
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Step 4: renderPages          │  PaginatedPage[] → 실제 JSX 렌더링
│                              │  header/footer 포함, 테이블 슬라이싱
└──────────────────────────────┘
```

---

## Step 1: 자식 요소 분류 (printableItems)

> `PrintableDocument.tsx` — `printableItems` useMemo (line ~411)

`children`을 순회하며 각 자식을 3종류의 `PrintableItem`으로 분류합니다:

| kind | 조건 | 동작 |
|------|------|------|
| `table` | `<table>` | `parseTableElement`로 thead/tbody/tfoot 파싱, 행 단위 분할 가능 |
| `page-break` | `<PrintPageBreak />` | 해당 위치에서 강제 페이지 나눔 |
| `block` | 그 외 모든 요소 | 분할 불가능한 하나의 덩어리 |

**분류 우선순위**:
```
1. 직접 <table>?          → "table" (행 분할 가능)
2. <PrintPageBreak>?      → "page-break"
3. 래퍼 내부에 <table>?   → unwrapTableContainer로 분해 (아래 섹션 참고)
4. 나머지                  → "block" (통째로 배치)
```

**Fragment 처리**: `flattenChildren`이 `<Fragment>`를 재귀적으로 풀어서 실제 요소만 추출합니다. `{items.map(...)}` 같은 패턴도 정상 동작합니다.

---

## Step 2: DOM 측정

> `PrintableDocument.tsx` — `calculatePagination` useLayoutEffect (line ~504)

### 측정 영역

화면에 보이지 않는 숨겨진 영역(Portal → `document.body`)에 모든 item을 렌더링합니다:

```
[hidden measurement area]
├── header (measureHeaderRef)
├── content (measureContentRef)
│   ├── [data-print-block] block-0
│   ├── [data-print-block] table-1
│   └── [data-print-block] block-2
└── footer (measureFooterRef)
```

### 측정 항목

각 item에 대해:
- **block**: `offsetHeight` + 다음 item과의 gap (includeMargins 옵션)
- **table**: 전체 `offsetHeight` + `thead` 높이 + 각 `tbody tr` 높이 + `tfoot` 높이

`ResizeObserver`로 크기 변경 감지 → 재측정 트리거.

### includeMargins

CSS margin이 요소 사이 간격을 만드는 경우, `offsetHeight`만으로는 실제 차지하는 공간을 정확히 파악하기 어렵습니다. `includeMargins={true}` (기본값)이면 연속된 item 사이의 실제 gap(px)을 측정하여 높이에 더합니다.

---

## Step 3: 페이지 배치 (paginateItems)

> `PrintableDocument.tsx` — `paginateItems` 함수 (line ~851)

측정값을 기반으로 각 item을 페이지에 배치합니다.

### 페이지 가용 높이 계산

```
용지 높이 (mm→px)
 - 상단 마진
 - 하단 마진
 - 헤더 높이 + 헤더 간격
 - 푸터 높이 + 푸터 간격   (footerMode="flow"일 때만)
 - SUB_PIXEL_TOLERANCE (2px)
─────────────────────────
= safeContentHeight (페이지당 콘텐츠 가용 높이)
```

### block 배치

```
현재 페이지 남은 높이에 block이 들어가는가?
  ├── YES → 현재 페이지에 배치
  └── NO  → 새 페이지 시작 후 배치 (단, 첫 번째 block이면 억지로 배치)
```

### table 배치 (행 분할)

테이블은 행 단위로 분할됩니다. 자세한 내용은 [테이블 행 분할](#테이블-행-분할) 참고.

---

## Step 4: 렌더링 (renderPages)

> `PrintableDocument.tsx` — `renderPages` 함수 (line ~655)

`PaginatedPage[]`를 실제 JSX로 변환합니다:

```html
<div class="printable-pages">
  <section class="printable-page" style="width:210mm; height:297mm; padding:...">
    <div class="printable-page-header">헤더</div>
    <div class="printable-page-body" style="width:...px; min-height:...px">
      <div class="printable-block">block 내용</div>
      <div class="printable-block">table 슬라이스</div>
    </div>
    <div class="printable-page-footer">푸터</div>
  </section>
  <section class="printable-page">...</section>
</div>
```

**3개의 렌더링 대상**:
1. **미리보기 영역**: `[data-print-preview-root]` — 화면에 표시
2. **측정 영역**: `position:fixed; visibility:hidden` — 높이 측정용 (Portal)
3. **인쇄 영역**: `[data-print-root]` — 인쇄 시에만 `display:block` (Portal)

---

## 테이블 행 분할

`<thead>`가 있는 `<table>`은 행 단위로 페이지를 걸쳐 분할됩니다.

### 분할 방식

```
페이지 1:                     페이지 2:
┌──────────────────┐          ┌──────────────────┐
│ thead (반복)     │          │ thead (반복)     │
├──────────────────┤          ├──────────────────┤
│ row 0            │          │ row 5            │
│ row 1            │          │ row 6            │
│ row 2            │          │ row 7            │
│ row 3            │          ├──────────────────┤
│ row 4            │          │ tfoot            │
└──────────────────┘          └──────────────────┘
```

- **thead**: 매 페이지 반복 (자동)
- **tfoot**: 마지막 페이지에만 표시
- **행 단위**: 행 중간에서는 절대 자르지 않음

### parseTableElement

JSX `<table>`을 파싱하여 분할 가능한 구조체(`ParsedTable`)를 생성합니다:

```typescript
type ParsedTable = {
  props: TableHTMLAttributes;  // table 속성 (className, style 등)
  caption?: ReactElement;      // <caption>
  head?: ReactElement;         // <thead>
  bodyRows: ReactNode[];       // <tbody> 내 각 <tr>
  footer?: ReactElement;       // <tfoot>
  tbodyProps?: object;         // <tbody> 속성
}
```

`<tbody>`의 `<tr>`이 없으면 파싱 실패 → block으로 fallback.

### renderTableSlice

특정 행 범위만 잘라서 완전한 `<table>`을 재구성합니다:

```typescript
renderTableSlice(parsedTable, startRow=5, endRow=8, showFooter=true)
// 결과:
// <table ...props>
//   <thead>...</thead>
//   <tbody><tr row5/><tr row6/><tr row7/></tbody>
//   <tfoot>...</tfoot>
// </table>
```

### 테이블 페이지 정보

`usePrintTablePagination()` 훅으로 현재 테이블이 몇 번째 페이지인지 알 수 있습니다:

```tsx
// thead 안에서 사용
function MyTableHeader() {
  return (
    <thead>
      <tr>
        <th>항목</th>
        <th>금액</th>
        <th><PrintTablePageInfo /></th>  {/* "1/3" 등 표시 */}
      </tr>
    </thead>
  );
}
```

---

## 래퍼 내부 테이블 자동 감지

> `PrintableDocument.tsx` — `unwrapTableContainer` 함수 (line ~168)

### 문제

많은 서식 템플릿이 `<section>` 안에 제목과 테이블을 함께 감쌉니다:

```tsx
<section style={{ marginBottom: '8px' }}>
  <div>처방</div>
  <table>...(많은 행)...</table>
</section>
```

이 `<section>`은 "block"으로 분류되어, 페이지에 안 들어가면 **통째로** 다음 페이지로 밀립니다.

### 해결: 자동 분해

`unwrapTableContainer`가 래퍼 내부의 `<table>`을 감지하면, 래퍼를 분해하여 개별 item으로 추출합니다:

```
입력: <section>
        <div>처방</div>
        <table>...(많은 행)...</table>
      </section>

분해 결과:
  [0] block-2-0  → <div>처방</div>        (block, 분할 불가)
  [1] table-2-1  → <table>...</table>     (table, 행 분할 가능)
```

### 분해 조건

| 조건 | 결과 |
|------|------|
| HTML 네이티브 요소 (`<section>`, `<div>` 등) | 분해 시도 |
| React 컴포넌트 (`<MyWrapper>`) | 분해 안 함 (내부 구조 알 수 없음) |
| 직접 자식에 `<table>` 없음 | 분해 안 함 |
| 직접 `<table>` | 분해 불필요 (기존 로직에서 처리) |

### 마진 전파

래퍼의 `marginTop`은 첫 번째 sub-item에, `marginBottom`은 마지막 sub-item에 전파됩니다.

---

## 안전 장치

환경별 미세한 측정 차이로 인한 불필요한 페이지 분할을 방지하는 2가지 장치가 있습니다.

### 1. SUB_PIXEL_TOLERANCE (2px)

```
safeContentHeight = contentHeight - footerSpacingPx - 2px
```

**배경**: 동일한 OS, 브라우저, 버전이라도 PC마다 디스플레이 배율, 시스템 폰트, 브라우저 렌더링 엔진 차이로 `offsetHeight`가 수 px 달라질 수 있습니다. 이 오차가 행마다 누적되면, 콘텐츠가 페이지 경계를 아슬아슬하게 넘겨 불필요한 페이지 분할이 발생합니다.

**해결**: 페이지 가용 높이에서 2px을 빼서 여유를 둡니다. 2px은 인쇄물에서 육안으로 구분 불가능한 크기입니다.

### 2. Widow Protection (과부 행 방지)

테이블 분할 시 다음 페이지에 남는 행이 너무 적으면 분할하지 않습니다.

**판단 기준**: `나머지 행 높이 + tfoot 높이 ≤ thead 높이`

```
예) 영수증 테이블이 페이지 경계를 10px만 초과할 때:

분할한 경우 (나쁨):
  페이지 1: [...행들...]
  페이지 2: thead(54px) + 주(註)(10px) = 64px만 사용 → 거의 빈 페이지

분할 안 한 경우 (좋음):
  페이지 1: [...행들...] + 10px 초과 → 하단 마진 영역으로 약간 넘침
```

**안전 제한**: 초과분이 하단 마진(bottomMarginPx)을 넘으면 컨텐츠가 잘릴 수 있으므로, 마진 이내일 때만 적용합니다.

```
projectedOverflow ≤ bottomMarginPx - SUB_PIXEL_TOLERANCE
```

### (삭제됨) data-print-no-split

> 이전에 HTML 속성으로 테이블/래퍼 분할을 방지하는 옵션이 있었으나 삭제했습니다.
> 이유: 하단 마진을 확인하지 않아 콘텐츠 잘림 위험이 있고, Widow Protection이 마진 안전 체크를 포함하여 같은 문제를 시스템 레벨에서 해결하기 때문입니다.
> 분할 방지가 필요하면 Widow Protection의 조건을 확장하는 방식으로 접근하세요.

---

## 헬퍼 함수

### splitHtmlIntoBlocks(html)

HTML 문자열을 블록 요소(`<p>`, `<ul>`, `<div>` 등) 단위로 분할합니다.

```typescript
splitHtmlIntoBlocks('<p>단락1</p><p>단락2</p><ul><li>목록</li></ul>')
// → ['<p>단락1</p>', '<p>단락2</p>', '<ul><li>목록</li></ul>']
```

**용도**: TipTap 에디터에서 생성된 HTML을 PrintableDocument의 개별 자식으로 분리하여 단락 단위 페이지 분할을 가능하게 합니다.

### renderHtmlBlocks(options)

`splitHtmlIntoBlocks` + border 스타일 + `printable-contiguous-block` 클래스를 결합한 헬퍼입니다. 연속 블록 사이의 border가 끊기지 않게 처리합니다.

```tsx
<PrintableDocument>
  <div>증상</div>
  {...renderHtmlBlocks({
    html: encounter.symptomText,
    keyPrefix: `${encounter.encounterId}-symptoms`,
    borderColor: '#ccc',
    style: { fontSize: '11px' },
  })}
</PrintableDocument>
```

**결과**: 각 단락이 개별 `<div>`로 렌더링되며, 좌우 border가 연속적으로 표시됩니다. 페이지가 넘어가도 border가 끊기지 않습니다.

---

## CSS 규칙

### 기본 간격

```css
.printable-page-body > * + * {
  margin-top: 8px;
}
```

연속된 block 사이에 자동으로 8px 간격이 추가됩니다. 테이블이 분해된 경우에도 sub-item 사이에 이 규칙이 적용됩니다.

### 연속 블록 간격 제거

```css
.printable-page-body > .printable-block:has(> .printable-contiguous-block)
  + .printable-block:has(> .printable-contiguous-block) {
  margin-top: 0;
}
```

`printable-contiguous-block` 클래스가 있는 연속 블록 사이에서는 8px 간격이 제거됩니다. 이를 통해 border가 끊기지 않고 연속됩니다.

### 인쇄 모드

`@media print`에서:
- `[data-print-root="true"]`만 표시하고 나머지는 숨김
- 각 `.printable-page`에 `break-after: page` 적용
- 미리보기 테두리 제거

---

## 서식 템플릿 작성 가이드

### 기본 사용법

```tsx
import { PrintableDocument, PAPER_SIZES, PrintPageBreak } from '@/lib/printable';

function MyTemplate({ data }) {
  return (
    <PrintableDocument
      paper={PAPER_SIZES.A4}
      margin={{ top: 10, right: 15, bottom: 10, left: 15 }}
      header={<MyHeader />}
      footer={<MyFooter />}
    >
      {/* 각 직접 자식이 하나의 "item"으로 인식됩니다 */}
      <div>환자 정보 블록</div>

      {/* <table>은 자동으로 행 분할됩니다 */}
      <table>
        <thead><tr><th>항목</th><th>금액</th></tr></thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}><td>{item.name}</td><td>{item.amount}</td></tr>
          ))}
        </tbody>
      </table>

      {/* 수동 페이지 나눔 */}
      <PrintPageBreak />

      <div>다음 페이지 내용</div>
    </PrintableDocument>
  );
}
```

### 래퍼 내부 테이블

래퍼(`<section>`, `<div>` 등) 안의 `<table>`은 자동 감지되어 행 분할됩니다. 특별한 처리가 필요 없습니다:

```tsx
<PrintableDocument>
  {/* 이 section은 자동으로 분해됩니다 */}
  <section>
    <div>처방</div>
    <table>
      <thead>...</thead>
      <tbody>{/* 많은 행 */}</tbody>
    </table>
  </section>
</PrintableDocument>
```

### HTML 블록 (TipTap 에디터 콘텐츠)

```tsx
import { PrintableDocument, renderHtmlBlocks } from '@/lib/printable';

<PrintableDocument>
  <div>증상</div>
  {...renderHtmlBlocks({
    html: encounter.symptomText,
    keyPrefix: `symptoms`,
    borderColor: '#999',
  })}
</PrintableDocument>
```

### Props 레퍼런스

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `paper` | `PaperPreset \| PaperSize` | `"A4"` | 용지 크기 |
| `margin` | `Partial<{top,right,bottom,left}>` | 각 15mm | 페이지 여백 (mm) |
| `header` | `ReactNode \| () => ReactNode` | — | 매 페이지 반복되는 헤더 |
| `footer` | `ReactNode \| () => ReactNode` | — | 매 페이지 반복되는 푸터 |
| `footerMode` | `"flow" \| "overlay"` | `"flow"` | flow: 푸터 높이를 페이지네이션에 반영. overlay: 푸터를 페이지 하단에 오버레이 |
| `gap` | `number` | `24` | 미리보기에서 페이지 사이 간격 (px) |
| `sectionSpacing` | `number` | `4` | 헤더-본문, 본문-푸터 사이 간격 (mm) |
| `includeMargins` | `boolean` | `true` | 요소 사이 CSS 마진을 측정에 포함할지 |
| `observeDependencies` | `unknown[]` | `[]` | 이 값이 변경되면 재측정 트리거 |
| `onPageCountChange` | `(count: number) => void` | — | 페이지 수 변경 시 콜백 |

### 용지 크기

```typescript
PAPER_SIZES.A4              // 210 x 297mm (세로)
PAPER_SIZES.A4_LANDSCAPE    // 297 x 210mm (가로)
PAPER_SIZES.A3              // 297 x 420mm
PAPER_SIZES.A3_LANDSCAPE    // 420 x 297mm
PAPER_SIZES.LETTER          // 215.9 x 279.4mm
PAPER_SIZES.LEGAL           // 215.9 x 355.6mm
```

### Context Hooks

| Hook | 반환값 | 용도 |
|------|--------|------|
| `usePrintPageContext()` | `{ pageIndex, totalPages, pageId }` | 헤더/푸터에서 페이지 번호 표시 |
| `usePrintTablePagination()` | `{ pageIndex, totalPages }` | thead 안에서 테이블 분할 페이지 번호 표시 |

---

## 트러블슈팅

### 일부 PC에서 페이지 수가 다르다

**원인**: 디스플레이 배율, 시스템 폰트 여부, 브라우저 렌더링 차이로 `offsetHeight`가 수 px 다를 수 있습니다.

**시스템 방어**:
- `SUB_PIXEL_TOLERANCE` (2px)가 기본 적용되어 있습니다.
- 테이블의 경우 `Widow Protection`이 불필요한 분할을 자동 방지합니다.

**그래도 발생하면**:
- `margin`을 약간 줄여 여유를 확보하세요.
- 내용이 정확히 1페이지에 맞아야 하는 서식이라면, margin을 조정하거나 Widow Protection 조건 확장을 고려하세요.

### 테이블이 페이지를 넘어가지 않고 통째로 밀린다

**가능한 원인**:
1. `<thead>`가 없는 테이블 → "block"으로 분류됨. `<thead>`를 추가하세요.
2. `<tbody>` 없이 직접 `<tr>`을 넣은 경우 → `<tbody>`로 감싸세요.
3. 래퍼 내부의 `<table>` → 자동 감지되지만, React 컴포넌트 래퍼는 감지 불가. HTML 네이티브 요소(`<section>`, `<div>`)를 사용하세요.

### 래퍼 내부 테이블이 분해되지 않는다

`unwrapTableContainer`는 다음 조건에서만 동작합니다:
- 래퍼가 HTML 네이티브 요소일 것 (`<section>`, `<div>` 등)
- 래퍼의 **직접 자식**에 `<table>`이 있을 것 (깊은 중첩은 미지원)

### border가 페이지 경계에서 끊긴다

`renderHtmlBlocks` 헬퍼를 사용하면 `printable-contiguous-block` 클래스가 자동 적용되어 연속 블록 사이의 gap이 제거됩니다. 직접 구현할 경우:

```tsx
// 각 블록에 printable-contiguous-block 클래스를 추가하세요
<div className="printable-contiguous-block" style={{ borderLeft: '1px solid #ccc', ... }}>
  내용
</div>
```

### 빈 테이블 헤더만 출력된다

`Widow Protection`이 이 문제를 시스템 레벨에서 방지합니다. 만약 발생한다면:
- 테이블의 마지막 몇 행이 매우 작고, `tfoot`이 있는 경우에 해당합니다.
- `bottomMarginPx`가 충분히 큰지 확인하세요 (마진이 매우 작으면 Widow Protection이 적용되지 않을 수 있습니다).
