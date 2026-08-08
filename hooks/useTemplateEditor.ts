"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  currentOutputName,
  downloadBlob,
  extractPlaceholders,
  parseBulkInput,
  replaceXmlTokens,
  type PlaceholderEntry,
} from "@/lib/template";
import type { FormValues, StatusType } from "@/types/editor";
import { DOCX_MIME, requestWordPreviewPdf } from "@/lib/api-requests";

export function useTemplateEditor() {
  const [isUploaded, setIsUploaded] = useState(false);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const [placeholders, setPlaceholders] = useState<PlaceholderEntry[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [activeTab, setActiveTab] = useState<"fields" | "bulk">("fields");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResult, setBulkResult] = useState("");
  const [bulkResultType, setBulkResultType] = useState<StatusType>("");
  const [status, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewPdfBuffer, setPreviewPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [previewPdfVersion, setPreviewPdfVersion] = useState(0);
  const [isBusy, setIsBusy] = useState(false);

  function applyStatus(message: string, type: StatusType) {
    setStatusType(type);
    setStatusMessage(message);
  }

  function resetState() {
    setIsUploaded(false);
    setTemplateBuffer(null);
    setCustomFileName("");
    setPlaceholders([]);
    setFormValues({});
    setActiveTab("fields");
    setBulkInput("");
    setBulkResult("");
    setBulkResultType("");
    setPreviewPdfBuffer(null);
    setPreviewPdfVersion(0);
    setPreviewHtml("");
  }

  async function handleCustomUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      applyStatus("Only .docx files are supported.", "error");
      return;
    }

    resetState();
    setIsBusy(true);
    applyStatus("Reading document...", "");

    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer.slice(0));
      const extracted = await extractPlaceholders(zip);

      if (!extracted.length) {
        throw new Error(
          "No placeholders found. Use <<NAME>>, {{NAME}}, ((NAME)), or [[NAME]] in your document.",
        );
      }

      const values: FormValues = {};
      extracted.forEach(({ token }) => { values[token] = ""; });

      setIsUploaded(true);
      setCustomFileName(file.name);
      setTemplateBuffer(buffer);
      setPlaceholders(extracted);
      setFormValues(values);
      applyStatus(`${extracted.length} placeholder${extracted.length === 1 ? "" : "s"} detected.`, "success");

      const previewBlob = new Blob([buffer], { type: DOCX_MIME });
      await renderPreview(previewBlob, file.name);
    } catch (error) {
      resetState();
      applyStatus(
        error instanceof Error ? error.message : "Could not read the document.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function applyBulkInput() {
    if (!bulkInput.trim()) {
      setBulkResult("Paste some placeholder values first.");
      setBulkResultType("error");
      return;
    }

    const parsed = parseBulkInput(bulkInput);
    if (!Object.keys(parsed).length) {
      setBulkResult(
        "No placeholders found. Format: <<FIELD>> = value or {{FIELD}} = value",
      );
      setBulkResultType("error");
      return;
    }

    // Match parsed tokens to loaded placeholders case-insensitively
    let matched = 0;
    const next = { ...formValues };
    for (const [parsedToken, value] of Object.entries(parsed)) {
      const loadedToken = placeholders.find(
        (p) => p.token.toLowerCase() === parsedToken.toLowerCase(),
      )?.token;
      if (loadedToken !== undefined) {
        next[loadedToken] = value;
        matched++;
      }
    }

    if (!matched) {
      setBulkResult(
        `None of the ${Object.keys(parsed).length} pasted placeholder(s) matched this document's placeholders.`,
      );
      setBulkResultType("error");
      return;
    }

    setFormValues(next);
    const skipped = Object.keys(parsed).length - matched;
    setBulkResult(
      `Filled ${matched} field${matched !== 1 ? "s" : ""}.${
        skipped > 0 ? ` ${skipped} placeholder(s) not found in this document.` : ""
      }`,
    );
    setBulkResultType("success");
    setActiveTab("fields");
  }

  function clearBulkInput() {
    setBulkInput("");
    setBulkResult("");
    setBulkResultType("");
  }

  function handleFieldValueChange(token: string, value: string) {
    setFormValues((previous) => ({ ...previous, [token]: value }));
  }

  async function buildDocxBlob() {
    if (!templateBuffer) {
      throw new Error("Upload a document first.");
    }

    const zip = await JSZip.loadAsync(templateBuffer.slice(0));
    const xmlFileNames = Object.keys(zip.files).filter(
      (name) => name.startsWith("word/") && name.endsWith(".xml"),
    );

    // Only touch Word XML files — all binary media/font/image files in the
    // archive are left untouched, preserving the original compression and
    // byte-for-byte fidelity of every non-text asset.
    for (const fileName of xmlFileNames) {
      const file = zip.file(fileName);
      if (!file) continue;
      const xml = await file.async("string");
      const replaced = replaceXmlTokens(xml, formValues);
      // Preserve the file's original compression method
      zip.file(fileName, replaced, { compression: "DEFLATE" });
    }

    return zip.generateAsync({
      type: "blob",
      mimeType: DOCX_MIME,
      // Do not set a global compression — each file keeps its own setting.
      // XML files were explicitly set to DEFLATE above; everything else
      // (images, fonts, binary embeddings) keeps its original compression.
    });
  }

  async function renderHtmlPreview(blob: Blob) {
    const { renderAsync } = await import("docx-preview");

    // Separate containers so docx-preview puts CSS in <head> and HTML in <body>
    const bodyEl = document.createElement("div");
    const styleEl = document.createElement("div");

    await renderAsync(blob, bodyEl, styleEl, {
      className: "docx",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      useBase64URL: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      experimental: false,
      trimXmlDeclaration: true,
    });

    // Build a fully isolated standalone HTML document.
    // Rendered inside an <iframe srcDoc> so Tailwind's preflight
    // and global CSS never interfere with docx-preview's injected styles.
    const standaloneDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${styleEl.innerHTML}
<style>
html, body { margin: 0; padding: 0; background: #e8ebee; }
</style>
</head>
<body>${bodyEl.innerHTML}</body>
</html>`;

    setPreviewHtml(standaloneDoc);
  }

  async function renderPreview(blob: Blob, sourceName?: string) {
    const docxBuffer = await blob.arrayBuffer();

    try {
      const pdfBuffer = await requestWordPreviewPdf(
        sourceName || customFileName || "preview.docx",
        docxBuffer,
      );
      setPreviewPdfBuffer(pdfBuffer.slice(0));
      setPreviewPdfVersion((v) => v + 1);
      setPreviewHtml("");
      return;
    } catch {
      setPreviewPdfBuffer(null);
      setPreviewPdfVersion(0);
    }

    await renderHtmlPreview(blob);
  }

  async function handlePreviewUpdate() {
    if (!templateBuffer) return;
    setIsBusy(true);
    applyStatus("Rendering filled preview…", "");
    try {
      const blob = await buildDocxBlob();
      await renderPreview(blob, customFileName || "preview.docx");
      applyStatus("Preview updated with your values.", "success");
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Preview failed.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDocxDownload() {
    setIsBusy(true);
    applyStatus("Generating document...", "");

    try {
      const blob = await buildDocxBlob();
      downloadBlob(blob, `${currentOutputName(customFileName)}.docx`);
      await renderPreview(blob, customFileName || "preview.docx");
      applyStatus("MS Word file generated.", "success");
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Document generation failed.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePdfDownload() {
    setIsBusy(true);
    applyStatus("Generating PDF...", "");

    try {
      const blob = await buildDocxBlob();
      const docxBuffer = await blob.arrayBuffer();

      // Use the same server-side conversion as the preview so the downloaded
      // PDF is byte-for-byte identical to what the user sees in the preview.
      const pdfBuffer = await requestWordPreviewPdf(
        customFileName || "document.docx",
        docxBuffer,
      );

      downloadBlob(
        new Blob([pdfBuffer], { type: "application/pdf" }),
        `${currentOutputName(customFileName)}.pdf`,
      );

      applyStatus("PDF file generated.", "success");
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Document generation failed.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function clearFields() {
    const next: FormValues = {};
    placeholders.forEach(({ token }) => { next[token] = ""; });
    setFormValues(next);
    setBulkInput("");
    setBulkResult("");
    setBulkResultType("");
    applyStatus("Fields cleared.", "success");
  }

  return {
    isUploaded,
    customFileName,
    placeholders,
    formValues,
    activeTab,
    setActiveTab,
    bulkInput,
    setBulkInput,
    bulkResult,
    bulkResultType,
    applyBulkInput,
    clearBulkInput,
    status,
    statusType,
    previewHtml,
    previewPdfBuffer,
    previewPdfVersion,
    isBusy,
    handleCustomUpload,
    handlePreviewUpdate,
    handleFieldValueChange,
    handleDocxDownload,
    handlePdfDownload,
    clearFields,
    resetState,
  };
}
