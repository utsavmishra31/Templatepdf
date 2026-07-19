"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function useMergePdfTool() {
  const [mergePdfFiles, setMergePdfFiles] = useState<
    Array<{
      name: string;
      buffer: ArrayBuffer;
      firstPageSrc: string;
      pageCount: number;
    }>
  >([]);
  const [mergePdfResultBuffer, setMergePdfResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [mergePdfResultName, setMergePdfResultName] = useState("");
  const [mergePdfStatus, setMergePdfStatus] = useState("");
  const [mergePdfStatusType, setMergePdfStatusType] = useState<StatusType>("");
  const [isMergePdfBusy, setIsMergePdfBusy] = useState(false);

  function applyMergePdfStatus(message: string, type: StatusType) {
    setMergePdfStatusType(type);
    setMergePdfStatus(message);
  }

  async function handleAddMergePdfFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const invalid = files.find(
      (f) =>
        f.type !== "application/pdf" &&
        !f.name.toLowerCase().endsWith(".pdf"),
    );
    if (invalid) {
      applyMergePdfStatus(`${invalid.name} is not a PDF file.`, "error");
      return;
    }

    setIsMergePdfBusy(true);
    applyMergePdfStatus(`Loading ${files.length} file(s)...`, "");

    try {
      const newEntries = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const previews = await renderPdfPagePreviews(buffer);
          return {
            name: file.name,
            buffer,
            firstPageSrc: previews[0] ?? "",
            pageCount: previews.length,
          };
        }),
      );
      const nextTotal = mergePdfFiles.length + newEntries.length;
      setMergePdfFiles((prev) => [...prev, ...newEntries]);
      applyMergePdfStatus(
        `${nextTotal} file(s) queued. Add more or click Merge PDFs.`,
        "success",
      );
    } catch (error) {
      applyMergePdfStatus(
        error instanceof Error ? error.message : "Could not read a PDF.",
        "error",
      );
    } finally {
      setIsMergePdfBusy(false);
    }
  }

  function handleRemoveMergePdfFile(index: number) {
    setMergePdfFiles((prev) => prev.filter((_, i) => i !== index));
    setMergePdfResultBuffer(null);
    setMergePdfResultName("");
  }

  function handleMoveMergePdfFile(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setMergePdfFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setMergePdfResultBuffer(null);
    setMergePdfResultName("");
  }

  function clearMergePdf() {
    setMergePdfFiles([]);
    setMergePdfResultBuffer(null);
    setMergePdfResultName("");
    applyMergePdfStatus("Cleared.", "success");
  }

  async function handleMergePdfs() {
    if (mergePdfFiles.length < 2) {
      applyMergePdfStatus("Add at least 2 PDF files to merge.", "error");
      return;
    }

    setIsMergePdfBusy(true);
    setMergePdfResultBuffer(null);
    setMergePdfResultName("");
    applyMergePdfStatus("Merging PDFs...", "");

    try {
      const { PDFDocument } = await import("pdf-lib");
      const mergedPdf = await PDFDocument.create();

      for (const entry of mergePdfFiles) {
        const sourcePdf = await PDFDocument.load(entry.buffer);
        const indices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, indices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const bytes = await mergedPdf.save();
      const totalPages = mergePdfFiles.reduce(
        (sum, f) => sum + f.pageCount,
        0,
      );
      setMergePdfResultBuffer(bytes.buffer as ArrayBuffer);
      setMergePdfResultName("merged.pdf");
      applyMergePdfStatus(
        `Merged ${mergePdfFiles.length} file(s) — ${totalPages} pages total. Click Download PDF to save.`,
        "success",
      );
    } catch (error) {
      applyMergePdfStatus(
        error instanceof Error ? error.message : "Merge failed.",
        "error",
      );
    } finally {
      setIsMergePdfBusy(false);
    }
  }

  function handleDownloadMergedPdf() {
    if (!mergePdfResultBuffer || !mergePdfResultName) return;
    downloadBlob(
      new Blob([mergePdfResultBuffer], { type: PDF_MIME }),
      mergePdfResultName,
    );
  }

  return {
    mergePdfFiles,
    mergePdfResultBuffer,
    mergePdfResultName,
    mergePdfStatus,
    mergePdfStatusType,
    isMergePdfBusy,
    handleAddMergePdfFiles,
    handleRemoveMergePdfFile,
    handleMoveMergePdfFile,
    clearMergePdf,
    handleMergePdfs,
    handleDownloadMergedPdf,
  };
}
