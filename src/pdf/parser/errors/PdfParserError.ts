export class PdfParserError extends Error {
  public readonly code: string;
  public readonly offset?: number;
  public readonly recoverable: boolean;

  public constructor(code: string, message: string, offset?: number, recoverable = false) {
    super(message);
    this.name = "PdfParserError";
    this.code = code;
    this.offset = offset;
    this.recoverable = recoverable;
  }
}
