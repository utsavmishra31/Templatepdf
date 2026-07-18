import { NextResponse } from "next/server";
import { generateWordPreviewPdf } from "@/lib/server/word-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a DOCX file first." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const pdfBuffer = await generateWordPreviewPdf(buffer);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Word preview generation failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}