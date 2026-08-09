"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews, renderSinglePdfPage } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MIN_RECT_PERCENT = 2;
const MIN_DIMENSION_POINTS = 8;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function fullRect(): CropRect {
  return { x: 0, y: 0, width: 100, height: 100 };
}

function normalizeRect(next: CropRect): CropRect {
  const x = clampPercent(next.x);
  const y = clampPercent(next.y);
  const width = clampPercent(next.width);
  const height = clampPercent(next.height);

  const boundedWidth = Math.max(MIN_RECT_PERCENT, Math.min(width, 100 - x));
  const boundedHeight = Math.max(MIN_RECT_PERCENT, Math.min(height, 100 - y));

  return {
    x,
    y,
    width: boundedWidth,
    height: boundedHeight,
  };
}

function hasCrop(rect: CropRect): boolean {
  return rect.x > 0 || rect.y > 0 || rect.width < 100 || rect.height < 100;
}

export function useCropPdfTool() {
  const [cropPdfName, setCropPdfName] = useState("");
  const [cropPdfSourceBuffer, setCropPdfSourceBuffer] = useState<ArrayBuffer | null>(null);
  const [cropPdfBuffer, setCropPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [cropPdfPreviews, setCropPdfPreviews] = useState<string[]>([]);
  const [cropPageSettings, setCropPageSettings] = useState<CropRect[]>([]);
  const [selectedCropPage, setSelectedCropPage] = useState(1);
  const [cropPdfResultBuffer, setCropPdfResultBuffer] = useState<ArrayBuffer | null>(null);
  const [cropPdfResultName, setCropPdfResultName] = useState("");
  const [cropPdfStatus, setCropPdfStatus] = useState("");
  const [cropPdfStatusType, setCropPdfStatusType] = useState<StatusType>("");
  const [isCropPdfBusy, setIsCropPdfBusy] = useState(false);

  const totalPages = cropPdfPreviews.length;

  const selectedPageRect = useMemo(() => {
    const pageIndex = selectedCropPage - 1;
    return cropPageSettings[pageIndex] ?? fullRect();
  }, [cropPageSettings, selectedCropPage]);

  function applyStatus(message: string, type: StatusType) {
    setCropPdfStatusType(type);
    setCropPdfStatus(message);
  }

  function setSettingForPage(pageNumber: number, next: CropRect) {
    setCropPageSettings((prev) => {
      const size = Math.max(prev.length, totalPages, pageNumber);
      const base = size > 0 ? Array.from({ length: size }, (_, i) => prev[i] ?? fullRect()) : [];
      base[pageNumber - 1] = normalizeRect(next);
      return base;
    });
  }

  async function rebuildPdfWithCropSettings(
    allSettings: CropRect[],
  ): Promise<ArrayBuffer> {
    if (!cropPdfSourceBuffer) {
      throw new Error("Please upload a PDF first.");
    }

    const { PDFDocument } = await import("pdf-lib");
    const sourceDoc = await PDFDocument.load(cropPdfSourceBuffer.slice(0));
    const pages = sourceDoc.getPages();

    for (let i = 0; i < pages.length; i += 1) {
      const settings = normalizeRect(allSettings[i] ?? fullRect());
      if (!hasCrop(settings)) continue;

      const page = pages[i];
      const { width, height } = page.getSize();
      const cropLeft = (settings.x / 100) * width;
      const cropTop = (settings.y / 100) * height;
      const croppedWidth = (settings.width / 100) * width;
      const croppedHeight = (settings.height / 100) * height;
      const cropBottom = height - cropTop - croppedHeight;

      if (croppedWidth < MIN_DIMENSION_POINTS || croppedHeight < MIN_DIMENSION_POINTS) {
        throw new Error(
          `Page ${i + 1}: crop is too aggressive. Keep at least ${MIN_DIMENSION_POINTS}pt of width and height.`,
        );
      }

      page.setCropBox(cropLeft, cropBottom, croppedWidth, croppedHeight);
      page.setMediaBox(cropLeft, cropBottom, croppedWidth, croppedHeight);
    }

    const bytes = await sourceDoc.save();
    const copy = new Uint8Array(bytes);
    const nextBuffer = new ArrayBuffer(copy.byteLength);
    new Uint8Array(nextBuffer).set(copy);
    return nextBuffer;
  }

  async function handleUploadCropPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsCropPdfBusy(true);
    setCropPdfResultBuffer(null);
    setCropPdfResultName("");
    applyStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      setCropPdfName(file.name);
      setCropPdfSourceBuffer(buffer);
      setCropPdfBuffer(buffer);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(buffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setCropPdfPreviews((prev) => mergePreviewSlots(prev, nextPreviews, update.total));
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsCropPdfBusy(false);
          }
        },
      });

      setCropPdfPreviews(previews);
      setCropPageSettings(Array.from({ length: previews.length }, () => fullRect()));
      setSelectedCropPage(1);
      applyStatus("", "");
    } catch (error) {
      setCropPdfName("");
      setCropPdfSourceBuffer(null);
      setCropPdfBuffer(null);
      setCropPdfPreviews([]);
      setCropPageSettings([]);
      setSelectedCropPage(1);
      applyStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsCropPdfBusy(false);
    }
  }

  function clearCropPdf() {
    setCropPdfName("");
    setCropPdfSourceBuffer(null);
    setCropPdfBuffer(null);
    setCropPdfPreviews([]);
    setCropPageSettings([]);
    setSelectedCropPage(1);
    setCropPdfResultBuffer(null);
    setCropPdfResultName("");
    applyStatus("Cleared.", "success");
  }

  function handleSelectCropPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setSelectedCropPage(pageNumber);
  }

  function handleSetSelectedPageCropRect(nextRect: CropRect) {
    setSettingForPage(selectedCropPage, nextRect);
  }

  function handleResetSelectedPageCrop() {
    setSettingForPage(selectedCropPage, fullRect());
  }

  function handleCopySelectedCropToAllPages() {
    if (totalPages === 0) return;
    const selected = selectedPageRect;
    setCropPageSettings(Array.from({ length: totalPages }, () => ({ ...selected })));
    applyStatus("Copied selected page crop settings to all pages.", "success");
  }

  async function handleApplyCrops() {
    if (!cropPdfSourceBuffer || totalPages === 0) return;

    setIsCropPdfBusy(true);
    applyStatus("Applying crop settings...", "");

    try {
      const nextBuffer = await rebuildPdfWithCropSettings(cropPageSettings);
      const preview = await renderSinglePdfPage(nextBuffer, selectedCropPage);

      setCropPdfBuffer(nextBuffer);
      setCropPdfPreviews((prev) => {
        const next = [...prev];
        next[selectedCropPage - 1] = preview;
        return next;
      });
      setCropPdfResultBuffer(nextBuffer);
      const baseName = cropPdfName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}-cropped.pdf`;
      setCropPdfResultName(outputName);
      applyStatus(
        `Crop applied for page ${selectedCropPage}. Click Download PDF to save all crop changes.`,
        "success",
      );
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Crop failed.",
        "error",
      );
    } finally {
      setIsCropPdfBusy(false);
    }
  }

  function handleDownloadCroppedPdf() {
    if (!cropPdfResultBuffer || !cropPdfResultName) return;
    downloadBlob(new Blob([cropPdfResultBuffer], { type: PDF_MIME }), cropPdfResultName);
  }

  return {
    cropPdfName,
    cropPdfSourceBuffer,
    cropPdfBuffer,
    cropPdfPreviews,
    cropPageSettings,
    selectedCropPage,
    selectedPageRect,
    cropPdfResultBuffer,
    cropPdfResultName,
    cropPdfStatus,
    cropPdfStatusType,
    isCropPdfBusy,
    handleUploadCropPdf,
    clearCropPdf,
    handleSelectCropPage,
    handleSetSelectedPageCropRect,
    handleResetSelectedPageCrop,
    handleCopySelectedCropToAllPages,
    handleApplyCrops,
    handleDownloadCroppedPdf,
  };
}
