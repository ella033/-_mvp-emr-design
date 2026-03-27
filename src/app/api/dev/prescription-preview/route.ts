import { NextRequest, NextResponse } from "next/server";
import { buildPrescriptionHtml, getMockPrescription } from "../../../../lib/prescription/buildHtml";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useFormPaper = searchParams.get("useFormPaper") !== "false";
    const showBackgroundImageParam = searchParams.get("showBackgroundImage");
    const showBackgroundImage =
      showBackgroundImageParam === null ? undefined : showBackgroundImageParam !== "false";
    const prescription = getMockPrescription();

    const html = buildPrescriptionHtml(prescription, {
      useFormPaper,
      showBackgroundImage,
    });

    return NextResponse.json({ html });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

