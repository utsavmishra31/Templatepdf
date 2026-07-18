type DocumentPreviewProps = {
  previewVisible: boolean;
  previewBadge: string;
  previewHtml: string;
};

export function DocumentPreview({ previewVisible, previewBadge, previewHtml }: DocumentPreviewProps) {
  if (!previewVisible) {
    return null;
  }

  return (
    <section
      className="mt-5 rounded-lg border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(32,36,31,0.12)]"
      aria-labelledby="previewTitle"
    >
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">Preview</p>
          <h2 id="previewTitle" className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Generated Document
          </h2>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">
          {previewBadge}
        </span>
      </div>
      <div
        className="doc-preview mt-4 min-h-[240px] overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4"
        id="docPreview"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </section>
  );
}
