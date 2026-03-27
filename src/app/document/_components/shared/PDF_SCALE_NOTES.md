# PDF 고해상도 스케일 적용 시 발생한 문제와 해결

## 배경

PDF 서식(PdfWithFieldOverlay) 캡처 시 **PDF canvas 영역이 흐릿하고 HTML 필드 오버레이는 선명**한 품질 차이가 있었다.

### 원인 분석

| 영역 | 렌더링 방식 | pixelRatio 효과 |
|------|------------|----------------|
| PDF canvas | pdf.js가 `scale=1.5`로 래스터화한 `<canvas>` 비트맵 | 이미 굳은 비트맵을 보간 확대할 뿐 → 효과 없음 |
| HTML 오버레이 | 브라우저 렌더링 엔진이 벡터로 재렌더링 | pixelRatio에 비례하여 진짜 고해상도 |

### 해결 전략

pdf.js의 `scale`을 1.5 → 3으로 높여 PDF canvas 자체를 고해상도로 렌더링한 뒤 캡처한다.
화면에는 원래 크기로 보이도록 CSS로 시각 보정한다.

---

## 구현 구조

```
PdfWithFieldOverlay (scale={3} 전달받음)
│
├─ 시각 보정 wrapper (data-client-pdf-root 바깥)
│   ├─ 크기 제한 div: width/height = pdfSize / scaleRatio
│   └─ CSS transform: scale(1/scaleRatio) → 화면에 원래 크기로 표시
│       transformOrigin: top left
│
└─ 캡처 루트 (data-client-pdf-root)
    ├─ PdfViewer (scale={3}) → canvas ~1200×1700
    └─ FormFieldOverlay (width/height = pdfSize) → 필드 좌표 직접 스케일
```

- **캡처 시**: html-to-image가 `data-client-pdf-root`를 캡처 → 시각 보정 wrapper 바깥이므로 풀 해상도(scale=3) 그대로 캡처됨
- **화면 표시**: 외부 `transform: scale(0.5)`로 시각적으로 scale=1.5와 동일하게 보임

---

## 겪었던 버그: 편집모드 input 클릭 불가

### 증상

`scale={3}` 적용 후 편집모드에서 HTML input/textarea를 클릭해도 커서가 생기지 않고 입력이 안 됨.

### 원인: 중첩 CSS transform의 pointer-events 좌표 매핑 오류

**문제가 된 구조:**

```
div [transform: scale(0.5)]              ← 외부 시각 축소
  div.relative (data-client-pdf-root)
    PdfViewer → canvas [1200×1700]
    div [position: absolute,              ← 내부 overlay wrapper
         transform: scale(2)]             ← 문제의 두 번째 transform
      FormFieldOverlay [600×850]
        input/textarea (편집 필드)
```

두 개의 CSS transform이 중첩되면 브라우저가 pointer-events의 좌표 변환을 수행할 때:

1. 외부 `scale(0.5)` inverse → 마우스 좌표 ×2
2. 내부 `scale(2)` inverse → 좌표 ÷2

이론적으로 상쇄되어야 하지만, **중간 단계에서 overlay wrapper의 layout box(600×850)를 기준으로 hit test**할 때 문제가 발생한다:

- 외부 inverse 후 좌표가 (1000, 800)이 되면
- overlay wrapper의 layout box(600×850)를 초과하여 hit test 실패
- 결과: 해당 영역의 input에 클릭 이벤트가 도달하지 않음

추가로, overlay wrapper에 `width/height`를 명시하지 않으면 절대 위치 자식만 포함하여 **layout box가 0×0으로 축소**되어 전체 영역에서 hit test가 실패한다.

### 해결: CSS transform 대신 필드 좌표 직접 스케일링

**수정된 구조:**

```
div [transform: scale(0.5)]              ← 외부 시각 축소 (유일한 transform)
  div.relative (data-client-pdf-root)
    PdfViewer → canvas [1200×1700]
    FormFieldOverlay [1200×1700]          ← PDF canvas와 동일 크기
      input [x*2, y*2, w*2, h*2, fs*2]   ← 필드 좌표 직접 스케일
```

```typescript
const overlayScaleRatio = pdfSize.scale / FIELD_EDITOR_SCALE; // e.g. 3/1.5 = 2

const renderFields = needsFieldScale
  ? currentPageFields.map(f => ({
      ...f,
      x: f.x != null ? f.x * overlayScaleRatio : f.x,
      y: f.y != null ? f.y * overlayScaleRatio : f.y,
      width: f.width != null ? f.width * overlayScaleRatio : f.width,
      height: f.height != null ? f.height * overlayScaleRatio : f.height,
      fontSize: f.fontSize != null ? f.fontSize * overlayScaleRatio : f.fontSize,
    }))
  : currentPageFields;

<FormFieldOverlay
  width={pdfSize.width}   // PDF canvas 전체 크기
  height={pdfSize.height}
  fields={renderFields}   // 스케일된 좌표
  ...
/>
```

