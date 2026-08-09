"use client";

import { type ChangeEvent, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PPTX_MIME, requestPdfToPptConversion } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function usePdfToPptTool() {
  const [pdfToPptName, setPdfToPptName] = useState("");
  const [pdfToPptBuffer, setPdfToPptBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [pdfToPptPreviews, setPdfToPptPreviews] = useState<string[]>([]);
  const [pdfToPptResultBuffer, setPdfToPptResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [pdfToPptResultName, setPdfToPptResultName] = useState("");
  const [pdfToPptStatus, setPdfToPptStatus] = useState("");
  const [pdfToPptStatusType, setPdfToPptStatusType] =
    useState<StatusType>("");
  const [isPdfToPptBusy, setIsPdfToPptBusy] = useState(false);

  function applyPdfToPptStatus(message: string, type: StatusType) {
    setPdfToPptStatusType(type);
    setPdfToPptStatus(message);
  }

  async function handleUploadPdfToPpt(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyPdfToPptStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsPdfToPptBusy(true);
    setPdfToPptResultBuffer(null);
    setPdfToPptResultName("");
    applyPdfToPptStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      setPdfToPptName(file.name);
      setPdfToPptBuffer(buffer);
      setPdfToPptPreviews([]);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(buffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setPdfToPptPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsPdfToPptBusy(false);
          }
        },
      });

      applyPdfToPptStatus(
        `${file.name} • ${previews.length} page(s). Click Convert to PPT to proceed.`,
        "success",
      );
    } catch (error) {
      setPdfToPptName("");
      setPdfToPptBuffer(null);
      setPdfToPptPreviews([]);
      applyPdfToPptStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsPdfToPptBusy(false);
    }
  }

  async function handleConvertPdfToPpt() {
    if (!pdfToPptBuffer || !pdfToPptName) {
      applyPdfToPptStatus("Upload a PDF first.", "error");
      return;
    }

    setIsPdfToPptBusy(true);
    setPdfToPptResultBuffer(null);
    setPdfToPptResultName("");
    applyPdfToPptStatus("Converting to PPT...", "");

    try {
      const pptxBuffer = await requestPdfToPptConversion(
        pdfToPptName,
        pdfToPptBuffer,
      );
      const baseName = pdfToPptName.replace(/\.pdf$/i, "") || "presentation";
      const outputName = `${baseName}.pptx`;
      setPdfToPptResultBuffer(pptxBuffer);
      setPdfToPptResultName(outputName);
      applyPdfToPptStatus(
        "Converted successfully. Click Download PPT to save.",
        "success",
      );
    } catch (error) {
      applyPdfToPptStatus(
        error instanceof Error ? error.message : "Conversion failed.",
        "error",
      );
    } finally {
      setIsPdfToPptBusy(false);
    }
  }

  function handleDownloadPdfToPpt() {
    if (!pdfToPptResultBuffer || !pdfToPptResultName) return;
    downloadBlob(
      new Blob([pdfToPptResultBuffer], { type: PPTX_MIME }),
      pdfToPptResultName,
    );
  }

  return {
    pdfToPptName,
    pdfToPptBuffer,
    pdfToPptPreviews,
    pdfToPptResultBuffer,
    pdfToPptResultName,
    pdfToPptStatus,
    pdfToPptStatusType,
    isPdfToPptBusy,
    handleUploadPdfToPpt,
    handleConvertPdfToPpt,
    handleDownloadPdfToPpt,
  };
}
