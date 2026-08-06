import type { PdfDictionary, PdfRevision, PdfStreamObject, XRefEntry } from "../contracts/types";
import { PdfParserError } from "../errors/PdfParserError";
import { PdfValueParser } from "../objects/PdfValueParser";
import { parseTrailerDict } from "../trailer/parseTrailer";

function parseXrefEntryLine(line: string, objectNumber: number): XRefEntry {
  const match = line.match(/^(\d{10})\s(\d{5})\s([nf])\s*$/);
  if (!match) {
    throw new PdfParserError("XREF_ENTRY_INVALID", `Invalid xref line: ${line}`);
  }

  const first = Number(match[1]);
  const generation = Number(match[2]);
  const flag = match[3];

  if (flag === "n") {
    return {
      kind: "normal",
      objectNumber,
      generationNumber: generation,
      offset: first,
    };
  }

  return {
    kind: "free",
    objectNumber,
    generationNumber: generation,
    nextFreeObjectNumber: first,
  };
}

export function parseClassicXrefRevision(text: string, startOffset: number): PdfRevision {
  let pos = startOffset;
  const xrefToken = text.slice(pos, pos + 4);
  if (xrefToken !== "xref") {
    throw new PdfParserError("XREF_EXPECTED", "Expected xref keyword", startOffset);
  }

  pos += 4;
  const entries: XRefEntry[] = [];

  while (pos < text.length) {
    while (/\s/.test(text[pos] ?? "")) {
      pos += 1;
    }
    if (text.slice(pos, pos + 7) === "trailer") {
      pos += 7;
      break;
    }

    const subsectionMatch = text.slice(pos, pos + 64).match(/^(\d+)\s+(\d+)/);
    if (!subsectionMatch) {
      throw new PdfParserError("XREF_SUBSECTION_INVALID", "Invalid xref subsection", pos);
    }

    const firstObject = Number(subsectionMatch[1]);
    const count = Number(subsectionMatch[2]);
    pos += subsectionMatch[0].length;
    pos = text.indexOf("\n", pos);
    if (pos === -1) {
      throw new PdfParserError("XREF_UNEXPECTED_EOF", "Unexpected EOF in xref subsection", startOffset);
    }
    pos += 1;

    for (let i = 0; i < count; i += 1) {
      const lineEnd = text.indexOf("\n", pos);
      if (lineEnd === -1) {
        throw new PdfParserError("XREF_UNEXPECTED_EOF", "Unexpected EOF in xref entries", pos);
      }
      const line = text.slice(pos, lineEnd).replace(/\r$/, "");
      entries.push(parseXrefEntryLine(line, firstObject + i));
      pos = lineEnd + 1;
    }
  }

  const parser = new PdfValueParser();
  const trailerValue = parser.parse(text, pos).value;
  if (!trailerValue || typeof trailerValue !== "object" || (trailerValue as PdfDictionary).kind !== "dict") {
    throw new PdfParserError("TRAILER_DICT_INVALID", "Trailer dictionary is invalid", pos);
  }

  return {
    startXRefOffset: startOffset,
    xrefEntries: entries,
    trailer: parseTrailerDict(trailerValue as PdfDictionary),
  };
}

function readEntryInt(bytes: Uint8Array, offset: number, width: number): number {
  let value = 0;
  for (let i = 0; i < width; i += 1) {
    value = (value << 8) + bytes[offset + i];
  }
  return value;
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((v): v is number => typeof v === "number");
}

export function parseXrefStreamRevision(streamObject: PdfStreamObject, startOffset: number): PdfRevision {
  const dict = streamObject.stream.dictionary;
  const type = dict.value.Type;
  if (!type || typeof type !== "object" || (type as { kind?: string }).kind !== "name" || (type as { value?: string }).value !== "XRef") {
    throw new PdfParserError("XREF_STREAM_TYPE_INVALID", "XRef stream must have /Type /XRef", startOffset);
  }

  const w = toNumberArray(dict.value.W);
  if (w.length !== 3) {
    throw new PdfParserError("XREF_STREAM_W_INVALID", "XRef stream has invalid /W entry", startOffset);
  }
  const entryLen = w[0] + w[1] + w[2];
  if (entryLen <= 0) {
    throw new PdfParserError("XREF_STREAM_ENTRY_LEN_INVALID", "XRef stream entry width is invalid", startOffset);
  }

  const size = typeof dict.value.Size === "number" ? dict.value.Size : undefined;
  if (!size || size <= 0) {
    throw new PdfParserError("XREF_STREAM_SIZE_INVALID", "XRef stream missing valid /Size", startOffset);
  }

  const index = toNumberArray(dict.value.Index);
  const ranges = index.length > 0 ? index : [0, size];

  const decoded = streamObject.stream.decoded;
  if (!decoded) {
    throw new PdfParserError("XREF_STREAM_DECODE_UNSUPPORTED", "XRef stream filter is unsupported", startOffset);
  }

  const entries: XRefEntry[] = [];
  let byteOffset = 0;
  for (let i = 0; i < ranges.length; i += 2) {
    const first = ranges[i];
    const count = ranges[i + 1];
    for (let j = 0; j < count; j += 1) {
      const t = w[0] === 0 ? 1 : readEntryInt(decoded, byteOffset, w[0]);
      const f2 = readEntryInt(decoded, byteOffset + w[0], w[1]);
      const f3 = readEntryInt(decoded, byteOffset + w[0] + w[1], w[2]);

      const objectNumber = first + j;
      if (t === 0) {
        entries.push({
          kind: "free",
          objectNumber,
          generationNumber: f3,
          nextFreeObjectNumber: f2,
        });
      } else if (t === 1) {
        entries.push({
          kind: "normal",
          objectNumber,
          generationNumber: f3,
          offset: f2,
        });
      } else if (t === 2) {
        entries.push({
          kind: "compressed",
          objectNumber,
          objectStreamObjectNumber: f2,
          objectStreamIndex: f3,
        });
      }

      byteOffset += entryLen;
    }
  }

  return {
    startXRefOffset: startOffset,
    xrefEntries: entries,
    trailer: parseTrailerDict(dict),
  };
}
