import { NextResponse } from "next/server";
import { convertPptToPdf } from "@/lib/server/word-backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a PPT file first." }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    const isPpt =
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.type === "application/vnd.ms-powerpoint" ||
      lowerName.endsWith(".pptx") ||
      lowerName.endsWith(".ppt");

    if (!isPpt) {
      return NextResponse.json({ message: "Please upload a valid PPT or PPTX file." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ message: "File is too large. Maximum allowed size is 50 MB." }, { status: 413 });
    }

    const buffer = await file.arrayBuffer();
    const pdfBuffer = await convertPptToPdf(buffer);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PPT to PDF conversion failed.";
    const status = message.includes("too large") ? 413 : 500;
    return NextResponse.json({ message }, { status });
  }
}
