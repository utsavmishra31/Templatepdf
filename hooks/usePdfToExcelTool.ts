"use client";

import { type ChangeEvent, useState } from "react";
import { mergePreviewSlots, renderPdfPagePreviews } from "@/lib/pdf-tools";
import { extractPdfTables } from "@/lib/pdf-table-extract";
import { buildXlsx, XLSX_MIME } from "@/lib/xlsx";
import { downloadBlob } from "@/lib/template";
import type { StatusType } from "@/types/editor";

export function usePdfToExcelTool() {
  const [pdfToExcelName, setPdfToExcelName] = useState("");
  const [pdfToExcelBuffer, setPdfToExcelBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [pdfToExcelPreviews, setPdfToExcelPreviews] = useState<string[]>([]);
  const [pdfToExcelResultBlob, setPdfToExcelResultBlob] =
    useState<Blob | null>(null);
  const [pdfToExcelResultName, setPdfToExcelResultName] = useState("");
  const [pdfToExcelStatus, setPdfToExcelStatus] = useState("");
  const [pdfToExcelStatusType, setPdfToExcelStatusType] =
    useState<StatusType>("");
  const [isPdfToExcelBusy, setIsPdfToExcelBusy] = useState(false);

  function applyPdfToExcelStatus(message: string, type: StatusType) {
    setPdfToExcelStatusType(type);
    setPdfToExcelStatus(message);
  }

  async function handleUploadPdfToExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyPdfToExcelStatus("Please upload a valid PDF file.", "error");
      return;
    }

    setIsPdfToExcelBusy(true);
    setPdfToExcelResultBlob(null);
    setPdfToExcelResultName("");
    applyPdfToExcelStatus("Reading PDF...", "");

    try {
      const buffer = await file.arrayBuffer();
      setPdfToExcelName(file.name);
      setPdfToExcelBuffer(buffer);
      setPdfToExcelPreviews([]);

      let unlocked = false;
      const previews = await renderPdfPagePreviews(buffer, undefined, {
        onUpdate: (nextPreviews, update) => {
          setPdfToExcelPreviews((prev) =>
            mergePreviewSlots(prev, nextPreviews, update.total),
          );
          if (!unlocked && nextPreviews.length > 0) {
            unlocked = true;
            setIsPdfToExcelBusy(false);
          }
        },
      });

      applyPdfToExcelStatus(
        `${file.name} • ${previews.length} page(s). Click Convert to Excel to extract tables.`,
        "success",
      );
    } catch (error) {
      setPdfToExcelName("");
      setPdfToExcelBuffer(null);
      setPdfToExcelPreviews([]);
      applyPdfToExcelStatus(
        error instanceof Error ? error.message : "Could not read this PDF.",
        "error",
      );
    } finally {
      setIsPdfToExcelBusy(false);
    }
  }

  function clearPdfToExcel() {
    setPdfToExcelName("");
    setPdfToExcelBuffer(null);
    setPdfToExcelPreviews([]);
    setPdfToExcelResultBlob(null);
    setPdfToExcelResultName("");
    applyPdfToExcelStatus("Cleared.", "success");
  }

  async function handleConvertPdfToExcel() {
    if (!pdfToExcelBuffer || !pdfToExcelName) {
      applyPdfToExcelStatus("Upload a PDF first.", "error");
      return;
    }

    setIsPdfToExcelBusy(true);
    setPdfToExcelResultBlob(null);
    setPdfToExcelResultName("");
    applyPdfToExcelStatus("Extracting tables...", "");

    try {
      const { sheets, tableDetected, totalTextItems } =
        await extractPdfTables(pdfToExcelBuffer);

      if (totalTextItems === 0) {
        applyPdfToExcelStatus(
          "No selectable text found. This looks like a scanned/image-only PDF, which needs OCR (not supported).",
          "error",
        );
        return;
      }

      const blob = await buildXlsx(sheets);
      const baseName = pdfToExcelName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}.xlsx`;
      setPdfToExcelResultBlob(blob);
      setPdfToExcelResultName(outputName);

      applyPdfToExcelStatus(
        tableDetected
          ? "Tables extracted successfully. Click Download Excel to save."
          : "No clear table columns detected — extracted text line by line. Click Download Excel to save.",
        "success",
      );
    } catch (error) {
      applyPdfToExcelStatus(
        error instanceof Error ? error.message : "Conversion failed.",
        "error",
      );
    } finally {
      setIsPdfToExcelBusy(false);
    }
  }

  function handleDownloadPdfToExcel() {
    if (!pdfToExcelResultBlob || !pdfToExcelResultName) return;
    downloadBlob(
      new Blob([pdfToExcelResultBlob], { type: XLSX_MIME }),
      pdfToExcelResultName,
    );
  }

  return {
    pdfToExcelName,
    pdfToExcelBuffer,
    pdfToExcelPreviews,
    pdfToExcelResultBlob,
    pdfToExcelResultName,
    pdfToExcelStatus,
    pdfToExcelStatusType,
    isPdfToExcelBusy,
    handleUploadPdfToExcel,
    clearPdfToExcel,
    handleConvertPdfToExcel,
    handleDownloadPdfToExcel,
  };
}
