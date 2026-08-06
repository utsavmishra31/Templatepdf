import type { ContentOperator } from "../parser/ContentOperator";
import type { TextObject, TextRun } from "./TextRun";

export class TextExtractor {
  private operators: ContentOperator[];
  private textObjects: TextObject[] = [];
  private currentTextRuns: TextRun[] = [];
  private fontName: string = "";
  private fontSize: number = 12;
  private charSpacing: number = 0;
  private wordSpacing: number = 0;
  private horizontalScale: number = 100;
  private renderingMode: number = 0;
  private rise: number = 0;
  private textMatrix: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];

  public constructor(operators: ContentOperator[]) {
    this.operators = operators;
  }

  public extract(): TextObject[] {
    this.textObjects = [];
    this.currentTextRuns = [];

    for (const op of this.operators) {
      this.processOperator(op);
    }

    if (this.currentTextRuns.length > 0) {
      this.finishTextObject();
    }

    return this.textObjects;
  }

  private processOperator(op: ContentOperator): void {
    switch (op.type) {
      case "BT":
        this.currentTextRuns = [];
        break;

      case "ET":
        if (this.currentTextRuns.length > 0) {
          this.finishTextObject();
        }
        break;

      case "Tf":
        if (op.operands[0]) {
          this.fontName = String(op.operands[0]);
        }
        if (op.operands[1]) {
          this.fontSize = Number(op.operands[1]);
        }
        break;

      case "Tc":
        this.charSpacing = Number(op.operands[0]) || 0;
        break;

      case "Tw":
        this.wordSpacing = Number(op.operands[0]) || 0;
        break;

      case "Tz":
        this.horizontalScale = Number(op.operands[0]) || 100;
        break;

      case "Tr":
        this.renderingMode = Number(op.operands[0]) || 0;
        break;

      case "Ts":
        this.rise = Number(op.operands[0]) || 0;
        break;

      case "Tm":
        if (op.operands.length === 6) {
          this.textMatrix = op.operands as [number, number, number, number, number, number];
        }
        break;

      case "Td":
      case "TD":
      case "T*":
        if (op.operands.length >= 2) {
          const tx = Number(op.operands[0]) || 0;
          const ty = Number(op.operands[1]) || 0;
          this.textMatrix = [
            this.textMatrix[0],
            this.textMatrix[1],
            this.textMatrix[2],
            this.textMatrix[3],
            this.textMatrix[4] + tx,
            this.textMatrix[5] + ty,
          ];
        }
        break;

      case "Tj":
      case "'":
      case '"':
        const text = this.extractText(op.operands);
        if (text) {
          const run: TextRun = {
            text,
            fontName: this.fontName,
            fontSize: this.fontSize,
            x: this.textMatrix[4],
            y: this.textMatrix[5],
            matrix: this.textMatrix,
            charSpacing: this.charSpacing,
            wordSpacing: this.wordSpacing,
            horizontalScale: this.horizontalScale,
            renderingMode: this.renderingMode,
            rise: this.rise,
          };
          this.currentTextRuns.push(run);
        }
        break;

      case "TJ":
        const runs = this.extractTextFromArray(op.operands);
        this.currentTextRuns.push(...runs);
        break;
    }
  }

  private extractText(operands: (number | string | number[])[]): string {
    if (operands.length === 0) return "";

    const first = operands[0];
    if (typeof first === "string") {
      return first;
    }

    if (Array.isArray(first)) {
      return this.bytesToString(first);
    }

    return "";
  }

  private extractTextFromArray(operands: (number | string | number[])[]): TextRun[] {
    const runs: TextRun[] = [];

    if (!Array.isArray(operands[0])) {
      return runs;
    }

    const array = operands[0] as (number | string | number[])[];

    let currentX = this.textMatrix[4];

    for (const item of array) {
      if (typeof item === "string") {
        const run: TextRun = {
          text: item,
          fontName: this.fontName,
          fontSize: this.fontSize,
          x: currentX,
          y: this.textMatrix[5],
          matrix: this.textMatrix,
          charSpacing: this.charSpacing,
          wordSpacing: this.wordSpacing,
          horizontalScale: this.horizontalScale,
          renderingMode: this.renderingMode,
          rise: this.rise,
        };
        runs.push(run);

        currentX += item.length * (this.fontSize * this.horizontalScale) / 100;
      } else if (Array.isArray(item)) {
        const text = this.bytesToString(item);
        const run: TextRun = {
          text,
          fontName: this.fontName,
          fontSize: this.fontSize,
          x: currentX,
          y: this.textMatrix[5],
          matrix: this.textMatrix,
          charSpacing: this.charSpacing,
          wordSpacing: this.wordSpacing,
          horizontalScale: this.horizontalScale,
          renderingMode: this.renderingMode,
          rise: this.rise,
        };
        runs.push(run);

        currentX += text.length * (this.fontSize * this.horizontalScale) / 100;
      } else if (typeof item === "number") {
        currentX -= (item / 1000) * this.fontSize;
      }
    }

    return runs;
  }

  private bytesToString(bytes: number[]): string {
    return bytes.map((b) => String.fromCharCode(b)).join("");
  }

  private finishTextObject(): void {
    if (this.currentTextRuns.length === 0) return;

    const xs = this.currentTextRuns.map((r) => r.x);
    const ys = this.currentTextRuns.map((r) => r.y);

    const textObject: TextObject = {
      runs: this.currentTextRuns,
      boundingBox: {
        x1: Math.min(...xs),
        y1: Math.min(...ys),
        x2: Math.max(...xs) + Math.max(...this.currentTextRuns.map((r) => r.text.length * r.fontSize)),
        y2: Math.max(...ys) + Math.max(...this.currentTextRuns.map((r) => r.fontSize)),
      },
    };

    this.textObjects.push(textObject);
    this.currentTextRuns = [];
  }
}
