/**
 * MILESTONE 1 REVIEW: Known Limitations and Future Work
 *
 * This document outlines what the current PDF parser layer supports,
 * what it intentionally does NOT support, and why.
 *
 * MISSION: This is a REAL PDF editing engine layer. It parses original PDF
 * structures and preserves byte-accurate references. It does NOT use overlays,
 * white rectangles, or fake editing.
 *
 * ====================================================================
 * SUPPORTED FEATURES
 * ====================================================================
 *
 * 1. PDF Versions
 *    - PDF 1.0 through 1.7 (classic)
 *    - PDF 2.0 headers recognized (full compliance in Layer 2+)
 *
 * 2. PDF Structure Parsing
 *    - Classic xref tables (including subsections)
 *    - Hybrid xref tables (table + stream in same doc)
 *    - XRef streams (compressed cross-reference format)
 *    - Incremental updates (revision chains via /Prev)
 *    - Object streams (compressed object containers)
 *    - Trailer dictionaries
 *
 * 3. PDF Objects and Values
 *    - Null, booleans, numbers (int/float)
 *    - Strings (literal with escape sequences)
 *    - Hex strings (ASCII hex encoding)
 *    - Names (with proper delimiter handling)
 *    - Arrays (nested)
 *    - Dictionaries (nested, key-value pairs)
 *    - Indirect references (obj gen R notation)
 *    - Comments (% style, line-based)
 *
 * 4. Streams
 *    - Stream dictionary + stream data recognition
 *    - Length resolution (direct or indirect)
 *    - FlateDecode (built-in decompression)
 *    - Filter metadata parsing (no decompression for other filters)
 *    - Raw byte access without decode
 *
 * 5. Validation & Recovery (Tolerant Mode)
 *    - Malformed but recoverable xref entries
 *    - Missing object delimiters (best-effort recovery)
 *    - Trailer consistency checking
 *    - Object count vs Size mismatch warnings
 *    - Dangling reference detection
 *
 * ====================================================================
 * INTENTIONALLY NOT SUPPORTED (and why)
 * ====================================================================
 *
 * 1. Encryption/Permissions
 *    WHY: Document editing requires decryption first.
 *    Encrypted PDFs will be rejected until a decryption layer is added.
 *    This is not a limitation; it's a correctness requirement.
 *
 * 2. Content Stream Parsing
 *    WHY: This is Layer 2. Layer 1 only parses document structure.
 *    Content streams are left as opaque byte sequences in Layer 1.
 *
 * 3. Font Subsetting & Advanced Font Metadata
 *    WHY: Layer 3 (Text Engine) will handle fonts.
 *    Layer 1 treats font refs as object references only.
 *
 * 4. Complex Filters (JPX, JBIG2, DCT, CCITTFax, LZW, etc.)
 *    WHY: Stream decoding is Layer 2. Layer 1 rejects unknown filters
 *    with explicit error instead of faking decode success.
 *    This preserves safety: never claim you decoded when you didn't.
 *
 * 5. Annotation and Form Field Editing
 *    WHY: Layer 4+ concern. Layer 1 sees these as normal objects.
 *
 * 6. Linearized PDFs (fast web viewing optimizations)
 *    WHY: Supported but not optimized. Linearization dict is parsed
 *    as a normal object. Full optimization in Layer 2.
 *
 * 7. Digital Signatures
 *    WHY: Document integrity layer comes after content editing.
 *    Currently parsed as objects, not validated.
 *
 * ====================================================================
 * SECURITY & LIMITS (Enforced)
 * ====================================================================
 *
 * 1. Object Count: 1,000,000 max
 *    RATIONALE: Prevent zip-bomb style attacks with cyclic references.
 *
 * 2. Stream Size: 512 MB max
 *    RATIONALE: Prevent OOM attacks with huge declared streams.
 *
 * 3. String Length: 32 MB max
 *    RATIONALE: Prevent memory exhaustion from huge strings.
 *
 * 4. Nesting Depth: 64 max (arrays, dicts, strings)
 *    RATIONALE: Prevent stack exhaustion from deeply nested structures.
 *
 * 5. Array/Dict Depth: 32 max
 *    RATIONALE: Tighter limit on recursive structures.
 *
 * 6. Revision Chain Limit: 32 max
 *    RATIONALE: Prevent attacks using hundreds of /Prev pointers.
 *
 * ====================================================================
 * EDGE CASES & KNOWN BEHAVIORS
 * ====================================================================
 *
 * 1. Multiple Objects with Same Number/Generation
 *    BEHAVIOR: Last revision wins (standard PDF semantics).
 *    RISK: Rare; detected in validation warnings.
 *
 * 2. Offset Mismatches in XRef
 *    BEHAVIOR: If xref offset != actual object byte position,
 *    parser will fail in strict mode, recover in tolerant mode.
 *    RATIONALE: Offset correctness is critical for Layer 2 editing.
 *
 * 3. Stream Length Declared > Actual
 *    BEHAVIOR: Parser reads up to endstream marker or declared length,
 *    whichever comes first. Mismatch reported as warning.
 *    RATIONALE: Prevents infinite reads; warns about inconsistency.
 *
 * 4. Missing /endobj or /endstream Markers
 *    BEHAVIOR: Parser searches forward for next object header or xref.
 *    In strict mode: error. In tolerant: warning + recovery.
 *
 * 5. Circular Indirect References (A refs B refs A)
 *    BEHAVIOR: Parsed successfully. Cycle detection in Layer 2.
 *    RATIONALE: References are structural; cycles are semantic concerns.
 *
 * 6. Object Stream Corruption
 *    BEHAVIOR: If xref stream decodes but contains malformed obj numbers,
 *    warning is issued. Parsing continues with available objects.
 *
 * ====================================================================
 * VALIDATION MODES
 * ====================================================================
 *
 * STRICT (default)
 *    - Hard fails on first unfixable error
 *    - Example: malformed xref entries, missing header
 *    - Use for production pipelines
 *
 * TOLERANT
 *    - Recovers where safe, collects warnings
 *    - Skips malformed objects, continues parse
 *    - Use for batch processing mixed-quality PDFs
 *
 * FORENSIC
 *    - Like tolerant, but retains all anomalies for analysis
 *    - Planned for future; not yet implemented
 *    - Use for document forensics, debugging
 *
 * ====================================================================
 * NEXT STEPS (Layers 2+)
 * ====================================================================
 *
 * Layer 2: Content Stream Parser
 *    - Parse content stream operators (BT, ET, Tj, Tf, etc.)
 *    - Build editable AST of text operations
 *    - Preserve font/color/position metadata
 *
 * Layer 3: Text Engine
 *    - Editable TextRun, Paragraph, Line objects
 *    - Font reference resolution
 *    - Glyph metrics and kerning preservation
 *    - Text replacement, deletion, insertion
 *
 * Layer 4: Layout Engine
 *    - Kerning and character spacing preservation
 *    - Transform matrix application
 *    - Baseline alignment
 *    - Word/line reflow (optional)
 *
 * Layer 5: Writer
 *    - Generate valid PDF bytes
 *    - Incremental save support
 *    - Object reference consistency
 *    - Cross-reference regeneration
 *
 * ====================================================================
 * TESTING STRATEGY
 * ====================================================================
 *
 * Layer 1 tests (current):
 *    - Header parsing (version, binary marker)
 *    - Value parsing (all primitive types)
 *    - XRef classic + stream
 *    - Trailer parsing
 *    - Minimal valid PDF end-to-end
 *
 * Layer 1 edge cases (expanded):
 *    - Broken xref offsets (tolerant recovery)
 *    - Trailer /Size mismatches
 *    - Missing root object
 *    - Huge declared stream length
 *    - Deep nesting (arrays/dicts)
 *    - Circular indirect references
 *    - Malformed object headers
 *    - Multiple revisions
 *
 * Fuzz tests (planned):
 *    - Random byte mutation
 *    - Truncated files
 *    - Cyclic /Prev chains
 *
 * ====================================================================
 * CORRECTNESS GUARANTEES
 * ====================================================================
 *
 * 1. Byte-Accurate Offsets
 *    GUARANTEE: Every object's byte range is tracked precisely.
 *    If you edit object at offset X, other objects' byte ranges
 *    remain valid for Layer 2+ to use.
 *
 * 2. No Fake Editing
 *    GUARANTEE: Parser never claims to modify content it didn't parse.
 *    If stream filter is unsupported, error is explicit.
 *    If object is malformed, parse fails or warning is issued.
 *
 * 3. Object Reference Integrity
 *    GUARANTEE: Indirect references (obj gen R) are preserved exactly.
 *    Layer 2+ can rewrite object content without breaking refs.
 *
 * 4. Incremental Update Safety
 *    GUARANTEE: Revision chain is preserved in order.
 *    Previous revisions remain accessible for forensics.
 *    Editing creates new revision without touching old bytes.
 *
 * 5. Validation Traceability
 *    GUARANTEE: Every warning/error includes offset and code.
 *    You can inspect the exact byte that caused the issue.
 *
 * ====================================================================
 * PRODUCTION READINESS ASSESSMENT
 * ====================================================================
 *
 * Layer 1 (PDF Parser) is production-ready for:
 *    ✅ Parsing valid PDF 1.0-1.7 documents
 *    ✅ Extracting document structure and metadata
 *    ✅ Recovering from common malformations (tolerant mode)
 *    ✅ Enforcing security limits
 *    ✅ Tracking byte offsets for Layer 2 editing
 *
 * Layer 1 is NOT ready for:
 *    ❌ Content editing (Layer 2 needed)
 *    ❌ Encrypted PDFs without decryption layer
 *    ❌ Complex stream decoders (JPX, JBIG2, etc.)
 *    ❌ Digital signature validation
 *
 * ====================================================================
 */

export const PARSER_LIMITATIONS = {
  unsupported: [
    "Encryption/Permissions",
    "Complex filters (JPX, JBIG2, DCT, CCITTFax)",
    "Digital signatures",
    "Font subsetting",
  ],
  limits: {
    maxObjectCount: 1_000_000,
    maxStreamLength: "512 MB",
    maxStringLength: "32 MB",
    maxNestingDepth: 64,
    maxRevisions: 32,
  },
  supportedVersions: ["1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "2.0"],
};
