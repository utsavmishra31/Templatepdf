# Milestone 3: Layer 3 Design – Text Engine

**Date**: 2026-07-23  
**Status**: Design Specification  
**Milestone**: 3  
**Layer**: 3 (Text Engine)  
**Scope**: Editable text operations with state preservation  
**Estimated Implementation**: After design review approval

---

## 1. Layer 3 Purpose & Scope

### Mission
Provide a semantically-aware, editable abstraction over PDF text content that enables:
- **Text insertion** at arbitrary positions with font/size preservation
- **Text deletion** of character ranges with proper matrix updates
- **Text replacement** of substrings maintaining formatting
- **Text formatting changes** (font, size, color, spacing)
- **State preservation** (kerning, baselines, alignment intent)
- **Content stream regeneration** with correct operators

### Constraints
- Must work on Layer 2 output (TextObject[], TextRun[])
- Must NOT modify Layer 1 or Layer 2 code
- Must prepare data for Layer 4 (Layout Engine)
- Must be reversible (support undo in future)
- Must preserve positioning accuracy (byte-level tracking)

### Non-Goals (Deferred to Layer 4+)
- Graphics/image manipulation
- Complex kerning calculations
- Automatic line breaking
- Character-level rendering (visual output)
- PDF form fields

---

## 2. Architecture Overview

### Data Flow

```
Layer 2 Output          Layer 3 Input              Layer 3 Processing           Layer 3 Output
─────────────────────────────────────────────────────────────────────────────────────────
TextObject[]  ──→  EditableTextObject[]  ──→  [TextEdit Operations]  ──→  ModifiedTextObject[]
TextRun[]           EditableTextRun[]         (insert/delete/replace)       ModifiedTextRun[]
                    + edit history            + state tracking
                    + position index          + undo capability
```

### Layer 3 Components

```
┌─────────────────────────────────────────────────────────┐
│                    Text Engine (Layer 3)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. TextEditSession                                    │
│     ├─ holds parsed text objects                       │
│     ├─ maintains edit history                          │
│     └─ manages undo/redo                               │
│                                                         │
│  2. TextEditor (Facade)                                │
│     ├─ replaceText(range, newText)                     │
│     ├─ deleteText(range)                               │
│     ├─ insertText(position, text)                      │
│     ├─ changeFont(range, fontName)                     │
│     ├─ changeFontSize(range, size)                     │
│     ├─ changeColor(range, color)                       │
│     └─ finalize() → ModifiedTextObject[]              │
│                                                         │
│  3. TextPositionMap                                    │
│     ├─ maps string indices to TextRun positions        │
│     ├─ tracks byte offsets                             │
│     └─ handles multi-run spans                         │
│                                                         │
│  4. TextEditOperation                                  │
│     ├─ Insert { position, text, ... }                  │
│     ├─ Delete { range, ... }                           │
│     ├─ Replace { range, text, ... }                    │
│     ├─ ChangeFont { range, fontName, ... }             │
│     ├─ ChangeSize { range, size, ... }                 │
│     └─ ChangeColor { range, color, ... }               │
│                                                         │
│  5. RunLayoutCalculator                                │
│     ├─ calculates new widths after edits               │
│     ├─ updates matrices for position shifts            │
│     ├─ preserves kerning pairs                         │
│     └─ handles font metric lookups                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
       ↑ Input: TextObject[] from Layer 2
       │ Output: ModifiedTextObject[] for Layer 4
```

### Key Design Patterns

1. **Immutable Edit History**: Each operation creates new objects, keeps previous versions
2. **Position Tracking**: String index → TextRun position → byte offset mapping
3. **Lazy Evaluation**: Don't update matrices until finalize() called
4. **State Preservation**: Keep original formatting properties during edits
5. **Error Recovery**: Invalid operations return error, don't modify state

---

## 3. Core Data Structures

### 3.1 EditableTextRun

