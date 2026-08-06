import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHeader, PdfValueParser, parseClassicXrefRevision } from "../../../parser";

test("parseHeader reads version", () => {
  const header = parseHeader("%PDF-1.7\n%\x80\x80\x80\x80\n");
  assert.equal(header.version, "1.7");
});

test("PdfValueParser parses dictionary with reference", () => {
  const parser = new PdfValueParser();
  const parsed = parser.parse("<< /Type /Catalog /Pages 3 0 R >>");
  assert.equal((parsed.value as { kind: string }).kind, "dict");
  const dict = parsed.value as { value: Record<string, unknown> };
  assert.equal((dict.value.Type as { kind: string; value: string }).value, "Catalog");
  assert.equal((dict.value.Pages as { kind: string }).kind, "ref");
});

test("parseClassicXrefRevision parses entries and trailer", () => {
  const text = [
    "xref",
    "0 2",
    "0000000000 65535 f ",
    "0000000010 00000 n ",
    "trailer",
    "<< /Size 2 /Root 1 0 R >>",
  ].join("\n");

  const rev = parseClassicXrefRevision(text, 0);
  assert.equal(rev.xrefEntries.length, 2);
  assert.equal(rev.trailer.size, 2);
  assert.equal(rev.trailer.root?.objectNumber, 1);
});
