import { NextRequest, NextResponse } from "next/server";
import { isValidKey, overwriteDoc } from "@/lib/storage";

/**
 * ONLYOFFICE Document Server callback endpoint.
 *
 * ONLYOFFICE posts here when a document is saved or force-saved.
 * It MUST receive { "error": 0 } within 5 s or it retries.
 *
 * Relevant status codes:
 *   1 – document is being edited (no action needed)
 *   2 – ready for saving (user closed / explicitly saved)
 *   3 – save error from ONLYOFFICE (nothing to do)
 *   4 – no changes, closed (nothing to do)
 *   6 – force save in progress
 *   7 – force save error
 */
interface OOCallback {
  status: number;
  url?: string;
  key?: string;
  users?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const key = req.nextUrl.searchParams.get("key") ?? "";

  if (!isValidKey(key)) {
    return NextResponse.json({ error: 1 }, { status: 400 });
  }

  let body: OOCallback;
  try {
    body = (await req.json()) as OOCallback;
  } catch {
    return NextResponse.json({ error: 1 }, { status: 400 });
  }

  // Status 2 = user saved and closed; status 6 = force save
  if ((body.status === 2 || body.status === 6) && body.url) {
    try {
      // Download the updated file from ONLYOFFICE and persist it
      const response = await fetch(body.url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`ONLYOFFICE download failed with status ${response.status}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await overwriteDoc(key, buffer);
    } catch (err) {
      console.error("[callback] Failed to persist document:", err);
      return NextResponse.json({ error: 1 });
    }
  }

  return NextResponse.json({ error: 0 });
}
