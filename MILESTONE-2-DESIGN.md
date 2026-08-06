# Milestone 2: Layer 2 (Content Stream Parser) - Design Phase

**Date**: 2026-07-23  
**Status**: DESIGN ONLY (no implementation yet)  
**Layer**: Content Stream Parser (Layer 2)  
**Scope**: PDF content stream lexing, parsing, and editable AST  

---

## Mission Alignment

**Core Requirement**: Build a real PDF editing engine that modifies original PDF content streams whenever technically possible.

**Layer 2 Responsibility**: Parse and represent content streams as editable ASTs so Layer 3+ can:
- Replace text
- Delete text
- Insert text
- Move text
- Change fonts
- Change font sizes
- Change colors
- Preserve layout and positioning

**What Layer 2 Must NOT Do**:
- Never claim to edit what it didn't parse
- Never lose operator state information
- Never break text positioning matrices
- Never omit font references

---

## Content Stream Context

### What is a Content Stream?

A PDF content stream is a **sequence of operators and operands** that describe how to render a page. Examples:

```
BT                          % Begin text
/F1 12 Tf                   % Set font F1, size 12
100 700 Td                  % Position at (100, 700)
(Hello World) Tj            % Show string
ET                          % End text
```

### Why Content Streams Are Hard to Parse

1. **Postfix notation**: operands come before operators (e.g., `100 700 Td` not `Td(100, 700)`)
2. **State machines**: BT/ET nest; Tf changes current font; Tm affects position
3. **Whitespace insensitive**: `100 700 Td` and `100\n700\nTd` are identical
4. **Stream content**: Operators can be in strings, hex strings, or comments
5. **Operator ambiguity**: Some tokens are both names and potential operators
6. **Variable arity**: Some operators consume different numbers of operands

---

## Supported Operators (Text-Focused)

Layer 2 focuses on **text operators** (painting operators in Layer 4+):

### Text State Operators
| Operator | Operands | Purpose |
|----------|----------|---------|
| BT | - | Begin text object |
| ET | - | End text object |
| Tf | font size | Set font and size |
| Tc | charSpace | Set character spacing |
| Tw | wordSpace | Set word spacing |
| Tz | scale | Set horizontal scaling |
| TL | leading | Set text leading |
| Tr | render | Set text rendering mode |
| Ts | rise | Set text rise |
| Tm | a b c d e f | Set text matrix (6 params) |
| Td | tx ty | Text positioning (relative) |
| TD | tx ty | Text positioning + set leading |
| T* | - | Move to next line (uses TL) |

### Text Showing Operators
| Operator | Operands | Purpose |
|----------|----------|---------|
| Tj | string | Show string |
| TJ | array | Show array of strings/spacing |
| ' | wy string | Set word space, leading, show |
| " | wc wy string | Set char space, word space, leading, show |

### Geometric Operators (Preserve but Don't Edit)
| Operator | Operands | Purpose |
|----------|----------|---------|
| m | x y | Move to point |
| l | x y | Line to |
| c | ... | Cubic Bezier |
| re | x y w h | Rectangle |
| S | - | Stroke |
| f | - | Fill |
| cm | a b c d e f | Concatenate transform matrix |

---

## Layer 2 Design: Lexer, Parser, AST

### Design Principle: Minimal Parsing

**Goal**: Parse enough to identify text boundaries and editable regions, but don't over-commit to full semantic interpretation.

```
Content Stream (bytes)
    ↓
Lexer (tokenize)
    ↓
Token Stream (array of tokens with types/values)
    ↓
Parser (build AST)
    ↓
Operator AST (tree of editable operations)
    ↓
Layer 3: Text Engine (extract/edit text)
```

---

## Part 1: Lexer Design

**Input**: Raw bytes of a content stream (post-decode from Layer 1)  
**Output**: Array of `Token` objects  
**Complexity**: O(n) where n = stream bytes

### Token Types

```typescript
type TokenType =
  | "number"          // 123, -45, 3.14
  | "name"            // /F1, /Helvetica
  | "string"          // (Hello), <48656C6C6F>
  | "array-open"      // [
  | "array-close"     // ]
  | "operator"        // Tj, Tf, BT, etc.
  | "eof";

interface Token {
  type: TokenType;
  value: string | number;
  offset: number;      // byte position in stream
  length: number;      // byte length in stream
}
```

### Lexer State Machine

