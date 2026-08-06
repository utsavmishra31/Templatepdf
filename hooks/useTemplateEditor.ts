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
import { DOCX_MIME } from "@/lib/api-requests";

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
      await renderPreview(previewBlob);
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

  async function renderPreview(blob: Blob) {
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
      useBase64URL: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      experimental: true,
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
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { padding: 20px 12px; background: #e8ebee; }
.docx-wrapper { background: transparent !important; padding: 0 !important; }
.docx {
  margin: 0 auto 20px !important;
  box-shadow: 0 2px 18px rgba(0,0,0,0.14) !important;
  background: #fff;
}
</style>
</head>
<body>${bodyEl.innerHTML}</body>
</html>`;

    setPreviewHtml(standaloneDoc);
  }

  async function handlePreviewUpdate() {
    if (!templateBuffer) return;
    setIsBusy(true);
    applyStatus("Rendering filled preview…", "");
    try {
      const blob = await buildDocxBlob();
      await renderPreview(blob);
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
      await renderPreview(blob);
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
    applyStatus("Generating document...", "");

    try {
      const blob = await buildDocxBlob();

      // Render DOCX into a temporary off-screen container so html2pdf.js
      // can capture it — this avoids depending on the iframe preview DOM.
      const { renderAsync } = await import("docx-preview");
      const tempContainer = document.createElement("div");
      tempContainer.style.cssText =
        "position:fixed;left:-10000px;top:0;width:816px;z-index:-1;background:#fff;";
      document.body.appendChild(tempContainer);

      await renderAsync(blob, tempContainer, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        experimental: true,
      });

      const html2pdfModule = (await import("html2pdf.js")) as unknown as {
        default: () => {
          set: (config: object) => {
            from: (element: HTMLElement) => { save: () => Promise<void> };
          };
        };
      };

      const exportNode =
        (tempContainer.querySelector(".docx-wrapper") as HTMLElement | null) ??
        tempContainer;

      await html2pdfModule
        .default()
        .set({
          filename: `${currentOutputName(customFileName)}.pdf`,
          margin: 0,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(exportNode)
        .save();

      applyStatus("PDF file generated.", "success");
    } catch (error) {
      applyStatus(
        error instanceof Error ? error.message : "Document generation failed.",
        "error",
      );
    } finally {
      // Clean up temp container
      document.querySelectorAll("div[style*='-10000px']").forEach((el) => el.remove());
      setIsBusy(false);
    }
  }

  function clearFields() {
    const next: FormValues = {};
    placeholders.forEach(({ token }) => { next[token] = ""; });
    setFormValues(next);
    setPreviewHtml("");
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
