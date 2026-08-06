import { test, describe } from "node:test";
import assert from "node:assert";
import { ContentLexer } from "../../../content/lexer/ContentLexer";
import { ContentParser } from "../../../content/parser/ContentParser";
import { TextExtractor } from "../../../content/extractor/TextExtractor";

function extractText(text: string) {
  const bytes = new TextEncoder().encode(text);
  const lexer = new ContentLexer(bytes);
  const tokens = lexer.tokenize();
  const parser = new ContentParser(tokens);
  const { operators } = parser.parse();
  const extractor = new TextExtractor(operators);
  return extractor.extract();
}

describe("TextExtractor", () => {
  test("extracts single text run", () => {
    const objects = extractText("BT /F1 12 Tf 1 0 0 1 100 200 Tm (Hello) Tj ET");
    assert.strictEqual(objects.length, 1);
    assert.strictEqual(objects[0].runs.length, 1);
    assert.strictEqual(objects[0].runs[0].text, "Hello");
    assert.strictEqual(objects[0].runs[0].fontName, "F1");
    assert.strictEqual(objects[0].runs[0].fontSize, 12);
  });

  test("extracts multiple text runs in single object", () => {
    const objects = extractText("BT /F1 12 Tf 1 0 0 1 100 200 Tm (Hello) Tj (World) Tj ET");
    assert.strictEqual(objects.length, 1);
    assert.strictEqual(objects[0].runs.length, 2);
    assert.strictEqual(objects[0].runs[0].text, "Hello");
    assert.strictEqual(objects[0].runs[1].text, "World");
  });

  test("extracts multiple text objects", () => {
    const stream = `
      BT /F1 12 Tf 1 0 0 1 100 200 Tm (First) Tj ET
      BT /F1 14 Tf 1 0 0 1 100 100 Tm (Second) Tj ET
    `;
    const objects = extractText(stream);
    assert.strictEqual(objects.length, 2);
    assert.strictEqual(objects[0].runs[0].text, "First");
    assert.strictEqual(objects[1].runs[0].text, "Second");
  });

  test("tracks font changes", () => {
    const objects = extractText("BT /F1 12 Tf (A) Tj /F2 14 Tf (B) Tj ET");
    assert.strictEqual(objects[0].runs.length, 2);
    assert.strictEqual(objects[0].runs[0].fontName, "F1");
    assert.strictEqual(objects[0].runs[1].fontName, "F2");
  });

  test("tracks character spacing", () => {
    const objects = extractText("BT 1.5 Tc (Text) Tj ET");
    assert.strictEqual(objects[0].runs[0].charSpacing, 1.5);
  });

  test("tracks word spacing", () => {
    const objects = extractText("BT 2.0 Tw (Text) Tj ET");
    assert.strictEqual(objects[0].runs[0].wordSpacing, 2.0);
  });

  test("tracks horizontal scale", () => {
    const objects = extractText("BT 80 Tz (Text) Tj ET");
    assert.strictEqual(objects[0].runs[0].horizontalScale, 80);
  });

  test("tracks rendering mode", () => {
    const objects = extractText("BT 2 Tr (Text) Tj ET");
    assert.strictEqual(objects[0].runs[0].renderingMode, 2);
  });

  test("tracks text rise", () => {
    const objects = extractText("BT 3 Ts (Text) Tj ET");
    assert.strictEqual(objects[0].runs[0].rise, 3);
  });

  test("calculates bounding box", () => {
    const objects = extractText("BT 1 0 0 1 100 200 Tm (Test) Tj ET");
    assert(objects[0].boundingBox.x1 <= 100);
    assert(objects[0].boundingBox.y1 <= 200);
    assert(objects[0].boundingBox.x2 > 100);
    assert(objects[0].boundingBox.y2 > 200);
  });

  test("tracks text matrix", () => {
    const objects = extractText("BT 1 0 0 1 50 75 Tm (Text) Tj ET");
    const matrix = objects[0].runs[0].matrix;
    assert.deepStrictEqual(matrix, [1, 0, 0, 1, 50, 75]);
  });

  test("extracts from TJ operator", () => {
    const objects = extractText("BT 1 0 0 1 100 200 Tm [(A) -100 (B)] TJ ET");
    assert(objects.length >= 1);
    assert(objects[0].runs.length >= 1);
  });

  test("handles positioning operators", () => {
    const objects = extractText("BT /F1 12 Tf 1 0 0 1 100 200 Tm (A) Tj 10 20 Td (B) Tj ET");
    assert.strictEqual(objects[0].runs.length, 2);
  });
});
