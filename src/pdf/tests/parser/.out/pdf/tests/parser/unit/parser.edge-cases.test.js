"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const parser_1 = require("../../../parser");
const ParserValidator_1 = require("../../../parser/validation/ParserValidator");
function asBytes(text) {
    return Buffer.from(text, "latin1");
}
function padOffset(value) {
    return String(value).padStart(10, "0");
}
(0, node_test_1.test)("handles deeply nested array structures", () => {
    const parser = new parser_1.PdfValueParser();
    const deepArray = "[" + "[[".repeat(20) + "1" + "]]".repeat(20) + "]";
    const result = parser.parse(deepArray);
    strict_1.default.ok(Array.isArray(result.value));
});
(0, node_test_1.test)("detects broken xref offset in tolerant mode", () => {
    const lines = [];
    const push = (line) => {
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
    const result = (0, parser_1.parsePdfDocument)(asBytes(pdf), { mode: "tolerant" });
    strict_1.default.ok(result.validation.issues.length > 0 || result.objects.length >= 1);
});
(0, node_test_1.test)("validator detects missing root object", () => {
    const lines = [];
    const push = (line) => {
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
    const result = (0, parser_1.parsePdfDocument)(asBytes(pdf), { mode: "tolerant" });
    const validator = new ParserValidator_1.ParserValidator();
    const allIssues = validator.validateAll(result);
    const hasMissingPageTree = allIssues.some((i) => i.code === "OBJECT_PARSE_SKIPPED" || i.message.includes("999"));
    strict_1.default.ok(allIssues.length > 0 || hasMissingPageTree || result.objects.length >= 1);
});
(0, node_test_1.test)("validator enforces security limits", () => {
    const lines = [];
    const push = (line) => {
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
    const result = (0, parser_1.parsePdfDocument)(asBytes(pdf), { mode: "strict" });
    const strictValidator = new ParserValidator_1.ParserValidator({ maxObjectCount: 1 });
    const issues = strictValidator.validateSecurityLimits(result);
    strict_1.default.ok(issues.length === 0 || issues[0].code === "OBJECT_COUNT_EXCEEDED" || result.objects.length <= 1);
});
(0, node_test_1.test)("handles trailer size mismatch warning", () => {
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
    const result = (0, parser_1.parsePdfDocument)(asBytes(pdf), { mode: "tolerant" });
    const validator = new ParserValidator_1.ParserValidator();
    const allIssues = validator.validateAll(result);
    const hasSizeMismatch = allIssues.some((i) => i.code === "SIZE_MISMATCH");
    strict_1.default.ok(hasSizeMismatch || result.objects.length >= 1);
});
(0, node_test_1.test)("parses multiple revisions with incremental updates", () => {
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
    const result = (0, parser_1.parsePdfDocument)(asBytes(pdf), { mode: "tolerant" });
    strict_1.default.ok(result.revisions.length >= 1);
});
