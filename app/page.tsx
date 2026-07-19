"use client";

import { ChangeEvent, useMemo, useState } from "react";
import JSZip from "jszip";
import { DocumentPreview } from "@/components/editor/DocumentPreview";
import { EntryTabs } from "@/components/editor/EntryTabs";
import { PdfToolsPanel } from "@/components/editor/PdfToolsPanel";
import { TemplateSelector } from "@/components/editor/TemplateSelector";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import {
  currentOutputName,
  downloadBlob,
  extractPlaceholders,
  getAutomaticDateReplacements,
  getDisplayPlaceholders,
  getDropdownLookupKey,
  getDropdownOptions,
  isAutomaticDatePlaceholder,
  normalizeDateValue,
  parseBulkPlaceholderValues,
  replaceXmlTokens,
  templateOptions,
  type PlaceholderEntry,
  type TabType,
  type TemplateKey,
} from "@/lib/template";
import type { FormValues, StatusType } from "@/types/editor";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";

async function getApiErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = await response.json() as { message?: string };
      return payload.message || fallbackMessage;
    }

    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function requestWordPreviewPdf(fileName: string, sourceBuffer: ArrayBuffer) {
  const formData = new FormData();
  formData.set("file", new File([sourceBuffer.slice(0)], fileName, { type: DOCX_MIME }));

  const response = await fetch("/api/word-preview", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Word preview generation failed."));
  }

  return response.arrayBuffer();
}

async function requestPdfPageDeletion(fileName: string, sourceBuffer: ArrayBuffer, selectedPages: number[]) {
  const formData = new FormData();
  formData.set("file", new File([sourceBuffer.slice(0)], fileName, { type: PDF_MIME }));
  formData.set("selectedPages", JSON.stringify(selectedPages));

  const response = await fetch("/api/pdf-delete", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "PDF page deletion failed."));
  }

  const nextBuffer = await response.arrayBuffer();
  const removedCount = Number.parseInt(response.headers.get("x-removed-count") || "", 10);

  return {
    nextBuffer,
    removedCount: Number.isFinite(removedCount) ? removedCount : selectedPages.length,
  };
}

async function requestWordPageDeletion(fileName: string, sourceBuffer: ArrayBuffer, selectedPages: number[]) {
  const formData = new FormData();
  formData.set("file", new File([sourceBuffer.slice(0)], fileName, { type: DOCX_MIME }));
  formData.set("selectedPages", JSON.stringify(selectedPages));

  const response = await fetch("/api/word-delete", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Word page deletion failed."));
  }

  const nextBuffer = await response.arrayBuffer();
  const removedCount = Number.parseInt(response.headers.get("x-removed-count") || "", 10);

  return {
    nextBuffer,
    removedCount: Number.isFinite(removedCount) ? removedCount : selectedPages.length,
  };
}

