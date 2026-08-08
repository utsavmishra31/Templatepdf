import { NextResponse } from "next/server";
import { compressPdf, type CompressMode } from "@/lib/server/pdf-compressor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PDF_MIME = "application/pdf";
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
const VALID_MODES = new Set<string>(["normal", "extreme"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = String(formData.get("mode") ?? "normal");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a PDF file first." }, { status: 400 });
    }

    const isPdf = file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ message: "Please upload a valid PDF file." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ message: "File is too large. Maximum allowed size is 100 MB." }, { status: 413 });
    }

    if (!VALID_MODES.has(mode)) {
      return NextResponse.json({ message: "Invalid mode." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const compressed = await compressPdf(buffer, mode as CompressMode);

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
