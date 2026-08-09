"use client";

import { type ChangeEvent, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews, renderSinglePdfPage } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function useRotatePdfTool() {
  const [rotatePdfName, setRotatePdfName] = useState("");
  const [rotatePdfBuffer, setRotatePdfBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [rotatePdfPreviews, setRotatePdfPreviews] = useState<string[]>([]);
  const [rotatePdfResultBuffer, setRotatePdfResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [rotatePdfResultName, setRotatePdfResultName] = useState("");
  const [rotatePdfStatus, setRotatePdfStatus] = useState("");
  const [rotatePdfStatusType, setRotatePdfStatusType] =
    useState<StatusType>("");
  const [isRotatePdfBusy, setIsRotatePdfBusy] = useState(false);

  function applyRotatePdfStatus(message: string, type: StatusType) {
    setRotatePdfStatusType(type);
    setRotatePdfStatus(message);
  }

  async function handleUploadRotatePdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyRotatePdfStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsRotatePdfBusy(true);
    setRotatePdfResultBuffer(null);
    setRotatePdfResultName("");
    applyRotatePdfStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      setRotatePdfName(file.name);
      setRotatePdfBuffer(buffer);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(buffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setRotatePdfPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsRotatePdfBusy(false);
          }
        },
      });

      setRotatePdfPreviews(previews);
      applyRotatePdfStatus("", "");
    } catch (error) {
      setRotatePdfName("");
      setRotatePdfBuffer(null);
      setRotatePdfPreviews([]);
      applyRotatePdfStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsRotatePdfBusy(false);
    }
  }

  function clearRotatePdf() {
    setRotatePdfName("");
    setRotatePdfBuffer(null);
    setRotatePdfPreviews([]);
    setRotatePdfResultBuffer(null);
    setRotatePdfResultName("");
    applyRotatePdfStatus("Cleared.", "success");
  }

  async function handleRotatePage(
    pageNumber: number,
    direction: "cw" | "ccw",
  ) {
    if (!rotatePdfBuffer) return;

    setIsRotatePdfBusy(true);
    applyRotatePdfStatus("Rotating...", "");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(rotatePdfBuffer);
      const page = pdfDoc.getPage(pageNumber - 1);
      const current = page.getRotation().angle;
      const delta = direction === "cw" ? 90 : 270;
      page.setRotation(degrees((current + delta) % 360));

      const bytes = await pdfDoc.save();
      const resultBuffer = bytes.buffer as ArrayBuffer;
      const baseName = rotatePdfName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}-rotated.pdf`;

      // Only re-render the single rotated page — keep all other previews unchanged
      const updatedPreview = await renderSinglePdfPage(resultBuffer, pageNumber);
      setRotatePdfBuffer(resultBuffer);
      setRotatePdfPreviews((prev) => {
        const next = [...prev];
        next[pageNumber - 1] = updatedPreview;
        return next;
      });
      setRotatePdfResultBuffer(resultBuffer);
      setRotatePdfResultName(outputName);
      applyRotatePdfStatus(
        `Page ${pageNumber} rotated ${direction === "cw" ? "clockwise" : "counter-clockwise"}. Click Download PDF to save.`,
        "success",
      );
    } catch (error) {
      applyRotatePdfStatus(
        error instanceof Error ? error.message : "Rotation failed.",
        "error",
      );
    } finally {
      setIsRotatePdfBusy(false);
    }
  }

  async function handleRotateAllPages(direction: "cw" | "ccw") {
    if (!rotatePdfBuffer) return;

    setIsRotatePdfBusy(true);
    applyRotatePdfStatus("Rotating all pages...", "");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(rotatePdfBuffer);
      const pages = pdfDoc.getPages();
      const delta = direction === "cw" ? 90 : 270;
      for (const page of pages) {
        page.setRotation(degrees((page.getRotation().angle + delta) % 360));
      }

      const bytes = await pdfDoc.save();
      const resultBuffer = bytes.buffer as ArrayBuffer;
      const baseName = rotatePdfName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}-rotated.pdf`;
      const updatedPreviews = await renderPdfPagePreviews(resultBuffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setRotatePdfPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
        },
      });
      setRotatePdfBuffer(resultBuffer);
      setRotatePdfPreviews(updatedPreviews);
      setRotatePdfResultBuffer(resultBuffer);
      setRotatePdfResultName(outputName);
      applyRotatePdfStatus(
        `All ${pages.length} page(s) rotated ${direction === "cw" ? "clockwise" : "counter-clockwise"}. Click Download PDF to save.`,
        "success",
      );
    } catch (error) {
      applyRotatePdfStatus(
        error instanceof Error ? error.message : "Rotation failed.",
        "error",
      );
    } finally {
      setIsRotatePdfBusy(false);
    }
  }

  function handleDownloadRotatedPdf() {
    if (!rotatePdfResultBuffer || !rotatePdfResultName) return;
    downloadBlob(
      new Blob([rotatePdfResultBuffer], { type: PDF_MIME }),
      rotatePdfResultName,
    );
  }

  return {
    rotatePdfName,
    rotatePdfBuffer,
    rotatePdfPreviews,
    rotatePdfResultBuffer,
    rotatePdfResultName,
    rotatePdfStatus,
    rotatePdfStatusType,
    isRotatePdfBusy,
    handleUploadRotatePdf,
    clearRotatePdf,
    handleRotatePage,
    handleRotateAllPages,
    handleDownloadRotatedPdf,
  };
}
