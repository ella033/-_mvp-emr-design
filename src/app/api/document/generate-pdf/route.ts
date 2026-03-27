import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { AddedField } from '@/types/document';
import { FIELD_EDITOR_SCALE } from '@/constants/pdf-scale';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { mkdirSync } from 'fs';

// ============================================
// 1단계: 기본 설정 및 헬퍼 함수
// ============================================

interface GeneratePdfRequest {
  fields: AddedField[];
  fieldValues: Record<string, string>;
  method?: 'puppeteer' | 'pdf-lib'; // 생성 방법 선택 (기본값: puppeteer)
  viewportSize?: { width: number; height: number; scale: number }; // 추가
  numPages?: number; // 전체 페이지 수 (선택적)
}

// 디버그 디렉토리 경로
const DEBUG_DIR = join(process.cwd(), 'debug-pdf');

// 브라우저 풀 - 전역으로 관리
let browserPool: Browser | null = null;
let browserPoolPromise: Promise<Browser> | null = null;

// 브라우저 풀에서 브라우저 가져오기 (재사용)
async function getBrowser(debugMode: boolean, chromePath?: string): Promise<Browser> {
  // 이미 브라우저가 있고 연결되어 있으면 재사용
  if (browserPool && browserPool.isConnected()) {
    return browserPool;
  }

  // 이미 브라우저 생성 중이면 대기
  if (browserPoolPromise) {
    return browserPoolPromise;
  }

  // 새 브라우저 생성
  browserPoolPromise = (async () => {
    const launchOptions = createBrowserLaunchOptions(debugMode, chromePath);
    console.log('[BROWSER-POOL] Launching browser...');
    const browser = await puppeteer.launch(launchOptions);
    console.log('[BROWSER-POOL] Browser launched successfully');
    browserPool = browser;
    browserPoolPromise = null;
    return browser;
  })();

  return browserPoolPromise;
}

// 대기 시간 헬퍼 함수
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTML 특수문자 이스케이프
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 디버그 디렉토리 생성 함수
function ensureDebugDir(): void {
  try {
    if (!existsSync(DEBUG_DIR)) {
      mkdirSync(DEBUG_DIR, { recursive: true });
      console.log('[DEBUG] Debug directory created:', DEBUG_DIR);
    }
  } catch (error) {
    console.warn('[DEBUG] Failed to create debug directory:', error);
  }
}

// 로컬 도메인 체크 함수
function isLocalDomain(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  const url = request.url;

  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('::1')) {
    return true;
  }

  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return true;
  }

  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

// 디버그 모드 체크 함수
function isDebugMode(request: NextRequest): boolean {
  const pdfDebugEnv = process.env.PDF_DEBUG === 'true';
  const isLocal = isLocalDomain(request);
  return pdfDebugEnv && isLocal;
}

// Chrome 실행 경로 가져오기
function getChromeExecutablePath(): string | undefined {
  // 환경 변수에서 직접 지정된 경로 (최우선)
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 배포 환경(Linux)에서 시스템 Chromium 사용 옵션
  if (process.platform === 'linux' && process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true') {
    // 여러 가능한 경로 확인
    const linuxPaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
    ];

    const fs = require('fs');
    for (const path of linuxPaths) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }

  // 로컬 개발 환경(Windows/macOS)에서만 로컬 경로 확인
  if (process.env.NODE_ENV === 'development') {
    // Windows 환경
    if (process.platform === 'win32') {
      const windowsPaths = [
        process.env.CHROME_EXECUTABLE_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA
          ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
          : null,
      ].filter((path): path is string => path !== null && path !== undefined);

      const fs = require('fs');
      for (const path of windowsPaths) {
        if (fs.existsSync(path)) {
          return path;
        }
      }
    }

    // macOS 환경
    if (process.platform === 'darwin') {
      const macPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ];
      const fs = require('fs');
      for (const path of macPaths) {
        if (fs.existsSync(path)) {
          return path;
        }
      }
    }
  }

  // 배포 환경에서는 undefined 반환 → Puppeteer가 자동으로 다운로드한 Chromium 사용
  return undefined;
}

// ============================================
// 2단계: PDF 파일 확인 및 기본 정보
// ============================================

function getPdfPath(): string {
  return join(process.cwd(), 'public', 'sample.pdf');
}

function validatePdfFile(pdfPath: string): boolean {
  if (!existsSync(pdfPath)) {
    console.error('[PDF-VALIDATE] PDF file not found:', pdfPath);
    return false;
  }
  console.log('[PDF-VALIDATE] PDF file found:', pdfPath);
  return true;
}

// PDF를 Base64 data URL로 변환하는 함수
function getPdfAsDataUrl(pdfPath: string): string {
  try {
    const pdfBuffer = readFileSync(pdfPath);
    const base64 = pdfBuffer.toString('base64');
    return `data:application/pdf;base64,${base64}`;
  } catch (error) {
    console.error('[PDF-DATA-URL] Error converting PDF to data URL:', error);
    throw error;
  }
}


