export type TokenType =
  | "number"
  | "name"
  | "string"
  | "hex-string"
  | "array-open"
  | "array-close"
  | "operator"
  | "eof";

export interface Token {
  type: TokenType;
  value: string | number;
  offset: number;
  length: number;
}