**States**:
1. **NEUTRAL** - reading operands/names
2. **STRING_LITERAL** - inside `(...)` with escape handling
3. **STRING_HEX** - inside `<...>` hex string
4. **COMMENT** - after `%` until newline
5. **NUMBER** - reading digits and decimal point
6. **NAME** - reading `/` name token

**Transitions**:
```
NEUTRAL:
  - [0-9+-.] → NUMBER
  - / → NAME
  - ( → STRING_LITERAL
  - < → STRING_HEX or start hex string
  - % → COMMENT
  - [ → emit "array-open" token
  - ] → emit "array-close" token
  - whitespace → skip
  - [a-zA-Z*'] → NAME (operator names can start with letter or special char)

NUMBER:
  - [0-9.] → continue
  - other → emit number token, return to NEUTRAL

NAME:
  - /[a-zA-Z0-9#$&'*+,-.;=?@^_`{}~]* → emit name token
  
STRING_LITERAL:
  - \ → escape sequence
  - ( → nesting or end
  - ) → end string
  - other → accumulate
  
STRING_HEX:
  - [0-9a-fA-F] → accumulate
  - > → end hex string
  - whitespace → skip (allowed in hex strings)
```

### Lexer Guarantees

- ✅ All tokens have precise byte offsets and lengths
- ✅ Comments are skipped (not tokenized)
- ✅ Whitespace between tokens is normalized
- ✅ Escape sequences in strings are decoded
- ✅ Hex strings are validated (even-length hex)
- ✅ Operators are case-sensitive (PDF spec)
- ✅ Names preserve original casing

### Lexer Limitations (Intentional)

- ❌ Does NOT interpret operator arity or semantics (parser job)
- ❌ Does NOT validate that operators are real (parser job)
- ❌ Does NOT track operator state (parser job)

---

## Part 2: Parser Design

**Input**: Token stream  
**Output**: Operator AST  
**Complexity**: O(m) where m = number of tokens  

### Parsing Strategy: Postfix Stack Model

**Key Insight**: PDF operators are postfix (operands come first). Use a stack:

```
1. Read token
2. If operand (number, string, name): push to stack
3. If operator: pop N operands, create operator node, push node to stack
4. At EOF: all nodes should be in result list
```

**Example Parse**:
```
Tokens: [ /F1, 12, Tf, 100, 700, Td, (Hello), Tj ]

Step 1: /F1 → push Name("/F1")
Step 2: 12 → push Number(12)
Step 3: Tf → pop 2 operands, create SetFont, push result
Step 4: 100 → push Number(100)
Step 5: 700 → push Number(700)
Step 6: Td → pop 2 operands, create TextMove, push result
Step 7: (Hello) → push String("Hello")
Step 8: Tj → pop 1 operand, create ShowText, push result
EOF: result = [SetFont, TextMove, ShowText]
```

### Operator AST Nodes

**Base Interface**:
```typescript
interface ContentOperator {
  kind: string;           // e.g., "SetFont", "ShowText", "BeginText"
  offset: number;         // byte offset in original stream
  operands: ContentOperand[];
  text?: string;          // for text-showing operators
}

type ContentOperand =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "name"; value: string }
  | { type: "array"; elements: ContentOperand[] }
  | ContentOperator;     // nested operators (rare but possible)
```

**Concrete Operator Types**:

#### Text State Operators
```typescript
interface BeginText extends ContentOperator {
  kind: "BeginText";
  operands: [];
}

interface EndText extends ContentOperator {
  kind: "EndText";
  operands: [];
}

interface SetFont extends ContentOperator {
  kind: "SetFont";
  operands: [{ type: "name" }, { type: "number" }];
  fontName: string;       // extracted from name operand
  fontSize: number;       // extracted from number operand
}

interface SetMatrix extends ContentOperator {
  kind: "SetMatrix";
  operands: [
    { type: "number" },   // a
    { type: "number" },   // b
    { type: "number" },   // c
    { type: "number" },   // d
    { type: "number" },   // e
    { type: "number" }    // f
  ];
  matrix: [number, number, number, number, number, number];
}

interface TextMove extends ContentOperator {
  kind: "TextMove";
  operands: [{ type: "number" }, { type: "number" }];
  tx: number;
  ty: number;
}
```

#### Text Showing Operators
```typescript
interface ShowText extends ContentOperator {
  kind: "ShowText";
  operands: [{ type: "string" } | { type: "array" }];
  text: string;           // extracted/reconstructed from operand
  isArray: boolean;       // true if TJ (show with spacing)
}

