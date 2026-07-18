import { NextResponse } from "next/server";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { deleteWordPages } from "@/lib/word-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function ensureDomGlobals() {
  const globalWithDom = globalThis as unknown as Record<string, unknown>;

  if (!globalWithDom.DOMParser) {
    globalWithDom.DOMParser = DOMParser;
  }

  if (!globalWithDom.XMLSerializer) {
    globalWithDom.XMLSerializer = XMLSerializer;
  }
}

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
    ensureDomGlobals();

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

    if (!selectedPages.length) {
      return NextResponse.json({ message: "Select at least one page to delete." }, { status: 400 });
    }

    const sourceBuffer = await file.arrayBuffer();
    const result = await deleteWordPages(sourceBuffer, selectedPages);

    return new Response(Buffer.from(result.bytes), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Cache-Control": "no-store",
        "x-removed-count": String(result.removedCount),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Word page deletion failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