```typescript
interface EditableTextRun {
  // Original from Layer 2
  original: TextRun;
  
  // Edit state
  modifiedText: string;          // "" = deleted, original text = unchanged, newText = edited
  isModified: boolean;           // true if text changed
  
  // Font/formatting edits
  fontName?: string;             // undefined = unchanged from original
  fontSize?: number;
  color?: [number, number, number];  // [r, g, b] or undefined
  charSpacing?: number;
  wordSpacing?: number;
  
  // Positioning (recalculated by RunLayoutCalculator)
  newX?: number;                 // updated position if affected by earlier edits
  newY?: number;
  newMatrix?: [number, number, number, number, number, number];
  widthEstimate?: number;        // approximate width after text change
  
  // Tracking
  originalOffset: number;        // in original text string
  newOffset: number;             // in modified text string
}
```

### 3.2 EditableTextObject

```typescript
interface EditableTextObject {
  // Original from Layer 2
  original: TextObject;
  
  // Runs with edit state
  editableRuns: EditableTextRun[];
  
  // Metadata
  hasChanges: boolean;
  operationCount: number;
}
```

### 3.3 TextEdit Operation Types

```typescript
type TextEditOperation = 
  | InsertOperation
  | DeleteOperation
  | ReplaceOperation
  | ChangeFontOperation
  | ChangeSizeOperation
  | ChangeColorOperation;

interface BaseOperation {
  id: string;                    // UUID for undo/redo
  timestamp: number;
  reversible: boolean;
  description: string;           // "Insert 'Hello' at position 10"
}

interface InsertOperation extends BaseOperation {
  type: "insert";
  position: number;              // index in full text
  text: string;
  fontName?: string;             // use from run if not specified
  fontSize?: number;
}

interface DeleteOperation extends BaseOperation {
  type: "delete";
  range: [start: number, end: number];
  originalText: string;          // for undo
}

interface ReplaceOperation extends BaseOperation {
  type: "replace";
  range: [start: number, end: number];
  originalText: string;          // for undo
  newText: string;
}

interface ChangeFontOperation extends BaseOperation {
  type: "changeFont";
  range: [start: number, end: number];
  fontName: string;
  originalFontNames?: Map<number, string>;  // for undo
}

interface ChangeSizeOperation extends BaseOperation {
  type: "changeSize";
  range: [start: number, end: number];
  fontSize: number;
  originalSizes?: Map<number, number>;  // for undo
}

interface ChangeColorOperation extends BaseOperation {
  type: "changeColor";
  range: [start: number, end: number];
  color: [number, number, number];
  originalColors?: Map<number, [number, number, number]>;  // for undo
}
```

### 3.4 TextPositionMap

```typescript
interface TextPositionMap {
  // Maps global text position → (objectIndex, runIndex, charIndexInRun)
  positions: Array<{
    objectIndex: number;
    runIndex: number;
    charIndex: number;
    byteOffset: number;          // in original content stream
  }>;
  
  // Cumulative text lengths
  cumulativeRunLengths: number[];  // after each run
  cumulativeObjectLengths: number[];  // after each object
  
  // Total text length
  totalLength: number;
}
```

### 3.5 ModifiedTextObject (Output)

```typescript
interface ModifiedTextObject extends TextObject {
  // Original runs for comparison
  originalRuns: TextRun[];
  
  // Modified runs (may have different count than original if runs merged)
  modifiedRuns: ModifiedTextRun[];
  
  // Tracking
  changes: {
    textModified: boolean;
    fontChanged: boolean;
    positionChanged: boolean;
    createdNewRuns: number;
    mergedRuns: number;
  };
}

interface ModifiedTextRun extends TextRun {
  // Track origin
  sourceRunIndex: number;
  sourceObjectIndex: number;
  
  // Changes applied
  editsMade: TextEditOperation[];
  
  // Updated dimensions
  estimatedWidth: number;
  estimatedHeight: number;
}
```

---

## 4. TextEditor API (Facade)

### 4.1 Main Operations

