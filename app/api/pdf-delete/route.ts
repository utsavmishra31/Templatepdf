import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      return NextResponse.json({ message: "Upload a PDF file first." }, { status: 400 });
    }

    if (!selectedPages.length) {
      return NextResponse.json({ message: "Select at least one page to delete." }, { status: 400 });
    }

    const sourceBuffer = await file.arrayBuffer();
    const source = await PDFDocument.load(sourceBuffer.slice(0));
    const totalPages = source.getPageCount();

    if (selectedPages.some((pageNumber) => pageNumber > totalPages)) {
      return NextResponse.json({ message: "One or more selected pages are out of range." }, { status: 400 });
    }

    if (selectedPages.length >= totalPages) {
      return NextResponse.json({ message: "You cannot delete all pages. Keep at least one page." }, { status: 400 });
    }

    const deleteSet = new Set(selectedPages);
    const keepIndices = Array.from({ length: totalPages }, (_, index) => index).filter((index) => !deleteSet.has(index + 1));

    const nextPdf = await PDFDocument.create();
    const copiedPages = await nextPdf.copyPages(source, keepIndices);
    copiedPages.forEach((page) => nextPdf.addPage(page));

    const bytes = await nextPdf.save();

    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "x-removed-count": String(deleteSet.size),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF page deletion failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
