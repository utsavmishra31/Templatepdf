import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export interface FileMeta {
  key: string;
  name: string;
  size: number;
  uploadedAt: string;
}

/** UUID v4 regex — prevents path traversal attacks */
const KEY_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidKey(key: string): boolean {
  return KEY_RE.test(key);
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function docPath(key: string): string {
  return path.join(UPLOADS_DIR, `${key}.docx`);
}

function metaPath(key: string): string {
  return path.join(UPLOADS_DIR, `${key}.json`);
}

/** Save an uploaded file and return its metadata. */
export async function saveUpload(buffer: Buffer, originalName: string): Promise<FileMeta> {
  await ensureDir();
  const key = randomUUID();
  const meta: FileMeta = {
    key,
    name: originalName,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
  await Promise.all([
    fs.writeFile(docPath(key), buffer),
    fs.writeFile(metaPath(key), JSON.stringify(meta, null, 2)),
  ]);
  return meta;
}

/** Read the raw file buffer for an existing upload. */
export async function readDoc(key: string): Promise<Buffer> {
  return fs.readFile(docPath(key));
}

/** Overwrite a document with an updated version (called by the ONLYOFFICE callback). */
export async function overwriteDoc(key: string, buffer: Buffer): Promise<void> {
  await fs.writeFile(docPath(key), buffer);
}

/** Return file metadata, or null if it does not exist. */
export async function readMeta(key: string): Promise<FileMeta | null> {
  try {
    const raw = await fs.readFile(metaPath(key), "utf8");
    return JSON.parse(raw) as FileMeta;
  } catch {
    return null;
  }
}

/** Check whether an upload exists on disk. */
export async function docExists(key: string): Promise<boolean> {
  try {
    await fs.access(docPath(key));
    return true;
  } catch {
    return false;
  }
}