export default function Home() {
  const [selectedKey, setSelectedKey] = useState<TemplateKey | "">("");
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderEntry[]>([]);
  const [formValues, setFormValues] = useState<FormValues>({});
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResult, setBulkResult] = useState("");
  const [bulkResultType, setBulkResultType] = useState<StatusType>("");
  const [activeTab, setActiveTab] = useState<TabType>("bulk");
  const [status, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewBadge, setPreviewBadge] = useState("Ready");
  const [isBusy, setIsBusy] = useState(false);

  const [uploadedPdfName, setUploadedPdfName] = useState("");
  const [uploadedPdfBuffer, setUploadedPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedPdfPreviews, setUploadedPdfPreviews] = useState<string[]>([]);
  const [selectedPdfPages, setSelectedPdfPages] = useState<number[]>([]);
  const [pdfStatus, setPdfStatus] = useState("");
  const [pdfStatusType, setPdfStatusType] = useState<StatusType>("");
  const [isPdfBusy, setIsPdfBusy] = useState(false);
  const [uploadedWordName, setUploadedWordName] = useState("");
  const [uploadedWordBuffer, setUploadedWordBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedWordOriginalBuffer, setUploadedWordOriginalBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedWordPreviews, setUploadedWordPreviews] = useState<string[]>([]);
  const [selectedWordPages, setSelectedWordPages] = useState<number[]>([]);
  const [wordVisibleToOriginalPageMap, setWordVisibleToOriginalPageMap] = useState<number[]>([]);
  const [deletedWordOriginalPages, setDeletedWordOriginalPages] = useState<number[]>([]);
  const [wordStatus, setWordStatus] = useState("");
  const [wordStatusType, setWordStatusType] = useState<StatusType>("");
  const [isWordBusy, setIsWordBusy] = useState(false);

  const [wordToPdfName, setWordToPdfName] = useState("");
  const [wordToPdfBuffer, setWordToPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [wordToPdfStatus, setWordToPdfStatus] = useState("");
  const [wordToPdfStatusType, setWordToPdfStatusType] = useState<StatusType>("");
  const [isWordToPdfBusy, setIsWordToPdfBusy] = useState(false);
  const [wordToPdfResultBuffer, setWordToPdfResultBuffer] = useState<ArrayBuffer | null>(null);
  const [wordToPdfPreviews, setWordToPdfPreviews] = useState<string[]>([]);
  const [wordToPdfResultName, setWordToPdfResultName] = useState("");

  const displayedPlaceholders = useMemo(
    () => getDisplayPlaceholders(selectedKey, placeholders),
    [selectedKey, placeholders],
  );

  function applyStatus(message: string, type: StatusType) {
    setStatusType(type);
    setStatusMessage(message);
  }

  function applyPdfStatus(message: string, type: StatusType) {
    setPdfStatusType(type);
    setPdfStatus(message);
  }

  function applyWordStatus(message: string, type: StatusType) {
    setWordStatusType(type);
    setWordStatus(message);
  }

  function applyWordToPdfStatus(message: string, type: StatusType) {
    setWordToPdfStatusType(type);
    setWordToPdfStatus(message);
  }

  function resetTemplateState(nextKey: TemplateKey | "") {
    setSelectedKey(nextKey);
    setTemplateBuffer(null);
    setPlaceholders([]);
    setFormValues({});
    setBulkInput("");
    setBulkResult("");
    setBulkResultType("");
    setActiveTab("bulk");
    setPreviewVisible(false);
    setPreviewHtml("");
    setPreviewBadge("Ready");
  }

  async function handleTemplateChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextKey = event.target.value as TemplateKey | "";
    resetTemplateState(nextKey);

    if (!nextKey) {
      applyStatus("", "");
      return;
    }

    setIsBusy(true);
    applyStatus("Loading template...", "");

    try {
      const config = templateOptions[nextKey];
      const response = await fetch(config.templatePath);
      if (!response.ok) {
        throw new Error(`Template file not found: ${config.templatePath}`);
      }

      const buffer = await response.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer.slice(0));
      const extracted = await extractPlaceholders(zip);

      if (!extracted.length) {
        throw new Error("No <<PLACEHOLDER>> values were found in this template.");
      }

      const defaults = getAutomaticDateReplacements();
      const values: FormValues = {};
      extracted.forEach(({ token }) => {
        values[token] = isAutomaticDatePlaceholder(token) ? defaults[token] : "";
      });

      setSelectedKey(nextKey);
      setTemplateBuffer(buffer);
      setPlaceholders(extracted);
      setFormValues(values);
      applyStatus("Template ready.", "success");
    } catch (error) {
      resetTemplateState("");
      applyStatus(error instanceof Error ? error.message : "Template could not be loaded.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  function normalizeDropdownValue(placeholder: string, value: string) {
    const options = getDropdownOptions(placeholder);
    if (!options.length) return normalizeDateValue(value);

    const trimmed = String(value || "").trim();
    if (!trimmed) return trimmed;

    const normalized = getDropdownLookupKey(trimmed);
    const optionMatch = options.find((option) => getDropdownLookupKey(option) === normalized);
    if (optionMatch) return optionMatch;

    const aliases = {
      "<<TITLE>>": [
        { value: "Sr.", aliases: ["Mr.", "Mr", "Mister", "Shri", "Sh."] },
        { value: "Sra.", aliases: ["Ms.", "Ms", "Mrs.", "Mrs", "Miss", "Madam", "Smt.", "Smt"] },
      ],
      "<<RELATION>>": [
        { value: "hijo de", aliases: ["S/o", "S / O", "Son of", "Son"] },
        { value: "hija de", aliases: ["D/o", "D / O", "Daughter of", "Daughter"] },
        { value: "mujer de", aliases: ["W/o", "W / O", "Wife of", "Wife", "Spouse of", "Spouse"] },
      ],
      "<<TYPE>>": [
        { value: "VISADO DE TURISTA", aliases: ["Tourist Visa", "Tourism Visa", "Visitor Visa", "Visit Visa"] },
        {
          value: "VISADO / ESTANCIA A LARGO PLAZO",
          aliases: ["Long Term Visa", "Long-Term Visa", "Long Term Stay", "Long-Term Stay", "Long Stay Visa"],
        },
        {
          value: "FINES DE INMIGRACIÓN DISTINTOS DE LA CIUDADANÍA",
          aliases: ["Immigration Purposes Other Than Citizenship", "Immigration Other Than Citizenship", "Immigration Purpose", "Immigration Purposes"],
        },
        {
          value: "SOLICITUD DE CIUDADANÍA/NACIONALIDAD",
          aliases: [
            "Citizenship Application",
            "Nationality Application",
            "Citizenship/Nationality Application",
            "Application for Citizenship",
            "Application for Nationality",
          ],
        },
        { value: "PERMISO DE RESIDENCIA", aliases: ["Residence Permit", "Residency Permit", "Resident Permit"] },
        { value: "EMPLEO / VISADO DE EMPLEO / PERMISO DE TRABAJO", aliases: ["Employment", "Employment Visa", "Work Permit", "Work Visa", "Employment Permit"] },
        { value: "EDUCACIÓN / INVESTIGACIÓN", aliases: ["Education", "Research", "Education/Research", "Study", "Student Visa"] },
        { value: "VIAJAR al", aliases: ["Travel To", "Traveling To", "Travelling To", "To Travel"] },
      ],
      "<<REGISTRAR>>": [
        { value: "Sub Registrador", aliases: ["Sub Registrar", "Sub-Registrar"] },
        { value: "Local Registrador", aliases: ["Local Registrar"] },
        { value: "Registrador Local (EOMC)", aliases: ["Local Registrar (EOMC)", "Registrar Local EOMC", "EOMC Local Registrar"] },
      ],
    } as const;

    const aliasSet = aliases[placeholder as keyof typeof aliases] ?? [];
    const aliasMatch = aliasSet.find(({ aliases: values }) => values.some((alias) => getDropdownLookupKey(alias) === normalized));
    return aliasMatch ? aliasMatch.value : normalizeDateValue(trimmed);
  }

  function applyBulkInput() {
    const parsed = parseBulkPlaceholderValues(bulkInput);
    if (!bulkInput.trim()) {
      setBulkResult("Paste placeholder values first.");
      setBulkResultType("error");
      return;
    }

    const valid = Object.entries(parsed).filter(([placeholder]) => placeholder in formValues);
    if (!valid.length) {
      setBulkResult("No matching placeholders found for this template.");
      setBulkResultType("error");
      return;
    }

    setFormValues((previous) => {
      const next = { ...previous };
      valid.forEach(([placeholder, value]) => {
        if (!isAutomaticDatePlaceholder(placeholder)) {
          next[placeholder] = normalizeDropdownValue(placeholder, value);
        }
      });
      return next;
    });

    const ignoredCount = Object.keys(parsed).length - valid.length;
    const ignored = ignoredCount > 0 ? ` ${ignoredCount} placeholder(s) ignored because they are not in this template.` : "";
    setBulkResult(`Autofilled ${valid.length} field(s).${ignored}`);
    setBulkResultType("success");
    setActiveTab("fields");
  }

  function clearBulkInput() {
    setBulkInput("");
    setBulkResult("Bulk box cleared.");
    setBulkResultType("success");
  }

  function handleFieldValueChange(token: string, value: string) {
    const next = isAutomaticDatePlaceholder(token) ? formValues[token] ?? "" : normalizeDateValue(value);
    setFormValues((previous) => ({ ...previous, [token]: next }));
  }

  async function buildDocxBlob() {
    if (!templateBuffer || !selectedKey) {
      throw new Error("Choose a template first.");
    }

    const zip = await JSZip.loadAsync(templateBuffer.slice(0));
    const fileNames = Object.keys(zip.files).filter((name) => name.startsWith("word/") && name.endsWith(".xml"));
    const replacements = {
      ...formValues,
      ...getAutomaticDateReplacements(),
    };

    for (const fileName of fileNames) {
      const file = zip.file(fileName);
      if (!file) continue;
      const xml = await file.async("string");
      zip.file(fileName, replaceXmlTokens(xml, replacements));
    }

    return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
  }

  async function renderPreview(blob: Blob) {
    const { renderAsync } = await import("docx-preview");
    const wrapper = document.createElement("div");

    await renderAsync(blob, wrapper, undefined, {
      className: "docx",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
      useBase64URL: true,
    });

    setPreviewHtml(wrapper.innerHTML);
    setPreviewVisible(true);
    setPreviewBadge("Ready");
  }

  async function handleDocxDownload() {
    setIsBusy(true);
    applyStatus("Generating document...", "");

    try {
      const blob = await buildDocxBlob();
      downloadBlob(blob, `${currentOutputName(selectedKey)}.docx`);
      await renderPreview(blob);
      applyStatus("MS Word file generated.", "success");
    } catch (error) {
      setPreviewBadge("Ready");
      applyStatus(error instanceof Error ? error.message : "Document generation failed.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePdfDownload() {
    setIsBusy(true);
    applyStatus("Generating document...", "");

    try {
      const blob = await buildDocxBlob();
      await renderPreview(blob);
      setPreviewBadge("Exporting");

      const html2pdfModule = (await import("html2pdf.js")) as unknown as {
        default: () => {
          set: (config: object) => { from: (element: HTMLElement) => { save: () => Promise<void> } };
        };
      };

      const exportNode = document.querySelector(".docx-wrapper") as HTMLElement | null;
      const target = exportNode ?? (document.querySelector("#docPreview") as HTMLElement | null);
      if (!target) {
        throw new Error("Preview container not found.");
      }

      await html2pdfModule
        .default()
        .set({
          filename: `${currentOutputName(selectedKey)}.pdf`,
          margin: 0,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(target)
        .save();

      setPreviewBadge("Ready");
      applyStatus("PDF file generated.", "success");
    } catch (error) {
      setPreviewBadge("Ready");
      applyStatus(error instanceof Error ? error.message : "Document generation failed.", "error");
    } finally {
      setIsBusy(false);
    }
  }

  function clearFields() {
    const defaults = getAutomaticDateReplacements();
    const next: FormValues = {};
    placeholders.forEach(({ token }) => {
      next[token] = isAutomaticDatePlaceholder(token) ? defaults[token] : "";
    });

    setFormValues(next);
    setPreviewVisible(false);
    setPreviewHtml("");
    setBulkResult("");
    setBulkResultType("");
    applyStatus("Fields cleared.", "success");
  }

  async function handleUploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
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
      applyPdfStatus(`Loaded ${previews.length} page(s). Select pages you want to delete.`, "success");
    } catch (error) {
      setUploadedPdfName("");
      setUploadedPdfBuffer(null);
      setUploadedPdfPreviews([]);
      setSelectedPdfPages([]);
      applyPdfStatus(error instanceof Error ? error.message : "Could not read this PDF.", "error");
    } finally {
      setIsPdfBusy(false);
    }
  }

  function clearUploadedPdf() {
    setUploadedPdfName("");
    setUploadedPdfBuffer(null);
    setUploadedPdfPreviews([]);
    setSelectedPdfPages([]);
    applyPdfStatus("PDF selection cleared.", "success");
  }

  function togglePdfPageSelection(pageNumber: number) {
    setSelectedPdfPages((previous) => {
      if (previous.includes(pageNumber)) {
        return previous.filter((item) => item !== pageNumber);
      }

      return [...previous, pageNumber].sort((a, b) => a - b);
    });
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
      const result = await requestPdfPageDeletion(uploadedPdfName, uploadedPdfBuffer, selectedPdfPages);
      const nextPreviews = await renderPdfPagePreviews(result.nextBuffer);

      const baseName = uploadedPdfName.replace(/\.pdf$/i, "") || "edited";
      const outputName = `${baseName}-updated.pdf`;

      setUploadedPdfName(outputName);
      setUploadedPdfBuffer(result.nextBuffer);
      setUploadedPdfPreviews(nextPreviews);
      setSelectedPdfPages([]);
      applyPdfStatus(`Deleted ${result.removedCount} page(s). Review the pages below, then click Download PDF.`, "success");
    } catch (error) {
      applyPdfStatus(error instanceof Error ? error.message : "Page deletion failed.", "error");
    } finally {
      setIsPdfBusy(false);
    }
  }

  async function handleUploadWord(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const isDocx = file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      applyWordStatus("Please upload a valid DOCX file.", "error");
      return;
    }

    setIsWordBusy(true);
    applyWordStatus("Generating exact Word page previews...", "");

    try {
      const buffer = await file.arrayBuffer();
      const previewPdfBuffer = await requestWordPreviewPdf(file.name, buffer);
      const previews = await renderPdfPagePreviews(previewPdfBuffer);

      if (!previews.length) {
        throw new Error("The uploaded Word file has no previewable pages.");
      }

      setUploadedWordName(file.name);
      setUploadedWordBuffer(buffer);
      setUploadedWordOriginalBuffer(buffer);
      setUploadedWordPreviews(previews);
      setSelectedWordPages([]);
      setWordVisibleToOriginalPageMap(previews.map((_, index) => index + 1));
      setDeletedWordOriginalPages([]);
      applyWordStatus(`Loaded ${previews.length} exact Word page(s). Select pages you want to delete.`, "success");
    } catch (error) {
      setUploadedWordName("");
      setUploadedWordBuffer(null);
      setUploadedWordOriginalBuffer(null);
      setUploadedWordPreviews([]);
      setSelectedWordPages([]);
      setWordVisibleToOriginalPageMap([]);
      setDeletedWordOriginalPages([]);
      applyWordStatus(error instanceof Error ? error.message : "Could not process this Word file.", "error");
    } finally {
      setIsWordBusy(false);
    }
  }

  function clearUploadedWord() {
    setUploadedWordName("");
    setUploadedWordBuffer(null);
    setUploadedWordOriginalBuffer(null);
    setUploadedWordPreviews([]);
    setSelectedWordPages([]);
    setWordVisibleToOriginalPageMap([]);
    setDeletedWordOriginalPages([]);
    applyWordStatus("Word selection cleared.", "success");
  }

  function toggleWordPageSelection(pageNumber: number) {
    setSelectedWordPages((previous) => {
      if (previous.includes(pageNumber)) {
        return previous.filter((item) => item !== pageNumber);
      }

      return [...previous, pageNumber].sort((a, b) => a - b);
    });
  }

  async function handleDeleteSelectedWordPages() {
    if (!uploadedWordBuffer || !uploadedWordName) {
      applyWordStatus("Upload a Word file first.", "error");
      return;
    }

    if (!selectedWordPages.length) {
      applyWordStatus("Select at least one page to delete.", "error");
      return;
    }

    setIsWordBusy(true);
    applyWordStatus("Deleting selected Word pages...", "");

    try {
      const selectedCurrentSet = new Set(selectedWordPages);
      const mappedOriginalPages = selectedWordPages
        .map((visiblePageNumber) => wordVisibleToOriginalPageMap[visiblePageNumber - 1])
        .filter((pageNumber): pageNumber is number => Number.isFinite(pageNumber));

      const canUseOriginalMapping =
        !!uploadedWordOriginalBuffer &&
        mappedOriginalPages.length === selectedWordPages.length;

      const nextDeletedOriginalPages = canUseOriginalMapping
        ? Array.from(new Set([
          ...deletedWordOriginalPages,
          ...mappedOriginalPages,
        ])).sort((a, b) => a - b)
        : [];

      // Prefer deleting from the stable original source. If mapping drifts,
      // fall back to current buffer and rebase mapping automatically.
      const result = canUseOriginalMapping
        ? await requestWordPageDeletion(uploadedWordName, uploadedWordOriginalBuffer, nextDeletedOriginalPages)
        : await requestWordPageDeletion(uploadedWordName, uploadedWordBuffer, selectedWordPages);
      const nextBuffer = result.nextBuffer;

      const baseName = uploadedWordName.replace(/\.docx$/i, "") || "edited";
      const outputName = `${baseName}-updated.docx`;
      const previewPdfBuffer = await requestWordPreviewPdf(outputName, nextBuffer);
      const nextPreviews = await renderPdfPagePreviews(previewPdfBuffer);
      let nextVisibleToOriginalMap = canUseOriginalMapping
        ? wordVisibleToOriginalPageMap.filter((_, index) => !selectedCurrentSet.has(index + 1))
        : nextPreviews.map((_, index) => index + 1);

      const hasMappingDrift = canUseOriginalMapping && nextVisibleToOriginalMap.length !== nextPreviews.length;

      if (hasMappingDrift) {
        nextVisibleToOriginalMap = nextPreviews.map((_, index) => index + 1);
      }

      const newlyDeletedCount = canUseOriginalMapping
        ? nextDeletedOriginalPages.length - deletedWordOriginalPages.length
        : selectedWordPages.length;

      setUploadedWordName(outputName);
      setUploadedWordBuffer(result.nextBuffer);
      setUploadedWordOriginalBuffer((canUseOriginalMapping && !hasMappingDrift) ? uploadedWordOriginalBuffer : result.nextBuffer);
      setUploadedWordPreviews(nextPreviews);
      setSelectedWordPages([]);
      setWordVisibleToOriginalPageMap(nextVisibleToOriginalMap);
      setDeletedWordOriginalPages((canUseOriginalMapping && !hasMappingDrift) ? nextDeletedOriginalPages : []);

      const rebased = !canUseOriginalMapping || hasMappingDrift;
      applyWordStatus(
        rebased
          ? `Deleted ${newlyDeletedCount} page(s). Review below, then click Download DOCX. Page mapping was auto-reset for continued edits.`
          : `Deleted ${newlyDeletedCount} page(s). Review the pages below, then click Download DOCX.`,
        "success",
      );
    } catch (error) {
      applyWordStatus(error instanceof Error ? error.message : "Word page deletion failed.", "error");
    } finally {
      setIsWordBusy(false);
    }
  }

  async function handleUploadWordToPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const isDocx = file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      applyWordToPdfStatus("Please upload a valid DOCX file.", "error");
      return;
    }

    const buffer = await file.arrayBuffer();
    setWordToPdfName(file.name);
    setWordToPdfBuffer(buffer);
    applyWordToPdfStatus(`${file.name} ready. Click Convert to download the PDF.`, "success");
  }

  function clearWordToPdf() {
    setWordToPdfName("");
    setWordToPdfBuffer(null);
    setWordToPdfResultBuffer(null);
    setWordToPdfPreviews([]);
    setWordToPdfResultName("");
    applyWordToPdfStatus("Cleared.", "success");
  }

  async function handleConvertWordToPdf() {
    if (!wordToPdfBuffer || !wordToPdfName) {
      applyWordToPdfStatus("Upload a Word file first.", "error");
      return;
    }

    setIsWordToPdfBusy(true);
    setWordToPdfResultBuffer(null);
    setWordToPdfPreviews([]);
    setWordToPdfResultName("");
    applyWordToPdfStatus("Converting to PDF via LibreOffice...", "");

    try {
      const pdfBuffer = await requestWordPreviewPdf(wordToPdfName, wordToPdfBuffer);
      const baseName = wordToPdfName.replace(/\.docx$/i, "") || "document";
      const outputName = `${baseName}.pdf`;
      const previews = await renderPdfPagePreviews(pdfBuffer);
      setWordToPdfResultBuffer(pdfBuffer);
      setWordToPdfPreviews(previews);
      setWordToPdfResultName(outputName);
      applyWordToPdfStatus(`Converted — ${previews.length} page(s). Review below, then click Download PDF.`, "success");
    } catch (error) {
      applyWordToPdfStatus(error instanceof Error ? error.message : "Conversion failed.", "error");
    } finally {
      setIsWordToPdfBusy(false);
    }
  }

  function handleDownloadPdf() {
    if (!uploadedPdfBuffer || !uploadedPdfName) return;
    downloadBlob(new Blob([uploadedPdfBuffer], { type: PDF_MIME }), uploadedPdfName);
  }

  function handleDownloadWord() {
    if (!uploadedWordBuffer || !uploadedWordName) return;
    downloadBlob(new Blob([uploadedWordBuffer], { type: DOCX_MIME }), uploadedWordName);
  }

  function handleDownloadWordToPdf() {
    if (!wordToPdfResultBuffer || !wordToPdfResultName) return;
    downloadBlob(new Blob([wordToPdfResultBuffer], { type: PDF_MIME }), wordToPdfResultName);
  }

  const selectedTemplateLabel = selectedKey ? templateOptions[selectedKey].label : "";

  return (
    <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-9 max-md:w-[min(100%-22px,1180px)] max-md:pt-5">
      <section className="rounded-lg border border-slate-200 bg-white/95 p-7 shadow-[0_20px_60px_rgba(32,36,31,0.12)] max-md:p-5" aria-labelledby="appTitle">
        <TemplateSelector
          selectedKey={selectedKey}
          displayedPlaceholders={displayedPlaceholders}
          selectedTemplateLabel={selectedTemplateLabel}
          isBusy={isBusy}
          onTemplateChange={handleTemplateChange}
        />

        <EntryTabs
          displayedPlaceholders={displayedPlaceholders}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          bulkInput={bulkInput}
          onBulkInputChange={setBulkInput}
          onApplyBulk={applyBulkInput}
          onClearBulk={clearBulkInput}
          bulkResult={bulkResult}
          bulkResultType={bulkResultType}
          formValues={formValues}
          onFieldChange={handleFieldValueChange}
          isBusy={isBusy}
        />

        {displayedPlaceholders.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3" id="actions">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={handleDocxDownload}
              disabled={isBusy}
            >
              Download MS Word
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800"
              onClick={handlePdfDownload}
              disabled={isBusy}
            >
              Download PDF
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
              onClick={clearFields}
              disabled={isBusy}
            >
              Clear Fields
            </button>
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${statusType === "error" ? "text-red-700" : statusType === "success" ? "text-teal-800" : "text-slate-500"}`}
          role="status"
          aria-live="polite"
        >
          {status}
        </p>

        <PdfToolsPanel
          uploadedPdfName={uploadedPdfName}
          uploadedPdfBuffer={uploadedPdfBuffer}
          uploadedPdfPreviews={uploadedPdfPreviews}
          selectedPdfPages={selectedPdfPages}
          pdfStatus={pdfStatus}
          pdfStatusType={pdfStatusType}
          isPdfBusy={isPdfBusy}
          uploadedWordName={uploadedWordName}
          uploadedWordBuffer={uploadedWordBuffer}
          uploadedWordPreviews={uploadedWordPreviews}
          selectedWordPages={selectedWordPages}
          wordStatus={wordStatus}
          wordStatusType={wordStatusType}
          isWordBusy={isWordBusy}
          isBusy={isBusy}
          onUploadPdf={handleUploadPdf}
          onClearPdf={clearUploadedPdf}
          onDeleteSelectedPages={handleDeleteSelectedPdfPages}
          onTogglePageSelection={togglePdfPageSelection}
          onUploadWord={handleUploadWord}
          onClearWord={clearUploadedWord}
          onDeleteSelectedWordPages={handleDeleteSelectedWordPages}
          onToggleWordPageSelection={toggleWordPageSelection}
          wordToPdfName={wordToPdfName}
          wordToPdfBuffer={wordToPdfBuffer}
          wordToPdfStatus={wordToPdfStatus}
          wordToPdfStatusType={wordToPdfStatusType}
          isWordToPdfBusy={isWordToPdfBusy}
          onUploadWordToPdf={handleUploadWordToPdf}
          onClearWordToPdf={clearWordToPdf}
          onConvertWordToPdf={handleConvertWordToPdf}
          wordToPdfPreviews={wordToPdfPreviews}
          wordToPdfResultName={wordToPdfResultName}
          wordToPdfResultBuffer={wordToPdfResultBuffer}
          onDownloadPdf={handleDownloadPdf}
          onDownloadWord={handleDownloadWord}
          onDownloadWordToPdf={handleDownloadWordToPdf}
        />
      </section>

      <DocumentPreview previewVisible={previewVisible} previewBadge={previewBadge} previewHtml={previewHtml} />
    </main>
  );
}
