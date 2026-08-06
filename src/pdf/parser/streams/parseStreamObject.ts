import { inflateSync } from "node:zlib";
import type { PdfDictionary, PdfName, PdfPrimitive, PdfRef, PdfStreamObject } from "../contracts/types";
import { PdfParserError } from "../errors/PdfParserError";
import { PdfValueParser } from "../objects/PdfValueParser";

interface ParseObjectResult {
  objectNumber: number;
  generationNumber: number;
  value: PdfPrimitive;
  rangeStart: number;
  valueEnd: number;
  objectEnd: number;
}

function findObjectHeader(text: string, offset: number): { objectNumber: number; generationNumber: number; bodyStart: number } {
  const slice = text.slice(offset, Math.min(offset + 60, text.length));
  const match = slice.match(/^\s*(\d+)\s+(\d+)\s+obj\b/);
  if (!match) {
    throw new PdfParserError("OBJECT_HEADER_INVALID", "Invalid object header", offset);
  }
  const full = match[0];
  return {
    objectNumber: Number(match[1]),
    generationNumber: Number(match[2]),
    bodyStart: offset + full.length,
  };
}

function readLength(dict: PdfDictionary): number | null {
  const lengthEntry = dict.value.Length;
  if (typeof lengthEntry === "number" && Number.isFinite(lengthEntry) && lengthEntry >= 0) {
    return Math.floor(lengthEntry);
  }
  if ((lengthEntry as PdfRef | undefined)?.kind === "ref") {
    return null;
  }
  return null;
}

function toFilterNames(dict: PdfDictionary): string[] {
  const filter = dict.value.Filter;
  if (!filter) {
    return [];
  }
  if ((filter as PdfName).kind === "name") {
    return [(filter as PdfName).value];
  }
  if (Array.isArray(filter)) {
    return filter
      .filter((v): v is PdfName => typeof v === "object" && v !== null && (v as PdfName).kind === "name")
      .map((v) => v.value);
  }
  return [];
}

function decodeIfSupported(raw: Uint8Array, filters: string[]): Uint8Array | undefined {
  if (filters.length === 0) {
    return raw;
  }

  if (filters.length === 1 && filters[0] === "FlateDecode") {
    return inflateSync(raw);
  }

  return undefined;
}

export function parseIndirectObject(text: string, bytes: Uint8Array, offset: number): ParseObjectResult {
  const header = findObjectHeader(text, offset);
  const valueParser = new PdfValueParser();
  const parsed = valueParser.parse(text, header.bodyStart);

  const afterValue = parsed.next;
  const tail = text.slice(afterValue, Math.min(afterValue + 1024, text.length));
  const endObjRel = tail.indexOf("endobj");
  if (endObjRel === -1) {
    throw new PdfParserError("OBJECT_ENDOBJ_MISSING", "Object is missing endobj", afterValue);
  }

  const objectEnd = afterValue + endObjRel + "endobj".length;
  return {
    objectNumber: header.objectNumber,
    generationNumber: header.generationNumber,
    value: parsed.value,
    rangeStart: offset,
    valueEnd: parsed.next,
    objectEnd,
  };
}

export function parseStreamObject(text: string, bytes: Uint8Array, offset: number): PdfStreamObject {
  const base = parseIndirectObject(text, bytes, offset);
  if (!base.value || typeof base.value !== "object" || (base.value as PdfDictionary).kind !== "dict") {
    throw new PdfParserError("STREAM_DICT_REQUIRED", "Stream object must start with a dictionary", offset);
  }

  const dict = base.value as PdfDictionary;
  const streamStartMarker = text.indexOf("stream", base.valueEnd);
  if (streamStartMarker === -1 || streamStartMarker > base.objectEnd) {
    throw new PdfParserError("STREAM_KEYWORD_MISSING", "Missing stream keyword", base.valueEnd);
  }

  let dataStart = streamStartMarker + "stream".length;
  if (text[dataStart] === "\r" && text[dataStart + 1] === "\n") {
    dataStart += 2;
  } else if (text[dataStart] === "\n" || text[dataStart] === "\r") {
    dataStart += 1;
  }

  const declaredLength = readLength(dict);
  let dataEnd = -1;
  if (declaredLength !== null) {
    dataEnd = dataStart + declaredLength;
  } else {
    dataEnd = text.indexOf("endstream", dataStart);
    if (dataEnd === -1) {
      throw new PdfParserError("ENDSTREAM_MISSING", "Missing endstream", dataStart);
    }
  }

  const raw = bytes.slice(dataStart, dataEnd);
  const filters = toFilterNames(dict);

  return {
    objectNumber: base.objectNumber,
    generationNumber: base.generationNumber,
    value: base.value,
    byteRange: { start: base.rangeStart, end: base.objectEnd },
    hasStream: true,
    stream: {
      dictionary: dict,
      raw,
      decoded: decodeIfSupported(raw, filters),
      filters,
    },
  };
}
