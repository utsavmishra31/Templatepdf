"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import JSZip from "jszip";
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
import { DOCX_MIME } from "@/lib/api-requests";

export function useTemplateEditor() {
  const [selectedKey, setSelectedKey] = useState<TemplateKey | "">("");
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(
    null,
  );
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

  const displayedPlaceholders = useMemo(
    () => getDisplayPlaceholders(selectedKey, placeholders),
    [selectedKey, placeholders],
  );

  function applyStatus(message: string, type: StatusType) {
    setStatusType(type);
    setStatusMessage(message);
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
        throw new Error(
          "No <<PLACEHOLDER>> values were found in this template.",
        );
      }

      const defaults = getAutomaticDateReplacements();
      const values: FormValues = {};
      extracted.forEach(({ token }) => {
        values[token] = isAutomaticDatePlaceholder(token)
          ? defaults[token]
          : "";
      });

      setSelectedKey(nextKey);
      setTemplateBuffer(buffer);
      setPlaceholders(extracted);
      setFormValues(values);
      applyStatus("Template ready.", "success");
    } catch (error) {
      resetTemplateState("");
      applyStatus(
        error instanceof Error
          ? error.message
          : "Template could not be loaded.",
        "error",
      );
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
    const optionMatch = options.find(
      (option) => getDropdownLookupKey(option) === normalized,
    );
    if (optionMatch) return optionMatch;

    const aliases = {
      "<<TITLE>>": [
        { value: "Sr.", aliases: ["Mr.", "Mr", "Mister", "Shri", "Sh."] },
        {
          value: "Sra.",
          aliases: ["Ms.", "Ms", "Mrs.", "Mrs", "Miss", "Madam", "Smt.", "Smt"],
        },
      ],
      "<<RELATION>>": [
        { value: "hijo de", aliases: ["S/o", "S / O", "Son of", "Son"] },
        {
          value: "hija de",
          aliases: ["D/o", "D / O", "Daughter of", "Daughter"],
        },
        {
          value: "mujer de",
          aliases: [
            "W/o",
            "W / O",
            "Wife of",
            "Wife",
            "Spouse of",
            "Spouse",
          ],
        },
      ],
      "<<TYPE>>": [
        {
          value: "VISADO DE TURISTA",
          aliases: ["Tourist Visa", "Tourism Visa", "Visitor Visa", "Visit Visa"],
        },
        {
          value: "VISADO / ESTANCIA A LARGO PLAZO",
          aliases: [
            "Long Term Visa",
            "Long-Term Visa",
            "Long Term Stay",
            "Long-Term Stay",
            "Long Stay Visa",
          ],
        },
        {
          value: "FINES DE INMIGRACIÓN DISTINTOS DE LA CIUDADANÍA",
          aliases: [
            "Immigration Purposes Other Than Citizenship",
            "Immigration Other Than Citizenship",
            "Immigration Purpose",
            "Immigration Purposes",
          ],
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
        {
          value: "PERMISO DE RESIDENCIA",
          aliases: ["Residence Permit", "Residency Permit", "Resident Permit"],
        },
        {
          value: "EMPLEO / VISADO DE EMPLEO / PERMISO DE TRABAJO",
          aliases: [
            "Employment",
            "Employment Visa",
            "Work Permit",
            "Work Visa",
            "Employment Permit",
          ],
        },
        {
          value: "EDUCACIÓN / INVESTIGACIÓN",
          aliases: [
            "Education",
            "Research",
            "Education/Research",
            "Study",
            "Student Visa",
          ],
        },
        {
          value: "VIAJAR al",
          aliases: ["Travel To", "Traveling To", "Travelling To", "To Travel"],
        },
      ],
      "<<REGISTRAR>>": [
        {
          value: "Sub Registrador",
          aliases: ["Sub Registrar", "Sub-Registrar"],
        },
        { value: "Local Registrador", aliases: ["Local Registrar"] },
        {
          value: "Registrador Local (EOMC)",
          aliases: [
            "Local Registrar (EOMC)",
            "Registrar Local EOMC",
            "EOMC Local Registrar",
          ],
        },
      ],
    } as const;

    const aliasSet = aliases[placeholder as keyof typeof aliases] ?? [];
    const aliasMatch = aliasSet.find(({ aliases: values }) =>
      values.some((alias) => getDropdownLookupKey(alias) === normalized),
    );
    return aliasMatch ? aliasMatch.value : normalizeDateValue(trimmed);
  }

  function applyBulkInput() {
    const parsed = parseBulkPlaceholderValues(bulkInput);
    if (!bulkInput.trim()) {
      setBulkResult("Paste placeholder values first.");
      setBulkResultType("error");
      return;
    }

    const valid = Object.entries(parsed).filter(
      ([placeholder]) => placeholder in formValues,
    );
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
    const ignored =
      ignoredCount > 0
        ? ` ${ignoredCount} placeholder(s) ignored because they are not in this template.`
        : "";
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
    const next = isAutomaticDatePlaceholder(token)
      ? (formValues[token] ?? "")
      : normalizeDateValue(value);
    setFormValues((previous) => ({ ...previous, [token]: next }));
  }

  async function buildDocxBlob() {
    if (!templateBuffer || !selectedKey) {
      throw new Error("Choose a template first.");
    }

    const zip = await JSZip.loadAsync(templateBuffer.slice(0));
    const fileNames = Object.keys(zip.files).filter(
      (name) => name.startsWith("word/") && name.endsWith(".xml"),
    );
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

    return zip.generateAsync({
      type: "blob",
      mimeType: DOCX_MIME,
      compression: "DEFLATE",
    });
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
      await renderPreview(blob);
      setPreviewBadge("Exporting");

      const html2pdfModule = (await import("html2pdf.js")) as unknown as {
        default: () => {
          set: (config: object) => {
            from: (element: HTMLElement) => { save: () => Promise<void> };
          };
        };
      };

      const exportNode = document.querySelector(
        ".docx-wrapper",
      ) as HTMLElement | null;
      const target =
        exportNode ??
        (document.querySelector("#docPreview") as HTMLElement | null);
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
      applyStatus(
        error instanceof Error ? error.message : "Document generation failed.",
        "error",
      );
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

  return {
    selectedKey,
    templateBuffer,
    placeholders,
    formValues,
    bulkInput,
    setBulkInput,
    bulkResult,
    bulkResultType,
    activeTab,
    setActiveTab,
    status,
    statusType,
    previewHtml,
    previewVisible,
    previewBadge,
    isBusy,
    displayedPlaceholders,
    handleTemplateChange,
    applyBulkInput,
    clearBulkInput,
    handleFieldValueChange,
    handleDocxDownload,
    handlePdfDownload,
    clearFields,
  };
}
