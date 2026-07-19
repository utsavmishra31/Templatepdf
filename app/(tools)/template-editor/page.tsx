"use client";

import { DocumentPreview } from "@/components/editor/DocumentPreview";
import { EntryTabs } from "@/components/editor/EntryTabs";
import { TemplateSelector } from "@/components/editor/TemplateSelector";
import { useTemplateEditor } from "@/hooks/useTemplateEditor";
import { templateOptions } from "@/lib/template";

const DocIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

export default function TemplateEditorPage() {
  const editor = useTemplateEditor();

  const selectedTemplateLabel = editor.selectedKey
    ? templateOptions[editor.selectedKey].label
    : "";

  // Step 1 — no template selected yet
  if (!editor.selectedKey) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
        <div className="w-full max-w-lg animate-step-in">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                {DocIcon}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Choose a Template</h2>
                <p className="text-sm text-slate-500">Select a template to get started</p>
              </div>
            </div>
            <TemplateSelector
              selectedKey={editor.selectedKey}
              displayedPlaceholders={editor.displayedPlaceholders}
              selectedTemplateLabel={selectedTemplateLabel}
              isBusy={editor.isBusy}
              onTemplateChange={editor.handleTemplateChange}
            />
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

  // Step 2 — template loaded, show fill form
  return (
    <div className="animate-step-in">
      <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm max-md:p-5">
        <TemplateSelector
          selectedKey={editor.selectedKey}
          displayedPlaceholders={editor.displayedPlaceholders}
          selectedTemplateLabel={selectedTemplateLabel}
          isBusy={editor.isBusy}
          onTemplateChange={editor.handleTemplateChange}
        />

        <EntryTabs
          displayedPlaceholders={editor.displayedPlaceholders}
          activeTab={editor.activeTab}
          onTabChange={editor.setActiveTab}
          bulkInput={editor.bulkInput}
          onBulkInputChange={editor.setBulkInput}
          onApplyBulk={editor.applyBulkInput}
          onClearBulk={editor.clearBulkInput}
          bulkResult={editor.bulkResult}
          bulkResultType={editor.bulkResultType}
          formValues={editor.formValues}
          onFieldChange={editor.handleFieldValueChange}
          isBusy={editor.isBusy}
        />

        {editor.displayedPlaceholders.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={editor.handleDocxDownload}
              disabled={editor.isBusy}
            >
              Download MS Word
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800"
              onClick={editor.handlePdfDownload}
              disabled={editor.isBusy}
            >
              Download PDF
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
              onClick={editor.clearFields}
              disabled={editor.isBusy}
            >
              Clear Fields
            </button>
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            editor.statusType === "error"
              ? "text-red-700"
              : editor.statusType === "success"
                ? "text-teal-800"
                : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {editor.status}
        </p>
      </div>

      <DocumentPreview
        previewVisible={editor.previewVisible}
        previewBadge={editor.previewBadge}
        previewHtml={editor.previewHtml}
      />
    </div>
  );
}
