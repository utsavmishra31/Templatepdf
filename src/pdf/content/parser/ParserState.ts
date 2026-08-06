export interface GraphicsState {
  ctm: [number, number, number, number, number, number];
  lineWidth: number;
  lineJoin: number;
  lineCap: number;
  dashPattern: number[];
  strokeColor: number[];
  fillColor: number[];
  renderingMode: number;
  font: string | null;
  fontSize: number;
}

export interface TextState {
  fontName: string | null;
  fontSize: number;
  charSpacing: number;
  wordSpacing: number;
  horizontalScale: number;
  leading: number;
  renderingMode: number;
  rise: number;
  textMatrix: [number, number, number, number, number, number];
  lineMatrix: [number, number, number, number, number, number];
}

export interface ParserState {
  graphicsStateStack: GraphicsState[];
  currentGraphicsState: GraphicsState;
  textState: TextState | null;
  inTextObject: boolean;
  operandStack: (number | string | number[])[];
  errors: Array<{ message: string; offset: number; recoverable: boolean }>;
}

export const DEFAULT_GRAPHICS_STATE: GraphicsState = {
  ctm: [1, 0, 0, 1, 0, 0],
  lineWidth: 1,
  lineJoin: 0,
  lineCap: 0,
  dashPattern: [],
  strokeColor: [0],
  fillColor: [0],
  renderingMode: 0,
  font: null,
  fontSize: 12,
};

export const DEFAULT_TEXT_STATE: TextState = {
  fontName: null,
  fontSize: 12,
  charSpacing: 0,
  wordSpacing: 0,
  horizontalScale: 100,
  leading: 0,
  renderingMode: 0,
  rise: 0,
  textMatrix: [1, 0, 0, 1, 0, 0],
  lineMatrix: [1, 0, 0, 1, 0, 0],
};
