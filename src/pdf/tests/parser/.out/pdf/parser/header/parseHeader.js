"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHeader = parseHeader;
const PdfParserError_1 = require("../errors/PdfParserError");
function parseHeader(text) {
    const match = text.match(/^%PDF-(\d\.\d)/m);
    if (!match || match.index === undefined) {
        throw new PdfParserError_1.PdfParserError("HEADER_NOT_FOUND", "PDF header not found", 0);
    }
    const headerLineEnd = text.indexOf("\n", match.index);
    const nextLineStart = headerLineEnd >= 0 ? headerLineEnd + 1 : match.index + match[0].length;
    const nextLineEnd = text.indexOf("\n", nextLineStart);
    const nextLine = text.slice(nextLineStart, nextLineEnd >= 0 ? nextLineEnd : nextLineStart + 32);
    return {
        version: match[1],
        binaryComment: nextLine.startsWith("%") && /[^\x00-\x7f]/.test(nextLine),
        offset: match.index,
    };
}
