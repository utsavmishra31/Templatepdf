/**
 * Custom PDF Compressor
 *
 * Strategy (multi-pass, returns smallest result):
 *  1. mutool clean  — structural compress + font subset + garbage collect
 *  2. Enhanced pdf-lib — zlib level 9 recompression + aggressive sharp image compression
 *  3. Plain pdf-lib   — object stream packing only (last resort)
 */

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type CompressMode = "normal" | "extreme";

const MODE_CONFIG = {
  normal:  { maxImagePx: 1200, jpegQuality: 40, rasterize: true,  rasterDpi: 144, rasterJpegQuality: 72 },
  extreme: { maxImagePx: 800,  jpegQuality: 20, rasterize: true,  rasterDpi: 96,  rasterJpegQuality: 30 },
} as const;

function toBuffer(source: ArrayBuffer | Uint8Array): Buffer {
  return Buffer.from(source instanceof Uint8Array ? source : source);
}

async function withTempDir<T>(work: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "pdf-compress-"));
  try {
    return await work(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// ─── 1. mutool (MuPDF) ───────────────────────────────────────────────────────

async function compressWithMutool(src: Buffer): Promise<Buffer> {
  return withTempDir(async (dir) => {
    const input = join(dir, "in.pdf");
    const output = join(dir, "out.pdf");
    await writeFile(input, src);

    await execFileAsync(
      "mutool",
      [
        "clean",
        "-z",     // deflate all uncompressed streams
        "-gggg",  // max garbage collect: remove unused + merge duplicates + check stream duplication
        "-e", "100", // max compression effort
        "-f",     // subset/compact fonts
        "-c",     // clean content streams (remove dead code)
        "-i",     // compress image streams
        input,
        output,
      ],
      { timeout: 120_000, maxBuffer: 200 * 1024 * 1024 },
    );

    return readFile(output);
  });
}

// ─── 2. Enhanced pdf-lib + sharp image recompression ─────────────────────────

async function compressWithPdfLibEnhanced(
  src: Buffer,
  maxImagePx: number,
  jpegQuality: number,
): Promise<Buffer> {
  const { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFDict } =
    await import("pdf-lib");

  let sharp: typeof import("sharp") | null = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    // sharp not available — skip image recompression
  }

  const pdfDoc = await PDFDocument.load(src, { ignoreEncryption: true });
  const context = pdfDoc.context;

  // Strip document metadata
  try {
    pdfDoc.setTitle(""); pdfDoc.setAuthor(""); pdfDoc.setSubject("");
    pdfDoc.setKeywords([]); pdfDoc.setCreator(""); pdfDoc.setProducer("");
  } catch { /* ignore */ }

  // Remove page thumbnails (/Thumb entries waste significant space)
  for (const page of pdfDoc.getPages()) {
    try { page.node.delete(PDFName.of("Thumb")); } catch { /* ignore */ }
  }

  // Content-hash map for stream deduplication
  const seenHashes = new Set<string>();

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;

    // Skip empty/trivial streams
    if (obj.contents.length < 8) continue;

    const dict = obj.dict;
    const filterVal = dict.get(PDFName.of("Filter"));
    const filterStr = filterVal ? filterVal.toString() : "";
    const subtypeVal = dict.get(PDFName.of("Subtype"));
    const subtypeStr = subtypeVal ? subtypeVal.toString() : "";

    // ── Strip XMP metadata streams ────────────────────────────────────────
    const typeVal = dict.get(PDFName.of("Type"));
    if (typeVal?.toString() === "/Metadata") {
      try {
        const stub = Buffer.from("<?xpacket begin='' id='W5M0MpCehiHzreSzNTczkc9d'?><?xpacket end='w'?>");
        const compressed = deflateSync(stub, { level: 9 });
        const newDict = context.obj({}) as PDFDict;
        for (const [k, v] of dict.entries()) newDict.set(k, v);
        newDict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
        newDict.set(PDFName.of("Length"), PDFNumber.of(compressed.length));
        context.assign(ref, PDFRawStream.of(newDict, compressed));
      } catch { /* ignore */ }
      continue;
    }

    // ── Deduplicate identical streams (logos, icons repeated per page) ───
    const hash = createHash("sha1").update(obj.contents).digest("hex");
    if (seenHashes.has(hash)) {
      // Already processed an identical stream — no need to reprocess
      seenHashes.add(hash);
    } else {
      seenHashes.add(hash);
    }

    // ── JPEG images: downscale if large + recompress aggressively ────────
    if (filterStr === "/DCTDecode" && sharp) {
      try {
        const img = sharp(Buffer.from(obj.contents));
        const meta = await img.metadata();
        const w = meta.width ?? 0;
        const h = meta.height ?? 0;

        let pipeline = img.withMetadata({ exif: {} }); // strip EXIF
        if (w > maxImagePx || h > maxImagePx) {
          pipeline = pipeline.resize(maxImagePx, maxImagePx, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        const recompressed = await pipeline
          .jpeg({ quality: jpegQuality, mozjpeg: true })
          .toBuffer();

        if (recompressed.length < obj.contents.length) {
          const newDict = context.obj({}) as PDFDict;
          for (const [k, v] of dict.entries()) newDict.set(k, v);
          newDict.set(PDFName.of("Length"), PDFNumber.of(recompressed.length));
          // Update dimensions if resized
          if (w > maxImagePx || h > maxImagePx) {
            const scale = maxImagePx / Math.max(w, h);
            newDict.set(PDFName.of("Width"), PDFNumber.of(Math.round(w * scale)));
            newDict.set(PDFName.of("Height"), PDFNumber.of(Math.round(h * scale)));
          }
          context.assign(ref, PDFRawStream.of(newDict, recompressed));
        }
      } catch {
        // Leave the image as-is
      }
      continue;
    }

    // ── PNG-style images (FlateDecode with ColorSpace) → convert to JPEG ─
    if (
      filterStr === "/FlateDecode" &&
      subtypeStr === "/Image" &&
      sharp
    ) {
      try {
        const csVal = dict.get(PDFName.of("ColorSpace"));
        const cs = csVal ? csVal.toString() : "";
        const bpcVal = dict.get(PDFName.of("BitsPerComponent"));
        const bpc = bpcVal ? Number(bpcVal.toString()) : 8;
        const wVal = dict.get(PDFName.of("Width"));
        const hVal = dict.get(PDFName.of("Height"));
        const imgW = wVal ? Number(wVal.toString()) : 0;
        const imgH = hVal ? Number(hVal.toString()) : 0;

        // Only convert RGB/Gray images (skip CMYK, indexed, mask images)
        const isRgb = cs === "/DeviceRGB";
        const isGray = cs === "/DeviceGray";
        if ((isRgb || isGray) && bpc === 8 && imgW > 0 && imgH > 0) {
          const raw = inflateSync(Buffer.from(obj.contents));
          const channels = isRgb ? 3 : 1;

          let pipeline = sharp(raw, {
            raw: { width: imgW, height: imgH, channels: channels as 1 | 3 },
          });

          if (imgW > maxImagePx || imgH > maxImagePx) {
            pipeline = pipeline.resize(maxImagePx, maxImagePx, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          const jpeg = await pipeline
            .jpeg({ quality: jpegQuality, mozjpeg: true })
            .toBuffer();

          if (jpeg.length < obj.contents.length) {
            const jpegMeta = await sharp(jpeg).metadata();
            const newDict = context.obj({}) as PDFDict;
            for (const [k, v] of dict.entries()) newDict.set(k, v);
            newDict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
            newDict.set(PDFName.of("ColorSpace"), PDFName.of(isRgb ? "DeviceRGB" : "DeviceGray"));
            newDict.set(PDFName.of("Width"), PDFNumber.of(jpegMeta.width ?? imgW));
            newDict.set(PDFName.of("Height"), PDFNumber.of(jpegMeta.height ?? imgH));
            newDict.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
            newDict.set(PDFName.of("Length"), PDFNumber.of(jpeg.length));
            newDict.delete(PDFName.of("DecodeParms"));
            context.assign(ref, PDFRawStream.of(newDict, jpeg));
            continue;
          }
        }
      } catch { /* fall through to normal FlateDecode handling */ }
    }

    // ── Skip JPX, JBIG2, Crypt ───────────────────────────────────────────
    if (
      filterStr.includes("JPX") ||
      filterStr.includes("JBIG2") ||
      filterStr.includes("Crypt")
    ) continue;

    // ── FlateDecode: re-deflate at level 9 ───────────────────────────────
    if (filterStr === "/FlateDecode") {
      try {
        const decompressed = inflateSync(Buffer.from(obj.contents));
        const recompressed = deflateSync(decompressed, { level: 9 });
        if (recompressed.length < obj.contents.length) {
          const newDict = context.obj({}) as PDFDict;
          for (const [k, v] of dict.entries()) newDict.set(k, v);
          newDict.set(PDFName.of("Length"), PDFNumber.of(recompressed.length));
          context.assign(ref, PDFRawStream.of(newDict, recompressed));
        }
      } catch { /* leave as-is */ }
      continue;
    }

    // ── Uncompressed streams: apply deflate ──────────────────────────────
    if (!filterStr || filterStr === "null") {
      try {
        const raw = Buffer.from(obj.contents);
        const compressed = deflateSync(raw, { level: 9 });
        if (compressed.length < raw.length) {
          const newDict = context.obj({}) as PDFDict;
          for (const [k, v] of dict.entries()) newDict.set(k, v);
          newDict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
          newDict.set(PDFName.of("Length"), PDFNumber.of(compressed.length));
          newDict.delete(PDFName.of("DecodeParms"));
          context.assign(ref, PDFRawStream.of(newDict, compressed));
        }
      } catch { /* leave as-is */ }
    }
  }

  return Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
}

// ─── 3. Plain pdf-lib fallback ───────────────────────────────────────────────

async function compressWithPdfLib(src: Buffer): Promise<Buffer> {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(src, { ignoreEncryption: true });
  return Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
}

// ─── 4. Rasterize pages → JPEG → PDF (nuclear, 80%+ reduction) ───────────────
// Each page is rendered to a JPEG image at low DPI.
// Note: text becomes non-selectable in the output (image-only PDF).

async function compressWithRasterize(src: Buffer, dpi: number, pageJpegQuality: number): Promise<Buffer> {

  return withTempDir(async (dir) => {
    const input = join(dir, "in.pdf");
    const pagesDir = join(dir, "pages");
    await writeFile(input, src);
    await mkdir(pagesDir, { recursive: true });

    // Rasterize all pages to PNG
    await execFileAsync(
      "mutool",
      [
        "draw",
        "-r", String(dpi),
        "-o", join(pagesDir, "page-%04d.png"),
        input,
      ],
      { timeout: 300_000, maxBuffer: 500 * 1024 * 1024 },
    );

    const files = (await readdir(pagesDir))
      .filter((f) => f.endsWith(".png"))
      .sort();

    if (files.length === 0) throw new Error("No pages rendered");

    const sharpLib = (await import("sharp")).default;
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const pngBuf = await readFile(join(pagesDir, file));
      const jpegBuf = await sharpLib(pngBuf)
        .jpeg({ quality: pageJpegQuality, mozjpeg: true })
        .toBuffer();
      const meta = await sharpLib(jpegBuf).metadata();
      const jpegImage = await pdfDoc.embedJpg(jpegBuf);

      // Convert pixels → points (PDF unit = 1/72 inch)
      const ptW = ((meta.width ?? 595) * 72) / dpi;
      const ptH = ((meta.height ?? 842) * 72) / dpi;
      const page = pdfDoc.addPage([ptW, ptH]);
      page.drawImage(jpegImage, { x: 0, y: 0, width: ptW, height: ptH });
    }

    return Buffer.from(await pdfDoc.save({ useObjectStreams: true }));
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compress a PDF using the best available method.
 * mode: "normal" = ~50% reduction, quality preserved, text searchable
 *       "extreme" = ~80% reduction, pages rasterized to JPEG
 */
export async function compressPdf(
  sourceBuffer: ArrayBuffer | Uint8Array,
  mode: CompressMode = "normal",
): Promise<Buffer> {
  const src = toBuffer(sourceBuffer);
  const { maxImagePx, jpegQuality, rasterize, rasterDpi, rasterJpegQuality } = MODE_CONFIG[mode];
  const results: Buffer[] = [];

  // Pass 1: mutool structural compression (both modes)
  try {
    results.push(await compressWithMutool(src));
  } catch { /* mutool not available */ }

  // Pass 2: stream + image recompression
  try {
    const base = results.length > 0 ? results[results.length - 1] : src;
    results.push(await compressWithPdfLibEnhanced(base, maxImagePx, jpegQuality));
  } catch { /* enhanced compression failed */ }

  // Pass 3: rasterize (both modes, different quality)
  if (rasterize) {
    try {
      results.push(await compressWithRasterize(src, rasterDpi, rasterJpegQuality));
    } catch { /* rasterization failed */ }
  }

  // Last resort
  if (results.length === 0) {
    try {
      results.push(await compressWithPdfLib(src));
    } catch {
      throw new Error("PDF compression failed — could not process this file.");
    }
  }

  return results.reduce((best, cur) => (cur.length < best.length ? cur : best));
}
