"use client";

import { type ChangeEvent, useState } from "react";
import {
  requestImageResize,
  type ImageResizeMode,
  type ImageResizeOptions,
} from "@/lib/api-requests";
import { downloadBlob } from "@/lib/template";
import type { StatusType } from "@/types/editor";

export type ImageResizeItem = {
  file: File;
  previewSrc: string;
  width: number;
  height: number;
};

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => reject(new Error(`Could not read dimensions for ${file.name}.`));
      image.src = objectUrl;
    });

    return dimensions;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function isSupportedImage(file: File): boolean {
  return (
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"].includes(
      file.type,
    ) ||
    /\.(png|jpe?g|webp|avif)$/i.test(file.name)
  );
}

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export function useImageResizeTool() {
  const [items, setItems] = useState<ImageResizeItem[]>([]);
  const [resizeMode, setResizeMode] = useState<ImageResizeMode>("ratio");
  const [ratioNumerator, setRatioNumerator] = useState("1");
  const [ratioDenominator, setRatioDenominator] = useState("1");
  const [pixelWidth, setPixelWidth] = useState("1920");
  const [pixelHeight, setPixelHeight] = useState("1080");
  const [percentage, setPercentage] = useState("100");

  const [resultBuffer, setResultBuffer] = useState<ArrayBuffer | null>(null);
  const [resultName, setResultName] = useState("");
  const [resultContentType, setResultContentType] = useState("application/octet-stream");
  const [resultKind, setResultKind] = useState<"single" | "zip">("single");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [isBusy, setIsBusy] = useState(false);

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
      const newItems = await Promise.all(
        files.map(async (file) => {
          const dimensions = await getImageDimensions(file);
          return {
            file,
            previewSrc: URL.createObjectURL(file),
            width: dimensions.width,
            height: dimensions.height,
          } satisfies ImageResizeItem;
        }),
      );

      setResultBuffer(null);
      setResultName("");
      setResultContentType("application/octet-stream");

      setItems((prev) => {
        const next = [...prev, ...newItems];
        applyStatus(`${next.length} image(s) ready. Choose resize mode and apply.`, "success");
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

  function buildResizeOptions(): ImageResizeOptions | null {
    if (resizeMode === "ratio") {
      if (!isPositiveNumber(ratioNumerator) || !isPositiveNumber(ratioDenominator)) {
        applyStatus("Ratio values must be numbers greater than 0.", "error");
        return null;
      }
      return {
        mode: "ratio",
        ratioNumerator: Number(ratioNumerator),
        ratioDenominator: Number(ratioDenominator),
      };
    }

    if (resizeMode === "pixel") {
      if (!isPositiveNumber(pixelWidth) || !isPositiveNumber(pixelHeight)) {
        applyStatus("Pixel width and height must be greater than 0.", "error");
        return null;
      }
      return {
        mode: "pixel",
        width: Number(pixelWidth),
        height: Number(pixelHeight),
      };
    }

    if (!isPositiveNumber(percentage)) {
      applyStatus("Percentage must be a number greater than 0.", "error");
      return null;
    }

    return {
      mode: "percentage",
      percentage: Number(percentage),
    };
  }

  async function handleResizeImages() {
    if (!items.length) {
      applyStatus("Add at least one image first.", "error");
      return;
    }

    const options = buildResizeOptions();
    if (!options) return;

    setIsBusy(true);
    setResultBuffer(null);
    setResultName("");
    applyStatus("Resizing images...", "");

    try {
      const response = await requestImageResize(
        items.map((item) => item.file),
        options,
      );

      setResultBuffer(response.buffer);
      setResultName(response.fileName);
      setResultContentType(response.contentType);
      setResultKind(response.outputKind);
      applyStatus(
        response.outputKind === "zip"
          ? `Resized ${items.length} images. Download ZIP to save all files.`
          : "Image resized successfully. Click Download to save.",
        "success",
      );
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Image resize failed.",
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
    resizeMode,
    setResizeMode,
    ratioNumerator,
    setRatioNumerator,
    ratioDenominator,
    setRatioDenominator,
    pixelWidth,
    setPixelWidth,
    pixelHeight,
    setPixelHeight,
    percentage,
    setPercentage,
    resultBuffer,
    resultName,
    resultKind,
    status,
    statusType,
    isBusy,
    handleAddImages,
    removeItem,
    clearAll,
    handleResizeImages,
    handleDownload,
  };
}
