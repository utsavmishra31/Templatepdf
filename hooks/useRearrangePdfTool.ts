"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export type RearrangePage = { originalIndex: number; previewSrc: string; rotation: 0 | 90 | 180 | 270 };

export function useRearrangePdfTool() {
  const [rearrangePdfName, setRearrangePdfName] = useState("");
  const [rearrangePdfBuffer, setRearrangePdfBuffer] =
    useState<ArrayBuffer | null>(null);
  const [rearrangePages, setRearrangePages] = useState<RearrangePage[]>([]);
  const [rearrangeHistory, setRearrangeHistory] = useState<RearrangePage[][]>([]);
  const [rearrangeFuture, setRearrangeFuture] = useState<RearrangePage[][]>([]);
  const [rearrangePdfResultBuffer, setRearrangePdfResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [rearrangePdfResultName, setRearrangePdfResultName] = useState("");
  const [rearrangePdfStatus, setRearrangePdfStatus] = useState("");
  const [rearrangePdfStatusType, setRearrangePdfStatusType] =
    useState<StatusType>("");
  const [isRearrangePdfBusy, setIsRearrangePdfBusy] = useState(false);

  function applyStatus(message: string, type: StatusType) {
    setRearrangePdfStatusType(type);
    setRearrangePdfStatus(message);
  }

  /** Push current pages onto the undo stack and apply the new state. */
  function commitPages(prev: RearrangePage[], next: RearrangePage[]) {
    setRearrangeHistory((h) => [...h, prev]);
    setRearrangeFuture([]);
    setRearrangePages(next);
    setRearrangePdfResultBuffer(null);
    setRearrangePdfResultName("");
  }

  async function handleUploadRearrangePdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsRearrangePdfBusy(true);
    setRearrangePdfResultBuffer(null);
    setRearrangePdfResultName("");
    applyStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      const previews = await renderPdfPagePreviews(buffer);
      setRearrangePdfName(file.name);
      setRearrangePdfBuffer(buffer);
      setRearrangePages(
        previews.map((previewSrc, i) => ({ originalIndex: i, previewSrc, rotation: 0 })),
      );
      setRearrangeHistory([]);
      setRearrangeFuture([]);
      applyStatus("", "");
    } catch (error) {
      setRearrangePdfName("");
      setRearrangePdfBuffer(null);
      setRearrangePages([]);
      applyStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsRearrangePdfBusy(false);
    }
  }

  function clearRearrangePdf() {
    setRearrangePdfName("");
    setRearrangePdfBuffer(null);
    setRearrangePages([]);
    setRearrangeHistory([]);
    setRearrangeFuture([]);
    setRearrangePdfResultBuffer(null);
    setRearrangePdfResultName("");
    applyStatus("Cleared.", "success");
  }

  function moveRearrangePage(fromIndex: number, toIndex: number) {
    const next = [...rearrangePages];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    commitPages(rearrangePages, next);
  }

  function deleteRearrangePage(index: number) {
    commitPages(rearrangePages, rearrangePages.filter((_, i) => i !== index));
  }

  function rotateRearrangePage(index: number, direction: "cw" | "ccw") {
    const next = rearrangePages.map((page, i) => {
      if (i !== index) return page;
      const delta = direction === "cw" ? 90 : 270;
      return { ...page, rotation: (((page.rotation + delta) % 360) as 0 | 90 | 180 | 270) };
    });
    commitPages(rearrangePages, next);
  }

  function swapRearrangePages(a: number, b: number) {
    if (a === b) return;
    const next = [...rearrangePages];
    [next[a], next[b]] = [next[b], next[a]];
    commitPages(rearrangePages, next);
  }

  function sortRearrangePages(direction: "asc" | "desc") {
    const next = [...rearrangePages].sort((a, b) =>
      direction === "asc"
        ? a.originalIndex - b.originalIndex
        : b.originalIndex - a.originalIndex,
    );
    commitPages(rearrangePages, next);
  }

  function undoRearrange() {
    if (rearrangeHistory.length === 0) return;
    const prev = rearrangeHistory[rearrangeHistory.length - 1];
    setRearrangeHistory((h) => h.slice(0, -1));
    setRearrangeFuture((f) => [rearrangePages, ...f]);
    setRearrangePages(prev);
    setRearrangePdfResultBuffer(null);
    setRearrangePdfResultName("");
  }

  function redoRearrange() {
    if (rearrangeFuture.length === 0) return;
    const next = rearrangeFuture[0];
    setRearrangeFuture((f) => f.slice(1));
    setRearrangeHistory((h) => [...h, rearrangePages]);
    setRearrangePages(next);
    setRearrangePdfResultBuffer(null);
    setRearrangePdfResultName("");
  }

  async function handleApplyRearrange() {
    if (!rearrangePdfBuffer || rearrangePages.length === 0) return;

    setIsRearrangePdfBusy(true);
    applyStatus("Rearranging pages...", "");

    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const srcDoc = await PDFDocument.load(rearrangePdfBuffer);
      const newDoc = await PDFDocument.create();

      const pageIndices = rearrangePages.map((p) => p.originalIndex);
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      for (let i = 0; i < copiedPages.length; i++) {
        const page = copiedPages[i];
        const extraRotation = rearrangePages[i].rotation;
        if (extraRotation !== 0) {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + extraRotation) % 360));
        }
        newDoc.addPage(page);
      }

      const bytes = await newDoc.save();
      const resultBuffer = bytes.buffer as ArrayBuffer;
      const baseName = rearrangePdfName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}-rearranged.pdf`;

      setRearrangePdfResultBuffer(resultBuffer);
      setRearrangePdfResultName(outputName);
      applyStatus(
        `Pages rearranged. Click Download PDF to save.`,
        "success",
      );
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Rearrange failed.",
        "error",
      );
    } finally {
      setIsRearrangePdfBusy(false);
    }
  }

  function handleDownloadRearrangedPdf() {
    if (!rearrangePdfResultBuffer || !rearrangePdfResultName) return;
    const blob = new Blob([rearrangePdfResultBuffer], { type: PDF_MIME });
    downloadBlob(blob, rearrangePdfResultName);
  }

  return {
    rearrangePdfName,
    rearrangePdfBuffer,
    rearrangePages,
    rearrangePdfResultBuffer,
    rearrangePdfResultName,
    rearrangePdfStatus,
    rearrangePdfStatusType,
    isRearrangePdfBusy,
    handleUploadRearrangePdf,
    clearRearrangePdf,
    moveRearrangePage,
    deleteRearrangePage,
    rotateRearrangePage,
    swapRearrangePages,
    sortRearrangePages,
    undoRearrange,
    redoRearrange,
    canUndo: rearrangeHistory.length > 0,
    canRedo: rearrangeFuture.length > 0,
    handleApplyRearrange,
    handleDownloadRearrangedPdf,
  };
}
