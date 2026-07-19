"use client";

import { type ChangeEvent, useState } from "react";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export type Orientation = "portrait" | "landscape";
export type PageSize = "a4-fit" | "original";

export type ImageEntry = {
  name: string;
  src: string;
  buffer: ArrayBuffer;
  type: "jpeg" | "png";
  width: number;
  height: number;
};

const A4_W = 595.28;
const A4_H = 841.89;

export function useJpgToPdfTool() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [pageSize, setPageSize] = useState<PageSize>("a4-fit");
  const [resultBuffer, setResultBuffer] = useState<ArrayBuffer | null>(null);
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

    const invalid = files.find(
      (f) =>
        !["image/jpeg", "image/jpg", "image/png"].includes(f.type) &&
        !f.name.toLowerCase().match(/\.(jpg|jpeg|png)$/),
    );
    if (invalid) {
      applyStatus(
        `${invalid.name} is not supported. Use JPG or PNG files.`,
        "error",
      );
      return;
    }

    setIsBusy(true);
    applyStatus(`Loading ${files.length} image(s)\u2026`, "");

    try {
      const newEntries = await Promise.all(
        files.map(async (file): Promise<ImageEntry> => {
          const buffer = await file.arrayBuffer();
          const src = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(new Blob([buffer], { type: file.type }));
          });
          const dims = await new Promise<{ width: number; height: number }>(
            (resolve) => {
              const img = new Image();
              img.onload = () =>
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
              img.src = src;
            },
          );
          const isPng =
            file.type === "image/png" ||
            file.name.toLowerCase().endsWith(".png");
          return {
            name: file.name,
            src,
            buffer,
            type: isPng ? "png" : "jpeg",
            width: dims.width,
            height: dims.height,
          };
        }),
      );

      setResultBuffer(null);
      setImages((prev) => {
        const next = [...prev, ...newEntries];
        applyStatus(
          `${next.length} image(s) ready. Add more or click Generate PDF.`,
          "success",
        );
        return next;
      });
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Could not load image.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setResultBuffer(null);
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setResultBuffer(null);
  }

  function clearAll() {
    setImages([]);
    setResultBuffer(null);
    applyStatus("Cleared.", "success");
  }

  async function handleGeneratePdf() {
    if (!images.length) {
      applyStatus("Add at least one image first.", "error");
      return;
    }

    setIsBusy(true);
    setResultBuffer(null);
    applyStatus("Generating PDF\u2026", "");

    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();

      for (const img of images) {
        const embedded =
          img.type === "png"
            ? await pdfDoc.embedPng(img.buffer)
            : await pdfDoc.embedJpg(img.buffer);

        if (pageSize === "original") {
          const page = pdfDoc.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, {
            x: 0,
            y: 0,
            width: embedded.width,
            height: embedded.height,
          });
        } else {
          // A4 fit
          const pageW = orientation === "portrait" ? A4_W : A4_H;
          const pageH = orientation === "portrait" ? A4_H : A4_W;
          const scale = Math.min(
            pageW / embedded.width,
            pageH / embedded.height,
          );
          const drawW = embedded.width * scale;
          const drawH = embedded.height * scale;
          const drawX = (pageW - drawW) / 2;
          const drawY = (pageH - drawH) / 2;

          const page = pdfDoc.addPage([pageW, pageH]);
          page.drawImage(embedded, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
          });
        }
      }

      const bytes = await pdfDoc.save();
      setResultBuffer(bytes.buffer as ArrayBuffer);
      applyStatus(
        `PDF created \u2014 ${images.length} page(s). Click Download PDF to save.`,
        "success",
      );
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "PDF generation failed.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function handleDownload() {
    if (!resultBuffer) return;
    downloadBlob(new Blob([resultBuffer], { type: PDF_MIME }), "images.pdf");
  }

  return {
    images,
    orientation,
    pageSize,
    setOrientation,
    setPageSize,
    resultBuffer,
    status,
    statusType,
    isBusy,
    handleAddImages,
    removeImage,
    moveImage,
    clearAll,
    handleGeneratePdf,
    handleDownload,
  };
}
