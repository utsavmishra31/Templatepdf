"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTrailerDict = parseTrailerDict;
function toRef(value) {
    if (!value || typeof value !== "object") {
        return undefined;
    }
    const v = value;
    if (v.kind === "ref" && Number.isInteger(v.objectNumber) && Number.isInteger(v.generationNumber)) {
        return v;
    }
    return undefined;
}
function parseTrailerDict(dict) {
    const size = typeof dict.value.Size === "number" ? dict.value.Size : undefined;
    const prev = typeof dict.value.Prev === "number" ? dict.value.Prev : undefined;
    return {
        size,
        root: toRef(dict.value.Root),
        prev,
        info: toRef(dict.value.Info),
        encrypt: toRef(dict.value.Encrypt),
        id: dict.value.ID,
        raw: dict,
    };
}
