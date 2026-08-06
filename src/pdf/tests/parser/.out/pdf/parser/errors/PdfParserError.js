"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfParserError = void 0;
class PdfParserError extends Error {
    code;
    offset;
    recoverable;
    constructor(code, message, offset, recoverable = false) {
        super(message);
        this.name = "PdfParserError";
        this.code = code;
        this.offset = offset;
        this.recoverable = recoverable;
    }
}
exports.PdfParserError = PdfParserError;
