import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

export { DOCX_MIME };