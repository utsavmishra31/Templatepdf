import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/storage";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const DOCX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // ZIP / OOXML signature

export async function POST(req: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Field 'file' is required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json(
      { error: "Only .docx files are supported" },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify OOXML / ZIP magic bytes — reject disguised uploads
  const magic = [...buffer.slice(0, 4)];
  if (!DOCX_MAGIC.every((b, i) => b === magic[i])) {
    return NextResponse.json(
      { error: "File does not appear to be a valid DOCX" },
      { status: 415 },
    );
  }

  const meta = await saveUpload(buffer, file.name);
  return NextResponse.json(meta, { status: 201 });
}
