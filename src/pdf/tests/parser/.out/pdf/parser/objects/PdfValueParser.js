"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfValueParser = void 0;
const PdfParserError_1 = require("../errors/PdfParserError");
const WHITESPACE = /[\u0000\t\n\f\r ]/;
const DELIMS = /[\s\[\]()<>\/{%}]/;
class PdfValueParser {
    parse(text, from = 0) {
        const i = this.skip(text, from);
        if (i >= text.length) {
            throw new PdfParserError_1.PdfParserError("UNEXPECTED_EOF", "Unexpected EOF while reading value", i);
        }
        const ch = text[i];
        if (ch === "/") {
            return this.parseName(text, i);
        }
        if (ch === "(") {
            return this.parseLiteralString(text, i);
        }
        if (ch === "<") {
            if (text[i + 1] === "<") {
                return this.parseDictionary(text, i);
            }
            return this.parseHexString(text, i);
        }
        if (ch === "[") {
            return this.parseArray(text, i);
        }
        if (ch === "n" && text.slice(i, i + 4) === "null") {
            return { value: null, next: i + 4 };
        }
        if (ch === "t" && text.slice(i, i + 4) === "true") {
            return { value: true, next: i + 4 };
        }
        if (ch === "f" && text.slice(i, i + 5) === "false") {
            return { value: false, next: i + 5 };
        }
        return this.parseNumberOrReference(text, i);
    }
    skip(text, from) {
        let i = from;
        while (i < text.length) {
            const ch = text[i];
            if (WHITESPACE.test(ch)) {
                i += 1;
                continue;
            }
            if (ch === "%") {
                while (i < text.length && text[i] !== "\n" && text[i] !== "\r") {
                    i += 1;
                }
                continue;
            }
            break;
        }
        return i;
    }
    parseName(text, from) {
        let i = from + 1;
        while (i < text.length && !DELIMS.test(text[i])) {
            i += 1;
        }
        const name = { kind: "name", value: text.slice(from + 1, i) };
        return { value: name, next: i };
    }
    parseLiteralString(text, from) {
        let depth = 0;
        let i = from;
        let out = "";
        while (i < text.length) {
            const ch = text[i];
            if (ch === "(") {
                depth += 1;
                if (depth > 1) {
                    out += ch;
                }
            }
            else if (ch === ")") {
                depth -= 1;
                if (depth === 0) {
                    const value = { kind: "string", value: out };
                    return { value, next: i + 1 };
                }
                out += ch;
            }
            else if (ch === "\\") {
                const next = text[i + 1] ?? "";
                out += next;
                i += 1;
            }
            else {
                out += ch;
            }
            i += 1;
        }
        throw new PdfParserError_1.PdfParserError("UNTERMINATED_STRING", "Unterminated literal string", from);
    }
    parseHexString(text, from) {
        const end = text.indexOf(">", from + 1);
        if (end === -1) {
            throw new PdfParserError_1.PdfParserError("UNTERMINATED_HEX", "Unterminated hex string", from);
        }
        const value = { kind: "hex", value: text.slice(from + 1, end).replace(/\s+/g, "") };
        return { value, next: end + 1 };
    }
    parseArray(text, from) {
        const arr = [];
        let i = from + 1;
        while (i < text.length) {
            i = this.skip(text, i);
            if (text[i] === "]") {
                return { value: arr, next: i + 1 };
            }
            const parsed = this.parse(text, i);
            arr.push(parsed.value);
            i = parsed.next;
        }
        throw new PdfParserError_1.PdfParserError("UNTERMINATED_ARRAY", "Unterminated array", from);
    }
    parseDictionary(text, from) {
        const dict = {};
        let i = from + 2;
        while (i < text.length) {
            i = this.skip(text, i);
            if (text[i] === ">" && text[i + 1] === ">") {
                const value = { kind: "dict", value: dict };
                return { value, next: i + 2 };
            }
            const keyResult = this.parseName(text, i);
            const key = keyResult.value.value;
            i = this.skip(text, keyResult.next);
            const valResult = this.parse(text, i);
            dict[key] = valResult.value;
            i = valResult.next;
        }
        throw new PdfParserError_1.PdfParserError("UNTERMINATED_DICT", "Unterminated dictionary", from);
    }
    parseNumberOrReference(text, from) {
        const first = this.parseNumber(text, from);
        let i = this.skip(text, first.next);
        const second = this.tryParseNumber(text, i);
        if (second) {
            i = this.skip(text, second.next);
            if (text[i] === "R") {
                const ref = {
                    kind: "ref",
                    objectNumber: first.value,
                    generationNumber: second.value,
                };
                return { value: ref, next: i + 1 };
            }
        }
        return { value: first.value, next: first.next };
    }
    tryParseNumber(text, from) {
        try {
            return this.parseNumber(text, from);
        }
        catch {
            return null;
        }
    }
    parseNumber(text, from) {
        let i = from;
        let token = "";
        while (i < text.length) {
            const ch = text[i];
            if (!/[0-9+\-.]/.test(ch)) {
                break;
            }
            token += ch;
            i += 1;
        }
        if (!token || token === "+" || token === "-" || token === ".") {
            throw new PdfParserError_1.PdfParserError("INVALID_NUMBER", "Invalid number token", from);
        }
        const value = Number(token);
        if (Number.isNaN(value)) {
            throw new PdfParserError_1.PdfParserError("INVALID_NUMBER", "Invalid number token", from);
        }
        return { value, next: i };
    }
}
exports.PdfValueParser = PdfValueParser;
