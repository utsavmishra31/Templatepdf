"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentLexer = void 0;
const operators_1 = require("./operators");
class ContentLexer {
    text;
    pos = 0;
    tokens = [];
    constructor(bytes) {
        this.text = Buffer.from(bytes).toString("latin1");
    }
    tokenize() {
        this.tokens = [];
        this.pos = 0;
        while (this.pos < this.text.length) {
            this.skipWhitespace();
            if (this.pos >= this.text.length)
                break;
            const ch = this.text[this.pos];
            if (ch === "%") {
                this.skipComment();
                continue;
            }
            if (ch === "[") {
                this.tokens.push({ type: "array-open", value: "[", offset: this.pos, length: 1 });
                this.pos += 1;
                continue;
            }
            if (ch === "]") {
                this.tokens.push({ type: "array-close", value: "]", offset: this.pos, length: 1 });
                this.pos += 1;
                continue;
            }
            if (ch === "/") {
                this.readName();
                continue;
            }
            if (ch === "(") {
                this.readLiteralString();
                continue;
            }
            if (ch === "<") {
                if (this.text[this.pos + 1] === "<") {
                    this.pos += 2;
                    continue;
                }
                this.readHexString();
                continue;
            }
            if (ch === ">") {
                this.pos += 1;
                continue;
            }
            if (/[0-9+\-.]/.test(ch)) {
                this.readNumber();
                continue;
            }
            if (/[a-zA-Z*']/.test(ch)) {
                this.readOperatorOrName();
                continue;
            }
            this.pos += 1;
        }
        this.tokens.push({ type: "eof", value: "", offset: this.pos, length: 0 });
        return this.tokens;
    }
    skipWhitespace() {
        while (this.pos < this.text.length) {
            const ch = this.text[this.pos];
            if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f" || ch === "\0") {
                this.pos += 1;
                continue;
            }
            break;
        }
    }
    skipComment() {
        while (this.pos < this.text.length && this.text[this.pos] !== "\n" && this.text[this.pos] !== "\r") {
            this.pos += 1;
        }
    }
    readNumber() {
        const start = this.pos;
        if (this.text[this.pos] === "+" || this.text[this.pos] === "-") {
            this.pos += 1;
        }
        while (this.pos < this.text.length && /[0-9.]/.test(this.text[this.pos])) {
            this.pos += 1;
        }
        const numStr = this.text.slice(start, this.pos);
        const value = Number(numStr);
        this.tokens.push({
            type: "number",
            value,
            offset: start,
            length: this.pos - start,
        });
    }
    readName() {
        const start = this.pos;
        this.pos += 1;
        while (this.pos < this.text.length) {
            const ch = this.text[this.pos];
            if (/[\s\[\]()<>{}/%]/.test(ch))
                break;
            this.pos += 1;
        }
        const value = this.text.slice(start + 1, this.pos);
        this.tokens.push({
            type: "name",
            value,
            offset: start,
            length: this.pos - start,
        });
    }
    readLiteralString() {
        const start = this.pos;
        this.pos += 1;
        let depth = 1;
        let out = "";
        while (this.pos < this.text.length && depth > 0) {
            const ch = this.text[this.pos];
            if (ch === "\\") {
                this.pos += 1;
                if (this.pos < this.text.length) {
                    const nextCh = this.text[this.pos];
                    out += this.decodeEscape(nextCh);
                    this.pos += 1;
                }
            }
            else if (ch === "(") {
                depth += 1;
                out += ch;
                this.pos += 1;
            }
            else if (ch === ")") {
                depth -= 1;
                if (depth > 0) {
                    out += ch;
                }
                this.pos += 1;
            }
            else {
                out += ch;
                this.pos += 1;
            }
        }
        this.tokens.push({
            type: "string",
            value: out,
            offset: start,
            length: this.pos - start,
        });
    }
    readHexString() {
        const start = this.pos;
        this.pos += 1;
        let hexStr = "";
        while (this.pos < this.text.length && this.text[this.pos] !== ">") {
            const ch = this.text[this.pos];
            if (!/\s/.test(ch)) {
                hexStr += ch;
            }
            this.pos += 1;
        }
        if (this.pos < this.text.length && this.text[this.pos] === ">") {
            this.pos += 1;
        }
        this.tokens.push({
            type: "hex-string",
            value: hexStr,
            offset: start,
            length: this.pos - start,
        });
    }
    readOperatorOrName() {
        const start = this.pos;
        while (this.pos < this.text.length) {
            const ch = this.text[this.pos];
            if (/[\s\[\]()<>{}/%]/.test(ch))
                break;
            this.pos += 1;
        }
        const value = this.text.slice(start, this.pos);
        if ((0, operators_1.isOperator)(value)) {
            this.tokens.push({
                type: "operator",
                value,
                offset: start,
                length: this.pos - start,
            });
        }
        else {
            this.tokens.push({
                type: "name",
                value,
                offset: start,
                length: this.pos - start,
            });
        }
    }
    decodeEscape(ch) {
        switch (ch) {
            case "n":
                return "\n";
            case "r":
                return "\r";
            case "t":
                return "\t";
            case "b":
                return "\b";
            case "f":
                return "\f";
            case "(":
                return "(";
            case ")":
                return ")";
            case "\\":
                return "\\";
            default:
                if (/[0-7]/.test(ch)) {
                    let octal = ch;
                    let i = 1;
                    while (i < 3 && this.pos + i < this.text.length && /[0-7]/.test(this.text[this.pos + i])) {
                        octal += this.text[this.pos + i];
                        i += 1;
                    }
                    return String.fromCharCode(Number.parseInt(octal, 8));
                }
                return ch;
        }
    }
}
exports.ContentLexer = ContentLexer;
