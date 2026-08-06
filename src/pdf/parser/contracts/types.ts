export type PdfPrimitive =
  | null
  | boolean
  | number
  | string
  | PdfName
  | PdfHexString
  | PdfString
  | PdfArray
  | PdfDictionary
  | PdfRef;

export interface PdfName {
  kind: "name";
  value: string;
}

export interface PdfString {
  kind: "string";
  value: string;
}

export interface PdfHexString {
  kind: "hex";
  value: string;
}

export interface PdfRef {
  kind: "ref";
  objectNumber: number;
  generationNumber: number;
}

export type PdfArray = PdfPrimitive[];

export interface PdfDictionary {
  kind: "dict";
  value: Record<string, PdfPrimitive>;
}

export interface PdfHeader {
  version: string;
  binaryComment: boolean;
  offset: number;
}

export interface ByteRange {
  start: number;
  end: number;
}

export interface PdfIndirectObject {
  objectNumber: number;
  generationNumber: number;
  value: PdfPrimitive;
  byteRange: ByteRange;
  hasStream: boolean;
}

export interface PdfStreamObject extends PdfIndirectObject {
  stream: {
    dictionary: PdfDictionary;
    raw: Uint8Array;
    decoded?: Uint8Array;
    filters: string[];
  };
}

export type XRefEntry =
  | {
      kind: "free";
      objectNumber: number;
      generationNumber: number;
      nextFreeObjectNumber: number;
    }
  | {
      kind: "normal";
      objectNumber: number;
      generationNumber: number;
      offset: number;
    }
  | {
      kind: "compressed";
      objectNumber: number;
      objectStreamObjectNumber: number;
      objectStreamIndex: number;
    };

export interface PdfTrailer {
  size?: number;
  root?: PdfRef;
  prev?: number;
  info?: PdfRef;
  encrypt?: PdfRef;
  id?: PdfPrimitive;
  raw: PdfDictionary;
}

export interface PdfRevision {
  startXRefOffset: number;
  xrefEntries: XRefEntry[];
  trailer: PdfTrailer;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  offset?: number;
  recoverable: boolean;
}

export interface ValidationReport {
  issues: ValidationIssue[];
}

export interface ParserOptions {
  mode?: "strict" | "tolerant" | "forensic";
  decodeStreams?: "none" | "metadataOnly" | "safe";
  maxRevisions?: number;
}

export interface ParsedPdfDocument {
  header: PdfHeader;
  revisions: PdfRevision[];
  effectiveXRefEntries: XRefEntry[];
  objects: PdfIndirectObject[];
  validation: ValidationReport;
}
