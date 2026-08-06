import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePdfDocument } from "../../../parser";

function asBytes(text: string): Uint8Array {
  return Buffer.from(text, "latin1");
}

function padOffset(value: number): string {
  return String(value).padStart(10, "0");
}

function buildMinimalPdf(): string {
  const lines: string[] = [];
  const push = (line: string): number => {
    const offset = Buffer.byteLength(lines.join("\n"), "latin1") + (lines.length > 0 ? 1 : 0);
    lines.push(line);
    return offset;
  };

  push("%PDF-1.4");
  const obj1Offset = push("1 0 obj");
  push("<< /Type /Catalog /Pages 2 0 R >>");
  push("endobj");
  const obj2Offset = push("2 0 obj");
  push("<< /Type /Pages /Count 0 /Kids [] >>");
  push("endobj");

  const xrefOffset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("0 3");
  push("0000000000 65535 f ");
  push(`${padOffset(obj1Offset)} 00000 n `);
  push(`${padOffset(obj2Offset)} 00000 n `);
  push("trailer");
  push("<< /Size 3 /Root 1 0 R >>");
  push("startxref");
  push(String(xrefOffset));
  push("%%EOF");

  return lines.join("\n");
}

test("parsePdfDocument parses a minimal valid PDF", () => {
  const pdf = buildMinimalPdf();

  const result = parsePdfDocument(asBytes(pdf), { mode: "strict" });
  assert.equal(result.header.version, "1.4");
  assert.equal(result.revisions.length, 1);
  assert.equal(result.objects.length >= 2, true);
});
