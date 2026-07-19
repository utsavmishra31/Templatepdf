"use client";

import { type ChangeEvent, useState } from "react";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME, requestPdfCompression } from "@/lib/api-requests";
import { formatBytes } from "@/lib/format-utils";
import type { StatusType } from "@/types/editor";

export function useCompressPdfTool() {
  const [compressPdfName, setCompressPdfName] = useState("");
  const [compressPdfBuffer, setCompressPdfBuffer] =
    useState<ArrayBuffer | null>(null);
  const [compressPdfOriginalSize, setCompressPdfOriginalSize] = useState(0);
  const [compressPdfResultBuffer, setCompressPdfResultBuffer] =
    useState<ArrayBuffer | null>(null);
  const [compressPdfQuality, setCompressPdfQuality] = useState<
    "extreme" | "recommended" | "less"
  >("recommended");
  const [compressPdfResultName, setCompressPdfResultName] = useState("");
  const [compressPdfResultSize, setCompressPdfResultSize] = useState(0);
  const [compressPdfStatus, setCompressPdfStatus] = useState("");
  const [compressPdfStatusType, setCompressPdfStatusType] =
    useState<StatusType>("");
  const [isCompressPdfBusy, setIsCompressPdfBusy] = useState(false);

  function applyCompressPdfStatus(message: string, type: StatusType) {
    setCompressPdfStatusType(type);
    setCompressPdfStatus(message);
  }

  async function handleUploadCompressPdf(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      applyCompressPdfStatus("Please upload a valid PDF file.", "error");
      return;
    }

    const buffer = await file.arrayBuffer();
    setCompressPdfName(file.name);
    setCompressPdfBuffer(buffer);
    setCompressPdfOriginalSize(file.size);
    setCompressPdfResultBuffer(null);
    setCompressPdfResultName("");
    setCompressPdfResultSize(0);
    applyCompressPdfStatus(
      `${file.name} • ${formatBytes(file.size)}. Select quality and click Compress PDF.`,
      "success",
    );
  }

  function clearCompressPdf() {
    setCompressPdfName("");
    setCompressPdfBuffer(null);
    setCompressPdfOriginalSize(0);
    setCompressPdfResultBuffer(null);
    setCompressPdfResultName("");
    setCompressPdfResultSize(0);
    applyCompressPdfStatus("Cleared.", "success");
  }

  async function handleCompressPdf() {
    if (!compressPdfBuffer || !compressPdfName) {
      applyCompressPdfStatus("Upload a PDF first.", "error");
      return;
    }

    setIsCompressPdfBusy(true);
    setCompressPdfResultBuffer(null);
    setCompressPdfResultName("");
    setCompressPdfResultSize(0);
    applyCompressPdfStatus("Compressing...", "");

    try {
      const QUALITY_MAP = {
        extreme: "screen",
        recommended: "ebook",
        less: "printer",
      } as const;

      const result = await requestPdfCompression(
        compressPdfName,
        compressPdfBuffer,
        QUALITY_MAP[compressPdfQuality],
      );
      const compressedSize = result.compressedSize;
      const baseName = compressPdfName.replace(/\.pdf$/i, "") || "document";
      const outputName = `${baseName}-compressed.pdf`;
      const reduction =
        compressPdfOriginalSize > 0
          ? Math.round((1 - compressedSize / compressPdfOriginalSize) * 100)
          : 0;

      setCompressPdfResultBuffer(result.buffer);
      setCompressPdfResultName(outputName);
      setCompressPdfResultSize(compressedSize);
      applyCompressPdfStatus(
        `${formatBytes(compressedSize)} (${reduction > 0 ? `−${reduction}%` : "no reduction"} from ${formatBytes(compressPdfOriginalSize)}). Click Download PDF to save.`,
        "success",
      );
    } catch (error) {
      applyCompressPdfStatus(
        error instanceof Error ? error.message : "Compression failed.",
        "error",
      );
    } finally {
      setIsCompressPdfBusy(false);
    }
  }

  function handleDownloadCompressedPdf() {
    if (!compressPdfResultBuffer || !compressPdfResultName) return;
    downloadBlob(
      new Blob([compressPdfResultBuffer], { type: PDF_MIME }),
      compressPdfResultName,
    );
  }

  return {
    compressPdfName,
    compressPdfBuffer,
    compressPdfOriginalSize,
    compressPdfQuality,
    compressPdfResultBuffer,
    compressPdfResultName,
    compressPdfResultSize,
    compressPdfStatus,
    compressPdfStatusType,
    isCompressPdfBusy,
    setCompressPdfQuality,
    handleUploadCompressPdf,
    clearCompressPdf,
    handleCompressPdf,
    handleDownloadCompressedPdf,
  };
}
