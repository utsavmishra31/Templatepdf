"use client";

import { ChangeEvent, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  currentOutputName,
  downloadBlob,
  extractPlaceholders,
  getAutomaticDateReplacements,
  getDisplayPlaceholders,
  getDropdownLookupKey,
  getDropdownOptions,
  hasDropdownOptions,
  humanizePlaceholder,
  isAutomaticDatePlaceholder,
  normalizeDateValue,
  parseBulkPlaceholderValues,
  replaceXmlTokens,
  templateOptions,
  type PlaceholderEntry,
  type TabType,
  type TemplateKey,
} from "@/lib/template";

type StatusType = "" | "success" | "error";

type FormValues = Record<string, string>;

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

  const displayedPlaceholders = useMemo(
    () => getDisplayPlaceholders(selectedKey, placeholders),
    [selectedKey, placeholders],
  );

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

  function applyStatus(message: string, type: StatusType) {
    setStatusType(type);
    setStatusMessage(message);
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

  function clearBulkInput() {
    setBulkInput("");
    setBulkResult("Bulk box cleared.");
    setBulkResultType("success");
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

  const selectedTemplateLabel = selectedKey ? templateOptions[selectedKey].label : "";

  return (
    <main className="app-shell">
      <section className="tool-panel" aria-labelledby="appTitle">
        <div className="topbar">
          <div>
            <p className="eyebrow">Spanish Translation Templates</p>
            <h1 id="appTitle">Manual Template Filler</h1>
          </div>
          <span className="status-pill">Frontend only</span>
        </div>

        <div className="template-strip">
          <label className="select-field" htmlFor="templateSelect">
            <span>Template</span>
            <select id="templateSelect" value={selectedKey} onChange={handleTemplateChange} disabled={isBusy} autoComplete="off">
              <option value="">Choose template</option>
              {Object.entries(templateOptions).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>
          <div className="template-meta">
            {!selectedKey && "Select a template to load its placeholders."}
            {selectedKey && `${selectedTemplateLabel} - ${displayedPlaceholders.length} placeholders loaded.`}
          </div>
        </div>

        {displayedPlaceholders.length > 0 && (
          <div className="entry-tabs" id="entryTabs">
            <div className="tab-list" role="tablist" aria-label="Entry mode">
              <button
                type="button"
                className={`tab-button ${activeTab === "bulk" ? "active" : ""}`}
                onClick={() => setActiveTab("bulk")}
                role="tab"
                aria-selected={activeTab === "bulk"}
                disabled={isBusy}
              >
                Bulk Paste
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === "fields" ? "active" : ""}`}
                onClick={() => setActiveTab("fields")}
                role="tab"
                aria-selected={activeTab === "fields"}
                disabled={isBusy}
              >
                Empty Fields
              </button>
            </div>

            {activeTab === "bulk" && (
              <section className="tab-panel" id="bulkPanel" role="tabpanel">
                <label className="bulk-field" htmlFor="bulkInput">
                  <span>Paste placeholders and values</span>
                  <textarea id="bulkInput" value={bulkInput} onChange={(event) => setBulkInput(event.target.value)} disabled={isBusy} />
                </label>
                <div className="bulk-actions">
                  <button type="button" className="secondary-action" onClick={applyBulkInput} disabled={isBusy}>
                    Autofill Fields
                  </button>
                  <button type="button" className="ghost-action" onClick={clearBulkInput} disabled={isBusy}>
                    Clear Box
                  </button>
                </div>
                <p className={`bulk-result ${bulkResultType}`.trim()}>{bulkResult}</p>
              </section>
            )}

            {activeTab === "fields" && (
              <section className="tab-panel" id="fieldsPanel" role="tabpanel">
                <form className="field-grid" id="fieldForm" onSubmit={(event) => event.preventDefault()}>
                  {displayedPlaceholders.map(({ token }) => (
                    <div className="field-card" key={token}>
                      <label>
                        <span>{humanizePlaceholder(token)}</span>
                        <span className="placeholder-token">{token}</span>
                        {hasDropdownOptions(token) && (
                          <select
                            className="placeholder-select"
                            value={getDropdownOptions(token).includes(formValues[token] ?? "") ? formValues[token] ?? "" : ""}
                            onChange={(event) => {
                              const next = event.target.value;
                              setFormValues((previous) => ({ ...previous, [token]: next }));
                            }}
                            disabled={isBusy}
                          >
                            <option value="">Blank / type manually below</option>
                            {getDropdownOptions(token).map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        )}
                        <textarea
                          data-placeholder={token}
                          value={formValues[token] ?? ""}
                          onChange={(event) => {
                            const next = isAutomaticDatePlaceholder(token) ? formValues[token] ?? "" : normalizeDateValue(event.target.value);
                            setFormValues((previous) => ({ ...previous, [token]: next }));
                          }}
                          placeholder={hasDropdownOptions(token) ? "Type custom value or choose from dropdown" : ""}
                          readOnly={isAutomaticDatePlaceholder(token)}
                          title={isAutomaticDatePlaceholder(token) ? "Filled automatically with today's date" : ""}
                          autoComplete="off"
                          spellCheck={false}
                          disabled={isBusy}
                        />
                      </label>
                    </div>
                  ))}
                </form>
              </section>
            )}
          </div>
        )}

        {displayedPlaceholders.length > 0 && (
          <div className="actions" id="actions">
            <button type="button" className="primary-action" onClick={handleDocxDownload} disabled={isBusy}>
              Download MS Word
            </button>
            <button type="button" className="secondary-action" onClick={handlePdfDownload} disabled={isBusy}>
              Download PDF
            </button>
            <button type="button" className="ghost-action" onClick={clearFields} disabled={isBusy}>
              Clear Fields
            </button>
          </div>
        )}

        <p className={`status ${statusType}`.trim()} role="status" aria-live="polite">
          {status}
        </p>
      </section>

      {previewVisible && (
        <section className="preview-shell" aria-labelledby="previewTitle">
          <div className="preview-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2 id="previewTitle">Generated Document</h2>
            </div>
            <span id="previewBadge">{previewBadge}</span>
          </div>
          <div className="doc-preview" id="docPreview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </section>
      )}
    </main>
  );
}