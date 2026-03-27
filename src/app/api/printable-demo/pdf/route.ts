import { existsSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { acquireWarmupPage, releaseWarmupPage } from "./warmup/route";
import { buildHtmlTemplate } from "./styles-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 브라우저 풀 - 전역으로 관리
let browserPool: Awaited<ReturnType<typeof import("puppeteer").default.launch>> | null = null;
let browserPoolPromise: Promise<Awaited<ReturnType<typeof import("puppeteer").default.launch>>> | null = null;

// 브라우저 풀에서 브라우저 가져오기 (재사용)
export async function getBrowser(chromePath?: string) {
  const { default: puppeteer } = await import("puppeteer");

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
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-default-apps",
        "--disable-features=TranslateUI",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--no-crash-upload",
        "--no-default-browser-check",
        "--no-pings",
        "--no-zygote",
        "--use-gl=swiftshader",
        "--window-size=1920,1080",
      ],
    };

    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }

    console.log('[PRINTABLE-DEMO] Launching browser...');
    const browser = await puppeteer.launch(launchOptions);
    console.log('[PRINTABLE-DEMO] Browser launched successfully');
    browserPool = browser;
    browserPoolPromise = null;
    return browser;
  })();

  return browserPoolPromise;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const executablePath = getChromeExecutablePath();
  let page: Awaited<ReturnType<Awaited<ReturnType<typeof import("puppeteer").default.launch>>["newPage"]>> | null = null;
  let useWarmupPage = false;

  const body = await parseJsonBody(request);
  const providedHtml = typeof body?.html === "string" ? body.html : null;
  console.log(`[PRINTABLE-DEMO] Parsing request took ${Date.now() - startTime}ms`);

  try {
    const pageAcquireStart = Date.now();
    // warmup 페이지가 있으면 재사용 시도 (페이지 초기화 비용 절약)
    const warmupPage = await acquireWarmupPage();
    if (warmupPage && !warmupPage.isClosed()) {
      page = warmupPage;
      useWarmupPage = true;
      console.log(`[PRINTABLE-DEMO] Reusing warmup page (took ${Date.now() - pageAcquireStart}ms)`);
    } else {
      // warmup 페이지를 사용할 수 없으면 새 페이지 생성
      const browser = await getBrowser(executablePath);
      page = await browser.newPage();
      console.log(`[PRINTABLE-DEMO] Created new page (took ${Date.now() - pageAcquireStart}ms)`);

      // Viewport 설정: A4 크기 (210mm x 297mm) at 96 DPI = 794 x 1123 px
      // deviceScaleFactor: 브라우저와 동일한 렌더링을 위해 1.0 사용
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      });

      // 네트워크 요청 차단 설정 (외부 리소스 로드 방지)
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();

        // 외부 CDN 및 네트워크 리소스 차단
        if (url.startsWith('http://') || url.startsWith('https://')) {
          // 로컬 파일이나 data URL은 허용
          if (!url.startsWith('data:') && !url.startsWith('file://')) {
            req.abort();
            return;
          }
        }

        // 이미지, 폰트 등은 로컬/인라인만 허용
        if (resourceType === 'image' || resourceType === 'font') {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            req.abort();
            return;
          }
        }

        req.continue();
      });
    }

    if (providedHtml) {
      const htmlProcessStart = Date.now();
      const printableHtml = wrapPrintableHtml(providedHtml);

      if (useWarmupPage) {
        const domUpdateStart = Date.now();
        // warmup 페이지를 재사용하는 경우: DOM을 직접 업데이트하여 전체 HTML 파싱 비용 절약
        // 스타일은 이미 파싱되어 있으므로 body 내용만 업데이트하면 됨
        await page.evaluate((html) => {
          const body = document.body;
          if (body) {
            body.innerHTML = html;
          }
        }, printableHtml);
        console.log(`[PRINTABLE-DEMO] DOM update took ${Date.now() - domUpdateStart}ms`);

        const renderWaitStart = Date.now();
        // DOM 업데이트 후 렌더링 완료 대기
        // waitForSelector를 사용하여 실제 요소가 렌더링될 때까지 대기 (더 정확함)
        try {
          await page.waitForSelector('[data-print-root]', { timeout: 1000 });
        } catch {
          // 타임아웃이 발생해도 계속 진행 (요소가 없을 수 있음)
        }

        // 추가로 requestAnimationFrame으로 렌더링 완료 보장
        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
        });
        console.log(`[PRINTABLE-DEMO] Render wait took ${Date.now() - renderWaitStart}ms`);
      } else {
        const templateStart = Date.now();
        // 새 페이지인 경우: 전체 HTML 템플릿 로드
        const htmlTemplate = buildHtmlTemplate(printableHtml);
        console.log(`[PRINTABLE-DEMO] Template build took ${Date.now() - templateStart}ms`);

        const setContentStart = Date.now();
        await page.setContent(htmlTemplate, {
          waitUntil: "domcontentloaded",
        });
        console.log(`[PRINTABLE-DEMO] setContent took ${Date.now() - setContentStart}ms`);
      }
      console.log(`[PRINTABLE-DEMO] Total HTML processing took ${Date.now() - htmlProcessStart}ms`);
    } else {
      // Puppeteer도 내부 localhost로 접근 (외부 HTTPS URL 사용 시 SSL 문제 발생 가능)
      const port = process.env.PORT || '3000';
      const internalUrl = `http://localhost:${port}`;

      await page.goto(`${internalUrl}/(document-dev)/printable-demo`, {
        waitUntil: "domcontentloaded",
      });
    }

    // warmup 페이지를 재사용한 경우 이미 설정되어 있으므로 다시 설정할 필요 없음
    if (!useWarmupPage) {
      await page.emulateMediaType('print');
    }

    // 폰트 디버깅: 콘솔 로그 캡처
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('FONT-DEBUG')) {
        console.log('[PUPPETEER-CONSOLE]', text);
      }
    });

    // 폰트 디버깅: document.fonts.ready 대기 및 로드된 폰트 확인
    const fontDebugStart = Date.now();
    try {
      await page.evaluate(() => {
        return document.fonts.ready.then(() => {
          const loadedFonts = [...document.fonts].map(f => ({
            family: f.family,
            weight: f.weight,
            style: f.style,
            status: f.status
          }));
          console.log('[FONT-DEBUG] Loaded fonts:', JSON.stringify(loadedFonts));

          // Nanum Gothic 폰트 확인
          const hasNanum = document.fonts.check('12px "Nanum Gothic"');
          const hasNanumNoSpace = document.fonts.check('12px "NanumGothic"');
          const hasMalgun = document.fonts.check('12px "Malgun Gothic"');
          console.log('[FONT-DEBUG] Font availability - Nanum Gothic:', hasNanum, 'NanumGothic:', hasNanumNoSpace, 'Malgun Gothic:', hasMalgun);

          return { loadedFonts, hasNanum, hasNanumNoSpace, hasMalgun };
        });
      });

      // 실제 적용된 폰트 확인
      const appliedFont = await page.evaluate(() => {
        const body = document.body;
        const testEl = document.querySelector('[data-print-root]') || body;
        if (testEl) {
          const computed = window.getComputedStyle(testEl);
          return {
            fontFamily: computed.fontFamily,
            firstFont: computed.fontFamily?.split(',')[0]?.trim().replace(/['"]/g, '') ?? ''
          };
        }
        return null;
      });
      console.log(`[PRINTABLE-DEMO] Font debug completed in ${Date.now() - fontDebugStart}ms`);
      console.log('[PRINTABLE-DEMO] Applied font:', JSON.stringify(appliedFont));
    } catch (fontError) {
      console.error('[PRINTABLE-DEMO] Font debug error:', fontError);
    }

    const pdfGenerateStart = Date.now();
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log(`[PRINTABLE-DEMO] PDF generation took ${Date.now() - pdfGenerateStart}ms`);
    console.log(`[PRINTABLE-DEMO] Total request time: ${Date.now() - startTime}ms`);

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="printable-demo.pdf"',
      },
    });
  } catch (error) {
    console.error("[printable-demo pdf]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate PDF. Please ensure Chrome/Chromium is installed.";
    return NextResponse.json(
      {
        error: message,
        hint:
          executablePath ??
          "설치된 Chrome을 찾을 수 없습니다. 환경 변수 PUPPETEER_EXECUTABLE_PATH 또는 CHROME_EXECUTABLE_PATH를 설정하거나 `npx puppeteer browsers install chrome`을 실행해 주세요.",
      },
      { status: 500 },
    );
  } finally {
    // warmup 페이지를 재사용한 경우 닫지 않고 반환 (다음 요청을 위해 유지)
    // 새로 생성한 페이지만 닫기 (브라우저는 풀에 유지)
    if (page && !page.isClosed()) {
      if (useWarmupPage) {
        // warmup 페이지는 닫지 않고 사용 가능 상태로 반환
        releaseWarmupPage();
      } else {
        // 새로 생성한 페이지는 닫기
        await page.close();
      }
    }
  }
}

export function getChromeExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (process.platform === "win32") {
    const windowsCandidates = [
      process.env.CHROME_EXECUTABLE_PATH,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA
        ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
        : undefined,
    ].filter((candidate): candidate is string => Boolean(candidate));

    for (const candidate of windowsCandidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  if (process.platform === "darwin") {
    const macCandidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];

    for (const candidate of macCandidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  if (process.platform === "linux") {
    const linuxCandidates = [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ];

    for (const candidate of linuxCandidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

async function parseJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null;
  }

  try {
    return await request.json();
  } catch {
    return null;
  }
}

function wrapPrintableHtml(html: string) {
  if (html.includes("data-print-root")) {
    return html;
  }

  if (html.includes("data-print-preview-root")) {
    return html.replace(/data-print-preview-root/g, "data-print-root");
  }

  return `<div data-print-root="true">${html}</div>`;
}

