"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runParserBenchmark = runParserBenchmark;
const node_perf_hooks_1 = require("node:perf_hooks");
const parser_1 = require("../../../parser");
function padOffset(value) {
    return String(value).padStart(10, "0");
}
function makeSamplePdf() {
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
    const text = lines.join("\n");
    return Buffer.from(text, "latin1");
}
function runParserBenchmark(iterations = 1000) {
    const bytes = makeSamplePdf();
    const start = node_perf_hooks_1.performance.now();
    for (let i = 0; i < iterations; i += 1) {
        (0, parser_1.parsePdfDocument)(bytes, { mode: "strict" });
    }
    const ms = node_perf_hooks_1.performance.now() - start;
    return { iterations, ms, perRunMs: ms / iterations };
}
if (require.main === module) {
    const result = runParserBenchmark(500);
    // eslint-disable-next-line no-console
    console.log(result);
}
