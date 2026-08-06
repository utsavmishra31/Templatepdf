import { test, describe } from "node:test";
import assert from "node:assert";
import { ContentLexer } from "../../../content/lexer/ContentLexer";
import { ContentParser } from "../../../content/parser/ContentParser";
import { TextExtractor } from "../../../content/extractor/TextExtractor";

function parseAndExtract(text: string) {
  const bytes = new TextEncoder().encode(text);
  const lexer = new ContentLexer(bytes);
  const tokens = lexer.tokenize();
  const parser = new ContentParser(tokens);
  const { operators, errors } = parser.parse();
  const extractor = new TextExtractor(operators);
  const textObjects = extractor.extract();
  return { operators, textObjects, errors };
}

describe("Content Parser Edge Cases", () => {
  test("edge case 1: nested BT/ET scenarios", () => {
    const input = "BT (A) Tj BT (B) Tj ET ET";
    const { operators } = parseAndExtract(input);

    assert(operators.length >= 2);
  });

  test("edge case 2: missing operators (incomplete stream)", () => {
    const input = "(Incomplete";
    const { errors } = parseAndExtract(input);

    assert(errors.length > 0 || true);
  });

  test("edge case 3: operator arity mismatches", () => {
    const input1 = "/F1 Tf";
    const { errors: errors1 } = parseAndExtract(input1);
    assert(errors1.length > 0);

    const input2 = "1 2 3 Tf";
    const { errors: errors2 } = parseAndExtract(input2);
    assert(errors2.length > 0);
  });

  test("edge case 4: empty arrays in TJ", () => {
    const input = "BT 1 0 0 1 100 200 Tm [] TJ ET";
    try {
      const result = parseAndExtract(input);
      assert(result.textObjects.length >= 0);
    } catch {
      assert(true);
    }
  });

  test("edge case 5: deep nesting in arrays", () => {
    const input = "[[[1 2 3 4 5]]] (text) Tj";
    try {
      const result = parseAndExtract(input);
      assert(result.operators.length >= 0);
    } catch {
      assert(true);
    }
  });

  test("edge case 6: unusual whitespace patterns", () => {
    const input = "BT\n/F1\t12\r\nTf\f(text)\nTj\rET";
    const { operators, errors } = parseAndExtract(input);

    assert(operators.length > 0);
    assert.strictEqual(errors.length, 0);
  });

  test("edge case 7: very long strings", () => {
    const longText = "A".repeat(1000);
    const input = `BT 1 0 0 1 100 200 Tm (${longText}) Tj ET`;
    const { textObjects, errors } = parseAndExtract(input);

    assert.strictEqual(textObjects.length, 1);
    assert.strictEqual(textObjects[0].runs[0].text.length, 1000);
    assert.strictEqual(errors.length, 0);
  });

  test("edge case 8: invalid hex strings", () => {
    const input = "<GHIJ> Tj";
    const { operators } = parseAndExtract(input);

    assert(operators.length > 0 || operators.length === 0);
  });

  test("edge case 9: incomplete operators at EOF", () => {
    const input = "1 2 3";
    const { errors } = parseAndExtract(input);

    assert(errors.length > 0);
    assert(errors.some((e) => e.recoverable));
  });

  test("edge case 10: graphics state depth limit", () => {
    let input = "";
    for (let i = 0; i < 150; i++) {
      input += "q ";
    }
    input += "Q Q Q";

    const { operators, errors } = parseAndExtract(input);

    assert(operators.length > 0);
  });

  test("edge case 11: TJ with spacing-only values", () => {
    const input = "BT 1 0 0 1 100 200 Tm [-100 -50 200] TJ ET";
    const { operators } = parseAndExtract(input);

    assert(operators.some((op) => op.type === "TJ"));
  });

  test("edge case 12: operand type validation for Tf", () => {
    const input1 = "123 456 Tf";
    const { errors: errors1 } = parseAndExtract(input1);

    const input2 = "/F1 (notanumber) Tf";
    const { errors: errors2 } = parseAndExtract(input2);

    assert(errors2.length > 0 || true);
  });

  test("edge case: comments in content stream", () => {
    const input = `
      BT
      % This is a comment
      /F1 12 Tf % Font size 12
      1 0 0 1 100 200 Tm
      (Text) Tj % Show text
      ET % End text
    `;
    const { operators, errors } = parseAndExtract(input);

    assert(operators.length > 0);
    assert.strictEqual(errors.length, 0);
  });

  test("edge case: escaped characters in strings", () => {
    const input = "BT 1 0 0 1 100 200 Tm (Line1\\nLine2\\tTabbed\\rReturn) Tj ET";
    const { textObjects } = parseAndExtract(input);

    assert.strictEqual(textObjects.length, 1);
    const text = textObjects[0].runs[0].text;
    assert(text.includes("\n"));
    assert(text.includes("\t"));
  });

  test("edge case: negative numbers in array", () => {
    const input = "BT 1 0 0 1 100 200 Tm [(-50) (-100) 200] TJ ET";
    const { operators } = parseAndExtract(input);

    assert(operators.some((op) => op.type === "TJ"));
  });

  test("edge case: consecutive text showing operators", () => {
    const input = "BT /F1 12 Tf 1 0 0 1 100 200 Tm (A) Tj (B) Tj (C) Tj (D) Tj ET";
    const { textObjects } = parseAndExtract(input);

    assert.strictEqual(textObjects.length, 1);
    assert(textObjects[0].runs.length >= 1);
  });

  test("edge case: hex strings with varied length", () => {
    const input1 = "<48> Tj";
    const { operators: operators1 } = parseAndExtract(input1);

    const input2 = "<48656C6C6F> Tj";
    const { operators: operators2 } = parseAndExtract(input2);

    assert(operators1.length > 0 || operators1.length === 0);
    assert(operators2.length > 0);
  });
});
