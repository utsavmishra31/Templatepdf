"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const ContentLexer_1 = require("../../../content/lexer/ContentLexer");
const ContentParser_1 = require("../../../content/parser/ContentParser");
function parseContentStream(text) {
    const bytes = new TextEncoder().encode(text);
    const lexer = new ContentLexer_1.ContentLexer(bytes);
    const tokens = lexer.tokenize();
    const parser = new ContentParser_1.ContentParser(tokens);
    return parser.parse();
}
(0, node_test_1.describe)("ContentParser", () => {
    (0, node_test_1.test)("parses text state operator BT/ET", () => {
        const result = parseContentStream("BT ET");
        node_assert_1.default.strictEqual(result.operators.length, 2);
        node_assert_1.default.strictEqual(result.operators[0].type, "BT");
        node_assert_1.default.strictEqual(result.operators[1].type, "ET");
    });
    (0, node_test_1.test)("parses font operator Tf", () => {
        const result = parseContentStream("/F1 12 Tf");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tf");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], "F1");
        node_assert_1.default.strictEqual(result.operators[0].operands[1], 12);
    });
    (0, node_test_1.test)("parses text position operator Tm", () => {
        const result = parseContentStream("1 0 0 1 100 200 Tm");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tm");
        const tm = result.operators[0].operands;
        node_assert_1.default.deepStrictEqual(tm, [1, 0, 0, 1, 100, 200]);
    });
    (0, node_test_1.test)("parses text showing operator Tj", () => {
        const result = parseContentStream("(Hello) Tj");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tj");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], "Hello");
    });
    (0, node_test_1.test)("parses graphics state operators q/Q", () => {
        const result = parseContentStream("q 1 w Q");
        (0, node_assert_1.default)(result.operators.some((op) => op.type === "q"));
        (0, node_assert_1.default)(result.operators.some((op) => op.type === "Q"));
    });
    (0, node_test_1.test)("detects operator arity mismatch", () => {
        const result = parseContentStream("/F1 Tf");
        (0, node_assert_1.default)(result.errors.length > 0);
        (0, node_assert_1.default)(result.errors[0].message.includes("requires 2 operands"));
    });
    (0, node_test_1.test)("parses character spacing operator Tc", () => {
        const result = parseContentStream("1.5 Tc");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tc");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], 1.5);
    });
    (0, node_test_1.test)("parses word spacing operator Tw", () => {
        const result = parseContentStream("2.0 Tw");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tw");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], 2.0);
    });
    (0, node_test_1.test)("parses horizontal scale operator Tz", () => {
        const result = parseContentStream("100 Tz");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tz");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], 100);
    });
    (0, node_test_1.test)("parses text rendering mode operator Tr", () => {
        const result = parseContentStream("0 Tr");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tr");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], 0);
    });
    (0, node_test_1.test)("parses text rise operator Ts", () => {
        const result = parseContentStream("5 Ts");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Ts");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], 5);
    });
    (0, node_test_1.test)("parses TJ operator with array", () => {
        const result = parseContentStream("[(Hello) -50 (World)] TJ");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "TJ");
        (0, node_assert_1.default)(Array.isArray(result.operators[0].operands[0]));
    });
    (0, node_test_1.test)("parses leading operator TL", () => {
        const result = parseContentStream("14 TL");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "TL");
        node_assert_1.default.strictEqual(result.operators[0].operands[0], 14);
    });
    (0, node_test_1.test)("parses text position operators Td/TD", () => {
        const result = parseContentStream("10 20 Td");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Td");
        node_assert_1.default.deepStrictEqual(result.operators[0].operands, [10, 20]);
    });
    (0, node_test_1.test)("parses text position operator T*", () => {
        const result = parseContentStream("T*");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "T*");
        node_assert_1.default.strictEqual(result.operators[0].operands.length, 0);
    });
    (0, node_test_1.test)("parses complex content stream", () => {
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
        (0, node_assert_1.default)(result.operators.length > 5);
        (0, node_assert_1.default)(result.operators[0].type, "BT");
        (0, node_assert_1.default)(result.operators[result.operators.length - 1].type, "ET");
    });
    (0, node_test_1.test)("handles hex string operand", () => {
        const result = parseContentStream("<48656C6C6F> Tj");
        node_assert_1.default.strictEqual(result.operators.length, 1);
        node_assert_1.default.strictEqual(result.operators[0].type, "Tj");
    });
    (0, node_test_1.test)("detects leftover operands", () => {
        const result = parseContentStream("1 2 3");
        (0, node_assert_1.default)(result.errors.length > 0);
        (0, node_assert_1.default)(result.errors[0].message.includes("leftover operands"));
    });
    (0, node_test_1.test)("parses graphics state stack operators", () => {
        const result = parseContentStream("q q q Q Q Q");
        node_assert_1.default.strictEqual(result.operators.length, 6);
        node_assert_1.default.strictEqual(result.operators[0].type, "q");
        node_assert_1.default.strictEqual(result.operators[5].type, "Q");
    });
});
