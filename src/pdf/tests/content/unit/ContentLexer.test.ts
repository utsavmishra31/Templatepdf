import { test, describe } from "node:test";
import assert from "node:assert";
import { ContentLexer } from "../../../content/lexer/ContentLexer";

describe("ContentLexer", () => {
  test("tokenizes simple number", () => {
    const bytes = new TextEncoder().encode("123");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens.length, 2); // number + eof
    assert.strictEqual(tokens[0].type, "number");
    assert.strictEqual(tokens[0].value, 123);
  });

  test("tokenizes negative number", () => {
    const bytes = new TextEncoder().encode("-45.67");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "number");
    assert.strictEqual(tokens[0].value, -45.67);
  });

  test("tokenizes operator", () => {
    const bytes = new TextEncoder().encode("Tf");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "operator");
    assert.strictEqual(tokens[0].value, "Tf");
  });

  test("tokenizes name", () => {
    const bytes = new TextEncoder().encode("/F1");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "name");
    assert.strictEqual(tokens[0].value, "F1");
  });

  test("tokenizes literal string with escapes", () => {
    const bytes = new TextEncoder().encode("(Hello\\nWorld)");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "string");
    assert.strictEqual(tokens[0].value, "Hello\nWorld");
  });

  test("tokenizes hex string", () => {
    const bytes = new TextEncoder().encode("<48656C6C6F>");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "hex-string");
    assert.strictEqual(tokens[0].value, "48656C6C6F");
  });

  test("tokenizes array", () => {
    const bytes = new TextEncoder().encode("[1 2 3]");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "array-open");
    assert.strictEqual(tokens[1].type, "number");
    assert.strictEqual(tokens[4].type, "array-close");
  });

  test("skips comments", () => {
    const bytes = new TextEncoder().encode("123 % comment\n456");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "number");
    assert.strictEqual(tokens[0].value, 123);
    assert.strictEqual(tokens[1].type, "number");
    assert.strictEqual(tokens[1].value, 456);
  });

  test("tokenizes text operator sequence", () => {
    const bytes = new TextEncoder().encode("BT /F1 12 Tf (Hello) Tj ET");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    const types = tokens.filter((t) => t.type !== "eof").map((t) => t.type);
    assert.deepStrictEqual(types, ["operator", "name", "number", "operator", "string", "operator", "operator"]);
  });

  test("tokenizes matrix operator", () => {
    const bytes = new TextEncoder().encode("1 0 0 1 10 20 Tm");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    const values = tokens
      .slice(0, 6)
      .map((t) => t.value);
    assert.deepStrictEqual(values, [1, 0, 0, 1, 10, 20]);
    assert.strictEqual(tokens[6].value, "Tm");
  });

  test("handles hex string with whitespace", () => {
    const bytes = new TextEncoder().encode("<48 65 6C 6C 6F>");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "hex-string");
    assert.strictEqual(tokens[0].value, "48656C6C6F");
  });

  test("tokenizes TJ operator with array", () => {
    const bytes = new TextEncoder().encode("[(A) -100 (B)] TJ");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "array-open");
    assert.strictEqual(tokens[1].type, "string");
    assert.strictEqual(tokens[2].type, "number");
    assert.strictEqual(tokens[3].type, "string");
    assert.strictEqual(tokens[4].type, "array-close");
    assert.strictEqual(tokens[5].type, "operator");
    assert.strictEqual(tokens[5].value, "TJ");
  });

  test("preserves token offsets", () => {
    const bytes = new TextEncoder().encode("123 456");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].offset, 0);
    assert.strictEqual(tokens[1].offset, 4);
  });

  test("tokenizes nested parentheses in strings", () => {
    const bytes = new TextEncoder().encode("(outer (inner) text)");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "string");
    assert(typeof tokens[0].value === "string" && tokens[0].value.includes("(inner)"));
  });

  test("handles escaped parentheses in strings", () => {
    const bytes = new TextEncoder().encode("(text with \\( and \\))");
    const lexer = new ContentLexer(bytes);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, "string");
    const val = tokens[0].value;
    assert(typeof val === "string" && val.includes("("));
    assert(typeof val === "string" && val.includes(")"));
  });
});