// ============================================
// 3단계: Puppeteer 브라우저 설정
// ============================================

function createBrowserLaunchOptions(debugMode: boolean, chromePath?: string): Parameters<typeof puppeteer.launch>[0] {
  const options: Parameters<typeof puppeteer.launch>[0] = {
    headless: debugMode ? false : true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
      '--allow-file-access-from-files', // file:// URL 접근 허용
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-features=TranslateUI',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--no-crash-upload',
      '--no-default-browser-check',
      '--no-pings',
      '--no-zygote',
      '--use-gl=swiftshader',
      '--window-size=1920,1080',
    ],
  };

  // Alpine Linux에서는 --single-process가 불안정할 수 있으므로 제거
  // 단, 메모리가 매우 제한적인 경우에만 사용
  if (process.env.USE_SINGLE_PROCESS === 'true') {
    options.args?.push('--single-process');
  }

  if (chromePath) {
    options.executablePath = chromePath;
  }

  return options;
}

// ============================================
// 4단계: PDF 배경 렌더링 테스트
// ============================================

// 간단한 PDF 배경만 있는 HTML 생성 (테스트용)
function generateSimplePdfHtml(pdfPath: string, width: number, height: number): string {
  const pdfDataUrl = getPdfAsDataUrl(pdfPath);
  const PAGE_NUMBER = 2;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
            overflow: hidden;
          }

          .container {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            background: white;
          }

          .pdf-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }

          #pdf-canvas {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="pdf-layer">
            <canvas id="pdf-canvas"></canvas>
          </div>
        </div>
        <script>
          (async function() {
            try {
              const pdfDataUrl = ${JSON.stringify(pdfDataUrl)};
              const scale = ${FIELD_EDITOR_SCALE};
              const pageNumber = ${PAGE_NUMBER};
              
              // PDF.js 설정
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              const loadingTask = pdfjsLib.getDocument({ data: atob(pdfDataUrl.split(',')[1]) });
              const pdf = await loadingTask.promise;
              const page = await pdf.getPage(pageNumber);
              const viewport = page.getViewport({ scale: scale });
              
              const canvas = document.getElementById('pdf-canvas');
              const context = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              
              await page.render(renderContext).promise;
              
              console.log('[PDF-BACKGROUND-TEST] PDF rendered successfully');
            } catch (error) {
              console.error('[PDF-BACKGROUND-TEST] Error rendering PDF:', error);
            }
          })();
        </script>
      </body>
    </html>
  `;
}

// PDF 배경이 제대로 렌더링되는지 테스트
async function testPdfBackgroundRendering(
  page: Page,
  pdfPath: string,
  debugMode: boolean
): Promise<boolean> {
  try {
    console.log('[PDF-BACKGROUND-TEST] Starting background rendering test');

    const testWidth = 1181;
    const testHeight = 1677;

    await page.setViewport({
      width: testWidth,
      height: testHeight,
    });

    const html = generateSimplePdfHtml(pdfPath, testWidth, testHeight);

    console.log('[PDF-BACKGROUND-TEST] Setting HTML content');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // PDF.js가 완전히 렌더링될 때까지 대기
    console.log('[PDF-BACKGROUND-TEST] Waiting for PDF.js to render...');
    await page.waitForFunction(
      () => {
        const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
        return canvas && canvas.width > 0 && canvas.height > 0;
      },
      { timeout: 30000 }
    ).catch(() => {
      console.warn('[PDF-BACKGROUND-TEST] PDF.js rendering timeout, continuing anyway...');
    });

    // 추가 대기 시간
    await wait(3000);

    if (debugMode) {
      try {
        await page.screenshot({
          path: join(DEBUG_DIR, '04-test-pdf-background.png') as `${string}.png`,
          fullPage: true,
        });
        console.log('[PDF-BACKGROUND-TEST] Screenshot saved');
      } catch (screenshotError) {
        console.warn('[PDF-BACKGROUND-TEST] Screenshot failed:', screenshotError);
      }
    }

    // PDF가 로드되었는지 확인 (canvas 기반)
    const pdfLoaded = await page.evaluate(() => {
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      return canvas && canvas.width > 0 && canvas.height > 0;
    });

    console.log('[PDF-BACKGROUND-TEST] PDF loaded:', pdfLoaded);
    return pdfLoaded;
  } catch (error) {
    console.error('[PDF-BACKGROUND-TEST] Error:', error);
    return false;
  }
}

// ============================================
// 5단계: PDF 크기 측정
// ============================================

async function measurePdfSize(
  page: Page,
  pdfPath: string,
  debugMode: boolean
): Promise<{ width: number; height: number }> {
  const defaultSize = { width: 1181, height: 1677 };
  const PAGE_NUMBER = 2;

  try {
    console.log('[PDF-SIZE] Starting PDF size measurement (react-pdf style)');

    if (page.isClosed()) {
      console.warn('[PDF-SIZE] Page is closed, using default size');
      return defaultSize;
    }

    const pdfDataUrl = getPdfAsDataUrl(pdfPath);

    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    if (page.isClosed()) {
      console.warn('[PDF-SIZE] Page closed after viewport setting');
      return defaultSize;
    }

    console.log('[PDF-SIZE] Setting PDF content with PDF.js...');
    // react-pdf와 동일한 방식으로 PDF.js 사용
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #pdf-canvas { display: block; }
          </style>
        </head>
        <body>
          <canvas id="pdf-canvas"></canvas>
          <script>
            (async function() {
              try {
                const pdfDataUrl = ${JSON.stringify(pdfDataUrl)};
                const scale = ${FIELD_EDITOR_SCALE};
                const pageNumber = ${PAGE_NUMBER};
                
                // PDF.js 설정
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                const loadingTask = pdfjsLib.getDocument({ data: atob(pdfDataUrl.split(',')[1]) });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: scale });
                
                const canvas = document.getElementById('pdf-canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const renderContext = {
                  canvasContext: context,
                  viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // 크기 정보를 window에 저장
                window.pdfDimensions = {
                  width: viewport.width,
                  height: viewport.height,
                  scale: viewport.scale
                };
                
                console.log('[PDF-SIZE] PDF rendered, dimensions:', window.pdfDimensions);
              } catch (error) {
                console.error('[PDF-SIZE] Error:', error);
                window.pdfDimensions = { width: 1181, height: 1677, scale: ${FIELD_EDITOR_SCALE} };
              }
            })();
          </script>
        </body>
      </html>
    `;
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    console.log('[PDF-SIZE] Waiting for PDF to render...');
    // PDF.js가 완전히 렌더링될 때까지 대기
    await wait(5000);

    if (page.isClosed()) {
      console.warn('[PDF-SIZE] Page closed after navigation');
      return defaultSize;
    }

    if (debugMode) {
      try {
        await page.screenshot({
          path: join(DEBUG_DIR, '05-pdf-size-measurement.png') as `${string}.png`,
          fullPage: true,
        });
      } catch (screenshotError) {
        console.warn('[PDF-SIZE] Screenshot failed:', screenshotError);
      }
    }

    // PDF.js로 계산된 크기 가져오기
    const dimensions = await page.evaluate(() => {
      // window.pdfDimensions가 있으면 사용, 없으면 canvas 크기 사용
      if ((window as any).pdfDimensions) {
        const dims = (window as any).pdfDimensions;
        return { width: dims.width, height: dims.height };
      }

      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      if (canvas) {
        return {
          width: canvas.width,
          height: canvas.height,
        };
      }

      return {
        width: document.body.scrollWidth || 1181,
        height: document.body.scrollHeight || 1677,
      };
    });

    console.log('[PDF-SIZE] Measured dimensions:', dimensions);
    return dimensions;
  } catch (error) {
    console.error('[PDF-SIZE] Error measuring PDF size:', error);
    return defaultSize;
  }
}

