import JSZip from "jszip";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_FILE_COUNT = 30;

type OutputFormat = "png" | "jpg" | "jpeg" | "webp" | "avif";

type FormatConfig = {
  sharpFormat: "png" | "jpeg" | "webp" | "avif";
  extension: OutputFormat;
  mimeType: string;
};

const FORMAT_CONFIG: Record<OutputFormat, FormatConfig> = {
  png: { sharpFormat: "png", extension: "png", mimeType: "image/png" },
  jpg: { sharpFormat: "jpeg", extension: "jpg", mimeType: "image/jpeg" },
  jpeg: { sharpFormat: "jpeg", extension: "jpeg", mimeType: "image/jpeg" },
  webp: { sharpFormat: "webp", extension: "webp", mimeType: "image/webp" },
  avif: { sharpFormat: "avif", extension: "avif", mimeType: "image/avif" },
};

function isSupportedImage(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"].includes(
      file.type,
    ) ||
    /\.(png|jpe?g|webp|avif)$/i.test(lowerName)
  );
}

function toConvertedFileName(originalName: string, extension: OutputFormat): string {
  const baseName = originalName.replace(/\.[^.]+$/, "") || "image";
  return `${baseName}.${extension}`;
}

async function convertImage(buffer: ArrayBuffer, format: FormatConfig): Promise<Buffer> {
  const pipeline = sharp(Buffer.from(buffer)).rotate();

  if (format.sharpFormat === "jpeg") {
    return pipeline.jpeg({ quality: 90 }).toBuffer();
  }

  if (format.sharpFormat === "webp") {
    return pipeline.webp({ quality: 90 }).toBuffer();
  }

  if (format.sharpFormat === "avif") {
    return pipeline.avif({ quality: 55 }).toBuffer();
  }

  return pipeline.png().toBuffer();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFormat = String(formData.get("format") || "").toLowerCase() as OutputFormat;
    const formatConfig = FORMAT_CONFIG[rawFormat];

    if (!formatConfig) {
      return NextResponse.json(
        { message: "Choose a valid output format: PNG, JPG, JPEG, WEBP, or AVIF." },
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

    const converted = await Promise.all(
      files.map(async (file) => {
        const sourceBuffer = await file.arrayBuffer();
        const resultBuffer = await convertImage(sourceBuffer, formatConfig);
        return {
          name: toConvertedFileName(file.name, formatConfig.extension),
          buffer: resultBuffer,
        };
      }),
    );

    if (converted.length === 1) {
      return new Response(converted[0].buffer, {
        headers: {
          "Content-Type": formatConfig.mimeType,
          "Cache-Control": "no-store",
          "x-output-kind": "single",
          "x-output-filename": converted[0].name,
        },
      });
    }

    const zip = new JSZip();
    for (const file of converted) {
      zip.file(file.name, file.buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Cache-Control": "no-store",
        "x-output-kind": "zip",
        "x-output-filename": `converted-images-${formatConfig.extension}.zip`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image conversion failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