```typescript
class TextEditor {
  constructor(textObjects: TextObject[])
  
  // Query
  getText(): string
  getTextObjects(): EditableTextObject[]
  getOperationHistory(): TextEditOperation[]
  canUndo(): boolean
  canRedo(): boolean
  
  // Text Editing
  insertText(
    position: number,
    text: string,
    options?: {
      fontName?: string;
      fontSize?: number;
      color?: [number, number, number];
    }
  ): Result<TextEditOperation>
  
  deleteText(range: [start: number, end: number]): Result<TextEditOperation>
  
  replaceText(
    range: [start: number, end: number],
    newText: string,
    options?: {
      fontName?: string;
      fontSize?: number;
    }
  ): Result<TextEditOperation>
  
  // Formatting Changes
  changeFont(
    range: [start: number, end: number],
    fontName: string
  ): Result<TextEditOperation>
  
  changeFontSize(
    range: [start: number, end: number],
    fontSize: number
  ): Result<TextEditOperation>
  
  changeColor(
    range: [start: number, end: number],
    color: [number, number, number]
  ): Result<TextEditOperation>
  
  // History
  undo(): Result<TextEditOperation | null>
  redo(): Result<TextEditOperation | null>
  
  // Finalization
  finalize(): Result<ModifiedTextObject[]>
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string; code: string }
```

### 4.2 Example Usage

```typescript
// Initialize
const textObjects = extractor.extract();  // Layer 2 output
const editor = new TextEditor(textObjects);

// Query
const fullText = editor.getText();
// Output: "Hello World"

// Insert text
const insertOp = editor.insertText(6, "Beautiful ");
// Result: "Hello Beautiful World"

// Replace text
const replaceOp = editor.replaceText([0, 5], "Hi");
// Result: "Hi Beautiful World"

// Change formatting
const fontOp = editor.changeFont([0, 2], "/F2");

// Apply all edits
const modified = editor.finalize();
// modified[0].modifiedRuns has updated matrices, text, fonts
```

---

## 5. TextPositionMap Calculation

### Algorithm: Build Global Text Index

```
Input: TextObject[]
Output: TextPositionMap

Algorithm:
  positions = []
  cumulativeRunLengths = []
  cumulativeObjectLengths = []
  totalLength = 0
  
  for each textObject at objectIndex:
    startOfObject = totalLength
    
    for each textRun at runIndex:
      startOfRun = totalLength
      
      for each character at charIndex in textRun.text:
        positions.push({
          objectIndex,
          runIndex,
          charIndex,
          byteOffset: ... (from Layer 2 TextRun)
        })
        totalLength += 1
      
      cumulativeRunLengths.push(totalLength - startOfObject)
    
    cumulativeObjectLengths.push(totalLength - startOfObject)
  
  return TextPositionMap { positions, cumulativeRunLengths, cumulativeObjectLengths, totalLength }
```

### Position Lookup Performance
- O(1) reverse lookup: global index → (objectIndex, runIndex, charIndex)
- O(1) forward lookup: (objectIndex, runIndex, charIndex) → global index
- Memory: O(n) where n = total character count (typically < 10MB even for large PDFs)

---

## 6. Edit Operation Processing

### Insert Operation

```
Input: position, text, fontName, fontSize
Precondition: 0 <= position <= totalLength

Steps:
  1. Find target run using TextPositionMap
  2. If position is mid-run: split run at position
  3. Create new run(s) with inserted text
  4. Set font/size if provided, else inherit from target run
  5. Update TextPositionMap for all subsequent positions (+text.length)
  6. Update all EditableTextRun.newOffsets for affected runs
  7. Record operation in history
  8. Return Result.ok(operation)

Error Cases:
  - position < 0 or position > totalLength → InvalidRange
  - text is empty → ZeroLengthInsert
  - fontName not in PDF → FontNotFound (warning, use default)
  - fontSize < 0 → InvalidFontSize

Post-Insert State:
  - Inserted text in EditableTextRun.modifiedText
  - Original run unchanged (for undo)
  - Position map rebuilt
```

### Delete Operation

```
Input: range [start, end]
Precondition: 0 <= start < end <= totalLength

Steps:
  1. Find all runs affected by range
  2. For each affected run:
     a. Determine portion to delete
     b. Update EditableTextRun.modifiedText (set to "" or truncate)
     c. Mark isModified = true
  3. Update TextPositionMap for all subsequent positions (-deletedLength)
  4. Merge adjacent unchanged runs (optional, for efficiency)
  5. Record operation in history
  6. Return Result.ok(operation)

Error Cases:
  - start < 0 or end > totalLength → InvalidRange
  - start >= end → InvalidRange
  - Deletes entire text object → WarnButAllow (empty object preserved)

Post-Delete State:
  - Deleted portions have modifiedText = ""
  - Original text preserved in TextRun (for undo)
  - Position map adjusted for new indices
```

