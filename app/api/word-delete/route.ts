import { NextResponse } from "next/server";
import { enrichDocxWithPageMarkers } from "@/lib/server/word-backend";
import { deleteWordPages } from "@/lib/word-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

function parseSelectedPages(rawValue: FormDataEntryValue | null): number[] {
  if (typeof rawValue !== "string") {
    throw new Error("Select at least one page to delete.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("Selected pages payload is invalid.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Selected pages payload is invalid.");
  }

  const numbers = parsed
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0) as number[];

  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const selectedPages = parseSelectedPages(formData.get("selectedPages"));

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Upload a DOCX file first." }, { status: 400 });
    }

    const isDocx = file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      return NextResponse.json({ message: "Please upload a valid DOCX file." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ message: "File is too large. Maximum allowed size is 50 MB." }, { status: 413 });
    }

    if (!selectedPages.length) {
      return NextResponse.json({ message: "Select at least one page to delete." }, { status: 400 });
    }

    const sourceBuffer = await file.arrayBuffer();

    // Attempt to enrich the DOCX via LibreOffice so that its layout engine
    // writes `w:lastRenderedPageBreak` markers.  Our page splitter already
    // reads those, turning a heuristic into a true layout-aware detection.
    // Fall back to the original buffer if LibreOffice is unavailable.
    let workingBuffer: ArrayBuffer | Buffer = sourceBuffer;
    try {
      workingBuffer = await enrichDocxWithPageMarkers(sourceBuffer);
    } catch {
      // LibreOffice enrichment unavailable — proceed with original DOCX.
    }

    const result = await deleteWordPages(workingBuffer, selectedPages);

    return new Response(Buffer.from(result.bytes), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Cache-Control": "no-store",
        "x-removed-count": String(result.removedCount),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Word page deletion failed.";
    const status = message.includes("too large") ? 413 : 500;
    return NextResponse.json({ message }, { status });
  }
}
