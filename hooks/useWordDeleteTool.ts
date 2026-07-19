"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import {
  DOCX_MIME,
  requestPdfPageDeletion,
  requestPdfToWordConversion,
  requestWordPreviewPdf,
} from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function useWordDeleteTool() {
  const [uploadedWordName, setUploadedWordName] = useState("");
  const [uploadedWordBuffer, setUploadedWordBuffer] =
    useState<ArrayBuffer | null>(null);
  // All page operations work on this PDF (converted from DOCX on upload).
  const [workingPdfBuffer, setWorkingPdfBuffer] =
    useState<ArrayBuffer | null>(null);
  const [uploadedWordPreviews, setUploadedWordPreviews] = useState<string[]>(
    [],
  );
  const [selectedWordPages, setSelectedWordPages] = useState<number[]>([]);
  const [wordStatus, setWordStatus] = useState("");
  const [wordStatusType, setWordStatusType] = useState<StatusType>("");
  const [isWordBusy, setIsWordBusy] = useState(false);

  function applyWordStatus(message: string, type: StatusType) {
    setWordStatusType(type);
    setWordStatus(message);
  }

  async function handleUploadWord(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isDocx =
      file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      applyWordStatus("Please upload a valid DOCX file.", "error");
      return;
    }

    setIsWordBusy(true);
    applyWordStatus("Converting to PDF for exact page preview\u2026", "");

    try {
      const buffer = await file.arrayBuffer();
      const pdfBuffer = await requestWordPreviewPdf(file.name, buffer);
      const previews = await renderPdfPagePreviews(pdfBuffer);

      if (!previews.length) {
        throw new Error("The uploaded Word file has no previewable pages.");
      }

      setUploadedWordName(file.name);
      setUploadedWordBuffer(buffer);
      setWorkingPdfBuffer(pdfBuffer);
      setUploadedWordPreviews(previews);
      setSelectedWordPages([]);
      applyWordStatus(
        `Loaded ${previews.length} page(s). Select pages you want to delete.`,
        "success",
      );
    } catch (error) {
      setUploadedWordName("");
      setUploadedWordBuffer(null);
      setWorkingPdfBuffer(null);
      setUploadedWordPreviews([]);
      setSelectedWordPages([]);
      applyWordStatus(
        error instanceof Error
          ? error.message
          : "Could not process this Word file.",
        "error",
      );
    } finally {
      setIsWordBusy(false);
    }
  }

  function clearUploadedWord() {
    setUploadedWordName("");
    setUploadedWordBuffer(null);
    setWorkingPdfBuffer(null);
    setUploadedWordPreviews([]);
    setSelectedWordPages([]);
    applyWordStatus("Word selection cleared.", "success");
  }

  function toggleWordPageSelection(pageNumber: number) {
    setSelectedWordPages((previous) => {
      if (previous.includes(pageNumber)) {
        return previous.filter((item) => item !== pageNumber);
      }
      return [...previous, pageNumber].sort((a, b) => a - b);
    });
  }

  async function handleDeleteSelectedWordPages() {
    if (!workingPdfBuffer || !uploadedWordName) {
      applyWordStatus("Upload a Word file first.", "error");
      return;
    }
    if (!selectedWordPages.length) {
      applyWordStatus("Select at least one page to delete.", "error");
      return;
    }

    setIsWordBusy(true);
    applyWordStatus("Deleting selected pages\u2026", "");

    try {
      const pdfName =
        uploadedWordName.replace(/\.docx$/i, ".pdf") || "document.pdf";
      const result = await requestPdfPageDeletion(
        pdfName,
        workingPdfBuffer,
        selectedWordPages,
      );
      const nextPreviews = await renderPdfPagePreviews(result.nextBuffer);

      setWorkingPdfBuffer(result.nextBuffer);
      setUploadedWordPreviews(nextPreviews);
      setSelectedWordPages([]);
      applyWordStatus(
        `Deleted ${result.removedCount} page(s). Review the pages below, then click Download DOCX.`,
        "success",
      );
    } catch (error) {
      applyWordStatus(
        error instanceof Error ? error.message : "Page deletion failed.",
        "error",
      );
    } finally {
      setIsWordBusy(false);
    }
  }

  async function handleDownloadWord() {
    if (!workingPdfBuffer || !uploadedWordName) return;

    setIsWordBusy(true);
    applyWordStatus("Preparing Word file for download\u2026", "");

    try {
      const pdfName =
        uploadedWordName.replace(/\.docx$/i, ".pdf") || "document.pdf";
      const docxBuffer = await requestPdfToWordConversion(
        pdfName,
        workingPdfBuffer,
      );
      const baseName =
        uploadedWordName.replace(/\.docx$/i, "") || "document";
      downloadBlob(
        new Blob([docxBuffer], { type: DOCX_MIME }),
        `${baseName}.docx`,
      );
      applyWordStatus("Downloaded.", "success");
    } catch (error) {
      applyWordStatus(
        error instanceof Error ? error.message : "Could not convert to Word.",
        "error",
      );
    } finally {
      setIsWordBusy(false);
    }
  }

  return {
    uploadedWordName,
    uploadedWordBuffer,
    uploadedWordPreviews,
    selectedWordPages,
    wordStatus,
    wordStatusType,
    isWordBusy,
    handleUploadWord,
    clearUploadedWord,
    toggleWordPageSelection,
    handleDeleteSelectedWordPages,
    handleDownloadWord,
  };
}
