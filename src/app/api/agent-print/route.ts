import { NextRequest, NextResponse } from "next/server";
import { getBrowser, getChromeExecutablePath } from "../printable-demo/pdf/route";
import { buildHtmlTemplate } from "../printable-demo/pdf/styles-cache";
import { acquireWarmupPage, releaseWarmupPage } from "../printable-demo/pdf/warmup/route";
import { uploadFileServerSide } from "./upload-helper";
import { parseJsonBody, wrapPrintableHtml } from "../print-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentPrintRequestBody {
  html?: string;
  agentId: string;
  printerId?: string;
  bin?: string;
  paperSize?: string;
  copies?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[AGENT-PRINT] ========================================");
  console.log("[AGENT-PRINT] 🚀 Request started");

  let page: Awaited<ReturnType<Awaited<ReturnType<typeof import("puppeteer").default.launch>>["newPage"]>> | null = null;
  let useWarmupPage = false;

  try {
    // 1. Parse request body
    console.log("[AGENT-PRINT] Step 1: Parsing request body");
    const body = await parseJsonBody(request);
    if (!body) {
      console.error("[AGENT-PRINT] ❌ Invalid request body");
      return NextResponse.json(
        { error: "Invalid request body", success: false },
        { status: 400 }
      );
    }

    const { html: providedHtml, agentId, printerId, bin, paperSize, copies } = body as AgentPrintRequestBody;

    if (!agentId) {
      console.error("[AGENT-PRINT] ❌ Missing required parameter: agentId");
      return NextResponse.json(
        { error: "agentId is required", success: false },
        { status: 400 }
      );
    }

    console.log(`[AGENT-PRINT] ✅ Request validated`);
    console.log(`[AGENT-PRINT]    - Agent ID: ${agentId}`);
    console.log(`[AGENT-PRINT]    - Printer ID: ${printerId || 'not specified'}`);
    console.log(`[AGENT-PRINT]    - Bin: ${bin || 'default'}`);
    console.log(`[AGENT-PRINT]    - Paper Size: ${paperSize || 'default'}`);
    console.log(`[AGENT-PRINT]    - Copies: ${copies || 1}`);

    // 2. Generate PDF (reuse logic from printable-demo)
    console.log("[AGENT-PRINT] Step 2: Generating PDF");
    const executablePath = getChromeExecutablePath();
    const pageAcquireStart = Date.now();

    const warmupPage = await acquireWarmupPage();
    if (warmupPage && !warmupPage.isClosed()) {
      page = warmupPage;
      useWarmupPage = true;
      console.log(`[AGENT-PRINT] ♻️  Reusing warmup page (took ${Date.now() - pageAcquireStart}ms)`);
    } else {
      const browser = await getBrowser(executablePath);
      page = await browser.newPage();
      console.log(`[AGENT-PRINT] 🆕 Created new page (took ${Date.now() - pageAcquireStart}ms)`);

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
        console.log(`[AGENT-PRINT] DOM update took ${Date.now() - domUpdateStart}ms`);

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
        console.log(`[AGENT-PRINT] Render wait took ${Date.now() - renderWaitStart}ms`);
      } else {
        const templateStart = Date.now();
        const htmlTemplate = buildHtmlTemplate(printableHtml);
        console.log(`[AGENT-PRINT] Template build took ${Date.now() - templateStart}ms`);

        const setContentStart = Date.now();
        await page.setContent(htmlTemplate, {
          waitUntil: "domcontentloaded",
        });
        console.log(`[AGENT-PRINT] setContent took ${Date.now() - setContentStart}ms`);
      }
      console.log(`[AGENT-PRINT] Total HTML processing took ${Date.now() - htmlProcessStart}ms`);
    } else {
      // Puppeteer도 내부 localhost로 접근 (외부 HTTPS URL 사용 시 SSL 문제 발생 가능)
      const port = process.env.PORT || '3000';
      const internalUrl = `http://localhost:${port}`;

      await page.goto(`${internalUrl}/(document-dev)/printable-demo`, {
        waitUntil: "domcontentloaded",
      });
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
    console.log(`[AGENT-PRINT] ✅ PDF generated successfully - ${pdfSizeKB} KB in ${Date.now() - pdfGenerateStart}ms`);

    // 3. Upload PDF to file-uploads v2 API using helper (FileService와 동일한 방식)
    console.log("[AGENT-PRINT] Step 3: Uploading PDF to file storage");
    const uploadStart = Date.now();
    const timestamp = Date.now();
    const fileName = `document-${timestamp}.pdf`;

    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    const uploadResult = await uploadFileServerSide(request, {
      file: pdfBlob,
      fileName: fileName,
      category: "general",
      entityType: "patient",
      description: "Agent print document",
    });

    console.log(`[AGENT-PRINT] ✅ File upload successful - took ${Date.now() - uploadStart}ms, UUID: ${uploadResult.uuid}`);

    // 4. Construct download URL (use backend URL for agent to access)
    const backendApiUrl = process.env.NEXT_PUBLIC_APP_API_URL;
    const contentUrl = `${backendApiUrl}/v2/file-uploads/${uploadResult.uuid}`;
    console.log(`[AGENT-PRINT] Download URL: ${contentUrl}`);

    // 5. Send print request directly to backend API (bypassing Next.js proxy)
    console.log(`[AGENT-PRINT] 📄 Starting print request (file upload succeeded)`);
    const printStart = Date.now();

    const cookieHeader = request.headers.get('cookie');
    const printPayload = {
      outputTypeCode: "ETC",
      agentId: agentId,
      contentType: "application/pdf",
      fileName: fileName,
      contentUrl: contentUrl,
      copies: copies || 1,
      ...(bin || paperSize ? {
        options: {
          ...(bin ? { bin } : {}),
          ...(paperSize ? { paperSize } : {}),
        }
      } : {}),
    };

    console.log(`[AGENT-PRINT] Print payload:`, JSON.stringify(printPayload, null, 2));

    // 직접 백엔드 API로 요청 (Next.js 프록시를 거치지 않음)
    // 프록시 경로(/api/printers)를 사용하면 결국 외부 HTTPS로 프록시되어 SSL 문제 발생
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
      console.error(`[AGENT-PRINT] ❌ Print request failed: ${printResponse.status} ${errorText}`);
      throw new Error(`프린터 출력 요청 실패 (${printResponse.status}): ${printResponse.statusText}`);
    }

    // Parse print result
    let printResult;
    try {
      printResult = await printResponse.json();
    } catch (parseError) {
      console.error(`[AGENT-PRINT] ❌ Failed to parse print response:`, parseError);
      throw new Error('프린터 출력 응답 파싱 실패');
    }

    console.log(`[AGENT-PRINT] ✅ Print request successful - took ${Date.now() - printStart}ms, Job ID: ${printResult.id}`);
    console.log(`[AGENT-PRINT] 🎉 Total request time: ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      jobId: printResult.id,
      message: printResult.message || "출력 작업이 생성되었습니다.",
      fileUuid: uploadResult.uuid,
    }, { status: 200 });

  } catch (error) {
    console.error("[AGENT-PRINT] ❌ Error occurred:", error);

    // Determine error message and status code
    let errorMessage = "문서 출력 중 오류가 발생했습니다";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('업로드')) {
        console.error("[AGENT-PRINT] ⚠️ Print request was NOT executed due to upload failure");
        statusCode = 502;
      } else if (error.message.includes('프린터')) {
        console.error("[AGENT-PRINT] ⚠️ File was uploaded but print request failed");
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


