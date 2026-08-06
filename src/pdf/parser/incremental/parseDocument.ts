import type {
  ParsedPdfDocument,
  ParserOptions,
  PdfIndirectObject,
  PdfRevision,
  ValidationIssue,
  XRefEntry,
} from "../contracts/types";
import { ByteCursor } from "../core/ByteCursor";
import { PdfParserError } from "../errors/PdfParserError";
import { parseHeader } from "../header/parseHeader";
import { parseIndirectObject, parseStreamObject } from "../streams/parseStreamObject";
import { parseClassicXrefRevision, parseXrefStreamRevision } from "../xref/parseXref";

function findStartXRef(text: string): number {
  const marker = text.lastIndexOf("startxref");
  if (marker === -1) {
    throw new PdfParserError("STARTXREF_NOT_FOUND", "Missing startxref marker", text.length - 1);
  }
  const tail = text.slice(marker + "startxref".length, marker + "startxref".length + 64);
  const offsetMatch = tail.match(/\s*(\d+)/);
  if (!offsetMatch) {
    throw new PdfParserError("STARTXREF_INVALID", "Invalid startxref value", marker);
  }
  return Number(offsetMatch[1]);
}

function parseOneRevision(text: string, bytes: Uint8Array, offset: number): PdfRevision {
  const token = text.slice(offset, offset + 4);
  if (token === "xref") {
    return parseClassicXrefRevision(text, offset);
  }

  const streamObject = parseStreamObject(text, bytes, offset);
  return parseXrefStreamRevision(streamObject, offset);
}

function buildEffectiveIndex(revisions: PdfRevision[]): XRefEntry[] {
  const map = new Map<string, XRefEntry>();
  for (const revision of revisions) {
    for (const entry of revision.xrefEntries) {
      if (entry.kind === "compressed") {
        map.set(`${entry.objectNumber}:c`, entry);
      } else {
        map.set(`${entry.objectNumber}:${entry.generationNumber}`, entry);
      }
    }
  }
  return [...map.values()].sort((a, b) => a.objectNumber - b.objectNumber);
}

function parseObjectsFromEffectiveIndex(text: string, bytes: Uint8Array, index: XRefEntry[], issues: ValidationIssue[]): PdfIndirectObject[] {
  const objects: PdfIndirectObject[] = [];
  for (const entry of index) {
    if (entry.kind !== "normal") {
      continue;
    }

    try {
      const obj = parseIndirectObject(text, bytes, entry.offset);
      objects.push({
        objectNumber: obj.objectNumber,
        generationNumber: obj.generationNumber,
        value: obj.value,
        byteRange: { start: obj.rangeStart, end: obj.objectEnd },
        hasStream: text.indexOf("stream", obj.valueEnd) >= 0 && text.indexOf("stream", obj.valueEnd) < obj.objectEnd,
      });
    } catch (error) {
      const err = error as Error;
      issues.push({
        severity: "warning",
        code: "OBJECT_PARSE_SKIPPED",
        message: `Skipping object at offset ${entry.offset}: ${err.message}`,
        offset: entry.offset,
        recoverable: true,
      });
    }
  }

  return objects;
}

export function parsePdfDocument(bytes: Uint8Array, options: ParserOptions = {}): ParsedPdfDocument {
  const mode = options.mode ?? "strict";
  const cursor = new ByteCursor(bytes);
  const text = cursor.toText();
  const issues: ValidationIssue[] = [];

  const header = parseHeader(text);
  const revisions: PdfRevision[] = [];

  let nextOffset = findStartXRef(text);
  const maxRevisions = options.maxRevisions ?? 32;

  for (let count = 0; count < maxRevisions; count += 1) {
    const revision = parseOneRevision(text, bytes, nextOffset);
    revisions.unshift(revision);
    if (typeof revision.trailer.prev !== "number") {
      break;
    }
    nextOffset = revision.trailer.prev;
  }

  if (revisions.length >= maxRevisions) {
    issues.push({
      severity: "warning",
      code: "REVISION_LIMIT_REACHED",
      message: `Revision parse stopped at maxRevisions=${maxRevisions}`,
      recoverable: true,
    });
  }

  const effectiveXRefEntries = buildEffectiveIndex(revisions);
  const objects = parseObjectsFromEffectiveIndex(text, bytes, effectiveXRefEntries, issues);

  if (mode === "strict") {
    const hardError = issues.find((i) => i.severity === "error" && !i.recoverable);
    if (hardError) {
      throw new PdfParserError(hardError.code, hardError.message, hardError.offset, hardError.recoverable);
    }
  }

  return {
    header,
    revisions,
    effectiveXRefEntries,
    objects,
    validation: { issues },
  };
}
