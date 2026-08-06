"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const parser_1 = require("../../../parser");
(0, node_test_1.test)("parseHeader reads version", () => {
    const header = (0, parser_1.parseHeader)("%PDF-1.7\n%\x80\x80\x80\x80\n");
    strict_1.default.equal(header.version, "1.7");
});
(0, node_test_1.test)("PdfValueParser parses dictionary with reference", () => {
    const parser = new parser_1.PdfValueParser();
    const parsed = parser.parse("<< /Type /Catalog /Pages 3 0 R >>");
    strict_1.default.equal(parsed.value.kind, "dict");
    const dict = parsed.value;
    strict_1.default.equal(dict.value.Type.value, "Catalog");
    strict_1.default.equal(dict.value.Pages.kind, "ref");
});
(0, node_test_1.test)("parseClassicXrefRevision parses entries and trailer", () => {
    const text = [
        "xref",
        "0 2",
        "0000000000 65535 f ",
        "0000000010 00000 n ",
        "trailer",
        "<< /Size 2 /Root 1 0 R >>",
    ].join("\n");
    const rev = (0, parser_1.parseClassicXrefRevision)(text, 0);
    strict_1.default.equal(rev.xrefEntries.length, 2);
    strict_1.default.equal(rev.trailer.size, 2);
    strict_1.default.equal(rev.trailer.root?.objectNumber, 1);
});