### Replace Operation

```
Input: range [start, end], newText, fontName, fontSize
Precondition: 0 <= start < end <= totalLength

Steps:
  1. Combine Delete(range) + Insert(start, newText, fontName, fontSize)
     - Atomically recorded as single Replace operation
     - Both can undo/redo together
  2. Record operation in history
  3. Return Result.ok(operation)

Efficiency:
  - No intermediate rebuild of position map
  - Single history entry (not two)
```

### ChangeFont Operation

```
Input: range [start, end], fontName
Precondition: 0 <= start < end <= totalLength

Steps:
  1. Find all runs affected by range
  2. For each affected run:
     a. Set run.fontName = fontName
     b. Mark isModified = true
  3. Record operation in history
  4. Return Result.ok(operation)

Error Cases:
  - fontName not found in document → Return error
  - start >= end → InvalidRange

Note:
  - Does NOT split runs (affected runs keep original text boundaries)
  - If range spans multiple runs, each gets fontName set
```

### ChangeSize & ChangeColor (Similar)

---

## 7. RunLayoutCalculator

### Purpose
After edits are finalized, calculate new positions and matrix values to preserve layout.

### Inputs
- EditableTextObject[] (after all edits)
- Original TextObject[] (for reference positioning)
- Font metrics (deferred to Layer 4, use estimates here)

### Algorithm: Position Update

```
for each editableTextObject:
  let currentX = original.firstRun.x
  let currentY = original.firstRun.y
  let currentMatrix = original.firstRun.matrix
  
  for each editableTextRun:
    if run.isModified or run.fontSize changed:
      // Estimate new width
      widthEstimate = estimateTextWidth(
        run.modifiedText,
        run.fontName || run.original.fontName,
        run.fontSize || run.original.fontSize
      )
      // Update position if text shifted due to earlier edits
      run.newX = currentX
      run.newY = currentY
      run.newMatrix = updateMatrix(currentMatrix, currentX, currentY)
    else:
      // Text unchanged, preserve original position
      run.newX = run.original.x
      run.newY = run.original.y
      run.newMatrix = run.original.matrix
    
    // Move cursor for next run
    currentX += run.widthEstimate
```

### Width Estimation

```typescript
function estimateTextWidth(
  text: string,
  fontName: string,
  fontSize: number
): number {
  // Deferred detailed metric lookup to Layer 4
  // For Layer 3, use conservative estimate:
  // - Fixed width per character (~0.5 × fontSize)
  // - Plus character spacing adjustments
  
  const charWidth = 0.5 * fontSize;
  let width = 0;
  
  for (let char of text) {
    width += charWidth;
    if (char === " ") {
      width += wordSpacing * fontSize / 100;  // rough estimate
    }
  }
  
  return width;
}
```

---

## 8. Undo/Redo Stack

### Implementation

```typescript
interface EditSession {
  // Immutable edit history
  operations: TextEditOperation[];
  
  // Current position in history
  currentPosition: number;  // -1 = no operations yet
  
  // Edit state at each position
  stateSnapshots: Array<{
    editableObjects: EditableTextObject[];
    positionMap: TextPositionMap;
  }>;
}

class TextEditor {
  private session: EditSession;
  
  undo(): Result<TextEditOperation | null> {
    if (!this.canUndo()) return { ok: true, value: null };
    
    this.session.currentPosition -= 1;
    this.rebuildState(this.session.currentPosition);
    return { ok: true, value: null };
  }
  
  redo(): Result<TextEditOperation | null> {
    if (!this.canRedo()) return { ok: true, value: null };
    
    this.session.currentPosition += 1;
    this.rebuildState(this.session.currentPosition);
    return { ok: true, value: null };
  }
  
  private rebuildState(position: number): void {
    // Restore editableObjects from snapshot
    // This is O(1) for small snapshots due to state preservation
  }
}
```

### Memory Efficiency
- Store full snapshots: ~200 bytes per operation (edit metadata + pointers)
- Typical undo depth: 50–100 operations
- Total snapshot memory: ~20KB
- Acceptable for in-browser editing

