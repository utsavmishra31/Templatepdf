"use client";

import { type ChangeEvent, useState } from "react";
import { downloadBlob } from "@/lib/template";
import {
  PDF_MIME,
  PPT_MIME,
  PPTX_MIME,
  requestPptToPdfConversion,
} from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function usePptToPdfTool() {
  const [pptToPdfName, setPptToPdfName] = useState("");
  const [pptToPdfBuffer, setPptToPdfBuffer] = useState<ArrayBuffer | null>(
    null,
  );
  const [pptToPdfStatus, setPptToPdfStatus] = useState("");
  const [pptToPdfStatusType, setPptToPdfStatusType] = useState<StatusType>("");
  const [isPptToPdfBusy, setIsPptToPdfBusy] = useState(false);
  const [pptToPdfResultBuffer, setPptToPdfResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [pptToPdfResultName, setPptToPdfResultName] = useState("");

  function applyPptToPdfStatus(message: string, type: StatusType) {
    setPptToPdfStatusType(type);
    setPptToPdfStatus(message);
  }

  async function handleUploadPptToPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isPpt =
      file.type === PPTX_MIME ||
      file.type === PPT_MIME ||
      lowerName.endsWith(".pptx") ||
      lowerName.endsWith(".ppt");

    if (!isPpt) {
      applyPptToPdfStatus("Please upload a valid PPT or PPTX file.", "error");
      return;
    }

    setIsPptToPdfBusy(true);
    setPptToPdfResultBuffer(null);
    setPptToPdfResultName("");
    applyPptToPdfStatus("Reading file...", "");

    try {
      const buffer = await file.arrayBuffer();
      setPptToPdfName(file.name);
      setPptToPdfBuffer(buffer);

      applyPptToPdfStatus(
        `${file.name} ready. Click Convert to PDF.`,
        "success",
      );
    } catch (error) {
      setPptToPdfName("");
      setPptToPdfBuffer(null);
      applyPptToPdfStatus(
        error instanceof Error ? error.message : "Failed to load preview.",
        "error",
      );
    } finally {
      setIsPptToPdfBusy(false);
    }
  }

  function clearPptToPdf() {
    setPptToPdfName("");
    setPptToPdfBuffer(null);
    setPptToPdfResultBuffer(null);
    setPptToPdfResultName("");
    applyPptToPdfStatus("Cleared.", "success");
  }

  async function handleConvertPptToPdf() {
    if (!pptToPdfBuffer || !pptToPdfName) {
      applyPptToPdfStatus("Upload a PPT file first.", "error");
      return;
    }

    setIsPptToPdfBusy(true);
    setPptToPdfResultBuffer(null);
    setPptToPdfResultName("");
    applyPptToPdfStatus("Converting to PDF...", "");

    try {
      const pdfBuffer = await requestPptToPdfConversion(
        pptToPdfName,
        pptToPdfBuffer,
      );
      const baseName = pptToPdfName.replace(/\.pptx?$/i, "") || "presentation";
      const outputName = `${baseName}.pdf`;
      setPptToPdfResultBuffer(pdfBuffer);
      setPptToPdfResultName(outputName);
      applyPptToPdfStatus(
        "Converted successfully. Click Download PDF.",
        "success",
      );
    } catch (error) {
      applyPptToPdfStatus(
        error instanceof Error ? error.message : "Conversion failed.",
        "error",
      );
    } finally {
      setIsPptToPdfBusy(false);
    }
  }

  function handleDownloadPptToPdf() {
    if (!pptToPdfResultBuffer || !pptToPdfResultName) return;
    downloadBlob(
      new Blob([pptToPdfResultBuffer], { type: PDF_MIME }),
      pptToPdfResultName,
    );
  }

  return {
    pptToPdfName,
    pptToPdfBuffer,
    pptToPdfStatus,
    pptToPdfStatusType,
    isPptToPdfBusy,
    pptToPdfResultBuffer,
    pptToPdfResultName,
    handleUploadPptToPdf,
    clearPptToPdf,
    handleConvertPptToPdf,
    handleDownloadPptToPdf,
  };
}
