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
function processFullStream(text) {
    const bytes = new TextEncoder().encode(text);
    const lexer = new ContentLexer_1.ContentLexer(bytes);
    const tokens = lexer.tokenize();
    const parser = new ContentParser_1.ContentParser(tokens);
    const { operators, errors: parserErrors } = parser.parse();
    const extractor = new TextExtractor_1.TextExtractor(operators);
    const textObjects = extractor.extract();
    return { tokens, operators, textObjects, parserErrors };
}
(0, node_test_1.describe)("Content Stream Integration", () => {
    (0, node_test_1.test)("full pipeline: simple text", () => {
        const input = "BT /F1 12 Tf 1 0 0 1 100 200 Tm (Hello) Tj ET";
        const { tokens, operators, textObjects, parserErrors } = processFullStream(input);
        (0, node_assert_1.default)(tokens.length > 0);
        (0, node_assert_1.default)(operators.length > 0);
        node_assert_1.default.strictEqual(textObjects.length, 1);
        node_assert_1.default.strictEqual(textObjects[0].runs[0].text, "Hello");
        node_assert_1.default.strictEqual(parserErrors.length, 0);
    });
    (0, node_test_1.test)("full pipeline: multi-line text", () => {
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
        (0, node_assert_1.default)(tokens.length > 0);
        (0, node_assert_1.default)(operators.length > 5);
        node_assert_1.default.strictEqual(textObjects.length, 1);
        (0, node_assert_1.default)(textObjects[0].runs.length >= 2);
    });
    (0, node_test_1.test)("full pipeline: multiple text objects", () => {
        const input = `
      BT /F1 12 Tf 1 0 0 1 50 700 Tm (Title) Tj ET
      BT /F1 10 Tf 1 0 0 1 50 650 Tm (Paragraph) Tj ET
      BT /F1 10 Tf 1 0 0 1 50 600 Tm (More text) Tj ET
    `;
        const { operators, textObjects } = processFullStream(input);
        (0, node_assert_1.default)(operators.length >= 9);
        node_assert_1.default.strictEqual(textObjects.length, 3);
    });
    (0, node_test_1.test)("full pipeline: font changes mid-stream", () => {
        const input = `
      BT
      /F1 12 Tf 1 0 0 1 100 200 Tm
      (Bold) Tj
      /F2 12 Tf
      (Regular) Tj
      ET
    `;
        const { textObjects } = processFullStream(input);
        node_assert_1.default.strictEqual(textObjects[0].runs.length, 2);
        node_assert_1.default.notStrictEqual(textObjects[0].runs[0].fontName, textObjects[0].runs[1].fontName);
    });
    (0, node_test_1.test)("full pipeline: mixed operators and text", () => {
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
        node_assert_1.default.strictEqual(parserErrors.length, 0);
        (0, node_assert_1.default)(operators.length >= 8);
        node_assert_1.default.strictEqual(textObjects.length, 1);
        const run = textObjects[0].runs[0];
        node_assert_1.default.strictEqual(run.text, "Complex");
        node_assert_1.default.strictEqual(run.charSpacing, 1.5);
        node_assert_1.default.strictEqual(run.wordSpacing, 2.0);
        node_assert_1.default.strictEqual(run.horizontalScale, 100);
        node_assert_1.default.strictEqual(run.renderingMode, 0);
        node_assert_1.default.strictEqual(run.rise, 5);
    });
    (0, node_test_1.test)("full pipeline: error recovery with leftover operands", () => {
        const input = "123 456 789";
        const { parserErrors } = processFullStream(input);
        (0, node_assert_1.default)(parserErrors.length > 0);
        (0, node_assert_1.default)(parserErrors[0].recoverable);
    });
    (0, node_test_1.test)("full pipeline: malformed operator", () => {
        const input = "1 2 UnknownOp";
        const { parserErrors } = processFullStream(input);
        (0, node_assert_1.default)(parserErrors.length > 0);
    });
    (0, node_test_1.test)("full pipeline: TJ with spacing array", () => {
        const input = "BT 1 0 0 1 100 200 Tm [(Text) -50 (Array)] TJ ET";
        const { operators, textObjects } = processFullStream(input);
        (0, node_assert_1.default)(operators.some((op) => op.type === "TJ"));
        (0, node_assert_1.default)(textObjects.length >= 1);
    });
    (0, node_test_1.test)("full pipeline: graphics state management", () => {
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
        node_assert_1.default.strictEqual(qOps, 3);
        node_assert_1.default.strictEqual(QOps, 3);
        node_assert_1.default.strictEqual(parserErrors.length, 0);
    });
});
