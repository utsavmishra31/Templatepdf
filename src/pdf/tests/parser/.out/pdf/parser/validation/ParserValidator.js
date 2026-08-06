"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserValidator = void 0;
const PdfParserError_1 = require("../errors/PdfParserError");
const DEFAULT_LIMITS = {
    maxObjectDepth: 64,
    maxArrayDepth: 32,
    maxDictionaryDepth: 32,
    maxStreamLengthBytes: 512 * 1024 * 1024,
    maxObjectCount: 1_000_000,
    maxStringLengthBytes: 32 * 1024 * 1024,
    maxStringDepth: 8,
};
class ParserValidator {
    limits;
    constructor(limits = {}) {
        this.limits = { ...DEFAULT_LIMITS, ...limits };
    }
    validateSecurityLimits(doc) {
        const issues = [];
        if (doc.objects.length > this.limits.maxObjectCount) {
            issues.push({
                severity: "error",
                code: "OBJECT_COUNT_EXCEEDED",
                message: `Object count ${doc.objects.length} exceeds limit ${this.limits.maxObjectCount}`,
                recoverable: false,
            });
        }
        for (const obj of doc.objects) {
            if (obj.hasStream) {
                const streamObj = obj;
                if (streamObj.stream?.raw?.length > this.limits.maxStreamLengthBytes) {
                    issues.push({
                        severity: "warning",
                        code: "STREAM_SIZE_EXCEEDED_SOFT",
                        message: `Stream in object ${obj.objectNumber} exceeds limit (${streamObj.stream.raw.length} > ${this.limits.maxStreamLengthBytes})`,
                        offset: obj.byteRange.start,
                        recoverable: true,
                    });
                }
            }
        }
        return issues;
    }
    validateSemanticConsistency(doc) {
        const issues = [];
        const lastRevision = doc.revisions[doc.revisions.length - 1];
        if (lastRevision?.trailer.size !== undefined) {
            const declaredSize = lastRevision.trailer.size;
            const effectiveCount = doc.effectiveXRefEntries.filter((e) => e.kind !== "free").length;
            if (declaredSize < effectiveCount) {
                issues.push({
                    severity: "warning",
                    code: "SIZE_MISMATCH",
                    message: `Trailer /Size (${declaredSize}) is less than effective object count (${effectiveCount})`,
                    recoverable: true,
                });
            }
        }
        if (lastRevision?.trailer.root === undefined) {
            issues.push({
                severity: "error",
                code: "ROOT_MISSING",
                message: "Trailer is missing required /Root entry",
                recoverable: false,
            });
        }
        if (lastRevision?.trailer.root) {
            const rootRef = lastRevision.trailer.root;
            const rootExists = doc.objects.some((o) => o.objectNumber === rootRef.objectNumber && o.generationNumber === rootRef.generationNumber);
            if (!rootExists) {
                issues.push({
                    severity: "error",
                    code: "ROOT_OBJECT_MISSING",
                    message: `Root object ${rootRef.objectNumber} ${rootRef.generationNumber} does not exist`,
                    recoverable: false,
                });
            }
        }
        return issues;
    }
    validateXrefConsistency(doc) {
        const issues = [];
        const objectMap = new Map();
        for (const entry of doc.effectiveXRefEntries) {
            const key = `${entry.objectNumber}:${entry.kind === "compressed" ? "c" : entry.generationNumber}`;
            const prev = objectMap.get(key);
            if (prev !== undefined) {
                issues.push({
                    severity: "warning",
                    code: "DUPLICATE_XREF_ENTRY",
                    message: `Duplicate xref entry for object ${entry.objectNumber}`,
                    recoverable: true,
                });
            }
            objectMap.set(key, 1);
        }
        return issues;
    }
    validateAll(doc) {
        return [
            ...doc.validation.issues,
            ...this.validateSecurityLimits(doc),
            ...this.validateSemanticConsistency(doc),
            ...this.validateXrefConsistency(doc),
        ];
    }
    throwIfHardErrors(issues) {
        const hardError = issues.find((i) => i.severity === "error" && !i.recoverable);
        if (hardError) {
            throw new PdfParserError_1.PdfParserError(hardError.code, hardError.message, hardError.offset, hardError.recoverable);
        }
    }
    getLimits() {
        return this.limits;
    }
}
exports.ParserValidator = ParserValidator;