**핵심:** CSS transform을 외부 하나(`scale(0.5)`)만 유지하고, overlay는 transform 없이 PDF canvas와 동일한 좌표계에서 렌더링. 브라우저가 단일 transform만 처리하므로 pointer-events 정상 동작.

---

## 스케일링 대상 필드 속성

FormFieldOverlay가 렌더링에 사용하는 픽셀 의존 속성:

| 속성 | 용도 | 스케일 필요 |
|------|------|:----------:|
| `x` | `left` 위치 | O |
| `y` | `top` 위치 | O |
| `width` | 필드 너비 | O |
| `height` | 필드 높이 | O |
| `fontSize` | 글자 크기 | O |
| `fontWeight` | 글자 두께 | X (비픽셀) |
| `textAlign` | 정렬 | X (비픽셀) |
| `pageNumber` | 페이지 번호 | X |
| `key`, `fieldName` 등 | 식별자 | X |

`allFields`는 스케일하지 않는다 — 라디오 그룹핑 등 데이터 레벨 로직에만 사용되며 위치 정보를 참조하지 않음.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `PdfWithFieldOverlay.tsx` | PDF + overlay 합성, scale prop, 시각 보정 wrapper |
| `DocumentPdfWithFieldOverlay.tsx` | production wrapper, `scale={3}` 전달 |
| `FormFieldOverlay.tsx` | 필드 렌더링 (absolute positioning, pointer-events-auto) |
| `PdfViewer.tsx` | react-pdf 래퍼, scale → canvas 크기 결정 |
| `client-pdf-generator.ts` | html-to-image 캡처 로직 |

---

## FIELD_EDITOR_SCALE = 1.5의 의미와 의존성

> **공유 상수**: `src/constants/pdf-scale.ts` → `export const FIELD_EDITOR_SCALE = 1.5`

`1.5`는 **필드 에디터가 좌표를 캡처할 때 PdfViewer가 사용하는 스케일**이다. DB에 저장되는 필드 좌표(x, y, width, height, fontSize)는 이 스케일 기준의 절대 픽셀값이다.

### 좌표 흐름

```
필드 에디터 (PdfViewer scale=FIELD_EDITOR_SCALE)
  → 사용자가 필드 배치 (Konva stage, viewport 픽셀 좌표)
  → DB 저장 (e.g. x=300, y=450 — scale=1.5 기준 픽셀)
       ↓
  ┌────┼────────────────┐
  ↓    ↓                ↓
 문서 뷰어          PDF 생성         태블릿 서명
 (직접 사용)     (÷1.5 → PDF pt)  (÷1.5 → PDF pt)
```

### FIELD_EDITOR_SCALE을 참조하는 코드 위치

모든 파일이 `src/constants/pdf-scale.ts`에서 import한다:

| 파일 | 용도 |
|------|------|
| `PdfViewer.tsx` | `scale` 기본 파라미터값 — 필드 에디터 렌더링 기준 |
| `PdfWithFieldOverlay.tsx` | overlay 스케일 보정 기준 (`scaleRatio`, `overlayScaleRatio` 계산) |
| `pdf-type-vector-print.ts` | `pxToPt()` 함수에서 에디터 px → PDF pt 변환 |
| `api/document/generate-pdf/route.ts` | Puppeteer/pdf-lib PDF 생성 시 CSS→PDF 좌표 변환 |
| `tablet/.../page.tsx` | 태블릿 서명 화면에서 에디터 좌표 → PDF pt → 디스플레이 좌표 변환 |

### FIELD_EDITOR_SCALE을 변경하면?

**DB 마이그레이션은 불필요하다.** 하지만:

1. `src/constants/pdf-scale.ts`의 값만 변경하면 위 5개 파일 모두 자동 반영
2. **기존 DB 데이터는 여전히 1.5 기준** — 새로 만드는 서식만 새 스케일 적용되므로 혼용 문제 발생
   - 해결: 서식 메타데이터에 `captureScale` 필드를 추가하여 각 서식이 어떤 스케일로 캡처되었는지 기록
   - 또는: 좌표를 정규화(0~1 비율)로 저장하도록 전면 리팩토링

현재로서는 **1.5를 변경할 실익이 없다** — 렌더링 품질은 `scale` prop으로 독립적으로 제어 가능하고, 1.5는 단지 "좌표 저장 기준"일 뿐이다.

---

## 주의사항

1. **CSS transform 중첩 금지**: `data-client-pdf-root` 내부에 추가 `transform: scale()`을 넣으면 pointer-events 문제 재발. 좌표 스케일링으로 대체할 것.
2. **시각 보정 wrapper 위치**: 반드시 `data-client-pdf-root` **바깥**에 있어야 캡처에 영향 없음.
3. **scale 미지정 시**: `scale ?? FIELD_EDITOR_SCALE`로 기본값 1.5 사용 → scaleRatio=1 → 보정 wrapper 비활성 → 기존 동작 유지.
