import JSZip from "jszip";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_FILE_COUNT = 30;

type ResizeMode = "ratio" | "pixel" | "percentage";
type OutputFormat = "png" | "jpg" | "jpeg" | "webp" | "avif";

type ResizeParams =
  | { mode: "ratio"; ratioNumerator: number; ratioDenominator: number }
  | { mode: "pixel"; width: number; height: number }
  | { mode: "percentage"; percentage: number };

function isSupportedImage(file: File): boolean {
  return (
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"].includes(
      file.type,
    ) ||
    /\.(png|jpe?g|webp|avif)$/i.test(file.name)
  );
}

function toOutputFormat(file: File): OutputFormat {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".jpg")) return "jpg";
  if (lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".webp")) return "webp";
  if (lower.endsWith(".avif")) return "avif";
  if (lower.endsWith(".png")) return "png";

  if (file.type.includes("jpeg") || file.type.includes("jpg")) return "jpg";
  if (file.type.includes("webp")) return "webp";
  if (file.type.includes("avif")) return "avif";
  return "png";
}

function outputMimeType(format: OutputFormat): string {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "avif") return "image/avif";
  return "image/jpeg";
}

function toResizedFileName(originalName: string, extension: OutputFormat): string {
  const baseName = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${baseName}-resized.${extension}`;
}

function parseResizeParams(formData: FormData): ResizeParams | null {
  const mode = String(formData.get("mode") || "") as ResizeMode;

  if (mode === "ratio") {
    const ratioNumerator = Number(formData.get("ratioNumerator"));
    const ratioDenominator = Number(formData.get("ratioDenominator"));
    if (
      Number.isFinite(ratioNumerator) &&
      Number.isFinite(ratioDenominator) &&
      ratioNumerator > 0 &&
      ratioDenominator > 0
    ) {
      return { mode, ratioNumerator, ratioDenominator };
    }
    return null;
  }

  if (mode === "pixel") {
    const width = Number(formData.get("width"));
    const height = Number(formData.get("height"));
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return {
        mode,
        width: Math.round(width),
        height: Math.round(height),
      };
    }
    return null;
  }

  if (mode === "percentage") {
    const percentage = Number(formData.get("percentage"));
    if (Number.isFinite(percentage) && percentage > 0) {
      return { mode, percentage };
    }
    return null;
  }

  return null;
}

async function resizeImage(
  sourceBuffer: ArrayBuffer,
  outputFormat: OutputFormat,
  params: ResizeParams,
): Promise<Buffer> {
  const image = sharp(Buffer.from(sourceBuffer)).rotate();
  const meta = await image.metadata();

  const sourceWidth = meta.width;
  const sourceHeight = meta.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Could not determine image dimensions.");
  }

  let width = sourceWidth;
  let height = sourceHeight;

  if (params.mode === "pixel") {
    width = Math.max(1, Math.round(params.width));
    height = Math.max(1, Math.round(params.height));
  } else {
    const scale =
      params.mode === "ratio"
        ? params.ratioNumerator / params.ratioDenominator
        : params.percentage / 100;

    width = Math.max(1, Math.round(sourceWidth * scale));
    height = Math.max(1, Math.round(sourceHeight * scale));
  }

  const pipeline = image.resize(width, height, {
    fit: "fill",
    kernel: sharp.kernel.lanczos3,
  });

  if (outputFormat === "png") {
    return pipeline.png().toBuffer();
  }
  if (outputFormat === "webp") {
    return pipeline.webp({ quality: 90 }).toBuffer();
  }
  if (outputFormat === "avif") {
    return pipeline.avif({ quality: 55 }).toBuffer();
  }
  return pipeline.jpeg({ quality: 90 }).toBuffer();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resizeParams = parseResizeParams(formData);

    if (!resizeParams) {
      return NextResponse.json(
        {
          message:
            "Invalid resize options. Use ratio, pixel dimensions, or percentage with values greater than 0.",
        },
        { status: 400 },
      );
    }

    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json({ message: "Upload at least one image file." }, { status: 400 });
    }

    if (files.length > MAX_FILE_COUNT) {
      return NextResponse.json(
        { message: `Too many files. Maximum allowed is ${MAX_FILE_COUNT}.` },
        { status: 400 },
      );
    }

    const invalidFile = files.find((file) => !isSupportedImage(file));
    if (invalidFile) {
      return NextResponse.json(
        {
          message: `${invalidFile.name} is not supported. Use PNG, JPG, JPEG, WEBP, or AVIF files.`,
        },
        { status: 400 },
      );
    }

    const oversizedFile = files.find((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversizedFile) {
      return NextResponse.json(
        {
          message: `${oversizedFile.name} is too large. Maximum allowed size is 50 MB per file.`,
        },
        { status: 413 },
      );
    }

    const resized = await Promise.all(
      files.map(async (file) => {
        const sourceBuffer = await file.arrayBuffer();
        const format = toOutputFormat(file);
        const resultBuffer = await resizeImage(sourceBuffer, format, resizeParams);
        return {
          name: toResizedFileName(file.name, format),
          format,
          buffer: resultBuffer,
        };
      }),
    );

    if (resized.length === 1) {
      return new Response(resized[0].buffer, {
        headers: {
          "Content-Type": outputMimeType(resized[0].format),
          "Cache-Control": "no-store",
          "x-output-kind": "single",
          "x-output-filename": resized[0].name,
        },
      });
    }

    const zip = new JSZip();
    for (const file of resized) {
      zip.file(file.name, file.buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Cache-Control": "no-store",
        "x-output-kind": "zip",
        "x-output-filename": "resized-images.zip",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image resize failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
