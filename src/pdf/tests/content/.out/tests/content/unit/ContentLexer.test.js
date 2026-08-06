"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const ContentLexer_1 = require("../../../content/lexer/ContentLexer");
(0, node_test_1.describe)("ContentLexer", () => {
    (0, node_test_1.test)("tokenizes simple number", () => {
        const bytes = new TextEncoder().encode("123");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens.length, 2); // number + eof
        node_assert_1.default.strictEqual(tokens[0].type, "number");
        node_assert_1.default.strictEqual(tokens[0].value, 123);
    });
    (0, node_test_1.test)("tokenizes negative number", () => {
        const bytes = new TextEncoder().encode("-45.67");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "number");
        node_assert_1.default.strictEqual(tokens[0].value, -45.67);
    });
    (0, node_test_1.test)("tokenizes operator", () => {
        const bytes = new TextEncoder().encode("Tf");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "operator");
        node_assert_1.default.strictEqual(tokens[0].value, "Tf");
    });
    (0, node_test_1.test)("tokenizes name", () => {
        const bytes = new TextEncoder().encode("/F1");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "name");
        node_assert_1.default.strictEqual(tokens[0].value, "F1");
    });
    (0, node_test_1.test)("tokenizes literal string with escapes", () => {
        const bytes = new TextEncoder().encode("(Hello\\nWorld)");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "string");
        node_assert_1.default.strictEqual(tokens[0].value, "Hello\nWorld");
    });
    (0, node_test_1.test)("tokenizes hex string", () => {
        const bytes = new TextEncoder().encode("<48656C6C6F>");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "hex-string");
        node_assert_1.default.strictEqual(tokens[0].value, "48656C6C6F");
    });
    (0, node_test_1.test)("tokenizes array", () => {
        const bytes = new TextEncoder().encode("[1 2 3]");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "array-open");
        node_assert_1.default.strictEqual(tokens[1].type, "number");
        node_assert_1.default.strictEqual(tokens[4].type, "array-close");
    });
    (0, node_test_1.test)("skips comments", () => {
        const bytes = new TextEncoder().encode("123 % comment\n456");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "number");
        node_assert_1.default.strictEqual(tokens[0].value, 123);
        node_assert_1.default.strictEqual(tokens[1].type, "number");
        node_assert_1.default.strictEqual(tokens[1].value, 456);
    });
    (0, node_test_1.test)("tokenizes text operator sequence", () => {
        const bytes = new TextEncoder().encode("BT /F1 12 Tf (Hello) Tj ET");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        const types = tokens.filter((t) => t.type !== "eof").map((t) => t.type);
        node_assert_1.default.deepStrictEqual(types, ["operator", "name", "number", "operator", "string", "operator", "operator"]);
    });
    (0, node_test_1.test)("tokenizes matrix operator", () => {
        const bytes = new TextEncoder().encode("1 0 0 1 10 20 Tm");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        const values = tokens
            .slice(0, 6)
            .map((t) => t.value);
        node_assert_1.default.deepStrictEqual(values, [1, 0, 0, 1, 10, 20]);
        node_assert_1.default.strictEqual(tokens[6].value, "Tm");
    });
    (0, node_test_1.test)("handles hex string with whitespace", () => {
        const bytes = new TextEncoder().encode("<48 65 6C 6C 6F>");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "hex-string");
        node_assert_1.default.strictEqual(tokens[0].value, "48656C6C6F");
    });
    (0, node_test_1.test)("tokenizes TJ operator with array", () => {
        const bytes = new TextEncoder().encode("[(A) -100 (B)] TJ");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "array-open");
        node_assert_1.default.strictEqual(tokens[1].type, "string");
        node_assert_1.default.strictEqual(tokens[2].type, "number");
        node_assert_1.default.strictEqual(tokens[3].type, "string");
        node_assert_1.default.strictEqual(tokens[4].type, "array-close");
        node_assert_1.default.strictEqual(tokens[5].type, "operator");
        node_assert_1.default.strictEqual(tokens[5].value, "TJ");
    });
    (0, node_test_1.test)("preserves token offsets", () => {
        const bytes = new TextEncoder().encode("123 456");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].offset, 0);
        node_assert_1.default.strictEqual(tokens[1].offset, 4);
    });
    (0, node_test_1.test)("tokenizes nested parentheses in strings", () => {
        const bytes = new TextEncoder().encode("(outer (inner) text)");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "string");
        (0, node_assert_1.default)(typeof tokens[0].value === "string" && tokens[0].value.includes("(inner)"));
    });
    (0, node_test_1.test)("handles escaped parentheses in strings", () => {
        const bytes = new TextEncoder().encode("(text with \\( and \\))");
        const lexer = new ContentLexer_1.ContentLexer(bytes);
        const tokens = lexer.tokenize();
        node_assert_1.default.strictEqual(tokens[0].type, "string");
        const val = tokens[0].value;
        (0, node_assert_1.default)(typeof val === "string" && val.includes("("));
        (0, node_assert_1.default)(typeof val === "string" && val.includes(")"));
    });
});
