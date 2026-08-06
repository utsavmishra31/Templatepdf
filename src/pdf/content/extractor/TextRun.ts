export interface TextRun {
  text: string;
  fontName: string;
  fontSize: number;
  x: number;
  y: number;
  matrix: [number, number, number, number, number, number];
  charSpacing: number;
  wordSpacing: number;
  horizontalScale: number;
  renderingMode: number;
  rise: number;
}

export interface TextObject {
  runs: TextRun[];
  boundingBox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}
