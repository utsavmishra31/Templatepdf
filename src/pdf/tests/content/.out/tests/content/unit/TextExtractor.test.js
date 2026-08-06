"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const ContentLexer_1 = require("../../../content/lexer/ContentLexer");
const ContentParser_1 = require("../../../content/parser/ContentParser");
const TextExtractor_1 = require("../../../content/extractor/TextExtractor");
function extractText(text) {
    const bytes = new TextEncoder().encode(text);
    const lexer = new ContentLexer_1.ContentLexer(bytes);
    const tokens = lexer.tokenize();
    const parser = new ContentParser_1.ContentParser(tokens);
    const { operators } = parser.parse();
    const extractor = new TextExtractor_1.TextExtractor(operators);
    return extractor.extract();
}
(0, node_test_1.describe)("TextExtractor", () => {
    (0, node_test_1.test)("extracts single text run", () => {
        const objects = extractText("BT /F1 12 Tf 1 0 0 1 100 200 Tm (Hello) Tj ET");
        node_assert_1.default.strictEqual(objects.length, 1);
        node_assert_1.default.strictEqual(objects[0].runs.length, 1);
        node_assert_1.default.strictEqual(objects[0].runs[0].text, "Hello");
        node_assert_1.default.strictEqual(objects[0].runs[0].fontName, "F1");
        node_assert_1.default.strictEqual(objects[0].runs[0].fontSize, 12);
    });
    (0, node_test_1.test)("extracts multiple text runs in single object", () => {
        const objects = extractText("BT /F1 12 Tf 1 0 0 1 100 200 Tm (Hello) Tj (World) Tj ET");
        node_assert_1.default.strictEqual(objects.length, 1);
        node_assert_1.default.strictEqual(objects[0].runs.length, 2);
        node_assert_1.default.strictEqual(objects[0].runs[0].text, "Hello");
        node_assert_1.default.strictEqual(objects[0].runs[1].text, "World");
    });
    (0, node_test_1.test)("extracts multiple text objects", () => {
        const stream = `
      BT /F1 12 Tf 1 0 0 1 100 200 Tm (First) Tj ET
      BT /F1 14 Tf 1 0 0 1 100 100 Tm (Second) Tj ET
    `;
        const objects = extractText(stream);
        node_assert_1.default.strictEqual(objects.length, 2);
        node_assert_1.default.strictEqual(objects[0].runs[0].text, "First");
        node_assert_1.default.strictEqual(objects[1].runs[0].text, "Second");
    });
    (0, node_test_1.test)("tracks font changes", () => {
        const objects = extractText("BT /F1 12 Tf (A) Tj /F2 14 Tf (B) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs.length, 2);
        node_assert_1.default.strictEqual(objects[0].runs[0].fontName, "F1");
        node_assert_1.default.strictEqual(objects[0].runs[1].fontName, "F2");
    });
    (0, node_test_1.test)("tracks character spacing", () => {
        const objects = extractText("BT 1.5 Tc (Text) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs[0].charSpacing, 1.5);
    });
    (0, node_test_1.test)("tracks word spacing", () => {
        const objects = extractText("BT 2.0 Tw (Text) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs[0].wordSpacing, 2.0);
    });
    (0, node_test_1.test)("tracks horizontal scale", () => {
        const objects = extractText("BT 80 Tz (Text) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs[0].horizontalScale, 80);
    });
    (0, node_test_1.test)("tracks rendering mode", () => {
        const objects = extractText("BT 2 Tr (Text) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs[0].renderingMode, 2);
    });
    (0, node_test_1.test)("tracks text rise", () => {
        const objects = extractText("BT 3 Ts (Text) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs[0].rise, 3);
    });
    (0, node_test_1.test)("calculates bounding box", () => {
        const objects = extractText("BT 1 0 0 1 100 200 Tm (Test) Tj ET");
        (0, node_assert_1.default)(objects[0].boundingBox.x1 <= 100);
        (0, node_assert_1.default)(objects[0].boundingBox.y1 <= 200);
        (0, node_assert_1.default)(objects[0].boundingBox.x2 > 100);
        (0, node_assert_1.default)(objects[0].boundingBox.y2 > 200);
    });
    (0, node_test_1.test)("tracks text matrix", () => {
        const objects = extractText("BT 1 0 0 1 50 75 Tm (Text) Tj ET");
        const matrix = objects[0].runs[0].matrix;
        node_assert_1.default.deepStrictEqual(matrix, [1, 0, 0, 1, 50, 75]);
    });
    (0, node_test_1.test)("extracts from TJ operator", () => {
        const objects = extractText("BT 1 0 0 1 100 200 Tm [(A) -100 (B)] TJ ET");
        (0, node_assert_1.default)(objects.length >= 1);
        (0, node_assert_1.default)(objects[0].runs.length >= 1);
    });
    (0, node_test_1.test)("handles positioning operators", () => {
        const objects = extractText("BT /F1 12 Tf 1 0 0 1 100 200 Tm (A) Tj 10 20 Td (B) Tj ET");
        node_assert_1.default.strictEqual(objects[0].runs.length, 2);
    });
});
