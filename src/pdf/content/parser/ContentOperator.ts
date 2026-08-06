export type ContentOperator = TextStateOperator | TextShowingOperator | GraphicsOperator | PathOperator;

// Text state operators
export interface TextStateOperator {
  type:
    | "BT"
    | "ET"
    | "Tf"
    | "Tc"
    | "Tw"
    | "Tz"
    | "TL"
    | "Tr"
    | "Ts"
    | "Tm"
    | "Td"
    | "TD"
    | "T*";
  operands: number[] | string[];
  offset: number;
}

// Text showing operators
export interface TextShowingOperator {
  type: "Tj" | "TJ" | "'" | '"';
  operands: (string | number[])[];
  offset: number;
}

// Graphics state operators
export interface GraphicsOperator {
  type: "q" | "Q" | "cm";
  operands: number[];
  offset: number;
}

// Path operators
export interface PathOperator {
  type: "m" | "l" | "c" | "re" | "S" | "f" | "B" | "n";
  operands: number[];
  offset: number;
}
