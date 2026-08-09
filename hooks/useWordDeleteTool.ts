"use client";

import { type ChangeEvent, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import {
  DOCX_MIME,
  requestPdfPageDeletion,
  requestPdfToWordConversion,
  requestWordPreviewPdf,
} from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

function formatPageRanges(pageNumbers: number[]) {
  if (!pageNumbers.length) return "";

  const ranges: string[] = [];
  let rangeStart = pageNumbers[0];
  let previous = pageNumbers[0];

  for (let index = 1; index <= pageNumbers.length; index += 1) {
    const current = pageNumbers[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push(rangeStart === previous ? `${rangeStart}` : `${rangeStart}-${previous}`);
    rangeStart = current;
    previous = current;
  }

  return ranges.join(",");
}

function parsePageRanges(value: string, totalPages: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { pages: [] as number[], error: "" };
  }

  const selectedPages = new Set<number>();
  const segments = trimmed.split(",").map((segment) => segment.trim()).filter(Boolean);

  for (const segment of segments) {
    if (/^\d+$/.test(segment)) {
      const pageNumber = Number(segment);
      if (pageNumber < 1 || pageNumber > totalPages) {
        return { pages: [] as number[], error: `Page ${pageNumber} is out of range.` };
      }
      selectedPages.add(pageNumber);
      continue;
    }

    const rangeMatch = segment.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!rangeMatch) {
      return {
        pages: [] as number[],
        error: "Use page numbers like 1,2,3-5.",
      };
    }

    const rangeStart = Number(rangeMatch[1]);
    const rangeEnd = Number(rangeMatch[2]);
    if (rangeStart < 1 || rangeEnd > totalPages) {
      return {
        pages: [] as number[],
        error: `Pages must stay between 1 and ${totalPages}.`,
      };
    }
    if (rangeStart > rangeEnd) {
      return {
        pages: [] as number[],
        error: `Invalid range ${segment}.`,
      };
    }

    for (let pageNumber = rangeStart; pageNumber <= rangeEnd; pageNumber += 1) {
      selectedPages.add(pageNumber);
    }
  }

  return { pages: Array.from(selectedPages).sort((a, b) => a - b), error: "" };
}

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
  const [wordPageRangeInput, setWordPageRangeInput] = useState("");
  const [wordPageRangeError, setWordPageRangeError] = useState("");
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
      applyWordStatus("Loading Word file...", "");

    try {
      const buffer = await file.arrayBuffer();
      setUploadedWordName(file.name);
      setUploadedWordBuffer(buffer);
      setUploadedWordPreviews([]);

      const pdfBuffer = await requestWordPreviewPdf(file.name, buffer);
      setWorkingPdfBuffer(pdfBuffer);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(pdfBuffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setUploadedWordPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsWordBusy(false);
          }
        },
      });

      if (!previews.length) {
        throw new Error("The uploaded Word file has no previewable pages.");
      }

      setUploadedWordPreviews(previews);
      setSelectedWordPages([]);
      setWordPageRangeInput("");
      setWordPageRangeError("");
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
      setWordPageRangeInput("");
      setWordPageRangeError("");
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
    setWordPageRangeInput("");
    setWordPageRangeError("");
    applyWordStatus("Word selection cleared.", "success");
  }

  function toggleWordPageSelection(pageNumber: number) {
    setSelectedWordPages((previous) => {
      let nextPages: number[];

      if (previous.includes(pageNumber)) {
        nextPages = previous.filter((item) => item !== pageNumber);
      } else {
        nextPages = [...previous, pageNumber].sort((a, b) => a - b);
      }

      setWordPageRangeInput(formatPageRanges(nextPages));
      setWordPageRangeError("");
      return nextPages;
    });
  }

  function handleWordPageRangeInputChange(value: string) {
    setWordPageRangeInput(value);

    if (!uploadedWordPreviews.length) {
      setSelectedWordPages([]);
      setWordPageRangeError("");
      return;
    }

    const parsed = parsePageRanges(value, uploadedWordPreviews.length);
    if (parsed.error) {
      setSelectedWordPages([]);
      setWordPageRangeError(parsed.error);
      applyWordStatus(parsed.error, "error");
      return;
    }

    setSelectedWordPages(parsed.pages);
    setWordPageRangeError("");
    if (!value.trim()) {
      applyWordStatus("Selection cleared. Enter pages to delete.", "success");
      return;
    }

    applyWordStatus(
      `Selected ${parsed.pages.length} page(s) for deletion.`,
      "success",
    );
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
      const nextPreviews = await renderPdfPagePreviews(result.nextBuffer, undefined, {
        onUpdate: (partialPreviews, update) => {
          setUploadedWordPreviews((prev) =>
            mergePreviewSlots(prev, partialPreviews, update.total),
          );
        },
      });

      setWorkingPdfBuffer(result.nextBuffer);
      setUploadedWordPreviews(nextPreviews);
      setSelectedWordPages([]);
      setWordPageRangeInput("");
      setWordPageRangeError("");
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
    wordPageRangeInput,
    wordPageRangeError,
    wordStatus,
    wordStatusType,
    isWordBusy,
    handleUploadWord,
    clearUploadedWord,
    toggleWordPageSelection,
    handleWordPageRangeInputChange,
    handleDeleteSelectedWordPages,
    handleDownloadWord,
  };
}
