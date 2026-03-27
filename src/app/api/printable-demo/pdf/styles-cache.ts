import { existsSync, readFileSync } from "fs";
import path from "path";

// 스타일 캐시를 별도 모듈로 분리하여 warmup과 PDF 라우트가 공유
// 이렇게 하면 warmup에서 캐시를 초기화하면 PDF 라우트에서도 사용 가능

/**
 * @font-face 규칙을 CSS에서 제거
 * Puppeteer는 시스템 폰트를 사용하므로 웹폰트 로드 시도를 방지하여 성능 향상
 */
function removeFontFaceRules(css: string): string {
  // @font-face { ... } 블록을 모두 제거
  return css.replace(/@font-face\s*\{[^}]*\}/g, '');
}

function loadBasePrintableCss(): string {
  try {
    const baseCssPath = path.join(process.cwd(), "src", "lib", "printable", "styles.css");
    if (existsSync(baseCssPath)) {
      const css = readFileSync(baseCssPath, "utf-8");
      // Puppeteer용: @font-face 제거하여 시스템 폰트만 사용
      return removeFontFaceRules(css);
    }
  } catch {
    // ignore
  }
  return "";
}

// printable base 스타일은 printStyles에 병합되므로 별도 로드하지 않음
export function getPrintableStyles() {
  return "";
}

let cachedPrintStyles: string | null = null;

function compilePrintStylesFromSource(): string {
  const scssPath = path.join(
    process.cwd(),
    "src",
    "app",
    "document",
    "_components",
    "DocumentCenter.print.scss",
  );

  try {
    const baseCss = loadBasePrintableCss();

    if (!existsSync(scssPath)) {
      console.warn("[PRINTABLE-DEMO] SCSS source file not found:", scssPath);
      return baseCss;
    }

    const sass = require("sass");
    const result = sass.compile(scssPath, {
      style: "expanded",
    });
    // Puppeteer용: @font-face 제거하여 시스템 폰트만 사용
    const compiledCss = removeFontFaceRules(String(result.css || ""));
    console.log("[PRINTABLE-DEMO] Loaded and compiled print styles from DocumentCenter.print.scss (+ base styles.css, font-face removed)");
    return `${baseCss}\n\n${compiledCss}`;
  } catch (error) {
    console.error("[PRINTABLE-DEMO] Error compiling print styles from source:", error);
    return "";
  }
}

export function getPrintStyles(): string {
  const isLocalDev = process.env.NODE_ENV !== "production";

  if (isLocalDev) {
    // 로컬 개발 환경에서는 항상 최신 SCSS를 바로 컴파일해 사용
    return compilePrintStylesFromSource();
  }

  if (cachedPrintStyles !== null) {
    return cachedPrintStyles;
  }

  // 1순위: public 디렉토리의 컴파일된 CSS 파일 (빌드 시 생성됨, 프로덕션 환경)
  try {
    const compiledCssPath = path.join(process.cwd(), "public", "document-center-print.css");
    if (existsSync(compiledCssPath)) {
      const baseCss = loadBasePrintableCss();
      let compiledCss = readFileSync(compiledCssPath, "utf-8");
      // Puppeteer용: @font-face 제거하여 시스템 폰트만 사용
      compiledCss = removeFontFaceRules(compiledCss);
      const hasBase = compiledCss.includes(".printable-document") || compiledCss.includes(".printable-pages");
      cachedPrintStyles = hasBase ? compiledCss : `${baseCss}\n\n${compiledCss}`;
      console.log("[PRINTABLE-DEMO] Loaded compiled print styles from public/document-center-print.css (font-face removed for system fonts)");
      return cachedPrintStyles;
    }
  } catch (error) {
    // 파일이 없거나 읽기 실패 시 무시하고 다음 단계로
    console.log("[PRINTABLE-DEMO] Compiled CSS not found, will compile from source");
  }

  // 2순위: 소스에서 직접 컴파일 (개발 환경 또는 빌드 파일이 없는 경우)
  cachedPrintStyles = compilePrintStylesFromSource();
  if (cachedPrintStyles) {
    return cachedPrintStyles;
  }

  // 스타일을 찾을 수 없는 경우 빈 문자열 반환 (에러 방지)
  console.warn("[PRINTABLE-DEMO] Print styles not available, PDF may not have correct styles");
  cachedPrintStyles = "";
  return cachedPrintStyles;
}