interface ShowTextSpaced extends ContentOperator {
  kind: "ShowTextSpaced";
  operands: [{ type: "array" }];
  elements: Array<{ type: "text" | "spacing"; value: string | number }>;
}
```

#### Geometry Operators (Opaque)
```typescript
interface GeometricOperation extends ContentOperator {
  kind: "LineTo" | "MoveTo" | "Rectangle" | "Stroke" | "Fill";
  operands: ContentOperand[];
  // Not edited by Layer 2; preserved for Layer 4+
}
```

### Parser Arity Rules

**Operator arity** (number of operands) must be hard-coded:

```typescript
const OPERATOR_ARITY: Record<string, number> = {
  "BT": 0,
  "ET": 0,
  "Tj": 1,
  "TJ": 1,
  "'": 2,
  "\"": 3,
  "Tf": 2,
  "Tm": 6,
  "Td": 2,
  "TD": 2,
  "T*": 0,
  "Tc": 1,
  "Tw": 1,
  "Tz": 1,
  "TL": 1,
  "Tr": 1,
  "Ts": 1,
  "m": 2,
  "l": 2,
  "c": 6,
  "re": 4,
  "S": 0,
  "f": 0,
  "cm": 6,
  "q": 0,     // Save graphics state
  "Q": 0,     // Restore graphics state
};
```

### Parser State Machine

**For each token**:
1. If operand (number, string, name, array): push to stack
2. If operator: 
   - Check arity in OPERATOR_ARITY
   - If unknown operator: emit warning, discard operands, continue
   - If arity > stack size: emit error (malformed stream)
   - Pop N operands, create operator node, push node to stack
3. At EOF: all stack items become output nodes

### Parser Error Handling

**Errors** (unrecoverable):
- Operator arity mismatch (e.g., `Tf` with 1 operand instead of 2)
- Unclosed BT/ET nesting
- Stream ends with leftover operands
- Invalid operator name (e.g., "NotAnOp")

**Warnings** (recoverable):
- Nested BT (should be ET first)
- Unknown operators (skip and log)
- ET without matching BT

---

## Part 3: Text Extraction AST

**Goal**: Provide Layer 3 with structured text information.

### Text Run Interface

```typescript
interface TextRun {
  kind: "TextRun";
  fontName: string;           // /F1, /F2, etc.
  fontSize: number;           // 12, 14, etc.
  text: string;               // actual glyph string
  matrix?: [number, number, number, number, number, number];  // Tm
  position?: { x: number; y: number };  // Td/TD result
  characterSpacing?: number;  // Tc
  wordSpacing?: number;       // Tw
  horizontalScale?: number;   // Tz
  textLeading?: number;       // TL
  renderMode?: number;        // Tr
  rise?: number;              // Ts (text rise)
  offset: number;             // byte offset in stream
}

interface TextObject {
  kind: "TextObject";
  offset: number;
  runs: TextRun[];            // all text runs between BT and ET
  matrix?: [number, number, number, number, number, number];
}
```

### Text Extraction Strategy

**During parsing**, track state:
- Current font (set by Tf)
- Current font size (set by Tf)
- Current position (set by Tm, Td, TD, T*)
- Current transformation matrix (Tm)
- Text rendering parameters (Tc, Tw, Tz, TL, Tr, Ts)

**When ShowText/ShowTextSpaced is encountered**:
1. Create TextRun with current state
2. Extract text from operand
3. Store reference to original operator (for editing)

**Output**: List of TextObject (one per BT/ET pair) containing TextRun nodes

---

## Part 4: Content Stream Architecture

### File Structure (Planned)

```
src/pdf/content/

├── lexer/
│   ├── ContentLexer.ts          # Token generator
│   ├── Token.ts                  # Token interface
│   └── operators.ts              # Operator definitions
│
├── parser/
│   ├── ContentParser.ts          # AST builder
│   ├── ContentOperator.ts        # Operator interfaces
│   └── ParserState.ts            # State tracking
│
├── extractor/
│   ├── TextExtractor.ts          # Text run extraction
│   ├── TextRun.ts                # Text run interface
│   └── TextAnalyzer.ts           # Semantic analysis
│
└── tests/
    ├── unit/
    │   ├── ContentLexer.test.ts
    │   ├── ContentParser.test.ts
    │   └── TextExtractor.test.ts
    ├── integration/
    │   └── ContentStream.integration.test.ts
    └── fixtures/
        └── sample-streams/
