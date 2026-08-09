"use client";

import { type ChangeEvent, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { DOCX_MIME, requestPdfToWordConversion } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function usePdfToWordTool() {
  const [pdfToWordName, setPdfToWordName] = useState("");
  const [pdfToWordBuffer, setPdfToWordBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [pdfToWordPreviews, setPdfToWordPreviews] = useState<string[]>([]);
  const [pdfToWordResultBuffer, setPdfToWordResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [pdfToWordResultName, setPdfToWordResultName] = useState("");
  const [pdfToWordStatus, setPdfToWordStatus] = useState("");
  const [pdfToWordStatusType, setPdfToWordStatusType] =
    useState<StatusType>("");
  const [isPdfToWordBusy, setIsPdfToWordBusy] = useState(false);

  function applyPdfToWordStatus(message: string, type: StatusType) {
    setPdfToWordStatusType(type);
    setPdfToWordStatus(message);
  }

  async function handleUploadPdfToWord(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyPdfToWordStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsPdfToWordBusy(true);
    setPdfToWordResultBuffer(null);
    setPdfToWordResultName("");
    applyPdfToWordStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      setPdfToWordName(file.name);
      setPdfToWordBuffer(buffer);
      setPdfToWordPreviews([]);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(buffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setPdfToWordPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsPdfToWordBusy(false);
          }
        },
      });

      applyPdfToWordStatus(
        `${file.name} • ${previews.length} page(s). Click Convert to Word to proceed.`,
        "success",
      );
    } catch (error) {
      setPdfToWordName("");
      setPdfToWordBuffer(null);
      setPdfToWordPreviews([]);
      applyPdfToWordStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsPdfToWordBusy(false);
    }
  }

  function clearPdfToWord() {
    setPdfToWordName("");
    setPdfToWordBuffer(null);
    setPdfToWordPreviews([]);
    setPdfToWordResultBuffer(null);
    setPdfToWordResultName("");
    applyPdfToWordStatus("Cleared.", "success");
  }

  async function handleConvertPdfToWord() {
    if (!pdfToWordBuffer || !pdfToWordName) {
      applyPdfToWordStatus("Upload a PDF first.", "error");
      return;
    }

    setIsPdfToWordBusy(true);
    setPdfToWordResultBuffer(null);
    setPdfToWordResultName("");
    applyPdfToWordStatus("Converting to Word...", "");

    try {
      const docxBuffer = await requestPdfToWordConversion(
        pdfToWordName,
        pdfToWordBuffer,
      );
      const baseName = pdfToWordName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}.docx`;
      setPdfToWordResultBuffer(docxBuffer);
      setPdfToWordResultName(outputName);
      applyPdfToWordStatus(
        "Converted successfully. Click Download Word to save.",
        "success",
      );
    } catch (error) {
      applyPdfToWordStatus(
        error instanceof Error ? error.message : "Conversion failed.",
        "error",
      );
    } finally {
      setIsPdfToWordBusy(false);
    }
  }

  function handleDownloadPdfToWord() {
    if (!pdfToWordResultBuffer || !pdfToWordResultName) return;
    downloadBlob(
      new Blob([pdfToWordResultBuffer], { type: DOCX_MIME }),
      pdfToWordResultName,
    );
  }

  return {
    pdfToWordName,
    pdfToWordBuffer,
    pdfToWordPreviews,
    pdfToWordResultBuffer,
    pdfToWordResultName,
    pdfToWordStatus,
    pdfToWordStatusType,
    isPdfToWordBusy,
    handleUploadPdfToWord,
    clearPdfToWord,
    handleConvertPdfToWord,
    handleDownloadPdfToWord,
  };
}
