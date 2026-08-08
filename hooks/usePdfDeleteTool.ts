"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME, requestPdfPageDeletion } from "@/lib/api-requests";
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

export function usePdfDeleteTool() {
  const [uploadedPdfName, setUploadedPdfName] = useState("");
  const [uploadedPdfBuffer, setUploadedPdfBuffer] =
    useState<ArrayBuffer | null>(null);
  const [uploadedPdfPreviews, setUploadedPdfPreviews] = useState<string[]>([]);
  const [selectedPdfPages, setSelectedPdfPages] = useState<number[]>([]);
  const [pdfPageRangeInput, setPdfPageRangeInput] = useState("");
  const [pdfPageRangeError, setPdfPageRangeError] = useState("");
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
      setPdfPageRangeInput("");
      setPdfPageRangeError("");
      applyPdfStatus(
        `Loaded ${previews.length} page(s). Select pages you want to delete.`,
        "success",
      );
    } catch (error) {
      setUploadedPdfName("");
      setUploadedPdfBuffer(null);
      setUploadedPdfPreviews([]);
      setSelectedPdfPages([]);
      setPdfPageRangeInput("");
      setPdfPageRangeError("");
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
    setPdfPageRangeInput("");
    setPdfPageRangeError("");
    applyPdfStatus("PDF selection cleared.", "success");
  }

  function togglePdfPageSelection(pageNumber: number) {
    setSelectedPdfPages((previous) => {
      let nextPages: number[];

      if (previous.includes(pageNumber)) {
        nextPages = previous.filter((item) => item !== pageNumber);
      } else {
        nextPages = [...previous, pageNumber].sort((a, b) => a - b);
      }

      setPdfPageRangeInput(formatPageRanges(nextPages));
      setPdfPageRangeError("");
      return nextPages;
    });
  }

  function handlePdfPageRangeInputChange(value: string) {
    setPdfPageRangeInput(value);

    if (!uploadedPdfPreviews.length) {
      setSelectedPdfPages([]);
      setPdfPageRangeError("");
      return;
    }

    const parsed = parsePageRanges(value, uploadedPdfPreviews.length);
    if (parsed.error) {
      setSelectedPdfPages([]);
      setPdfPageRangeError(parsed.error);
      applyPdfStatus(parsed.error, "error");
      return;
    }

    setSelectedPdfPages(parsed.pages);
    setPdfPageRangeError("");
    if (!value.trim()) {
      applyPdfStatus("Selection cleared. Enter pages to delete.", "success");
      return;
    }

    applyPdfStatus(
      `Selected ${parsed.pages.length} page(s) for deletion.`,
      "success",
    );
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
      setPdfPageRangeInput("");
      setPdfPageRangeError("");
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

  async function loadFromBuffer(buffer: ArrayBuffer, name: string) {
    setIsPdfBusy(true);
    applyPdfStatus("Loading PDF…", "");
    try {
      const previews = await renderPdfPagePreviews(buffer);
      if (!previews.length) throw new Error("The PDF has no pages.");
      setUploadedPdfName(name);
      setUploadedPdfBuffer(buffer);
      setUploadedPdfPreviews(previews);
      setSelectedPdfPages([]);
      setPdfPageRangeInput("");
      setPdfPageRangeError("");
      applyPdfStatus(
        `Loaded ${previews.length} page(s). Select pages you want to delete.`,
        "success",
      );
    } catch (error) {
      applyPdfStatus(
        error instanceof Error ? error.message : "Could not load PDF.",
        "error",
      );
    } finally {
      setIsPdfBusy(false);
    }
  }

  return {
    uploadedPdfName,
    uploadedPdfBuffer,
    uploadedPdfPreviews,
    selectedPdfPages,
    pdfPageRangeInput,
    pdfPageRangeError,
    pdfStatus,
    pdfStatusType,
    isPdfBusy,
    handleUploadPdf,
    clearUploadedPdf,
    togglePdfPageSelection,
    handlePdfPageRangeInputChange,
    handleDeleteSelectedPdfPages,
    handleDownloadPdf,
    loadFromBuffer,
  };
}
