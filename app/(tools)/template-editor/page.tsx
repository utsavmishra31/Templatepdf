"use client";

import { useRef, useState } from "react";
import { useTemplateEditor } from "@/hooks/useTemplateEditor";
import { humanizePlaceholder } from "@/lib/template";
import { HighFidelityPdfPreview } from "@/components/editor/HighFidelityPdfPreview";

const UploadIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

export default function TemplateEditorPage() {
  const editor = useTemplateEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) editor.handleCustomUpload(file);
  }

  // ── Step 1: Upload zone ──────────────────────────────────────────────────
  if (!editor.isUploaded) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
        <div className="w-full max-w-lg animate-step-in">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700">Template Editor</p>
              <h1 className="font-[var(--font-newsreader)] text-3xl font-semibold text-slate-900">
                Fill Your Word Template
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Upload any <code className="rounded bg-slate-100 px-1">.docx</code> file with placeholders — we&apos;ll detect them automatically.
              </p>
            </div>

            <label
              htmlFor="wordUpload"
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
                isDragOver
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50"
              } ${editor.isBusy ? "pointer-events-none opacity-60" : ""}`}
            >
              <span className="text-teal-600">{UploadIcon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Click to upload or drag &amp; drop</p>
                <p className="mt-1 text-xs text-slate-400">.docx files only</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {["<<FIELD>>", "{{FIELD}}", "((FIELD))", "[[FIELD]]"].map((fmt) => (
                  <code key={fmt} className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 border border-teal-100">
                    {fmt}
                  </code>
                ))}
              </div>
              <input
                ref={fileInputRef}
                id="wordUpload"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={editor.isBusy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) editor.handleCustomUpload(file);
                  e.target.value = "";
                }}
              />
            </label>

            {editor.status && (
              <p
                className={`mt-4 text-sm font-bold ${
                  editor.statusType === "error" ? "text-red-700" : "text-slate-500"
                }`}
                role="status"
              >
                {editor.status}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Split view (preview left, fields right) ──────────────────────
  return (
    <div
      className="animate-step-in -mt-8 flex overflow-hidden border-t border-slate-200 max-md:flex-col"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Left: custom preview (no browser PDF toolbar) */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-[#e8ebee]">
        {editor.previewPdfBuffer ? (
          <HighFidelityPdfPreview
            sourceBuffer={editor.previewPdfBuffer}
            renderKey={editor.previewPdfVersion}
          />
        ) : editor.previewHtml ? (
          <iframe
            srcDoc={editor.previewHtml}
            title="Document preview"
            className="w-full border-0 block"
            style={{ minHeight: "calc(100vh - 3.5rem)" }}
            onLoad={(e) => {
              try {
                const f = e.currentTarget;
                const h = f.contentDocument?.documentElement.scrollHeight ?? 0;
                if (h > 0) f.style.height = h + "px";
              } catch {}
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm font-semibold text-slate-400">
              {editor.isBusy ? "Rendering preview…" : "Preview will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* Right: scrollable sidebar */}
      <div className="flex w-[340px] shrink-0 flex-col border-l border-slate-200 bg-white max-md:h-[55vh] max-md:w-full max-md:border-l-0 max-md:border-t">

        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">Your Template</p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-800" title={editor.customFileName}>
                {editor.customFileName}
              </p>
            </div>
            <span className="mt-0.5 shrink-0 rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-bold text-white">
              {editor.placeholders.length}
            </span>
          </div>
          <button
            type="button"
            className="mt-2 text-[11px] font-semibold text-slate-400 hover:text-teal-700"
            onClick={editor.resetState}
            disabled={editor.isBusy}
          >
            ← Upload different file
          </button>
        </div>

        {/* Tab switcher */}
        <div className="shrink-0 border-b border-slate-100 px-4 pt-3 pb-0">
          <div className="flex gap-0">
            {(["fields", "bulk"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => editor.setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition border-b-2 ${
                  editor.activeTab === tab
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "fields" ? "Fields" : "Bulk Paste"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto">
          {editor.activeTab === "fields" ? (
            <form onSubmit={(e) => e.preventDefault()}>
              {editor.placeholders.map(({ token }, i) => (
                <div
                  key={token}
                  className={`px-4 py-3 ${i !== editor.placeholders.length - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <label className="block">
                    <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {humanizePlaceholder(token)}
                      </span>
                      <span className="rounded-full bg-teal-50 px-1.5 py-px text-[10px] font-bold text-teal-700 border border-teal-100">
                        {token}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editor.formValues[token] ?? ""}
                      onChange={(e) => editor.handleFieldValueChange(token, e.target.value)}
                      placeholder="Enter value…"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={editor.isBusy}
                      className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none ring-teal-500 transition focus:border-teal-400 focus:bg-white focus:ring-2 disabled:cursor-progress disabled:opacity-50"
                    />
                  </label>
                </div>
              ))}
            </form>
          ) : (
            <div className="p-4">
              <p className="mb-2 text-[11px] font-semibold text-slate-500">
                Paste placeholder&nbsp;=&nbsp;value pairs, one per line:
              </p>
              <pre className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-[10px] leading-5 text-slate-400 border border-slate-100 select-all">
{`<<NAME>> = John Doe
{{CITY}} = Mumbai
((DATE)) = 01/01/1990
[[FATHER_NAME]] = Robert`}
              </pre>
              <textarea
                value={editor.bulkInput}
                onChange={(e) => editor.setBulkInput(e.target.value)}
                placeholder={"<<FIELD_NAME>> = value\n{{FIELD_NAME}} = value"}
                rows={10}
                disabled={editor.isBusy}
                spellCheck={false}
                autoComplete="off"
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none ring-teal-500 transition focus:border-teal-400 focus:bg-white focus:ring-2 disabled:opacity-50 font-mono"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={editor.applyBulkInput}
                  disabled={editor.isBusy}
                  className="flex-1 h-9 rounded-lg bg-teal-700 text-sm font-bold text-white transition hover:bg-teal-800 disabled:opacity-60"
                >
                  Autofill Fields
                </button>
                <button
                  type="button"
                  onClick={editor.clearBulkInput}
                  disabled={editor.isBusy}
                  className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
              {editor.bulkResult && (
                <p className={`mt-2 text-xs font-bold ${editor.bulkResultType === "error" ? "text-red-600" : "text-teal-700"}`}>
                  {editor.bulkResult}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-4">
          <button
            type="button"
            className="mb-2 h-10 w-full rounded-lg bg-teal-700 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-60"
            onClick={editor.handleDocxDownload}
            disabled={editor.isBusy}
          >
            Download Word
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-9 flex-1 rounded-lg border border-teal-600 text-sm font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-60"
              onClick={editor.handlePdfDownload}
              disabled={editor.isBusy}
            >
              Download PDF
            </button>
            <button
              type="button"
              className="h-9 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
              onClick={editor.clearFields}
              disabled={editor.isBusy}
            >
              Clear
            </button>
          </div>
          <button
            type="button"
            className="mt-2 h-9 w-full rounded-lg border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
            onClick={editor.handlePreviewUpdate}
            disabled={editor.isBusy}
          >
            Preview with values
          </button>
          {editor.status && (
            <p
              className={`mt-2.5 text-xs font-bold ${
                editor.statusType === "error" ? "text-red-600" : "text-teal-700"
              }`}
              role="status"
              aria-live="polite"
            >
              {editor.status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
