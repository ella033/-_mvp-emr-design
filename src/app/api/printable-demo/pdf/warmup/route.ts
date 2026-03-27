import { NextResponse } from "next/server";
import { getBrowser, getChromeExecutablePath } from "../route";
import { buildHtmlTemplate } from "../styles-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 페이지 풀 - warmup 시 생성한 페이지를 재사용
let warmupPage: Awaited<ReturnType<Awaited<ReturnType<typeof import("puppeteer").default.launch>>["newPage"]>> | null = null;
let warmupPagePromise: Promise<Awaited<ReturnType<Awaited<ReturnType<typeof import("puppeteer").default.launch>>["newPage"]>>> | null = null;
let warmupPageInUse = false;

// warmup 페이지 가져오기 및 사용 중 표시 (없으면 새로 생성)
export async function acquireWarmupPage(): Promise<Awaited<ReturnType<Awaited<ReturnType<typeof import("puppeteer").default.launch>>["newPage"]>> | null> {
  // 이미 warmup 페이지가 있고 닫히지 않았고 사용 중이 아니면 재사용
  if (warmupPage && !warmupPage.isClosed() && !warmupPageInUse) {
    warmupPageInUse = true;
    return warmupPage;
  }

  // 이미 생성 중이면 대기
  if (warmupPagePromise) {
    const page = await warmupPagePromise;
    if (!warmupPageInUse) {
      warmupPageInUse = true;
      return page;
    }
  }

  // 새 warmup 페이지 생성
  warmupPagePromise = (async () => {
    const executablePath = getChromeExecutablePath();
    const browser = await getBrowser(executablePath);
    const page = await browser.newPage();

    // Viewport 설정: A4 크기 (210mm x 297mm) at 96 DPI = 794 x 1123 px
    // deviceScaleFactor: 브라우저와 동일한 렌더링을 위해 1.0 사용
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    // 네트워크 요청 차단 설정 (PDF 생성 시와 동일한 설정)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      // 외부 CDN 및 네트워크 리소스 차단
      if (url.startsWith('http://') || url.startsWith('https://')) {
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

    // 미디어 타입 설정 (PDF 생성 시와 동일)
    await page.emulateMediaType('print');

    // 실제 사용할 HTML 템플릿의 기본 구조를 미리 로드하여 스타일 파싱과 렌더링 엔진 초기화 비용 절약
    // 이렇게 하면 첫 번째 PDF 생성 시 HTML 템플릿 파싱 시간이 크게 단축됨
    // 또한 스타일 컴파일도 warmup 시점에 미리 수행하여 캐시됨
    const warmupHtml = buildHtmlTemplate('<div data-print-root="true"></div>', true); // skipLogs = true

    // HTML 템플릿을 로드하여 스타일 파싱과 렌더링 엔진 초기화
    // 스타일은 인라인으로 포함되어 있으므로 domcontentloaded로 충분
    await page.setContent(warmupHtml, {
      waitUntil: 'domcontentloaded',
    });

    console.log('[PRINTABLE-DEMO] Warmup page initialized with HTML template and styles');

    warmupPage = page;
    warmupPagePromise = null;
    // warmup API에서는 페이지를 사용 중으로 표시하지 않음 (단순히 준비만 함)
    // 실제 PDF 생성 시에만 사용 중으로 표시됨
    console.log('[PRINTABLE-DEMO] Warmup page created and initialized');
    return page;
  })();

  return warmupPagePromise;
}

// warmup 페이지 반환 (다음 요청을 위해 사용 가능 상태로)
export function releaseWarmupPage() {
  warmupPageInUse = false;
}

// warmup 페이지 가져오기 (없으면 새로 생성, 기존 함수 호환성 유지)
// warmup API에서만 사용되며, 페이지를 사용 중으로 표시하지 않음
export async function getWarmupPage() {
  // 이미 warmup 페이지가 있고 닫히지 않았으면 반환 (사용 중 표시 안 함)
  if (warmupPage && !warmupPage.isClosed() && !warmupPageInUse) {
    return warmupPage;
  }

  // 이미 생성 중이면 대기
  if (warmupPagePromise) {
    return warmupPagePromise;
  }

  // 새 warmup 페이지 생성 (사용 중 표시 안 함)
  warmupPagePromise = (async () => {
    const executablePath = getChromeExecutablePath();
    const browser = await getBrowser(executablePath);
    const page = await browser.newPage();

    // Viewport 설정: A4 크기 (210mm x 297mm) at 96 DPI = 794 x 1123 px
    // deviceScaleFactor: 브라우저와 동일한 렌더링을 위해 1.0 사용
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    // 네트워크 요청 차단 설정 (PDF 생성 시와 동일한 설정)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();

      // 외부 CDN 및 네트워크 리소스 차단
      if (url.startsWith('http://') || url.startsWith('https://')) {
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

    // 미디어 타입 설정 (PDF 생성 시와 동일)
    await page.emulateMediaType('print');

    // 실제 사용할 HTML 템플릿의 기본 구조를 미리 로드하여 스타일 파싱과 렌더링 엔진 초기화 비용 절약
    const warmupHtml = buildHtmlTemplate('<div data-print-root="true"></div>', true); // skipLogs = true

    await page.setContent(warmupHtml, {
      waitUntil: 'domcontentloaded',
    });

    console.log('[PRINTABLE-DEMO] Warmup page initialized with HTML template and styles');

    warmupPage = page;
    warmupPagePromise = null;
    // warmup API에서는 페이지를 사용 중으로 표시하지 않음
    console.log('[PRINTABLE-DEMO] Warmup page created and initialized');
    return page;
  })();

  return warmupPagePromise;
}

// 브라우저 warmup - 브라우저와 페이지를 미리 생성하여 준비 상태로 만듦
export async function GET() {
  try {
    const executablePath = getChromeExecutablePath();
    const browser = await getBrowser(executablePath);

    // 브라우저가 정상적으로 연결되어 있는지 확인
    if (!browser || !browser.isConnected()) {
      return NextResponse.json({
        success: false,
        message: "Browser launch failed"
      }, { status: 500 });
    }

    // warmup 페이지가 이미 있으면 새로 생성하지 않음
    if (warmupPage && !warmupPage.isClosed() && !warmupPageInUse) {
      return NextResponse.json({
        success: true,
        message: "Browser and page are already ready"
      });
    }

    // warmup 페이지가 없거나 사용 중이면 새로 생성
    // 단, 사용 중이 아닐 때만 생성 (동시 요청 방지)
    if (!warmupPageInUse) {
      const page = await getWarmupPage();

      // PDF 생성까지 수행하여 렌더링 엔진 완전 워밍업
      // 실제 사용할 것과 유사한 복잡한 HTML로 더미 PDF 생성
      // PDF 엔진의 복잡한 레이아웃 처리 최적화를 위해 충분히 복잡한 구조 사용
      const dummyHtml = `
        <div data-print-root="true">
          <div class="printable-pages">
            <div class="printable-page" style="padding: 20mm;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px; border-bottom: 2px solid #333;">워밍업 문서</h1>
              <p style="margin-bottom: 12px; line-height: 1.6;">이것은 렌더링 엔진을 워밍업하기 위한 더미 문서입니다. PDF 엔진이 복잡한 레이아웃을 최적화하도록 충분히 복잡한 구조를 포함합니다.</p>
              
              <div style="margin-bottom: 20px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1f2937;">상세 정보</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; background: white;">
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">항목</th>
                      <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">값</th>
                      <th style="border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: 600;">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #d1d5db; padding: 10px;">테스트 1</td>
                      <td style="border: 1px solid #d1d5db; padding: 10px;">데이터 1</td>
                      <td style="border: 1px solid #d1d5db; padding: 10px; color: #059669; font-weight: 500;">완료</td>
                    </tr>
                    <tr style="background: #fafafa;">
                      <td style="border: 1px solid #d1d5db; padding: 10px;">테스트 2</td>
                      <td style="border: 1px solid #d1d5db; padding: 10px;">데이터 2</td>
                      <td style="border: 1px solid #d1d5db; padding: 10px; color: #dc2626; font-weight: 500;">대기</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #d1d5db; padding: 10px;">테스트 3</td>
                      <td style="border: 1px solid #d1d5db; padding: 10px;">데이터 3</td>
                      <td style="border: 1px solid #d1d5db; padding: 10px; color: #059669; font-weight: 500;">완료</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                <div style="flex: 1; padding: 16px; border: 2px solid #3b82f6; border-radius: 8px; background: #eff6ff;">
                  <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #1e40af;">섹션 1</h3>
                  <p style="font-size: 14px; color: #1f2937; margin-bottom: 8px; line-height: 1.5;">복잡한 레이아웃 테스트를 위한 컨텐츠입니다.</p>
                  <ul style="margin: 0; padding-left: 20px; list-style: disc;">
                    <li style="margin-bottom: 4px;">항목 A</li>
                    <li style="margin-bottom: 4px;">항목 B</li>
                    <li style="margin-bottom: 4px;">항목 C</li>
                  </ul>
                </div>
                <div style="flex: 1; padding: 16px; border: 2px solid #10b981; border-radius: 8px; background: #ecfdf5;">
                  <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 10px; color: #047857;">섹션 2</h3>
                  <p style="font-size: 14px; color: #1f2937; margin-bottom: 8px; line-height: 1.5;">다양한 스타일 속성을 포함합니다.</p>
                  <div style="padding: 8px; background: white; border-radius: 4px; margin-top: 8px;">
                    <span style="font-weight: 600;">중첩된 요소</span>: 추가 복잡도
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 24px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>참고:</strong> 이 문서는 PDF 엔진의 레이아웃 최적화를 트리거하기 위해 복잡한 구조를 포함합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      `;

      // 첫 번째 PDF 생성 (초기 렌더링 엔진 워밍업)
      await page.evaluate((html) => {
        const body = document.body;
        if (body) {
          body.innerHTML = html;
        }
      }, dummyHtml);

      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      });

      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      console.log('[PRINTABLE-DEMO] First warmup PDF generated');

      // 두 번째 PDF 생성 (DOM 업데이트 → 렌더링 → PDF 변환 사이클 워밍업)
      // 다른 내용으로 DOM 업데이트하여 실제 사용 패턴과 동일하게 워밍업
      const dummyHtml2 = `
        <div data-print-root="true">
          <div class="printable-pages">
            <div class="printable-page" style="padding: 20mm;">
              <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #6366f1;">두 번째 워밍업 문서</h2>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
                <div style="padding: 12px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">항목 A</div>
                  <div style="font-size: 12px; color: #64748b;">설명 A</div>
                </div>
                <div style="padding: 12px; background: #fce7f3; border: 1px solid #ec4899; border-radius: 6px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">항목 B</div>
                  <div style="font-size: 12px; color: #64748b;">설명 B</div>
                </div>
                <div style="padding: 12px; background: #dcfce7; border: 1px solid #10b981; border-radius: 6px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">항목 C</div>
                  <div style="font-size: 12px; color: #64748b;">설명 C</div>
                </div>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #1f2937; color: white;">
                    <th style="border: 1px solid #374151; padding: 12px; text-align: left;">번호</th>
                    <th style="border: 1px solid #374151; padding: 12px; text-align: left;">제목</th>
                    <th style="border: 1px solid #374151; padding: 12px; text-align: left;">내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 12px;">1</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: 500;">첫 번째 항목</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px;">복잡한 테이블 레이아웃 테스트</td>
                  </tr>
                  <tr style="background: #f9fafb;">
                    <td style="border: 1px solid #d1d5db; padding: 12px;">2</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: 500;">두 번째 항목</td>
                    <td style="border: 1px solid #d1d5db; padding: 12px;">다양한 스타일 속성 적용</td>
                  </tr>
                </tbody>
              </table>
              
              <ul style="list-style: disc; padding-left: 24px; margin-bottom: 16px; line-height: 1.8;">
                <li style="margin-bottom: 8px;"><strong>리스트 항목 1:</strong> 복잡한 텍스트 포맷팅 테스트</li>
                <li style="margin-bottom: 8px;"><strong>리스트 항목 2:</strong> 다양한 폰트 스타일 적용</li>
                <li style="margin-bottom: 8px;"><strong>리스트 항목 3:</strong> PDF 엔진 최적화 트리거</li>
              </ul>
            </div>
          </div>
        </div>
      `;

      await page.evaluate((html) => {
        const body = document.body;
        if (body) {
          body.innerHTML = html;
        }
      }, dummyHtml2);

      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      });

      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      console.log('[PRINTABLE-DEMO] Second warmup PDF generated');

      // 세 번째 PDF 생성 (PDF 엔진의 복잡한 레이아웃 최적화 완료를 위해)
      const dummyHtml3 = `
        <div data-print-root="true">
          <div class="printable-pages">
            <div class="printable-page" style="padding: 20mm;">
              <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 18px; color: #7c3aed;">세 번째 워밍업</h1>
              <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                <div style="flex: 2; padding: 16px; background: linear-gradient(to bottom, #fef3c7, #fde68a); border-radius: 8px;">
                  <h3 style="font-size: 16px; margin-bottom: 10px;">메인 섹션</h3>
                  <p style="line-height: 1.6; margin-bottom: 10px;">복잡한 그라디언트와 레이아웃을 포함한 섹션입니다.</p>
                  <div style="padding: 8px; background: rgba(255,255,255,0.8); border-radius: 4px;">중첩 요소</div>
                </div>
                <div style="flex: 1; padding: 16px; background: #e0e7ff; border-radius: 8px;">
                  <h3 style="font-size: 16px; margin-bottom: 10px;">사이드</h3>
                  <p style="line-height: 1.6;">추가 정보</p>
                </div>
              </div>
              <table style="width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background: #4f46e5; color: white;">
                  <th style="padding: 12px; text-align: left;">헤더 1</th>
                  <th style="padding: 12px; text-align: left;">헤더 2</th>
                </tr>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">데이터 1</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">값 1</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">데이터 2</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">값 2</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;

      await page.evaluate((html) => {
        const body = document.body;
        if (body) {
          body.innerHTML = html;
        }
      }, dummyHtml3);

      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      });

      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      console.log('[PRINTABLE-DEMO] Third warmup PDF generated');

      // 네 번째 PDF 생성 (PDF 엔진 완전 워밍업)
      const dummyHtml4 = `
        <div data-print-root="true">
          <div class="printable-pages">
            <div class="printable-page" style="padding: 20mm;">
              <div style="margin-bottom: 20px; padding: 20px; border: 3px solid #10b981; border-radius: 12px; background: #f0fdf4;">
                <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #047857;">네 번째 워밍업 - 최종 점검</h2>
                <p style="line-height: 1.7; color: #1f2937;">PDF 엔진의 모든 최적화가 완료되었는지 확인하는 마지막 단계입니다.</p>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
                <div style="padding: 16px; border: 2px dashed #6366f1; background: #eef2ff; border-radius: 8px;">
                  <strong style="display: block; margin-bottom: 8px;">박스 1</strong>
                  <span style="color: #64748b;">복잡한 보더 스타일</span>
                </div>
                <div style="padding: 16px; border: 2px dotted #ec4899; background: #fdf2f8; border-radius: 8px;">
                  <strong style="display: block; margin-bottom: 8px;">박스 2</strong>
                  <span style="color: #64748b;">다양한 배경색</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      await page.evaluate((html) => {
        const body = document.body;
        if (body) {
          body.innerHTML = html;
        }
      }, dummyHtml4);

      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      });

      await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      console.log('[PRINTABLE-DEMO] Fourth warmup PDF generated');

      // 페이지를 초기 상태로 리셋 (다음 요청을 위해)
      await page.evaluate(() => {
        const body = document.body;
        if (body) {
          body.innerHTML = '<div data-print-root="true"></div>';
        }
      });

      console.log('[PRINTABLE-DEMO] Warmup completed - PDF engine fully warmed up (4 PDFs generated)');

      // PDF 라우트를 실제 HTTP 요청으로 호출하여 Next.js 라우트 컴파일 강제 실행
      // 이렇게 해야 첫 번째 실제 요청 시 라우트 컴파일 비용이 발생하지 않음
      // 서버 내부에서 자기 자신에게 요청하므로 localhost 사용 (외부 URL보다 빠르고 안정적)
      try {
        const baseUrl = 'http://localhost:3000';
        console.log('[PRINTABLE-DEMO] Triggering PDF route compilation via HTTP request...');

        const response = await fetch(`${baseUrl}/api/printable-demo/pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: '<div>warmup request to trigger route compilation</div>'
          }),
        });

        if (response.ok) {
          // 응답 버퍼를 소비해야 연결이 정상 종료됨
          await response.arrayBuffer();
          console.log('[PRINTABLE-DEMO] PDF route compilation completed via HTTP request');
        } else {
          console.warn('[PRINTABLE-DEMO] PDF route HTTP warmup failed:', response.status);
        }
      } catch (error) {
        console.warn('[PRINTABLE-DEMO] PDF route HTTP warmup error (non-critical):', error instanceof Error ? error.message : error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Browser and page are ready"
    });
  } catch (error) {
    console.error("[printable-demo pdf warmup]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to warmup browser.";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