```

---

## Part 5: Integration with Layer 1

### Data Flow

```
Layer 1 (PDF Parser)
├─ ParsedPdfDocument
│  ├─ header
│  ├─ objects
│  └─ revisions
│
↓ Extract content streams
│
Layer 2 (Content Stream Parser)
├─ ContentStream (bytes)
│  ├─ decode (if FlateDecode)
│  ├─ lex → TokenStream
│  ├─ parse → OperatorAST
│  ├─ extract → TextObjects
│  └─ analyze → SemanticInfo
│
↓ Pass to Layer 3
│
Layer 3 (Text Engine)
└─ Edit text, fonts, colors
```

### How Layer 2 Uses Layer 1 Output

1. **Stream dictionary** from Layer 1:
   - Filter metadata (FlateDecode, etc.)
   - Raw stream bytes (already decoded by Layer 1)

2. **Object references**:
   - Font references (e.g., `/F1 0 R`)
   - Resource dictionary (defines fonts, colors)

3. **Byte offsets**:
   - Track position in decoded stream for error reporting

### Guarantees to Layer 3

✅ Every text run has original operator reference  
✅ Font, size, position preserved with full precision  
✅ Transformation matrices intact  
✅ Operand sequence untouched (only semantically interpreted)  
✅ Byte offset map for round-trip edits  

---

## Part 6: Error Handling & Validation

### Lexer Errors
- Unterminated string (missing close paren or `>`)
- Invalid hex string (odd-length hex in `<>`)
- EOF while in comment/string

### Parser Errors
- Operator arity mismatch (e.g., `Tf` with 1 operand)
- Stack underflow (operator pops more than available)
- Unclosed BT/ET nesting
- Unknown operator (warning, skip)

### Validation Issues
- Text outside BT/ET (error)
- Tf outside BT/ET (warning)
- Matrix without positioning (warning)

### Recovery Strategy

**Strict Mode**:
- Hard fail on first parse error
- Return detailed error with offset

**Tolerant Mode**:
- Skip malformed operators
- Warn but continue
- Collect all text runs successfully parsed

---

## Part 7: Testing Strategy

### Unit Tests

**Lexer Tests**:
- Number parsing (integers, floats, negatives)
- String escaping (backslash sequences)
- Hex string validation
- Comment skipping
- Name token parsing
- Array brackets
- Whitespace normalization

**Parser Tests**:
- Single operator (e.g., BT/ET)
- Operator arity validation
- Stack operations
- Nested structures
- Error cases

**Text Extractor Tests**:
- Text run reconstruction
- State tracking (font, size, position)
- Matrix interpretation
- Multiple text objects

### Integration Tests

- Real content stream samples
- Multi-line text with various operators
- Error recovery in tolerant mode
- Byte offset accuracy

### Benchmark Plan

- Lexer: tokens/second for various stream sizes
- Parser: operators/second
- Text extraction: text runs/second
- Overall: content stream → AST → text for 100 samples

---

## Part 8: Known Limitations (Intentional)

### Not Supporting (Yet)

❌ **Complex operators** (Layer 4+):
- Glyph positioning with individual spacing arrays (TJ details)
- Kerning adjustments
- Complex font substitution

❌ **Inline images** (IMG/EI):
- Rarely used in editable PDFs
- Handled by Layer 4+ if needed

❌ **Color space interpretation**:
- Color operators (g, rg, sc, etc.) preserved
- But color values not converted to RGB/CMYK
- Handled by Layer 4+ rendering layer

❌ **Form XObjects**:
- References preserved but not recursively parsed
- Layer 4+ handles if needed

### Parser Behavior

- **Unknown operators**: Logged as warnings; operands preserved
- **Malformed streams**: Best-effort recovery in tolerant mode
- **Encoding issues**: Assume latin-1 per PDF spec (layer 3+ handles UTF-16BE for fonts)

---

## Part 9: Security Considerations

### Limits (Same as Layer 1 + specific to content streams)

```typescript
const CONTENT_STREAM_LIMITS = {
  maxTokenCount: 1_000_000,           // tokens in single stream
  maxStringLength: 32 * 1024 * 1024,  // single string operand
  maxArrayDepth: 32,                  // nesting in arrays/show commands
  maxOperatorDepth: 64,               // operator nesting (via q/Q)
  maxGraphicsStateSaveDepth: 128,     // q/Q stack depth
};
```

### Threats Mitigated

- **Zip-bomb**: Token count limit prevents huge token lists
- **String bomb**: String length limit prevents huge decoded strings
- **Stack exhaustion**: Depth limits on arrays and graphics state
- **Infinite loops**: No loops in content streams (no jumps)

---

## Part 10: Success Criteria for Layer 2 Design

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Lexer design complete | ✅ | Token types, state machine specified |
| Parser design complete | ✅ | Arity table, AST nodes designed |
| Text extraction strategy | ✅ | TextRun/TextObject interfaces |
| Integration with Layer 1 | ✅ | Data flow documented |
| Error handling strategy | ✅ | Strict/tolerant modes specified |
| Security limits | ✅ | 5 limit categories defined |
| Test strategy | ✅ | Unit/integration/benchmark plans |
| Known limitations documented | ✅ | Intentional gaps explained |

---

## Comparison to Layer 1 Design

| Aspect | Layer 1 (PDF Structure) | Layer 2 (Content Stream) |
|--------|----------------------|------------------------|
| Input | Full PDF file (bytes) | Decoded stream (bytes) |
| Output | Document structure AST | Operator AST + text runs |
| Complexity | O(n) parse O(o) index | O(m) lex O(m) parse |
| State tracking | Minimal (offsets only) | Moderate (graphics state) |
| Text awareness | None (opaque streams) | Full (extracts text runs) |
| Editing readiness | Yes (offsets preserved) | Yes (operand references) |

---

## Sign-Off: Ready for Implementation

**Layer 2 Design** is complete and ready for Step 1 (Implementation).

**Design Completeness**: 100%
- ✅ Lexer fully specified
- ✅ Parser fully specified
- ✅ AST structure fully specified
- ✅ Integration fully specified
- ✅ Error handling fully specified
- ✅ Security limits fully specified

**Next: Implementation Phase**
1. Implement lexer with token accuracy
2. Implement parser with arity validation
3. Implement text extractor with state tracking
4. Comprehensive test suite
5. Benchmark and validate

---

## Appendix: PDF Operator Reference

### Text State Operators

```
BT                      Begin text object
ET                      End text object
Tc <char space>         Set character spacing
Tw <word space>         Set word spacing
Tz <scale>              Set horizontal scaling (%)
TL <leading>            Set text leading
Tr <render>             Set text rendering mode
Ts <rise>               Set text rise
Tf <font> <size>        Set font and size
Tm <a b c d e f>        Set text matrix
Td <tx> <ty>            Text positioning (relative)
TD <tx> <ty>            Text positioning + set leading
T*                      Move to next line
```

### Text Showing

```
Tj <string>             Show string
TJ <array>              Show array of strings/numbers
' <wy> <string>         Set Tw, set TL, show string
" <wc> <wy> <string>    Set Tc, Tw, TL, show string
```

### Graphics State

```
q                       Save graphics state
Q                       Restore graphics state
cm <a b c d e f>        Concatenate transform matrix
```

### Path Operators

```
m <x> <y>               Move to
l <x> <y>               Line to
c <x1 y1 x2 y2 x3 y3>   Cubic Bezier curve
re <x> <y> <w> <h>      Rectangle
S                       Stroke path
f                       Fill path
B                       Fill and stroke
n                       End path (no-op)
```

---

## Appendix: Example Content Stream

```
BT                              % Begin text
/F1 12 Tf                       % Font F1, size 12
100 700 Td                      % Position at (100, 700)
(Hello, World!) Tj              % Show string
0 -15 Td                        % Move down 15 units
(This is line 2) Tj             % Show another string
ET                              % End text
```

### Lexical Analysis

```
Token 1: name, value="/F1", offset=0
Token 2: number, value=12, offset=5
Token 3: operator, value="Tf", offset=8
Token 4: number, value=100, offset=11
Token 5: number, value=700, offset=15
Token 6: operator, value="Td", offset=19
Token 7: string, value="Hello, World!", offset=22
Token 8: operator, value="Tj", offset=38
...
```

### Parsing Result

```
Operator 1: BeginText(offset=0)
Operator 2: SetFont(offset=5, fontName="/F1", fontSize=12)
Operator 3: TextMove(offset=11, tx=100, ty=700)
Operator 4: ShowText(offset=22, text="Hello, World!")
Operator 5: TextMove(offset=38, tx=0, ty=-15)
Operator 6: ShowText(offset=43, text="This is line 2")
Operator 7: EndText(offset=60)
```

### Text Extraction

```
TextObject 1:
  TextRun 1:
    fontName: "/F1"
    fontSize: 12
    text: "Hello, World!"
    position: { x: 100, y: 700 }
  TextRun 2:
    fontName: "/F1"
    fontSize: 12
    text: "This is line 2"
    position: { x: 100, y: 685 }
```

---

**Design Document Complete**  
**Ready for Implementation Approval**
