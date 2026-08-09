"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import {
  requestImageConversion,
  type ImageConvertFormat,
} from "@/lib/api-requests";
import { downloadBlob } from "@/lib/template";
import type { StatusType } from "@/types/editor";

export type ImageConvertItem = {
  file: File;
  previewSrc: string;
};

const SUPPORTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"];

function isSupportedImage(file: File): boolean {
  return (
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"].includes(
      file.type,
    ) ||
    /\.(png|jpe?g|webp|avif)$/i.test(file.name)
  );
}

function extensionFromName(name: string): string {
  const match = name.toLowerCase().match(/\.([^.]+)$/);
  return match?.[1] ?? "";
}

function normalizeInputFormat(ext: string): ImageConvertFormat | "" {
  if (ext === "png") return "png";
  if (ext === "jpg") return "jpg";
  if (ext === "jpeg") return "jpeg";
  if (ext === "webp") return "webp";
  if (ext === "avif") return "avif";
  return "";
}

export function useImageConvertTool() {
  const [items, setItems] = useState<ImageConvertItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageConvertFormat>("jpg");
  const [resultBuffer, setResultBuffer] = useState<ArrayBuffer | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultContentType, setResultContentType] = useState("application/octet-stream");
  const [resultKind, setResultKind] = useState<"single" | "zip">("single");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [isBusy, setIsBusy] = useState(false);

  const sourceFormats = useMemo(() => {
    const seen = new Set<ImageConvertFormat>();
    for (const item of items) {
      const normalized = normalizeInputFormat(extensionFromName(item.file.name));
      if (normalized) seen.add(normalized);
    }
    return Array.from(seen.values());
  }, [items]);

  function applyStatus(message: string, type: StatusType) {
    setStatusType(type);
    setStatus(message);
  }

  async function handleAddImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const invalid = files.find((file) => !isSupportedImage(file));
    if (invalid) {
      applyStatus(
        `${invalid.name} is not supported. Use PNG, JPG, JPEG, WEBP, or AVIF files.`,
        "error",
      );
      return;
    }

    setIsBusy(true);
    applyStatus(`Loading ${files.length} image(s)...`, "");

    try {
      const newItems = files.map((file) => ({
        file,
        previewSrc: URL.createObjectURL(file),
      }));

      setResultBuffer(null);
      setResultName("");
      setResultContentType("application/octet-stream");

      setItems((prev) => {
        const next = [...prev, ...newItems];
        applyStatus(
          `${next.length} image(s) ready. Choose output format and click Convert Images.`,
          "success",
        );
        return next;
      });
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Could not load images.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function removeItem(index: number) {
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewSrc);
      return next;
    });
    setResultBuffer(null);
    setResultName("");
  }

  function clearAll() {
    setItems((prev) => {
      for (const item of prev) {
        URL.revokeObjectURL(item.previewSrc);
      }
      return [];
    });
    setResultBuffer(null);
    setResultName("");
    setResultContentType("application/octet-stream");
    setResultKind("single");
    applyStatus("Cleared.", "success");
  }

  async function handleConvertImages() {
    if (!items.length) {
      applyStatus("Add at least one image first.", "error");
      return;
    }

    setIsBusy(true);
    setResultBuffer(null);
    setResultName("");
    applyStatus(`Converting to ${targetFormat.toUpperCase()}...`, "");

    try {
      const response = await requestImageConversion(
        items.map((item) => item.file),
        targetFormat,
      );

      setResultBuffer(response.buffer);
      setResultName(response.fileName);
      setResultContentType(response.contentType);
      setResultKind(response.outputKind);

      const targetLabel = targetFormat.toUpperCase();
      applyStatus(
        response.outputKind === "zip"
          ? `Converted ${items.length} images to ${targetLabel}. Download ZIP to save all files.`
          : `Image converted to ${targetLabel}. Click Download to save.`,
        "success",
      );
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Image conversion failed.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function handleDownload() {
    if (!resultBuffer || !resultName) return;
    downloadBlob(new Blob([resultBuffer], { type: resultContentType }), resultName);
  }

  return {
    items,
    sourceFormats,
    targetFormat,
    setTargetFormat,
    resultBuffer,
    resultName,
    resultKind,
    status,
    statusType,
    isBusy,
    handleAddImages,
    removeItem,
    clearAll,
    handleConvertImages,
    handleDownload,
    supportedExtensions: SUPPORTED_EXTENSIONS,
  };
}
