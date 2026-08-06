"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePdfDocument = parsePdfDocument;
const ByteCursor_1 = require("../core/ByteCursor");
const PdfParserError_1 = require("../errors/PdfParserError");
const parseHeader_1 = require("../header/parseHeader");
const parseStreamObject_1 = require("../streams/parseStreamObject");
const parseXref_1 = require("../xref/parseXref");
function findStartXRef(text) {
    const marker = text.lastIndexOf("startxref");
    if (marker === -1) {
        throw new PdfParserError_1.PdfParserError("STARTXREF_NOT_FOUND", "Missing startxref marker", text.length - 1);
    }
    const tail = text.slice(marker + "startxref".length, marker + "startxref".length + 64);
    const offsetMatch = tail.match(/\s*(\d+)/);
    if (!offsetMatch) {
        throw new PdfParserError_1.PdfParserError("STARTXREF_INVALID", "Invalid startxref value", marker);
    }
    return Number(offsetMatch[1]);
}
function parseOneRevision(text, bytes, offset) {
    const token = text.slice(offset, offset + 4);
    if (token === "xref") {
        return (0, parseXref_1.parseClassicXrefRevision)(text, offset);
    }
    const streamObject = (0, parseStreamObject_1.parseStreamObject)(text, bytes, offset);
    return (0, parseXref_1.parseXrefStreamRevision)(streamObject, offset);
}
function buildEffectiveIndex(revisions) {
    const map = new Map();
    for (const revision of revisions) {
        for (const entry of revision.xrefEntries) {
            if (entry.kind === "compressed") {
                map.set(`${entry.objectNumber}:c`, entry);
            }
            else {
                map.set(`${entry.objectNumber}:${entry.generationNumber}`, entry);
            }
        }
    }
    return [...map.values()].sort((a, b) => a.objectNumber - b.objectNumber);
}
function parseObjectsFromEffectiveIndex(text, bytes, index, issues) {
    const objects = [];
    for (const entry of index) {
        if (entry.kind !== "normal") {
            continue;
        }
        try {
            const obj = (0, parseStreamObject_1.parseIndirectObject)(text, bytes, entry.offset);
            objects.push({
                objectNumber: obj.objectNumber,
                generationNumber: obj.generationNumber,
                value: obj.value,
                byteRange: { start: obj.rangeStart, end: obj.objectEnd },
                hasStream: text.indexOf("stream", obj.valueEnd) >= 0 && text.indexOf("stream", obj.valueEnd) < obj.objectEnd,
            });
        }
        catch (error) {
            const err = error;
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
function parsePdfDocument(bytes, options = {}) {
    const mode = options.mode ?? "strict";
    const cursor = new ByteCursor_1.ByteCursor(bytes);
    const text = cursor.toText();
    const issues = [];
    const header = (0, parseHeader_1.parseHeader)(text);
    const revisions = [];
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
            throw new PdfParserError_1.PdfParserError(hardError.code, hardError.message, hardError.offset, hardError.recoverable);
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