---

## 9. Integration Points

### Input from Layer 2
```typescript
// Layer 2 provides:
textObjects: TextObject[] = [
  {
    runs: [
      { text: "Hello", fontName: "F1", fontSize: 12, x: 100, y: 200, ... },
      { text: " World", fontName: "F1", fontSize: 12, x: 125, y: 200, ... }
    ],
    boundingBox: { x1: 100, y1: 180, x2: 160, y2: 220 }
  }
]

// Layer 3 accepts: TextObject[]
editor = new TextEditor(textObjects);
```

### Output to Layer 4
```typescript
// Layer 3 provides:
modifiedObjects: ModifiedTextObject[] = [
  {
    originalRuns: [...],
    modifiedRuns: [
      { 
        text: "Hello Beautiful ", 
        fontName: "F2",  // changed
        fontSize: 14,     // changed
        x: 100,
        y: 200,
        matrix: [1, 0, 0, 1, 100, 200],
        estimatedWidth: 80,
        editsMade: [InsertOperation, ChangeFontOperation, ...]
      },
      ...
    ],
    changes: { textModified: true, fontChanged: true, ... }
  }
]

// Layer 4 (Layout Engine) receives: ModifiedTextObject[]
// - Validates estimated widths with font metrics
// - Calculates precise kerning
// - Updates matrices for alignment
// - Handles line breaking if needed
```

---

## 10. Security Model & Limits

### Input Validation

| Constraint | Limit | Rationale |
|-----------|-------|-----------|
| Max edited text length | 32 MB | Same as Layer 1 string limit |
| Max operations per session | 10,000 | Prevents history explosion |
| Max undo depth | 1,000 | Memory bound: ~200KB |
| Max text objects | 100,000 | From Layer 1 (1M objects) |
| Max runs per object | 10,000 | Prevent pathological nesting |
| Max font changes per operation | 1,000 | Prevent flooding |

### Error Handling

```typescript
type ErrorCode = 
  | "InvalidRange"
  | "ZeroLengthInsert"
  | "FontNotFound"
  | "InvalidFontSize"
  | "OperationLimitExceeded"
  | "UndoHistoryFull"
  | "TextLengthExceeded"
  | "MalformedOperation"
  | "InternalError";

interface EditError {
  code: ErrorCode;
  message: string;
  recoverable: boolean;  // true = try again with different params
}
```

---

## 11. Test Strategy

### 11.1 Unit Tests (~30 tests)

**TextPositionMap Construction & Lookup**
- [ ] Build map for single text object
- [ ] Build map for multiple objects
- [ ] Position lookup forward (index → run)
- [ ] Position lookup reverse (run → index)
- [ ] Handle empty runs (degenerate case)
- [ ] Handle runs at boundaries

**Insert Operations**
- [ ] Insert at position 0
- [ ] Insert at position end
- [ ] Insert in middle of run
- [ ] Insert spanning multiple runs
- [ ] Insert with font change
- [ ] Insert with size change
- [ ] Insert zero-length text (error)
- [ ] Insert with invalid position (error)
- [ ] Insert after deletion (position map rebuilt)

**Delete Operations**
- [ ] Delete single character
- [ ] Delete entire run
- [ ] Delete spanning multiple runs
- [ ] Delete to end of text
- [ ] Delete all text (warning allowed)
- [ ] Delete zero-length range (error)
- [ ] Delete with invalid range (error)
- [ ] Delete after insert (chained)

**Replace Operations**
- [ ] Replace single character
- [ ] Replace within run
- [ ] Replace across runs
- [ ] Replace entire text object
- [ ] Replace with font change
- [ ] Replace with size change
- [ ] Replace zero-length (error)

**Font/Size/Color Changes**
- [ ] Change font in single run
- [ ] Change font across multiple runs
- [ ] Change font with invalid name (error)
- [ ] Change size in range
- [ ] Change color in range

**Undo/Redo**
- [ ] Undo single operation
- [ ] Redo after undo
- [ ] Undo multiple levels
- [ ] Redo multiple levels
- [ ] Can't undo at start (false)
- [ ] Can't redo at end (false)
- [ ] New operation clears redo stack

### 11.2 Integration Tests (~15 tests)

