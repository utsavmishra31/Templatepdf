import { test, describe } from "node:test";
import assert from "node:assert";
import { ContentLexer } from "../../../content/lexer/ContentLexer";
import { ContentParser } from "../../../content/parser/ContentParser";
import { TextExtractor } from "../../../content/extractor/TextExtractor";

function processFullStream(text: string) {
  const bytes = new TextEncoder().encode(text);
  const lexer = new ContentLexer(bytes);
  const tokens = lexer.tokenize();
  const parser = new ContentParser(tokens);
  const { operators, errors: parserErrors } = parser.parse();
  const extractor = new TextExtractor(operators);
  const textObjects = extractor.extract();
  return { tokens, operators, textObjects, parserErrors };
}

describe("Content Stream Integration", () => {
  test("full pipeline: simple text", () => {
    const input = "BT /F1 12 Tf 1 0 0 1 100 200 Tm (Hello) Tj ET";
    const { tokens, operators, textObjects, parserErrors } = processFullStream(input);

    assert(tokens.length > 0);
    assert(operators.length > 0);
    assert.strictEqual(textObjects.length, 1);
    assert.strictEqual(textObjects[0].runs[0].text, "Hello");
    assert.strictEqual(parserErrors.length, 0);
  });

  test("full pipeline: multi-line text", () => {
    const input = `
      BT
      /F1 12 Tf
      1 0 0 1 100 200 Tm
      (First line) Tj
      0 14 Td
      (Second line) Tj
      ET
    `;
    const { tokens, operators, textObjects } = processFullStream(input);

    assert(tokens.length > 0);
    assert(operators.length > 5);
    assert.strictEqual(textObjects.length, 1);
    assert(textObjects[0].runs.length >= 2);
  });

  test("full pipeline: multiple text objects", () => {
    const input = `
      BT /F1 12 Tf 1 0 0 1 50 700 Tm (Title) Tj ET
      BT /F1 10 Tf 1 0 0 1 50 650 Tm (Paragraph) Tj ET
      BT /F1 10 Tf 1 0 0 1 50 600 Tm (More text) Tj ET
    `;
    const { operators, textObjects } = processFullStream(input);

    assert(operators.length >= 9);
    assert.strictEqual(textObjects.length, 3);
  });

  test("full pipeline: font changes mid-stream", () => {
    const input = `
      BT
      /F1 12 Tf 1 0 0 1 100 200 Tm
      (Bold) Tj
      /F2 12 Tf
      (Regular) Tj
      ET
    `;
    const { textObjects } = processFullStream(input);

    assert.strictEqual(textObjects[0].runs.length, 2);
    assert.notStrictEqual(textObjects[0].runs[0].fontName, textObjects[0].runs[1].fontName);
  });

  test("full pipeline: mixed operators and text", () => {
    const input = `
      BT
      /F1 12 Tf
      1 0 0 1 100 200 Tm
      1.5 Tc
      2.0 Tw
      100 Tz
      0 Tr
      5 Ts
      (Complex) Tj
      ET
    `;
    const { operators, textObjects, parserErrors } = processFullStream(input);

    assert.strictEqual(parserErrors.length, 0);
    assert(operators.length >= 8);
    assert.strictEqual(textObjects.length, 1);
    const run = textObjects[0].runs[0];
    assert.strictEqual(run.text, "Complex");
    assert.strictEqual(run.charSpacing, 1.5);
    assert.strictEqual(run.wordSpacing, 2.0);
    assert.strictEqual(run.horizontalScale, 100);
    assert.strictEqual(run.renderingMode, 0);
    assert.strictEqual(run.rise, 5);
  });

  test("full pipeline: error recovery with leftover operands", () => {
    const input = "123 456 789";
    const { parserErrors } = processFullStream(input);

    assert(parserErrors.length > 0);
    assert(parserErrors[0].recoverable);
  });

  test("full pipeline: malformed operator", () => {
    const input = "1 2 UnknownOp";
    const { parserErrors } = processFullStream(input);

    assert(parserErrors.length > 0);
  });

  test("full pipeline: TJ with spacing array", () => {
    const input = "BT 1 0 0 1 100 200 Tm [(Text) -50 (Array)] TJ ET";
    const { operators, textObjects } = processFullStream(input);

    assert(operators.some((op) => op.type === "TJ"));
    assert(textObjects.length >= 1);
  });

  test("full pipeline: graphics state management", () => {
    const input = `
      q
      1 w
      q
      0 0 0 rg
      q
      Q
      Q
      Q
    `;
    const { operators, parserErrors } = processFullStream(input);

    const qOps = operators.filter((op) => op.type === "q").length;
    const QOps = operators.filter((op) => op.type === "Q").length;
    assert.strictEqual(qOps, 3);
    assert.strictEqual(QOps, 3);
    assert.strictEqual(parserErrors.length, 0);
  });
});
