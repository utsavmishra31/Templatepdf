import { test, describe } from "node:test";
import assert from "node:assert";
import { ContentLexer } from "../../../content/lexer/ContentLexer";
import { ContentParser } from "../../../content/parser/ContentParser";

function parseContentStream(text: string) {
  const bytes = new TextEncoder().encode(text);
  const lexer = new ContentLexer(bytes);
  const tokens = lexer.tokenize();
  const parser = new ContentParser(tokens);
  return parser.parse();
}

describe("ContentParser", () => {
  test("parses text state operator BT/ET", () => {
    const result = parseContentStream("BT ET");
    assert.strictEqual(result.operators.length, 2);
    assert.strictEqual(result.operators[0].type, "BT");
    assert.strictEqual(result.operators[1].type, "ET");
  });

  test("parses font operator Tf", () => {
    const result = parseContentStream("/F1 12 Tf");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tf");
    assert.strictEqual(result.operators[0].operands[0], "F1");
    assert.strictEqual(result.operators[0].operands[1], 12);
  });

  test("parses text position operator Tm", () => {
    const result = parseContentStream("1 0 0 1 100 200 Tm");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tm");
    const tm = result.operators[0].operands as number[];
    assert.deepStrictEqual(tm, [1, 0, 0, 1, 100, 200]);
  });

  test("parses text showing operator Tj", () => {
    const result = parseContentStream("(Hello) Tj");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tj");
    assert.strictEqual(result.operators[0].operands[0], "Hello");
  });

  test("parses graphics state operators q/Q", () => {
    const result = parseContentStream("q 1 w Q");
    assert(result.operators.some((op) => op.type === "q"));
    assert(result.operators.some((op) => op.type === "Q"));
  });

  test("detects operator arity mismatch", () => {
    const result = parseContentStream("/F1 Tf");
    assert(result.errors.length > 0);
    assert(result.errors[0].message.includes("requires 2 operands"));
  });

  test("parses character spacing operator Tc", () => {
    const result = parseContentStream("1.5 Tc");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tc");
    assert.strictEqual(result.operators[0].operands[0], 1.5);
  });

  test("parses word spacing operator Tw", () => {
    const result = parseContentStream("2.0 Tw");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tw");
    assert.strictEqual(result.operators[0].operands[0], 2.0);
  });

  test("parses horizontal scale operator Tz", () => {
    const result = parseContentStream("100 Tz");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tz");
    assert.strictEqual(result.operators[0].operands[0], 100);
  });

  test("parses text rendering mode operator Tr", () => {
    const result = parseContentStream("0 Tr");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tr");
    assert.strictEqual(result.operators[0].operands[0], 0);
  });

  test("parses text rise operator Ts", () => {
    const result = parseContentStream("5 Ts");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Ts");
    assert.strictEqual(result.operators[0].operands[0], 5);
  });

  test("parses TJ operator with array", () => {
    const result = parseContentStream("[(Hello) -50 (World)] TJ");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "TJ");
    assert(Array.isArray(result.operators[0].operands[0]));
  });

  test("parses leading operator TL", () => {
    const result = parseContentStream("14 TL");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "TL");
    assert.strictEqual(result.operators[0].operands[0], 14);
  });

  test("parses text position operators Td/TD", () => {
    const result = parseContentStream("10 20 Td");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Td");
    assert.deepStrictEqual(result.operators[0].operands, [10, 20]);
  });

  test("parses text position operator T*", () => {
    const result = parseContentStream("T*");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "T*");
    assert.strictEqual(result.operators[0].operands.length, 0);
  });

  test("parses complex content stream", () => {
    const stream = `
      BT
      /F1 12 Tf
      1 0 0 1 100 200 Tm
      (Hello World) Tj
      1.5 Tc
      0 14 Td
      (Next line) Tj
      ET
    `;
    const result = parseContentStream(stream);
    assert(result.operators.length > 5);
    assert(result.operators[0].type, "BT");
    assert(result.operators[result.operators.length - 1].type, "ET");
  });

  test("handles hex string operand", () => {
    const result = parseContentStream("<48656C6C6F> Tj");
    assert.strictEqual(result.operators.length, 1);
    assert.strictEqual(result.operators[0].type, "Tj");
  });

  test("detects leftover operands", () => {
    const result = parseContentStream("1 2 3");
    assert(result.errors.length > 0);
    assert(result.errors[0].message.includes("leftover operands"));
  });

  test("parses graphics state stack operators", () => {
    const result = parseContentStream("q q q Q Q Q");
    assert.strictEqual(result.operators.length, 6);
    assert.strictEqual(result.operators[0].type, "q");
    assert.strictEqual(result.operators[5].type, "Q");
  });
});
