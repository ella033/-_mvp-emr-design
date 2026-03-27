/**
 * 필드 좌표(x, y, width, height, fontSize)가 저장되는 기준 스케일.
 *
 * PdfViewer(react-pdf)가 이 scale로 PDF를 렌더링하고,
 * 그 위에 오버레이된 필드의 절대 픽셀 좌표가 DB에 저장된다.
 *
 * 변경 시 영향 범위:
 *  - PdfViewer 기본 scale
 *  - PdfWithFieldOverlay 스케일 보정
 *  - pdf-type-vector-print pxToPt() 변환
 *  - generate-pdf route (Puppeteer / pdf-lib)
 *  - 태블릿 서명 좌표 변환
 */
export const FIELD_EDITOR_SCALE = 1.5;
