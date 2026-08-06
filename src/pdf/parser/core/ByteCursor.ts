export class ByteCursor {
  private readonly bytes: Uint8Array;
  private readonly text: string;

  public constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.text = Buffer.from(bytes).toString("latin1");
  }

  public length(): number {
    return this.bytes.length;
  }

  public slice(start: number, end: number): Uint8Array {
    return this.bytes.slice(start, end);
  }

  public textSlice(start: number, end: number): string {
    return this.text.slice(start, end);
  }

  public toText(): string {
    return this.text;
  }

  public lastIndexOf(needle: string, from?: number): number {
    if (typeof from === "number") {
      return this.text.lastIndexOf(needle, from);
    }
    return this.text.lastIndexOf(needle);
  }

  public indexOf(needle: string, from = 0): number {
    return this.text.indexOf(needle, from);
  }
}