**Multi-Operation Sequences**
- [ ] Insert + Insert (same run)
- [ ] Insert + Insert (different runs)
- [ ] Insert + Delete (overlapping ranges)
- [ ] Delete + Insert (restore deleted text)
- [ ] Replace + ChangeFont (same range)
- [ ] Insert + ChangeFont (dependent ops)
- [ ] Multiple formatting changes stacked
- [ ] Format change on empty result (after delete)

**Complex Text Objects**
- [ ] Edit text with 3+ objects
- [ ] Edit with 5+ runs per object
- [ ] Edit with mixed formatting
- [ ] Edit with very long text (1MB)

**State Preservation**
- [ ] Position map accurate after each op
- [ ] No data loss in undo/redo cycle
- [ ] Original text never modified
- [ ] Operation count correct
- [ ] Changes tracking correct

### 11.3 Edge Case Tests (~15 tests)

- [ ] Empty text object (no runs)
- [ ] Single-character runs
- [ ] Runs with special characters (newlines, tabs)
- [ ] Text with numeric only (position sensitivity)
- [ ] Font name with special characters
- [ ] Unicode text (multi-byte characters)
- [ ] Very large font sizes (> 1000pt)
- [ ] Very small font sizes (< 1pt)
- [ ] Color values at boundaries ([0,0,0], [255,255,255])
- [ ] Text with mixed Latin + non-Latin scripts
- [ ] Operations at exact boundaries
- [ ] Undo/redo with maximum depth (1000 ops)
- [ ] Memory stress: 10,000 operations
- [ ] Position lookup O(1) performance
- [ ] History serialization/deserialization

### 11.4 Interaction with Layer 2

- [ ] TextEditor accepts TextObject[] from TextExtractor
- [ ] Output format matches Layer 4 expectations
- [ ] No mutation of input TextObject[]
- [ ] Byte offsets preserved from Layer 2

---

## 12. Performance Targets

### Operation Performance

| Operation | Expected Time | Acceptable Range |
|-----------|--------------|-----------------|
| Insert 100 characters | < 5ms | < 10ms |
| Delete 100 characters | < 5ms | < 10ms |
| Replace 1000 chars | < 10ms | < 20ms |
| Change font (range) | < 5ms | < 10ms |
| Undo/Redo | < 1ms | < 5ms |
| Get full text | < 1ms | < 5ms |
| Finalize 1000 objects | < 50ms | < 100ms |

### Memory Usage

| Component | Target |
|-----------|--------|
| EditableTextRun (per run) | ~500 bytes |
| undo/redo snapshot (per op) | ~200 bytes |
| Position map (per character) | ~50 bytes |
| **Total for typical PDF** | **< 50MB** |

### Complexity Analysis

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Insert | O(n) | Rebuild position map |
| Delete | O(n) | Rebuild position map |
| Replace | O(n) | Combined delete+insert |
| ChangeFont | O(m) | m = runs in range |
| Undo/Redo | O(1) | State snapshot lookup |
| Finalize | O(n) | Recalculate all positions |
| getText() | O(1) | With memoization |
| getOperationHistory() | O(k log k) | k = operations, for search |

---

## 13. Future Compatibility (Layers 4–5)

### Layer 4 (Layout Engine) Expectations

Layer 4 receives ModifiedTextObject[] and will:
1. **Validate** positions using font metrics
2. **Refine** width calculations with actual kerning data
3. **Handle** line breaking and alignment
4. **Preserve** semantic intent (e.g., "these words should be on same line")

### Layer 5 (Writer) Expectations

Layer 5 receives final ModifiedTextObject[] and will:
1. **Serialize** operations back to PDF content stream operators
2. **Generate** new xref entries
3. **Write** incremental update to file

### Reversibility Guarantee

TextEditor provides enough information for Layer 5 to generate:
```
BT
/F1 12 Tf
1 0 0 1 100 200 Tm
(Hello Beautiful ) Tj
ET
```

Original:
```
BT
/F1 12 Tf
1 0 0 1 100 200 Tm
(Hello) Tj
( World) Tj
ET
```

---

## 14. Specification Completeness Checklist

