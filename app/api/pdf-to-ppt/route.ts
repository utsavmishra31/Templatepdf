import { NextResponse } from "next/server";
import { convertPdfToPptx, PPTX_MIME } from "@/lib/server/word-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a PDF file first." }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ message: "Please upload a valid PDF file." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ message: "File is too large. Maximum allowed size is 50 MB." }, { status: 413 });
    }

    const buffer = await file.arrayBuffer();
    const pptxBuffer = await convertPdfToPptx(buffer);

    return new Response(new Uint8Array(pptxBuffer), {
      headers: {
        "Content-Type": PPTX_MIME,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF to PPT conversion failed.";
    const status = message.includes("too large") ? 413 : 500;
    return NextResponse.json({ message }, { status });
  }
}
