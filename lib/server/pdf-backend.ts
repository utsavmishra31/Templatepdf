import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type PdfCompressQuality = "screen" | "ebook" | "printer";

function toBuffer(source: ArrayBuffer | Uint8Array) {
  return source instanceof Uint8Array ? Buffer.from(source) : Buffer.from(source);
}

async function withTempDir<T>(work: (directory: string) => Promise<T>) {
  const directory = await mkdtemp(join(tmpdir(), "templatepdf-pdf-"));
  try {
    return await work(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * Compress via Ghostscript (best quality, preserves searchable text).
 * Throws ENOENT if gs is not installed.
 */
async function compressPdfWithGhostscript(
  sourceBuffer: ArrayBuffer | Uint8Array,
  quality: PdfCompressQuality,
): Promise<Buffer> {
  return withTempDir(async (directory) => {
    const inputPath = join(directory, "input.pdf");
    const outputPath = join(directory, "output.pdf");

    await writeFile(inputPath, toBuffer(sourceBuffer));

    await execFileAsync(
      "gs",
      [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        `-dPDFSETTINGS=/${quality}`,
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${outputPath}`,
        inputPath,
      ],
      { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 },
    );

    return readFile(outputPath);
  });
}

/**
 * Fallback: compress via LibreOffice PDF round-trip.
 * LibreOffice re-encodes the content which can reduce file size,
 * especially for documents created by non-optimised exporters.
 * Quality levels are approximated via LibreOffice's JPEG quality setting.
 */
async function compressPdfWithLibreOffice(
  sourceBuffer: ArrayBuffer | Uint8Array,
  quality: PdfCompressQuality,
): Promise<Buffer> {
  const JPEG_QUALITY = { screen: 40, ebook: 70, printer: 90 } as const;

  return withTempDir(async (directory) => {
    const inputPath = join(directory, "input.pdf");
    const outputDir = join(directory, "output");
    const profilePath = join(directory, "lo-profile");

    await writeFile(inputPath, toBuffer(sourceBuffer));
    await mkdir(outputDir, { recursive: true });

    // writer_pdf_Export filter params: ReduceImageResolution + quality
    const filterParams = [
      `ReduceImageResolution=true`,
      `MaxImageResolution=${quality === "screen" ? 75 : quality === "ebook" ? 150 : 300}`,
      `Quality=${JPEG_QUALITY[quality]}`,
    ].join(";");

    await execFileAsync(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profilePath).toString()}`,
        "--convert-to",
        `pdf:draw_pdf_Export:${filterParams}`,
        "--outdir",
        outputDir,
        inputPath,
      ],
      { timeout: 300_000, maxBuffer: 50 * 1024 * 1024 },
    );

    return readFile(join(outputDir, "input.pdf"));
  });
}

/**
 * Last-resort fallback: pure Node.js structural compression via pdf-lib.
 * No external binaries required. Compresses cross-reference tables and
 * content streams. Works well for text-heavy PDFs (10–40% reduction);
 * minimal effect on image-heavy PDFs since images are not resampled.
 * Quality levels are accepted for API consistency but produce the same result.
 */
async function compressPdfWithPdfLib(
  sourceBuffer: ArrayBuffer | Uint8Array,
): Promise<Buffer> {
  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(toBuffer(sourceBuffer));
  const compressed = await pdfDoc.save({ useObjectStreams: true });
  return Buffer.from(compressed);
}

/**
 * Compress a PDF using the best available backend.
 *
 * Priority:
 *   1. Ghostscript (gs)  — best results, preserves searchable text
 *   2. LibreOffice       — already installed, good fallback
 *   3. pdf-lib           — pure Node.js, structural compression only
 *
 * Quality levels:
 *   screen  — 72–75 dpi, smallest file
 *   ebook   — 150 dpi, balanced (default)
 *   printer — 300 dpi, high quality
 */
export async function compressPdf(
  sourceBuffer: ArrayBuffer | Uint8Array,
  quality: PdfCompressQuality = "ebook",
): Promise<Buffer> {
  try {
    return await compressPdfWithGhostscript(sourceBuffer, quality);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isGsMissing = msg.includes("ENOENT") || msg.includes("not found") || msg.includes("spawn gs");

    if (!isGsMissing) {
      throw new Error(msg.trim() || "PDF compression failed.");
    }

    // gs not available — try LibreOffice, then pdf-lib
    try {
      return await compressPdfWithLibreOffice(sourceBuffer, quality);
    } catch {
      // LibreOffice also unavailable — fall back to pure Node.js pdf-lib
      return await compressPdfWithPdfLib(sourceBuffer);
    }
  }
}
