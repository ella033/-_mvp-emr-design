import { NextRequest, NextResponse } from "next/server";
import { getBrowser, getChromeExecutablePath } from "../printable-demo/pdf/route";
import { buildHtmlTemplate } from "../printable-demo/pdf/styles-cache";
import { acquireWarmupPage, releaseWarmupPage } from "../printable-demo/pdf/warmup/route";
import { uploadFileServerSide } from "../agent-print/upload-helper";
import { OutputTypeCode } from "@/types/printer-types";
import { parseJsonBody, wrapPrintableHtml } from "../print-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DirectPrintRequestBody {
  html?: string;
  agentId?: string;
  printerId?: string;
  bin?: string;
  paperSize?: string;
  copies?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[DIRECT-PRINT] ========================================");
  console.log("[DIRECT-PRINT] 🚀 Request started");

  let page: Awaited<ReturnType<Awaited<ReturnType<typeof import("puppeteer").default.launch>>["newPage"]>> | null = null;
  let useWarmupPage = false;

  try {
    // 1. Parse request body
    console.log("[DIRECT-PRINT] Step 1: Parsing request body");
    const body = await parseJsonBody(request);
    if (!body) {
      console.error("[DIRECT-PRINT] ❌ Invalid request body");
      return NextResponse.json(
        { error: "Invalid request body", success: false },
        { status: 400 }
      );
    }

    const { html: providedHtml, agentId, printerId, bin, paperSize, copies } = body as DirectPrintRequestBody;

    // agentId는 optional - 전달되지 않으면 서버에서 기본 에이전트를 사용하거나 에러 처리
    console.log(`[DIRECT-PRINT] ✅ Request validated`);
    console.log(`[DIRECT-PRINT]    - Agent ID: ${agentId || 'not specified (server default)'}`);
    console.log(`[DIRECT-PRINT]    - Printer ID: ${printerId || 'not specified'}`);
    console.log(`[DIRECT-PRINT]    - Bin: ${bin || 'default'}`);
    console.log(`[DIRECT-PRINT]    - Paper Size: ${paperSize || 'default'}`);
    console.log(`[DIRECT-PRINT]    - Copies: ${copies || 1}`);
    console.log(`[DIRECT-PRINT]    - Output Type: ${OutputTypeCode.CERTIFICATE}`);

    // 2. Generate PDF (reuse logic from printable-demo)
    console.log("[DIRECT-PRINT] Step 2: Generating PDF");
    const executablePath = getChromeExecutablePath();
    const pageAcquireStart = Date.now();

    const warmupPage = await acquireWarmupPage();
    if (warmupPage && !warmupPage.isClosed()) {
      page = warmupPage;
      useWarmupPage = true;
      console.log(`[DIRECT-PRINT] ♻️  Reusing warmup page (took ${Date.now() - pageAcquireStart}ms)`);
    } else {
      const browser = await getBrowser(executablePath);
      page = await browser.newPage();
      console.log(`[DIRECT-PRINT] 🆕 Created new page (took ${Date.now() - pageAcquireStart}ms)`);

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const url = req.url();

        if (url.startsWith('http://') || url.startsWith('https://')) {
          if (!url.startsWith('data:') && !url.startsWith('file://')) {
            req.abort();
            return;
          }
        }

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
        await page.evaluate((html) => {
          const body = document.body;
          if (body) {
            body.innerHTML = html;
          }
        }, printableHtml);
        console.log(`[DIRECT-PRINT] DOM update took ${Date.now() - domUpdateStart}ms`);

        const renderWaitStart = Date.now();
        try {
          await page.waitForSelector('[data-print-root]', { timeout: 1000 });
        } catch {
          // Continue even if timeout
        }

        await page.evaluate(() => {
          return new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          });
        });
        console.log(`[DIRECT-PRINT] Render wait took ${Date.now() - renderWaitStart}ms`);
      } else {
        const templateStart = Date.now();
        const htmlTemplate = buildHtmlTemplate(printableHtml);
        console.log(`[DIRECT-PRINT] Template build took ${Date.now() - templateStart}ms`);

        const setContentStart = Date.now();
        await page.setContent(htmlTemplate, {
          waitUntil: "domcontentloaded",
        });
        console.log(`[DIRECT-PRINT] setContent took ${Date.now() - setContentStart}ms`);
      }
      console.log(`[DIRECT-PRINT] Total HTML processing took ${Date.now() - htmlProcessStart}ms`);
    } else {
      console.error("[DIRECT-PRINT] ❌ No HTML content provided");
      return NextResponse.json(
        { error: "HTML content is required", success: false },
        { status: 400 }
      );
    }

    if (!useWarmupPage) {
      await page.emulateMediaType('print');
    }

    const pdfGenerateStart = Date.now();
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const pdfSizeKB = (pdfBuffer.length / 1024).toFixed(2);
    console.log(`[DIRECT-PRINT] ✅ PDF generated successfully - ${pdfSizeKB} KB in ${Date.now() - pdfGenerateStart}ms`);

    // 3. Upload PDF to file-uploads v2 API using helper (FileService와 동일한 방식)
    console.log("[DIRECT-PRINT] Step 3: Uploading PDF to file storage");
    const uploadStart = Date.now();
    const timestamp = Date.now();
    const fileName = `certificate-${timestamp}.pdf`;

    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    const uploadResult = await uploadFileServerSide(request, {
      file: pdfBlob,
      fileName: fileName,
      category: "general",
      entityType: "patient",
      description: "Direct print certificate document",
    });

    console.log(`[DIRECT-PRINT] ✅ File upload successful - took ${Date.now() - uploadStart}ms, UUID: ${uploadResult.uuid}`);

    // 4. Construct download URL (use backend URL for agent to access)
    const backendApiUrl = process.env.NEXT_PUBLIC_APP_API_URL;
    const contentUrl = `${backendApiUrl}/v2/file-uploads/${uploadResult.uuid}`;
    console.log(`[DIRECT-PRINT] Download URL: ${contentUrl}`);

    // 5. Send print request directly to backend API (bypassing Next.js proxy)
    console.log(`[DIRECT-PRINT] 📄 Starting print request (file upload succeeded)`);
    const printStart = Date.now();

    const cookieHeader = request.headers.get('cookie');
    const printPayload: Record<string, unknown> = {
      outputTypeCode: OutputTypeCode.CERTIFICATE,
      contentType: "application/pdf",
      fileName: fileName,
      contentUrl: contentUrl,
      copies: copies || 1,
    };

    // agentId가 있을 때만 추가
    if (agentId) {
      printPayload.agentId = agentId;
    }

    // bin 또는 paperSize가 있을 때만 options 추가
    if (bin || paperSize) {
      printPayload.options = {
        ...(bin ? { bin } : {}),
        ...(paperSize ? { paperSize } : {}),
      };
    }

    console.log(`[DIRECT-PRINT] Print payload:`, JSON.stringify(printPayload, null, 2));

    // 직접 백엔드 API로 요청 (Next.js 프록시를 거치지 않음)
    const backendPrintUrl = `${backendApiUrl}/printers`;
    const printResponse = await fetch(backendPrintUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { 'cookie': cookieHeader } : {}),
      },
      body: JSON.stringify(printPayload),
    });

    // Check if print request was successful
    if (!printResponse.ok) {
      const errorText = await printResponse.text();
      console.error(`[DIRECT-PRINT] ❌ Print request failed: ${printResponse.status} ${errorText}`);
      throw new Error(`프린터 출력 요청 실패 (${printResponse.status}): ${printResponse.statusText}`);
    }

    // Parse print result
    let printResult;
    try {
      printResult = await printResponse.json();
    } catch (parseError) {
      console.error(`[DIRECT-PRINT] ❌ Failed to parse print response:`, parseError);
      throw new Error('프린터 출력 응답 파싱 실패');
    }

    console.log(`[DIRECT-PRINT] ✅ Print request successful - took ${Date.now() - printStart}ms, Job ID: ${printResult.id}`);
    console.log(`[DIRECT-PRINT] 🎉 Total request time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      jobId: printResult.id,
      message: printResult.message || "출력 작업이 생성되었습니다.",
      fileUuid: uploadResult.uuid,
    }, { status: 200 });

  } catch (error) {
    console.error("[DIRECT-PRINT] ❌ Error occurred:", error);

    // Determine error message and status code
    let errorMessage = "문서 출력 중 오류가 발생했습니다";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('업로드')) {
        console.error("[DIRECT-PRINT] ⚠️ Print request was NOT executed due to upload failure");
        statusCode = 502;
      } else if (error.message.includes('프린터')) {
        console.error("[DIRECT-PRINT] ⚠️ File was uploaded but print request failed");
        statusCode = 503;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false
      },
      { status: statusCode }
    );
  } finally {
    if (page && !page.isClosed()) {
      if (useWarmupPage) {
        releaseWarmupPage();
      } else {
        await page.close();
      }
    }
  }
}