let cachedTailwindStyles: string | null = null;

export function getTailwindStyles(): string {
  if (cachedTailwindStyles !== null) {
    return cachedTailwindStyles;
  }

  try {
    const tailwindPath = path.join(process.cwd(), 'public', 'tailwind-prebuilt.css');
    if (existsSync(tailwindPath)) {
      cachedTailwindStyles = readFileSync(tailwindPath, 'utf-8');
      console.log('[PRINTABLE-DEMO] Loaded Tailwind prebuilt CSS from public/tailwind-prebuilt.css');
      return cachedTailwindStyles;
    } else {
      console.warn('[PRINTABLE-DEMO] Tailwind prebuilt CSS not found:', tailwindPath);
    }
  } catch (error) {
    console.error('[PRINTABLE-DEMO] Error loading Tailwind prebuilt CSS:', error);
  }

  cachedTailwindStyles = "";
  return cachedTailwindStyles;
}

export function buildHtmlTemplate(html: string, skipLogs = false) {
  const styles = getPrintableStyles();
  const printStyles = getPrintStyles();
  const tailwindStyles = getTailwindStyles();

  // 시스템에 설치된 나눔 고딕 폰트 사용 (Dockerfile에서 /usr/share/fonts/nanumfont에 설치됨)
  if (!skipLogs) {
    console.log('[PRINTABLE-DEMO] Using system-installed Nanum Gothic font');
  }

  // 폰트 디버깅 스크립트
  const fontDebugScript = `
    <script>
      (function() {
        // 페이지 로드 시 폰트 정보 출력
        document.fonts.ready.then(function() {
          var loadedFonts = [];
          document.fonts.forEach(function(font) {
            loadedFonts.push({
              family: font.family,
              weight: font.weight,
              style: font.style,
              status: font.status
            });
          });
          console.log('[FONT-DEBUG] document.fonts.ready - Loaded fonts:', JSON.stringify(loadedFonts));
          
          // 폰트 가용성 테스트
          var fontTests = {
            'Nanum Gothic': document.fonts.check('12px "Nanum Gothic"'),
            'NanumGothic': document.fonts.check('12px "NanumGothic"'),
            'NanumBarunGothic': document.fonts.check('12px "NanumBarunGothic"'),
            'Malgun Gothic': document.fonts.check('12px "Malgun Gothic"'),
            'Apple SD Gothic Neo': document.fonts.check('12px "Apple SD Gothic Neo"'),
            'Arial': document.fonts.check('12px "Arial"')
          };
          console.log('[FONT-DEBUG] Font availability tests:', JSON.stringify(fontTests));
          
          // 실제 적용된 폰트 확인
          var testEl = document.querySelector('[data-print-root]') || document.body;
          var computed = window.getComputedStyle(testEl);
          console.log('[FONT-DEBUG] Computed fontFamily:', computed.fontFamily);
        });
      })();
    </script>
  `;

  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <style>
          :root, html, body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          [data-print-root="true"] {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            box-sizing: border-box;
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif !important;
          }

          .printable-pages {
            width: 100%;
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif !important;
          }

          .printable-page input {
            border: none !important;
            background: transparent !important;
            outline: none !important;
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif !important;
          }

          /* 전달된 HTML의 모든 요소에 한글 폰트 강제 적용 */
          *,
          *::before,
          *::after {
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif !important;
          }

          /* Tailwind CSS가 폰트를 덮어쓰지 않도록 설정 */
          input, textarea, select, button, span, div, p, h1, h2, h3, h4, h5, h6, 
          table, thead, tbody, tr, td, th, label, a, li, ul, ol {
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif !important;
          }
        </style>
        ${tailwindStyles ? `<style>${tailwindStyles}</style>` : ''}
        <style>${styles}</style>
        ${printStyles ? `<style>${printStyles}</style>` : ''}
      </head>
      <body>
        ${html}
        ${fontDebugScript}
      </body>
    </html>
  `;
}

