import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 동의서 PDF 프록시 API Route
 * Azure Blob Storage의 CORS 문제를 해결하기 위해 서버에서 PDF를 프록시합니다.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ consentId: string }> | { consentId: string } }
) {
  try {
    // Next.js 15에서는 params와 cookies가 Promise일 수 있음
    const params = await Promise.resolve(context.params);
    const consentId = params.consentId;
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    console.log("[ConsentPDFProxy] Request received:", { consentId });

    if (!consentId) {
      console.error("[ConsentPDFProxy] Missing consentId");
      return NextResponse.json(
        { success: false, message: "consentId is required" },
        { status: 400 }
      );
    }

    // 백엔드 API URL 구성 (NEXT_PUBLIC_APP_API_URL에 /api가 포함되어 있을 수 있음)
    const backendApiUrl = process.env.NEXT_PUBLIC_APP_API_URL || "http://localhost:3000";
    const consentApiUrl = backendApiUrl.endsWith("/api")
      ? `${backendApiUrl}/consents/${encodeURIComponent(consentId)}`
      : `${backendApiUrl}/api/consents/${encodeURIComponent(consentId)}`;

    // 1. 백엔드에서 동의서 상세 정보 가져오기
    const cookieHeader = cookieStore
      .getAll()
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const consentResponse = await fetch(consentApiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!consentResponse.ok) {
      const errorText = await consentResponse.text();
      console.error("[ConsentPDFProxy] Failed to fetch consent:", consentResponse.status, errorText);
      return NextResponse.json(
        { success: false, message: errorText || "Failed to fetch consent" },
        { status: consentResponse.status }
      );
    }

    const consentData = await consentResponse.json();

    // 2. PDF blobUrl 추출
    if (
      !consentData?.content ||
      !("type" in consentData.content) ||
      consentData.content.type !== "PDF" ||
      !consentData.content.blobUrl
    ) {
      console.error("[ConsentPDFProxy] PDF content not found in response");
      return NextResponse.json(
        { success: false, message: "PDF content not found" },
        { status: 404 }
      );
    }

    const blobUrl = consentData.content.blobUrl;
    console.log("[ConsentPDFProxy] Fetching PDF from blob storage:", blobUrl);

    // 3. Azure Blob Storage에서 PDF 가져오기
    const pdfResponse = await fetch(blobUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!pdfResponse.ok) {
      console.error("[ConsentPDFProxy] Failed to fetch PDF from blob:", pdfResponse.status);
      return NextResponse.json(
        { success: false, message: "Failed to fetch PDF from blob storage" },
        { status: pdfResponse.status }
      );
    }

    // 4. PDF를 스트리밍으로 반환
    const pdfBlob = await pdfResponse.blob();
    const contentType = pdfResponse.headers.get("content-type") || "application/pdf";

    console.log("[ConsentPDFProxy] PDF proxied successfully, size:", pdfBlob.size);

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="consent-${consentId}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("[ConsentPDFProxy] Error:", error);
    console.error("[ConsentPDFProxy] Error stack:", error?.stack);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to proxy PDF",
      },
      { status: 500 }
    );
  }
}