// ============================================
// 6단계: 필드 오버레이 추가
// ============================================

function generateFieldHtml(fields: AddedField[], fieldValues: Record<string, string>, pageNumber?: number): string {
  // 페이지 번호가 지정되면 해당 페이지의 필드만 필터링
  const fieldsToRender = pageNumber
    ? fields.filter(field => field.pageNumber === pageNumber)
    : fields;

  return fieldsToRender.map((field) => {
    const fieldValue = fieldValues[field.key] || '';
    return `
      <div
        class="field-item"
        style="
          position: absolute;
          left: ${field.x}px;
          top: ${field.y}px;
          width: ${field.width}px;
          height: ${field.height}px;
          font-size: ${field.fontSize || 12}px;
          display: flex;
          align-items: center;
          padding: 2px 4px;
          color: black;
          font-family: "Nanum Gothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
          z-index: 10;
          background: transparent;
          pointer-events: none;
        "
      >
        ${escapeHtml(fieldValue)}
      </div>
    `;
  }).join('');
}

function generateFullHtml(
  fields: AddedField[],
  fieldValues: Record<string, string>,
  pdfPath: string,
  pdfSize: { width: number; height: number },
  pageNumber: number = 1 // 페이지 번호 (1-indexed, 기본값 1)
): string {
  const { width, height } = pdfSize;
  const fieldsHtml = generateFieldHtml(fields, fieldValues, pageNumber);
  const pdfDataUrl = getPdfAsDataUrl(pdfPath);

  // 시스템에 설치된 나눔 고딕 폰트 사용 (Dockerfile에서 /usr/share/fonts/nanumfont에 설치됨)
  console.log('[PUPPETEER] Using system-installed Nanum Gothic font');

  // react-pdf와 동일한 방식으로 PDF.js를 사용하여 canvas에 렌더링
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: "Nanum Gothic", "NanumGothic", "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif;
            background: white;
            overflow: hidden;
          }

          .container {
            position: relative;
            width: ${width}px;
            height: ${height}px;
            background: white;
          }

          .pdf-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
          }

          #pdf-canvas {
            width: 100%;
            height: 100%;
            display: block;
          }

          .fields-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
            pointer-events: none;
          }

          .field-item {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            .container {
              width: 210mm;
              height: 297mm;
              page-break-after: avoid;
            }

            .pdf-layer {
              width: 100%;
              height: 100%;
            }

            .field-item {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="pdf-layer">
            <canvas id="pdf-canvas"></canvas>
          </div>
          <div class="fields-layer">
            ${fieldsHtml}
          </div>
        </div>
        <script>
          (async function() {
            try {
              const pdfDataUrl = ${JSON.stringify(pdfDataUrl)};
              const scale = ${FIELD_EDITOR_SCALE};
              const pageNumber = ${pageNumber};
              
              // PDF.js 설정
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              
              // PDF 로드
              const loadingTask = pdfjsLib.getDocument({ data: atob(pdfDataUrl.split(',')[1]) });
              const pdf = await loadingTask.promise;
              
              // 페이지 가져오기
              const page = await pdf.getPage(pageNumber);
              
              // Viewport 계산 (react-pdf와 동일)
              const viewport = page.getViewport({ scale: scale });
              
              // Canvas 설정 - 고해상도 렌더링
              const canvas = document.getElementById('pdf-canvas');
              const context = canvas.getContext('2d', {
                alpha: false, // 배경 투명도 불필요 (성능 향상)
              });
              
              // 고해상도 렌더링을 위한 배율 (2배 권장)
              const pixelRatio = 2;
              
              // 실제 렌더링 크기 (고해상도)
              const displayWidth = viewport.width;
              const displayHeight = viewport.height;
              const actualWidth = displayWidth * pixelRatio;
              const actualHeight = displayHeight * pixelRatio;
              
              // Canvas 실제 크기 설정 (고해상도)
              canvas.width = actualWidth;
              canvas.height = actualHeight;
              
              // CSS 표시 크기는 원본 크기 유지
              canvas.style.width = displayWidth + 'px';
              canvas.style.height = displayHeight + 'px';
              
              // 고해상도 렌더링을 위한 컨텍스트 스케일 조정
              context.scale(pixelRatio, pixelRatio);
              
              // PDF 렌더링
              const renderContext = {
                canvasContext: context,
                viewport: viewport
              };
              
              await page.render(renderContext).promise;
              
              console.log('[PDF-RENDER] PDF rendered successfully at ' + pixelRatio + 'x resolution');
            } catch (error) {
              console.error('[PDF-RENDER] Error rendering PDF:', error);
            }
          })();
        </script>
      </body>
    </html>
  `;
}

// ============================================
// 7단계: 최종 PDF 생성
// ============================================

// PDF 크기 계산 함수 (하드코딩 또는 계산)
function calculatePdfSize(): { width: number; height: number } {
  // react-pdf scale 1.5, A4 페이지 2번째
  // A4: 210mm x 297mm = 794px x 1123px (96 DPI)
  // scale 1.5 적용: 1191px x 1684.5px
  return { width: 1191, height: 1685 };
}

// ============================================
// PDF-lib 방식 구현
// ============================================

// CSS 좌표를 PDF 좌표로 변환
function convertCssToPdfCoordinates(
  field: AddedField,
  pdfPageHeight: number,
  canvasScale: number = FIELD_EDITOR_SCALE,
  pdfPageWidth?: number,
  actualPdfPageHeight?: number,
  viewportSize?: { width: number; height: number; scale: number } // 추가
): {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
} {
  // 실제 PDF 크기 사용
  const actualPdfWidth = pdfPageWidth ?? 595.28;
  const actualPdfHeight = actualPdfPageHeight ?? pdfPageHeight;

  // viewport 크기가 제공되면 사용, 없으면 계산
  let CANVAS_WIDTH: number;
  let CANVAS_HEIGHT: number;

  if (viewportSize) {
    // 브라우저에서 전달된 실제 viewport 크기 사용
    CANVAS_WIDTH = viewportSize.width;
    CANVAS_HEIGHT = viewportSize.height;
    console.log('[PDF-LIB] Using provided viewport size:', viewportSize);
  } else {
    // fallback: 계산된 값 사용
    const DPI_RATIO = 96 / 72;
    CANVAS_WIDTH = actualPdfWidth * canvasScale * DPI_RATIO;
    CANVAS_HEIGHT = actualPdfHeight * canvasScale * DPI_RATIO;
    console.log('[PDF-LIB] Using calculated viewport size (fallback)');
  }

  // 좌표 변환 비율: 실제 PDF 크기 / viewport 크기
  const X_RATIO = actualPdfWidth / CANVAS_WIDTH;
  const Y_RATIO = actualPdfHeight / CANVAS_HEIGHT;

  console.log('[PDF-LIB] Coordinate conversion ratios:', {
    CANVAS_WIDTH: CANVAS_WIDTH.toFixed(2),
    CANVAS_HEIGHT: CANVAS_HEIGHT.toFixed(2),
    actualPdfWidth,
    actualPdfHeight,
    X_RATIO: X_RATIO.toFixed(4),
    Y_RATIO: Y_RATIO.toFixed(4),
  });

  // CSS 좌표를 PDF 좌표로 변환
  const pdfX = field.x * X_RATIO;
  const pdfWidth = field.width * X_RATIO;
  const pdfHeight = field.height * Y_RATIO;

  // 폰트 크기 변환
  // 브라우저에서의 px는 이미 viewport 크기에 맞춰져 있음
  // 좌표 변환 비율만 적용하면 됨 (DPI 변환은 불필요)
  // Puppeteer 버전에서는 font-size를 px로 그대로 사용하므로 동일하게 유지
  const pdfFontSize = (field.fontSize || 12) * X_RATIO;

  // Y 좌표 반전 (CSS top → PDF bottom)
  const cssYInPoints = field.y * Y_RATIO;
  const pdfY = actualPdfHeight - cssYInPoints - pdfHeight;

  // ... existing logging code ...

  return {
    x: pdfX,
    y: pdfY,
    width: pdfWidth,
    height: pdfHeight,
    fontSize: pdfFontSize,
  };
}

// PDF-lib을 사용한 PDF 생성
async function generatePdfWithPdfLib(
  pdfPath: string,
  fields: AddedField[],
  fieldValues: Record<string, string>,
  viewportSize?: { width: number; height: number; scale: number }, // 추가
  numPages?: number // 전체 페이지 수 (선택적)
): Promise<Buffer> {
  console.log('[PDF-LIB] Starting PDF generation with pdf-lib');

  try {
    // PDF 템플릿 로드
    const templateBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // fontkit 등록 (PDFDocument 인스턴스에서 호출)
    pdfDoc.registerFontkit(fontkit);

    const totalPages = pdfDoc.getPageCount();
    console.log('[PDF-LIB] Total pages in PDF:', totalPages);

    // 한글 폰트 임베드 시도
    let font;
    try {
      // 폰트 경로 (우선순위 순)
      const fontPaths: string[] = [];

      // Docker/Linux 환경에서 시스템 폰트 경로
      if (process.platform === 'linux') {
        fontPaths.push(
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
          '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
          '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
          '/usr/share/fonts/TTF/DejaVuSans.ttf',
          '/usr/share/fonts/TTF/LiberationSans-Regular.ttf'
        );
      }

      // Windows 환경
      if (process.platform === 'win32') {
        fontPaths.push(
          'C:\\Windows\\Fonts\\malgun.ttf',  // 맑은 고딕
          'C:\\Windows\\Fonts\\NanumGothic.ttf',  // 나눔고딕
          'C:\\Windows\\Fonts\\NanumBarunGothic.ttf',  // 나눔바른고딕
        );
      }

      // macOS 환경
      if (process.platform === 'darwin') {
        fontPaths.push(
          '/System/Library/Fonts/Supplemental/AppleGothic.ttf',
          '/Library/Fonts/AppleGothic.ttf',
        );
      }

      // public 폴더의 폰트 파일 (모든 환경) - 여러 파일 시도
      const publicFontNames = ['NanumGothic-Regular.ttf', 'NanumGothic.ttf', 'NanumGothic-Bold.ttf'];
      for (const fontName of publicFontNames) {
        const publicFontPath = join(process.cwd(), 'public', 'fonts', fontName);
        console.log('[PDF-LIB] Checking font path:', publicFontPath);
        if (existsSync(publicFontPath)) {
          console.log('[PDF-LIB] Font found at:', publicFontPath);
          fontPaths.unshift(publicFontPath); // 최우선
          break; // 첫 번째로 찾은 폰트 사용
        } else {
          console.log('[PDF-LIB] Font not found at:', publicFontPath);
        }
      }

      console.log('[PDF-LIB] All font paths to try:', fontPaths);

      let fontBytes: Buffer | null = null;
      for (const fontPath of fontPaths) {
        if (fontPath && existsSync(fontPath)) {
          console.log('[PDF-LIB] Attempting to load font from:', fontPath);
          try {
            fontBytes = readFileSync(fontPath);
            console.log('[PDF-LIB] Font loaded successfully, size:', fontBytes.length, 'bytes');
            break;
          } catch (readError) {
            console.warn('[PDF-LIB] Failed to read font from:', fontPath, readError);
            continue;
          }
        } else {
          console.log('[PDF-LIB] Font path does not exist:', fontPath);
        }
      }

      if (fontBytes) {
        try {
          // 서브셋팅 옵션 사용 (사용된 글자만 포함)
          font = await pdfDoc.embedFont(fontBytes, {
            subset: true, // 서브셋팅 활성화
          });
          console.log('[PDF-LIB] Font embedded successfully with subsetting');
        } catch (embedError) {
          console.error('[PDF-LIB] Error embedding font with subsetting:', embedError);
          // 서브셋팅 실패 시 서브셋팅 없이 시도
          try {
            font = await pdfDoc.embedFont(fontBytes, {
              subset: false,
            });
            console.log('[PDF-LIB] Font embedded successfully without subsetting');
          } catch (embedError2) {
            console.error('[PDF-LIB] Error embedding font without subsetting:', embedError2);
            throw embedError2;
          }
        }
      } else {
        // 폰트 파일을 찾을 수 없으면 StandardFonts 사용 (한글 미지원)
        console.error('[PDF-LIB] ==========================================');
        console.error('[PDF-LIB] ⚠️ WARNING: Korean font not found!');
        console.error('[PDF-LIB] Korean characters will NOT render correctly.');
        console.error('[PDF-LIB] Searched paths:', fontPaths);
        console.error('[PDF-LIB] Current working directory:', process.cwd());
        console.error('[PDF-LIB] Public fonts directory:', join(process.cwd(), 'public', 'fonts'));
        console.error('[PDF-LIB] Platform:', process.platform);

        // public/fonts 디렉토리 확인
        const publicFontsDir = join(process.cwd(), 'public', 'fonts');
        if (existsSync(publicFontsDir)) {
          const fs = require('fs');
          const files = fs.readdirSync(publicFontsDir);
          console.error('[PDF-LIB] Files in public/fonts:', files);
        } else {
          console.error('[PDF-LIB] public/fonts directory does not exist!');
        }

        console.error('[PDF-LIB] ==========================================');
        console.error('[PDF-LIB] Please ensure NanumGothic font files are in public/fonts/ directory.');
        console.error('[PDF-LIB] Expected files: NanumGothic-Regular.ttf, NanumGothic-Bold.ttf');
        console.error('[PDF-LIB] ==========================================');

        // StandardFonts는 한글을 지원하지 않지만, 에러를 던지지 않고 경고만 표시
        // (배포 환경에서 폰트가 없을 때도 PDF 생성은 진행되도록)
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } catch (fontError) {
      console.error('[PDF-LIB] Error embedding font:', fontError);
      // 폰트 임베드 실패 시 StandardFonts 사용
      console.warn('[PDF-LIB] Falling back to StandardFonts (Korean characters may not render correctly)');
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // 모든 페이지를 순회하며 필드 오버레이
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const page = pdfDoc.getPage(pageIndex);
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const pageNumber = pageIndex + 1; // 1-indexed 페이지 번호

      console.log(`[PDF-LIB] Processing page ${pageNumber} (index ${pageIndex})`);

      // 현재 페이지에 해당하는 필드만 필터링
      const pageFields = fields.filter(field => field.pageNumber === pageNumber);

      if (pageFields.length === 0) {
        console.log(`[PDF-LIB] No fields for page ${pageNumber}, skipping`);
        continue;
      }

      console.log(`[PDF-LIB] Found ${pageFields.length} fields for page ${pageNumber}`);

      // 각 필드에 텍스트 오버레이
      for (const field of pageFields) {
        const value = fieldValues[field.key] || '';
        if (!value.trim()) continue;

        // CSS 좌표 → PDF 좌표 변환 (실제 viewport 크기 사용)
        const coords = convertCssToPdfCoordinates(field, pageHeight, FIELD_EDITOR_SCALE, pageWidth, pageHeight, viewportSize);

        // 디버깅: 원본 필드 좌표와 변환된 좌표 비교
        console.log(`[PDF-LIB] Field ${field.key} coordinate conversion (page ${pageNumber}):`, {
          original: {
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            fontSize: field.fontSize || 12,
          },
          converted: coords,
          pdfPageSize: { width: pageWidth, height: pageHeight },
        });

        // 텍스트를 수직 중앙에 배치 (CSS의 flex align-items: center)
        // PDF의 drawText는 baseline 기준이므로 조정 필요
        // baseline은 폰트 크기의 약 25% 정도 아래에 위치 (더 정확한 중앙 정렬)
        const textY = coords.y + (coords.height / 2) - (coords.fontSize * 0.25);

        // 좌우 패딩 (CSS의 padding: 2px 4px)
        // 패딩도 비율에 맞게 변환 필요
        // react-pdf scale 1.5 기준: 4px → PDF 좌표로 변환
        // 동적으로 계산된 canvas 크기 사용
        const DPI_RATIO = 96 / 72;
        const CANVAS_WIDTH = pageWidth * FIELD_EDITOR_SCALE * DPI_RATIO;
        const paddingX = 4 * (pageWidth / CANVAS_WIDTH);

        console.log(`[PDF-LIB] Drawing field ${field.key} on page ${pageNumber}:`, {
          value,
          x: coords.x + paddingX,
          y: textY,
          fontSize: coords.fontSize,
          paddingX,
        });

        // 텍스트 그리기
        page.drawText(value, {
          x: coords.x + paddingX,
          y: textY,
          size: coords.fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }

    // PDF 생성
    const pdfBytes = await pdfDoc.save();
    console.log('[PDF-LIB] PDF generated successfully, size:', pdfBytes.length, 'bytes');

    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('[PDF-LIB] Error generating PDF:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  let page: Page | null = null;

  try {
    console.log('[PDF-GENERATE] ==========================================');
    console.log('[PDF-GENERATE] Starting PDF generation');
    console.log('[PDF-GENERATE] ==========================================');

    // 요청 데이터 파싱
    const { fields, fieldValues, method = 'puppeteer', viewportSize, numPages } = await request.json() as GeneratePdfRequest;

    console.log('[PDF-GENERATE] Fields count:', fields.length);
    console.log('[PDF-GENERATE] Field values count:', Object.keys(fieldValues).length);
    console.log('[PDF-GENERATE] Generation method:', method);

    // 디버그 모드 확인
    const DEBUG_MODE = isDebugMode(request);
    console.log('[PDF-GENERATE] Debug mode:', DEBUG_MODE);

    if (DEBUG_MODE) {
      ensureDebugDir();
    }

    // PDF 파일 확인
    const pdfPath = getPdfPath();
    console.log('[PDF-GENERATE] PDF path:', pdfPath);

    if (!validatePdfFile(pdfPath)) {
      return NextResponse.json(
        { error: 'PDF 파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // PDF-lib 방식인 경우
    if (method === 'pdf-lib') {
      console.log('[PDF-GENERATE] Using pdf-lib method');
      const startTime = Date.now();

      try {
        const pdfBuffer = await generatePdfWithPdfLib(pdfPath, fields, fieldValues, viewportSize, numPages);
        const duration = Date.now() - startTime;

        console.log('[PDF-GENERATE] ==========================================');
        console.log('[PDF-GENERATE] PDF generation completed successfully');
        console.log('[PDF-GENERATE] Method: pdf-lib');
        console.log('[PDF-GENERATE] Duration:', duration, 'ms');
        console.log('[PDF-GENERATE] ==========================================');

        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="document.pdf"',
          },
        });
      } catch (error) {
        console.error('[PDF-GENERATE] Error with pdf-lib method:', error);
        return NextResponse.json(
          { error: 'PDF 생성에 실패했습니다.', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    // Puppeteer 방식 (기본)
    console.log('[PDF-GENERATE] Using puppeteer method');

    // Chrome 실행 경로 확인
    const chromePath = getChromeExecutablePath();
    console.log('[PDF-GENERATE] Chrome path:', chromePath || 'using default');

    // 브라우저 풀에서 브라우저 가져오기 (재사용)
    console.log('[PDF-GENERATE] Getting browser from pool...');
    const browser = await getBrowser(DEBUG_MODE, chromePath);
    console.log('[PDF-GENERATE] Browser obtained from pool');

    // PDF 파일에서 전체 페이지 수 확인
    const templateBytes = readFileSync(pdfPath);
    const tempPdfDoc = await PDFDocument.load(templateBytes);
    const totalPages = tempPdfDoc.getPageCount();
    console.log('[PDF-GENERATE] Total pages in PDF:', totalPages);

    // PDF 크기 측정 (첫 번째 페이지 기준)
    const pdfSize = calculatePdfSize();
    console.log('[PDF-GENERATE] PDF size:', pdfSize);

    // 각 페이지의 PDF를 저장할 배열
    const pagePdfs: Buffer[] = [];

    // 각 페이지를 순회하며 PDF 생성
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      console.log(`[PDF-GENERATE] Processing page ${pageNum} of ${totalPages}`);

      // 새 페이지 생성
      const currentPage = await browser.newPage();

      currentPage.on('console', (msg: { type: () => string; text: () => string }) => {
        console.log(`[PDF-PAGE-${pageNum}] ${msg.type()}: ${msg.text()}`);
      });

      currentPage.on('pageerror', (error: unknown) => {
        console.error(`[PDF-PAGE-${pageNum}] Page error:`, error);
      });

      try {
        // 뷰포트 설정 - 고해상도 렌더링
        await currentPage.setViewport({
          width: pdfSize.width,
          height: pdfSize.height,
          deviceScaleFactor: 2, // 고해상도 렌더링을 위한 디바이스 스케일 팩터
        });

        // 현재 페이지에 해당하는 HTML 생성
        const html = generateFullHtml(fields, fieldValues, pdfPath, pdfSize, pageNum);
        console.log(`[PDF-GENERATE] HTML generated for page ${pageNum}`);

        if (DEBUG_MODE) {
          const fs = require('fs');
          fs.writeFileSync(
            join(DEBUG_DIR, `06-final-html-page-${pageNum}.html`),
            html,
            'utf-8'
          );
          console.log(`[PDF-DEBUG] HTML saved for page ${pageNum}`);
        }

        // HTML 로드
        console.log(`[PDF-GENERATE] Loading HTML content for page ${pageNum}...`);
        await currentPage.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });

        // PDF.js 렌더링 대기
        await currentPage.waitForFunction(
          () => {
            const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
            return canvas && canvas.width > 0 && canvas.height > 0;
          },
          { timeout: 15000 }
        ).catch(() => {
          console.warn(`[PDF-GENERATE] PDF.js rendering timeout for page ${pageNum}`);
        });

        // 대기 시간 제거 또는 최소화 (waitForFunction이 이미 완료를 보장)
        // await wait(1000); // 제거 가능

        if (DEBUG_MODE) {
          await wait(2000); // 디버그 모드에서만 유지
          await currentPage.screenshot({
            path: join(DEBUG_DIR, `07-after-pdf-render-page-${pageNum}.png`) as `${string}.png`,
            fullPage: true,
          });
          console.log(`[PDF-DEBUG] Screenshot after PDF render saved for page ${pageNum}`);
        }

        // Print media type 적용
        console.log(`[PDF-GENERATE] Applying print media type for page ${pageNum}...`);
        await currentPage.emulateMediaType('print');

        if (DEBUG_MODE) {
          await wait(1000); // 디버그 모드에서만 유지
          await currentPage.screenshot({
            path: join(DEBUG_DIR, `09-after-print-css-page-${pageNum}.png`) as `${string}.png`,
            fullPage: true,
          });
          console.log(`[PDF-DEBUG] Screenshot after print CSS saved for page ${pageNum}`);
        }

        // 현재 페이지의 PDF 생성
        console.log(`[PDF-GENERATE] Generating PDF for page ${pageNum}...`);
        const pagePdf = await currentPage.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
          },
          preferCSSPageSize: false,
        });

        pagePdfs.push(Buffer.from(pagePdf));
        console.log(`[PDF-GENERATE] PDF generated for page ${pageNum}, size: ${pagePdf.length} bytes`);
      } finally {
        // 페이지 정리
        if (currentPage && !currentPage.isClosed()) {
          await currentPage.close();
        }
      }
    }

    // 모든 페이지 PDF를 하나로 병합
    console.log('[PDF-GENERATE] Merging all pages...');
    const mergedPdfDoc = await PDFDocument.create();

    for (let i = 0; i < pagePdfs.length; i++) {
      const pagePdf = await PDFDocument.load(pagePdfs[i]);
      const pages = await mergedPdfDoc.copyPages(pagePdf, pagePdf.getPageIndices());
      pages.forEach((page) => {
        mergedPdfDoc.addPage(page);
      });
      console.log(`[PDF-GENERATE] Merged page ${i + 1} of ${pagePdfs.length}`);
    }

    const mergedPdfBytes = await mergedPdfDoc.save();
    const finalPdf = Buffer.from(mergedPdfBytes);
    console.log('[PDF-GENERATE] All pages merged, final size:', finalPdf.length, 'bytes');

    if (DEBUG_MODE) {
      const fs = require('fs');
      fs.writeFileSync(
        join(DEBUG_DIR, '10-final-merged-pdf.pdf'),
        finalPdf
      );
      console.log('[PDF-DEBUG] Final merged PDF saved to debug directory');
    }

    console.log('[PDF-GENERATE] ==========================================');
    console.log('[PDF-GENERATE] PDF generation completed successfully');
    console.log('[PDF-GENERATE] Method: puppeteer');
    console.log('[PDF-GENERATE] Total pages:', totalPages);
    console.log('[PDF-GENERATE] ==========================================');

    // 응답 반환
    return new NextResponse(finalPdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });
  } catch (error) {
    console.error('[PDF-GENERATE] ==========================================');
    console.error('[PDF-GENERATE] Error occurred:', error);
    if (error instanceof Error) {
      console.error('[PDF-GENERATE] Error message:', error.message);
      console.error('[PDF-GENERATE] Error stack:', error.stack);
    }
    console.error('[PDF-GENERATE] ==========================================');

    // 페이지 정리 (브라우저는 풀에 유지)
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (closeError) {
        console.error('[PDF-GENERATE] Error closing page:', closeError);
      }
    }

    return NextResponse.json(
      { error: 'PDF 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