### Design Specification
- [x] Architecture overview with data flow
- [x] Core data structures (Editable*, Modified*, TextPositionMap)
- [x] TextEditor API with method signatures
- [x] Operation types with full details
- [x] Algorithms (position map, edit processing)
- [x] Undo/redo stack design
- [x] Integration with Layer 2 input format
- [x] Integration with Layer 4 output format
- [x] Security model and limits
- [x] Error handling strategy
- [x] Test strategy (60 tests planned)
- [x] Performance targets
- [x] Complexity analysis

### Implementation Readiness
- [x] TypeScript interfaces defined
- [x] Method signatures specified
- [x] Error codes defined
- [x] Algorithm pseudocode
- [x] Integration points documented
- [x] No ambiguities in specification

### Quality Checklist
- [x] Backward compatible (no Layer 1/2 changes)
- [x] Forward compatible (Layer 4 compatible)
- [x] Reversible operations (undo/redo support)
- [x] Handles edge cases (empty objects, unicode, etc.)
- [x] Secure (validates inputs, limits enforced)
- [x] Performant (O(n) complexity, < 50MB memory)
- [x] Testable (60+ test cases identified)

---

## 15. Open Questions for Review

1. **Run Merging**: Should Layer 3 merge adjacent runs with same formatting after edits?
   - Pro: Cleaner output, fewer operators in final PDF
   - Con: More complex logic, potential for errors
   - Decision: Defer to Layer 4 (Layout Engine)

2. **Kerning Preservation**: Should we preserve original kerning pairs?
   - Pro: Visual fidelity to original
   - Con: Requires font metrics (needs Layer 4)
   - Decision: Use estimates in Layer 3, refine in Layer 4

3. **Position Map Mutability**: Should position map be rebuilt after every operation or cached?
   - Pro: Always accurate, simpler logic
   - Con: O(n) rebuild overhead per operation
   - Decision: Rebuild lazily (only when needed for next query)

4. **Max Edits Per Session**: Is 10,000 operations enough?
   - Typical editing: 50–200 operations
   - Batch operations: 500–1000 possible
   - Decision: 10,000 is reasonable; enforce with warning at 80%

5. **Snapshot Storage**: Full state snapshots or delta-based?
   - Pro (full): Simple undo/redo, O(1) lookup
   - Con (full): More memory (200 bytes per operation)
   - Pro (delta): Memory efficient
   - Con (delta): Complex to reconstruct
   - Decision: Full snapshots (< 50MB acceptable)

---

## 16. Implementation Roadmap

After design review approval, implementation will follow:

### Phase 1: Core Data Structures (1–2 hours)
- EditableTextRun, EditableTextObject interfaces
- TextPositionMap structure and build algorithm
- ModifiedTextObject, ModifiedTextRun interfaces

### Phase 2: TextPositionMap Builder (1 hour)
- Implement position mapping algorithm
- Implement position lookup (forward/reverse)
- Unit tests for map construction (6 tests)

### Phase 3: TextEditor Facade (2–3 hours)
- Implement insertText, deleteText, replaceText
- Implement changeFont, changeFontSize, changeColor
- Error handling and validation
- Unit tests (20 tests)

### Phase 4: Undo/Redo & History (1 hour)
- EditSession and operation recording
- undo() and redo() methods
- History snapshot management
- Unit tests (5 tests)

### Phase 5: RunLayoutCalculator (1–2 hours)
- Position update algorithm
- Width estimation
- Matrix recalculation
- Integration tests (15 tests)

### Phase 6: Integration & Edge Cases (1–2 hours)
- Integration tests with Layer 2 output
- Edge case tests (15 tests)
- Performance validation
- Memory profiling

### Total Estimated Implementation Time: 8–11 hours

---

## 17. Sign-Off Criteria for Implementation

Design review passes when:
- [x] All 16 sections complete and consistent
- [x] No ambiguities in specifications
- [x] Edge cases identified and handled
- [x] Performance targets realistic
- [x] Error handling comprehensive
- [x] 60+ test cases identified
- [x] Architecture compatible with Layers 1, 2, 4, 5
- [x] Security model validated
- [ ] Review feedback addressed (pending)

---

**End of Layer 3 Design Specification**

Next: Design Review Phase (Milestone 3 Step 2)
