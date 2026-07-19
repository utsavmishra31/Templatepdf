import { NextResponse } from "next/server";
import { compressPdf, type PdfCompressQuality } from "@/lib/server/pdf-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PDF_MIME = "application/pdf";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const VALID_QUALITIES = new Set<string>(["screen", "ebook", "printer"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const quality = String(formData.get("quality") ?? "ebook");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a PDF file first." }, { status: 400 });
    }

    const isPdf = file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ message: "Please upload a valid PDF file." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ message: "File is too large. Maximum allowed size is 50 MB." }, { status: 413 });
    }

    if (!VALID_QUALITIES.has(quality)) {
      return NextResponse.json({ message: "Invalid quality setting." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const compressed = await compressPdf(buffer, quality as PdfCompressQuality);

    return new Response(new Uint8Array(compressed), {
      headers: {
        "Content-Type": PDF_MIME,
        "Cache-Control": "no-store",
        "x-original-size": String(file.size),
        "x-compressed-size": String(compressed.length),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF compression failed.";
    const status = message.includes("too large") ? 413 : 500;
    return NextResponse.json({ message }, { status });
  }
}
