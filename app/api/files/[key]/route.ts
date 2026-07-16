import { NextRequest, NextResponse } from "next/server";
import { docExists, isValidKey, readDoc } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
): Promise<NextResponse> {
  const { key } = await params;

  if (!isValidKey(key)) {
    return NextResponse.json({ error: "Invalid document key" }, { status: 400 });
  }

  if (!(await docExists(key))) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const buffer = await readDoc(key);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `inline; filename="document.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
