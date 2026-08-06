"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIndirectObject = parseIndirectObject;
exports.parseStreamObject = parseStreamObject;
const node_zlib_1 = require("node:zlib");
const PdfParserError_1 = require("../errors/PdfParserError");
const PdfValueParser_1 = require("../objects/PdfValueParser");
function findObjectHeader(text, offset) {
    const slice = text.slice(offset, Math.min(offset + 60, text.length));
    const match = slice.match(/^\s*(\d+)\s+(\d+)\s+obj\b/);
    if (!match) {
        throw new PdfParserError_1.PdfParserError("OBJECT_HEADER_INVALID", "Invalid object header", offset);
    }
    const full = match[0];
    return {
        objectNumber: Number(match[1]),
        generationNumber: Number(match[2]),
        bodyStart: offset + full.length,
    };
}
function readLength(dict) {
    const lengthEntry = dict.value.Length;
    if (typeof lengthEntry === "number" && Number.isFinite(lengthEntry) && lengthEntry >= 0) {
        return Math.floor(lengthEntry);
    }
    if (lengthEntry?.kind === "ref") {
        return null;
    }
    return null;
}
function toFilterNames(dict) {
    const filter = dict.value.Filter;
    if (!filter) {
        return [];
    }
    if (filter.kind === "name") {
        return [filter.value];
    }
    if (Array.isArray(filter)) {
        return filter
            .filter((v) => typeof v === "object" && v !== null && v.kind === "name")
            .map((v) => v.value);
    }
    return [];
}
function decodeIfSupported(raw, filters) {
    if (filters.length === 0) {
        return raw;
    }
    if (filters.length === 1 && filters[0] === "FlateDecode") {
        return (0, node_zlib_1.inflateSync)(raw);
    }
    return undefined;
}
function parseIndirectObject(text, bytes, offset) {
    const header = findObjectHeader(text, offset);
    const valueParser = new PdfValueParser_1.PdfValueParser();
    const parsed = valueParser.parse(text, header.bodyStart);
    const afterValue = parsed.next;
    const tail = text.slice(afterValue, Math.min(afterValue + 1024, text.length));
    const endObjRel = tail.indexOf("endobj");
    if (endObjRel === -1) {
        throw new PdfParserError_1.PdfParserError("OBJECT_ENDOBJ_MISSING", "Object is missing endobj", afterValue);
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
function parseStreamObject(text, bytes, offset) {
    const base = parseIndirectObject(text, bytes, offset);
    if (!base.value || typeof base.value !== "object" || base.value.kind !== "dict") {
        throw new PdfParserError_1.PdfParserError("STREAM_DICT_REQUIRED", "Stream object must start with a dictionary", offset);
    }
    const dict = base.value;
    const streamStartMarker = text.indexOf("stream", base.valueEnd);
    if (streamStartMarker === -1 || streamStartMarker > base.objectEnd) {
        throw new PdfParserError_1.PdfParserError("STREAM_KEYWORD_MISSING", "Missing stream keyword", base.valueEnd);
    }
    let dataStart = streamStartMarker + "stream".length;
    if (text[dataStart] === "\r" && text[dataStart + 1] === "\n") {
        dataStart += 2;
    }
    else if (text[dataStart] === "\n" || text[dataStart] === "\r") {
        dataStart += 1;
    }
    const declaredLength = readLength(dict);
    let dataEnd = -1;
    if (declaredLength !== null) {
        dataEnd = dataStart + declaredLength;
    }
    else {
        dataEnd = text.indexOf("endstream", dataStart);
        if (dataEnd === -1) {
            throw new PdfParserError_1.PdfParserError("ENDSTREAM_MISSING", "Missing endstream", dataStart);
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
