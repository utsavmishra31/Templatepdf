"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const parser_1 = require("../../../parser");
function asBytes(text) {
    return Buffer.from(text, "latin1");
}
function padOffset(value) {
    return String(value).padStart(10, "0");
}
function buildMinimalPdf() {
    const lines = [];
    const push = (line) => {
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
(0, node_test_1.test)("parsePdfDocument parses a minimal valid PDF", () => {
    const pdf = buildMinimalPdf();
    const result = (0, parser_1.parsePdfDocument)(asBytes(pdf), { mode: "strict" });
    strict_1.default.equal(result.header.version, "1.4");
    strict_1.default.equal(result.revisions.length, 1);
    strict_1.default.equal(result.objects.length >= 2, true);
});
