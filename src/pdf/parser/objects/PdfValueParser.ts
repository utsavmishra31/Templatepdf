import type {
  PdfArray,
  PdfDictionary,
  PdfHexString,
  PdfName,
  PdfPrimitive,
  PdfRef,
  PdfString,
} from "../contracts/types";
import { PdfParserError } from "../errors/PdfParserError";

const WHITESPACE = /[\u0000\t\n\f\r ]/;
const DELIMS = /[\s\[\]()<>\/{%}]/;

export interface ParseResult {
  value: PdfPrimitive;
  next: number;
}

export class PdfValueParser {
  public parse(text: string, from = 0): ParseResult {
    const i = this.skip(text, from);
    if (i >= text.length) {
      throw new PdfParserError("UNEXPECTED_EOF", "Unexpected EOF while reading value", i);
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

  private skip(text: string, from: number): number {
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

  private parseName(text: string, from: number): ParseResult {
    let i = from + 1;
    while (i < text.length && !DELIMS.test(text[i])) {
      i += 1;
    }
    const name: PdfName = { kind: "name", value: text.slice(from + 1, i) };
    return { value: name, next: i };
  }

  private parseLiteralString(text: string, from: number): ParseResult {
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
      } else if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          const value: PdfString = { kind: "string", value: out };
          return { value, next: i + 1 };
        }
        out += ch;
      } else if (ch === "\\") {
        const next = text[i + 1] ?? "";
        out += next;
        i += 1;
      } else {
        out += ch;
      }
      i += 1;
    }
    throw new PdfParserError("UNTERMINATED_STRING", "Unterminated literal string", from);
  }

  private parseHexString(text: string, from: number): ParseResult {
    const end = text.indexOf(">", from + 1);
    if (end === -1) {
      throw new PdfParserError("UNTERMINATED_HEX", "Unterminated hex string", from);
    }
    const value: PdfHexString = { kind: "hex", value: text.slice(from + 1, end).replace(/\s+/g, "") };
    return { value, next: end + 1 };
  }

  private parseArray(text: string, from: number): ParseResult {
    const arr: PdfArray = [];
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
    throw new PdfParserError("UNTERMINATED_ARRAY", "Unterminated array", from);
  }

  private parseDictionary(text: string, from: number): ParseResult {
    const dict: Record<string, PdfPrimitive> = {};
    let i = from + 2;
    while (i < text.length) {
      i = this.skip(text, i);
      if (text[i] === ">" && text[i + 1] === ">") {
        const value: PdfDictionary = { kind: "dict", value: dict };
        return { value, next: i + 2 };
      }
      const keyResult = this.parseName(text, i);
      const key = (keyResult.value as PdfName).value;
      i = this.skip(text, keyResult.next);
      const valResult = this.parse(text, i);
      dict[key] = valResult.value;
      i = valResult.next;
    }
    throw new PdfParserError("UNTERMINATED_DICT", "Unterminated dictionary", from);
  }

  private parseNumberOrReference(text: string, from: number): ParseResult {
    const first = this.parseNumber(text, from);
    let i = this.skip(text, first.next);
    const second = this.tryParseNumber(text, i);
    if (second) {
      i = this.skip(text, second.next);
      if (text[i] === "R") {
        const ref: PdfRef = {
          kind: "ref",
          objectNumber: first.value,
          generationNumber: second.value,
        };
        return { value: ref, next: i + 1 };
      }
    }
    return { value: first.value, next: first.next };
  }

  private tryParseNumber(text: string, from: number): { value: number; next: number } | null {
    try {
      return this.parseNumber(text, from);
    } catch {
      return null;
    }
  }

  private parseNumber(text: string, from: number): { value: number; next: number } {
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
      throw new PdfParserError("INVALID_NUMBER", "Invalid number token", from);
    }
    const value = Number(token);
    if (Number.isNaN(value)) {
      throw new PdfParserError("INVALID_NUMBER", "Invalid number token", from);
    }
    return { value, next: i };
  }
}
