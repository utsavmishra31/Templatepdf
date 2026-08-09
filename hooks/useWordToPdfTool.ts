"use client";

import { type ChangeEvent, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { DOCX_MIME, PDF_MIME, requestWordPreviewPdf } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function useWordToPdfTool() {
  const [wordToPdfName, setWordToPdfName] = useState("");
  const [wordToPdfBuffer, setWordToPdfBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [wordToPdfStatus, setWordToPdfStatus] = useState("");
  const [wordToPdfStatusType, setWordToPdfStatusType] =
    useState<StatusType>("");
  const [isWordToPdfBusy, setIsWordToPdfBusy] = useState(false);
  const [wordToPdfResultBuffer, setWordToPdfResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [wordToPdfPreviews, setWordToPdfPreviews] = useState<string[]>([]);
  const [wordToPdfResultName, setWordToPdfResultName] = useState("");

  function applyWordToPdfStatus(message: string, type: StatusType) {
    setWordToPdfStatusType(type);
    setWordToPdfStatus(message);
  }

  async function handleUploadWordToPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isDocx =
      file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      applyWordToPdfStatus("Please upload a valid DOCX file.", "error");
      return;
    }

    setIsWordToPdfBusy(true);
    setWordToPdfResultBuffer(null);
    setWordToPdfPreviews([]);
    setWordToPdfResultName("");
    applyWordToPdfStatus("Loading preview...", "");

    try {
      const buffer = await file.arrayBuffer();
      setWordToPdfName(file.name);
      setWordToPdfBuffer(buffer);
      setWordToPdfPreviews([]);

      const pdfBuffer = await requestWordPreviewPdf(file.name, buffer);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(pdfBuffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setWordToPdfPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsWordToPdfBusy(false);
          }
        },
      });

      applyWordToPdfStatus(
        `${file.name} ready — ${previews.length} page(s). Click Convert to PDF.`,
        "success",
      );
    } catch (error) {
      setWordToPdfName("");
      setWordToPdfBuffer(null);
      setWordToPdfPreviews([]);
      applyWordToPdfStatus(
        error instanceof Error ? error.message : "Failed to load preview.",
        "error",
      );
    } finally {
      setIsWordToPdfBusy(false);
    }
  }

  function clearWordToPdf() {
    setWordToPdfName("");
    setWordToPdfBuffer(null);
    setWordToPdfResultBuffer(null);
    setWordToPdfPreviews([]);
    setWordToPdfResultName("");
    applyWordToPdfStatus("Cleared.", "success");
  }

  async function handleConvertWordToPdf() {
    if (!wordToPdfBuffer || !wordToPdfName) {
      applyWordToPdfStatus("Upload a Word file first.", "error");
      return;
    }

    setIsWordToPdfBusy(true);
    setWordToPdfResultBuffer(null);
    setWordToPdfResultName("");
    applyWordToPdfStatus("Converting to PDF...", "");

    try {
      const pdfBuffer = await requestWordPreviewPdf(
        wordToPdfName,
        wordToPdfBuffer,
      );
      const baseName = wordToPdfName.replace(/\.docx$/i, "") || "document";
      const outputName = `${baseName}.pdf`;
      const previews = await renderPdfPagePreviews(pdfBuffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setWordToPdfPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
        },
      });
      setWordToPdfResultBuffer(pdfBuffer);
      setWordToPdfPreviews(previews);
      setWordToPdfResultName(outputName);
      applyWordToPdfStatus(
        `Converted — ${previews.length} page(s). Review below, then click Download PDF.`,
        "success",
      );
    } catch (error) {
      applyWordToPdfStatus(
        error instanceof Error ? error.message : "Conversion failed.",
        "error",
      );
    } finally {
      setIsWordToPdfBusy(false);
    }
  }

  function handleDownloadWordToPdf() {
    if (!wordToPdfResultBuffer || !wordToPdfResultName) return;
    downloadBlob(
      new Blob([wordToPdfResultBuffer], { type: PDF_MIME }),
      wordToPdfResultName,
    );
  }

  return {
    wordToPdfName,
    wordToPdfBuffer,
    wordToPdfStatus,
    wordToPdfStatusType,
    isWordToPdfBusy,
    wordToPdfResultBuffer,
    wordToPdfPreviews,
    wordToPdfResultName,
    handleUploadWordToPdf,
    clearWordToPdf,
    handleConvertWordToPdf,
    handleDownloadWordToPdf,
  };
}
