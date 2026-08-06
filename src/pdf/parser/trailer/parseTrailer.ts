import type { PdfDictionary, PdfRef, PdfTrailer } from "../contracts/types";

function toRef(value: unknown): PdfRef | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const v = value as PdfRef;
  if (v.kind === "ref" && Number.isInteger(v.objectNumber) && Number.isInteger(v.generationNumber)) {
    return v;
  }
  return undefined;
}

export function parseTrailerDict(dict: PdfDictionary): PdfTrailer {
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
