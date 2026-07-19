"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import { autoDistributeSplitRanges, parseSplitRange } from "@/lib/format-utils";
import type { StatusType } from "@/types/editor";

export function useSplitPdfTool() {
  const [splitPdfName, setSplitPdfName] = useState("");
  const [splitPdfBuffer, setSplitPdfBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [splitPdfPreviews, setSplitPdfPreviews] = useState<string[]>([]);
  const [splitNumOutputs, setSplitNumOutputs] = useState(2);
  const [splitRanges, setSplitRanges] = useState<string[]>(["", ""]);
  const [splitPdfStatus, setSplitPdfStatus] = useState("");
  const [splitPdfStatusType, setSplitPdfStatusType] = useState<StatusType>("");
  const [isSplitPdfBusy, setIsSplitPdfBusy] = useState(false);

  function applySplitPdfStatus(message: string, type: StatusType) {
    setSplitPdfStatusType(type);
    setSplitPdfStatus(message);
  }

  async function handleUploadSplitPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applySplitPdfStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsSplitPdfBusy(true);
    applySplitPdfStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      const previews = await renderPdfPagePreviews(buffer);
      setSplitPdfName(file.name);
      setSplitPdfBuffer(buffer);
      setSplitPdfPreviews(previews);
      setSplitRanges(
        autoDistributeSplitRanges(splitNumOutputs, previews.length),
      );
      applySplitPdfStatus(
        `${file.name} \u2022 ${previews.length} page(s). Define your ranges below and click Generate.`,
        "success",
      );
    } catch (error) {
      applySplitPdfStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsSplitPdfBusy(false);
    }
  }

  function clearSplitPdf() {
    setSplitPdfName("");
    setSplitPdfBuffer(null);
    setSplitPdfPreviews([]);
    setSplitRanges(["", ""]);
    setSplitNumOutputs(2);
    applySplitPdfStatus("Cleared.", "success");
  }

  function handleSplitNumOutputsChange(n: number) {
    const clamped = Math.max(1, Math.min(20, n));
    setSplitNumOutputs(clamped);
    setSplitRanges(
      splitPdfPreviews.length > 0
        ? autoDistributeSplitRanges(clamped, splitPdfPreviews.length)
        : Array(clamped).fill(""),
    );
  }

  function handleSplitRangeChange(index: number, value: string) {
    setSplitRanges((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleGenerateSplit() {
    if (!splitPdfBuffer) return;

    setIsSplitPdfBusy(true);
    applySplitPdfStatus("Generating PDF(s)\u2026", "");

    try {
      const { PDFDocument } = await import("pdf-lib");
      const srcDoc = await PDFDocument.load(splitPdfBuffer);
      const totalPages = srcDoc.getPageCount();
      const outputs = splitRanges
        .map((range, i) => ({
          name: `part-${i + 1}.pdf`,
          indices: parseSplitRange(range, totalPages).map((p) => p - 1),
        }))
        .filter((o) => o.indices.length > 0);

      if (outputs.length === 0) {
        throw new Error(
          'No valid page ranges. Use formats like "1-3" or "1,3,5".',
        );
      }

      const baseName = splitPdfName.replace(/\.pdf$/i, "") || "document";

      if (outputs.length === 1) {
        const newDoc = await PDFDocument.create();
        const pages = await newDoc.copyPages(srcDoc, outputs[0].indices);
        pages.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        downloadBlob(
          new Blob([bytes.buffer as ArrayBuffer], { type: PDF_MIME }),
          `${baseName}-split.pdf`,
        );
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        for (const output of outputs) {
          const newDoc = await PDFDocument.create();
          const pages = await newDoc.copyPages(srcDoc, output.indices);
          pages.forEach((p) => newDoc.addPage(p));
          const bytes = await newDoc.save();
          zip.file(`${baseName}-${output.name}`, bytes);
        }
        const zipBytes = await zip.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
        });
        downloadBlob(
          new Blob([zipBytes.buffer as ArrayBuffer], {
            type: "application/zip",
          }),
          `${baseName}-split.zip`,
        );
      }

      applySplitPdfStatus(
        `Generated ${outputs.length} PDF(s). Downloading\u2026`,
        "success",
      );
    } catch (error) {
      applySplitPdfStatus(
        error instanceof Error ? error.message : "Split failed.",
        "error",
      );
    } finally {
      setIsSplitPdfBusy(false);
    }
  }

  return {
    splitPdfName,
    splitPdfBuffer,
    splitPdfPreviews,
    splitNumOutputs,
    splitRanges,
    splitPdfStatus,
    splitPdfStatusType,
    isSplitPdfBusy,
    handleUploadSplitPdf,
    clearSplitPdf,
    handleSplitNumOutputsChange,
    handleSplitRangeChange,
    handleGenerateSplit,
  };
}
