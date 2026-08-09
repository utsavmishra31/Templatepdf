import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function toBuffer(source: ArrayBuffer | Uint8Array) {
  if (source instanceof Uint8Array) {
    return Buffer.from(source);
  }

  return Buffer.from(source);
}

async function withTempDir<T>(work: (directory: string) => Promise<T>) {
  const directory = await mkdtemp(join(tmpdir(), "templatepdf-word-"));

  try {
    return await work(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function runSofficeConversion(directory: string, inputPath: string, profilePath: string) {
  await execFileAsync("soffice", [
    "--headless",
    `-env:UserInstallation=${pathToFileURL(profilePath).toString()}`,
    "--convert-to",
    "pdf:writer_pdf_Export",
    "--outdir",
    directory,
    inputPath,
  ], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });
}

export async function generateWordPreviewPdf(sourceBuffer: ArrayBuffer | Uint8Array) {
  return withTempDir(async (directory) => {
    const inputPath = join(directory, "preview-input.docx");
    const profilePath = join(directory, "lo-profile");
    const outputPath = join(directory, `${basename(inputPath, ".docx")}.pdf`);

    await writeFile(inputPath, toBuffer(sourceBuffer));

    try {
      await runSofficeConversion(directory, inputPath, profilePath);

      // Rarely LibreOffice exits cleanly but does not emit the PDF on first try.
      // Retry once with a fresh isolated profile to avoid intermittent 500s.
      try {
        return await readFile(outputPath);
      } catch {
        await runSofficeConversion(directory, inputPath, `${profilePath}-retry`);
      }
    } catch (error) {
      const message = error instanceof Error && "stderr" in error
        ? String((error as Error & { stderr?: string }).stderr || (error as Error & { message: string }).message)
        : "Word preview generation failed.";

      throw new Error(message.trim() || "Word preview generation failed.");
    }

    return readFile(outputPath);
  });
}

/**
 * Round-trip a DOCX through LibreOffice's DOCX export filter.
 *
 * NOTE (verified via scripts/test-lo-page-markers.mjs):
 * LibreOffice does NOT write `w:lastRenderedPageBreak` elements during this
 * round-trip, so the output cannot be used to infer flowing-content page
 * boundaries.  The function is kept for potential future use (e.g. format
 * normalisation or testing) but must not be used for page detection.
 *
 * True layout-accurate page deletion would require the LibreOffice UNO API
 * (XPageCursor / XTextViewCursor) running inside a LibreOffice process —
 * see scripts/test-lo-page-markers.mjs for details.
 *
 * Throws if LibreOffice is unavailable or conversion fails.
 */
export async function enrichDocxWithPageMarkers(
  sourceBuffer: ArrayBuffer | Uint8Array,
): Promise<Buffer> {
  return withTempDir(async (directory) => {
    const inputPath = join(directory, "lo-source.docx");
    const outputDir = join(directory, "lo-output");
    const profilePath = join(directory, "lo-profile");

    await writeFile(inputPath, toBuffer(sourceBuffer));
    await mkdir(outputDir, { recursive: true });

    await execFileAsync(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profilePath).toString()}`,
        "--convert-to",
        "docx:MS Word 2007 XML",
        "--outdir",
        outputDir,
        inputPath,
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000,
      },
    );

    // LibreOffice names the output file using the input basename.
    const outputPath = join(outputDir, "lo-source.docx");
    return readFile(outputPath);
  });
}

/**
 * Convert a PDF to DOCX using LibreOffice's built-in PDF import filter.
 *
 * Text-based PDFs convert well. Scanned/image-only PDFs will be embedded as
 * images inside the DOCX — an OCR step would be required for editable text.
 *
 * Throws if LibreOffice is unavailable or the PDF cannot be processed.
 */
export async function convertPdfToDocx(sourceBuffer: ArrayBuffer | Uint8Array): Promise<Buffer> {
  return withTempDir(async (directory) => {
    const inputPath = join(directory, "input.pdf");
    const outputDir = join(directory, "output");
    const profilePath = join(directory, "lo-profile");

    await writeFile(inputPath, toBuffer(sourceBuffer));
    await mkdir(outputDir, { recursive: true });

    await execFileAsync(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profilePath).toString()}`,
        "--infilter=writer_pdf_import",
        "--convert-to",
        "docx:MS Word 2007 XML",
        "--outdir",
        outputDir,
        inputPath,
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120_000,
      },
    );

    const outputPath = join(outputDir, "input.docx");
    const docxBytes = await readFile(outputPath);

    // Post-process: LibreOffice places text frames at their absolute PDF
    // coordinates (e.g. 720 twips from the page edge), but the generated DOCX
    // also carries default page margins (~1440 twips).  When Word renders the
    // file those margins stack, shifting every frame right by one margin width.
    // Zeroing the page margins makes the absolute frame coordinates line up
    // correctly with the page edge so content matches the original layout.
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(docxBytes);
      const docEntry = zip.file("word/document.xml");
      if (docEntry) {
        const xml = await docEntry.async("string");
        const fixed = xml.replace(
          /<w:pgMar\b[^>]*\/?>/g,
          '<w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/>',
        );
        zip.file("word/document.xml", fixed);
        return (await zip.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
        })) as unknown as Buffer;
      }
    } catch {
      // If post-processing fails, return the original conversion output.
    }

    return docxBytes;
  });
}

/**
 * Convert a PDF to PPTX using LibreOffice's PDF import for Impress.
 *
 * Each PDF page is imported as a slide. Text-heavy PDFs generally retain
 * editable text boxes; scanned/image-only PDFs become image-like slides.
 */
export async function convertPdfToPptx(sourceBuffer: ArrayBuffer | Uint8Array): Promise<Buffer> {
  return withTempDir(async (directory) => {
    const inputPath = join(directory, "input.pdf");
    const outputDir = join(directory, "output");
    const profilePath = join(directory, "lo-profile");

    await writeFile(inputPath, toBuffer(sourceBuffer));
    await mkdir(outputDir, { recursive: true });

    await execFileAsync(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profilePath).toString()}`,
        "--infilter=impress_pdf_import",
        "--convert-to",
        "pptx:Impress MS PowerPoint 2007 XML",
        "--outdir",
        outputDir,
        inputPath,
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120_000,
      },
    );

    const outputPath = join(outputDir, "input.pptx");
    return readFile(outputPath);
  });
}

/**
 * Convert a PPT/PPTX file to PDF using LibreOffice Impress export.
 */
export async function convertPptToPdf(sourceBuffer: ArrayBuffer | Uint8Array): Promise<Buffer> {
  return withTempDir(async (directory) => {
    const inputPath = join(directory, "input.pptx");
    const outputDir = join(directory, "output");
    const profilePath = join(directory, "lo-profile");

    await writeFile(inputPath, toBuffer(sourceBuffer));
    await mkdir(outputDir, { recursive: true });

    await execFileAsync(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=${pathToFileURL(profilePath).toString()}`,
        "--convert-to",
        "pdf:impress_pdf_Export",
        "--outdir",
        outputDir,
        inputPath,
      ],
      {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        timeout: 120_000,
      },
    );

    const outputPath = join(outputDir, "input.pdf");
    return readFile(outputPath);
  });
}

export { DOCX_MIME, PPTX_MIME };