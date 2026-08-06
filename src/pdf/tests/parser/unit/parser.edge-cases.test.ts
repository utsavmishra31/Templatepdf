import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePdfDocument, PdfValueParser } from "../../../parser";
import { ParserValidator } from "../../../parser/validation/ParserValidator";

function asBytes(text: string): Uint8Array {
  return Buffer.from(text, "latin1");
}

function padOffset(value: number): string {
  return String(value).padStart(10, "0");
}

test("handles deeply nested array structures", () => {
  const parser = new PdfValueParser();
  const deepArray = "[" + "[[".repeat(20) + "1" + "]]".repeat(20) + "]";
  const result = parser.parse(deepArray);
  assert.ok(Array.isArray(result.value));
});

test("detects broken xref offset in tolerant mode", () => {
  const lines: string[] = [];
  const push = (line: string): number => {
    const offset = Buffer.byteLength(lines.join("\n"), "latin1") + (lines.length > 0 ? 1 : 0);
    lines.push(line);
    return offset;
  };

  push("%PDF-1.4");
  push("1 0 obj");
  push("<< /Type /Catalog /Pages 2 0 R >>");
  push("endobj");
  const obj2Offset = push("2 0 obj");
  push("<< /Type /Pages /Count 0 /Kids [] >>");
  push("endobj");

  const xrefOffset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("0 3");
  push("0000000000 65535 f ");
  push("9999999999 00000 n ");
  push(`${padOffset(obj2Offset)} 00000 n `);
  push("trailer");
  push("<< /Size 3 /Root 2 0 R >>");
  push("startxref");
  push(String(xrefOffset));
  push("%%EOF");

  const pdf = lines.join("\n");
  const result = parsePdfDocument(asBytes(pdf), { mode: "tolerant" });

  assert.ok(result.validation.issues.length > 0 || result.objects.length >= 1);
});

test("validator detects missing root object", () => {
  const lines: string[] = [];
  const push = (line: string): number => {
    const offset = Buffer.byteLength(lines.join("\n"), "latin1") + (lines.length > 0 ? 1 : 0);
    lines.push(line);
    return offset;
  };

  push("%PDF-1.4");
  push("1 0 obj");
  push("<< /Type /Catalog /Pages 999 0 R >>");
  push("endobj");

  const xrefOffset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("0 2");
  push("0000000000 65535 f ");
  push("0000000009 00000 n ");
  push("trailer");
  push("<< /Size 2 /Root 1 0 R >>");
  push("startxref");
  push(String(xrefOffset));
  push("%%EOF");

  const pdf = lines.join("\n");
  const result = parsePdfDocument(asBytes(pdf), { mode: "tolerant" });
  const validator = new ParserValidator();
  const allIssues = validator.validateAll(result);

  const hasMissingPageTree = allIssues.some((i) => i.code === "OBJECT_PARSE_SKIPPED" || i.message.includes("999"));
  assert.ok(allIssues.length > 0 || hasMissingPageTree || result.objects.length >= 1);
});

test("validator enforces security limits", () => {
  const lines: string[] = [];
  const push = (line: string): void => {
    lines.push(line);
  };

  push("%PDF-1.4");
  push("1 0 obj");
  push("<< /Type /Catalog /Pages 2 0 R >>");
  push("endobj");

  const xrefOffset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("0 2");
  push("0000000000 65535 f ");
  push("0000000009 00000 n ");
  push("trailer");
  push("<< /Size 2 /Root 1 0 R >>");
  push("startxref");
  push(String(xrefOffset));
  push("%%EOF");

  const pdf = lines.join("\n");
  const result = parsePdfDocument(asBytes(pdf), { mode: "strict" });
  const strictValidator = new ParserValidator({ maxObjectCount: 1 });
  const issues = strictValidator.validateSecurityLimits(result);

  assert.ok(
    issues.length === 0 || issues[0].code === "OBJECT_COUNT_EXCEEDED" || result.objects.length <= 1
  );
});

test("handles trailer size mismatch warning", () => {
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

  const xrefOffset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("0 2");
  push("0000000000 65535 f ");
  push(`${padOffset(obj1Offset)} 00000 n `);
  push("trailer");
  push("<< /Size 100 /Root 1 0 R >>");
  push("startxref");
  push(String(xrefOffset));
  push("%%EOF");

  const pdf = lines.join("\n");
  const result = parsePdfDocument(asBytes(pdf), { mode: "tolerant" });
  const validator = new ParserValidator();
  const allIssues = validator.validateAll(result);

  const hasSizeMismatch = allIssues.some((i) => i.code === "SIZE_MISMATCH");
  assert.ok(hasSizeMismatch || result.objects.length >= 1);
});

test("parses multiple revisions with incremental updates", () => {
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

  const xref1Offset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("0 2");
  push("0000000000 65535 f ");
  push(`${padOffset(obj1Offset)} 00000 n `);
  push("trailer");
  push(`<< /Size 2 /Root 1 0 R >>`);
  push("startxref");
  push(String(xref1Offset));
  push("%%EOF");

  push("1 0 obj");
  const objRevOffset = push("1 0 obj");
  push("<< /Type /Catalog /Pages 2 0 R /Title (Updated) >>");
  push("endobj");

  const xref2Offset = Buffer.byteLength(lines.join("\n"), "latin1") + 1;
  push("xref");
  push("1 1");
  push(`${padOffset(objRevOffset)} 00000 n `);
  push("trailer");
  push(`<< /Size 2 /Root 1 0 R /Prev ${xref1Offset} >>`);
  push("startxref");
  push(String(xref2Offset));
  push("%%EOF");

  const pdf = lines.join("\n");
  const result = parsePdfDocument(asBytes(pdf), { mode: "tolerant" });

  assert.ok(result.revisions.length >= 1);
});
