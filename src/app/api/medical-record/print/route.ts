import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MedicalRecordPrintRequestBody {
  contentBase64?: string;
  fileName?: string;
  copies?: number;
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const isJsonRequest = contentType.includes("application/json");
  if (!isJsonRequest) {
    return NextResponse.json(
      { success: false, message: "Invalid content type" },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json()) as MedicalRecordPrintRequestBody;
    const hasContent = Boolean(body.contentBase64);
    if (!hasContent) {
      return NextResponse.json(
        { success: false, message: "contentBase64 is required" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: `mock-medical-record-${Date.now()}`,
        message: "Mock 진료기록부 출력 요청 완료",
        fileName: body.fileName || "medical-record.png",
        copies: body.copies ?? 1,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}
