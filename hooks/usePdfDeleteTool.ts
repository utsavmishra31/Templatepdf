"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME, requestPdfPageDeletion } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function usePdfDeleteTool() {
  const [uploadedPdfName, setUploadedPdfName] = useState("");
  const [uploadedPdfBuffer, setUploadedPdfBuffer] =
    useState<ArrayBuffer | null>(null);
  const [uploadedPdfPreviews, setUploadedPdfPreviews] = useState<string[]>([]);
  const [selectedPdfPages, setSelectedPdfPages] = useState<number[]>([]);
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfStatusType, setPdfStatusType] = useState<StatusType>("");
  const [isPdfBusy, setIsPdfBusy] = useState(false);

  function applyPdfStatus(message: string, type: StatusType) {
    setPdfStatusType(type);
    setPdfStatus(message);
  }

  async function handleUploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyPdfStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsPdfBusy(true);
    applyPdfStatus("Reading PDF file...", "");

    try {
      const buffer = await file.arrayBuffer();
      const previews = await renderPdfPagePreviews(buffer);

      if (!previews.length) {
        throw new Error("The uploaded PDF has no pages.");
      }

      setUploadedPdfName(file.name);
      setUploadedPdfBuffer(buffer);
      setUploadedPdfPreviews(previews);
      setSelectedPdfPages([]);
      applyPdfStatus(
        `Loaded ${previews.length} page(s). Select pages you want to delete.`,
        "success",
      );
    } catch (error) {
      setUploadedPdfName("");
      setUploadedPdfBuffer(null);
      setUploadedPdfPreviews([]);
      setSelectedPdfPages([]);
      applyPdfStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsPdfBusy(false);
    }
  }

  function clearUploadedPdf() {
    setUploadedPdfName("");
    setUploadedPdfBuffer(null);
    setUploadedPdfPreviews([]);
    setSelectedPdfPages([]);
    applyPdfStatus("PDF selection cleared.", "success");
  }

  function togglePdfPageSelection(pageNumber: number) {
    setSelectedPdfPages((previous) => {
      if (previous.includes(pageNumber)) {
        return previous.filter((item) => item !== pageNumber);
      }
      return [...previous, pageNumber].sort((a, b) => a - b);
    });
  }

  async function handleDeleteSelectedPdfPages() {
    if (!uploadedPdfBuffer || !uploadedPdfName) {
      applyPdfStatus("Upload a PDF first.", "error");
      return;
    }
    if (!selectedPdfPages.length) {
      applyPdfStatus("Select at least one page to delete.", "error");
      return;
    }

    setIsPdfBusy(true);
    applyPdfStatus("Deleting selected pages...", "");

    try {
      const result = await requestPdfPageDeletion(
        uploadedPdfName,
        uploadedPdfBuffer,
        selectedPdfPages,
      );
      const nextPreviews = await renderPdfPagePreviews(result.nextBuffer);
      const baseName = uploadedPdfName.replace(/\.pdf$/i, "") || "edited";
      const outputName = `${baseName}-updated.pdf`;

      setUploadedPdfName(outputName);
      setUploadedPdfBuffer(result.nextBuffer);
      setUploadedPdfPreviews(nextPreviews);
      setSelectedPdfPages([]);
      applyPdfStatus(
        `Deleted ${result.removedCount} page(s). Review the pages below, then click Download PDF.`,
        "success",
      );
    } catch (error) {
      applyPdfStatus(
        error instanceof Error ? error.message : "Page deletion failed.",
        "error",
      );
    } finally {
      setIsPdfBusy(false);
    }
  }

  function handleDownloadPdf() {
    if (!uploadedPdfBuffer || !uploadedPdfName) return;
    downloadBlob(
      new Blob([uploadedPdfBuffer], { type: PDF_MIME }),
      uploadedPdfName,
    );
  }

  return {
    uploadedPdfName,
    uploadedPdfBuffer,
    uploadedPdfPreviews,
    selectedPdfPages,
    pdfStatus,
    pdfStatusType,
    isPdfBusy,
    handleUploadPdf,
    clearUploadedPdf,
    togglePdfPageSelection,
    handleDeleteSelectedPdfPages,
    handleDownloadPdf,
  };
}
