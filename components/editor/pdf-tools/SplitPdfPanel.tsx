import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  splitPdfName: string;
  splitPdfBuffer: ArrayBuffer | null;
  splitPdfPreviews: string[];
  splitNumOutputs: number;
  splitRanges: string[];
  splitPdfStatus: string;
  splitPdfStatusType: StatusType;
  isSplitPdfBusy: boolean;
  isBusy: boolean;
  onUploadSplitPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearSplitPdf: () => void;
  onSplitNumOutputsChange: (n: number) => void;
  onSplitRangeChange: (index: number, value: string) => void;
  onGenerateSplit: () => void;
};

export function SplitPdfPanel({
  splitPdfName,
  splitPdfBuffer,
  splitPdfPreviews,
  splitNumOutputs,
  splitRanges,
  splitPdfStatus,
  splitPdfStatusType,
  isSplitPdfBusy,
  isBusy,
  onUploadSplitPdf,
  onClearSplitPdf,
  onSplitNumOutputsChange,
  onSplitRangeChange,
  onGenerateSplit,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="splitPdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        {/* Left: page previews */}
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="PDF pages"
        >
          {splitPdfPreviews.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-slate-400">
                Page reference ({splitPdfPreviews.length} total)
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                {splitPdfPreviews.map((previewSrc, index) => (
                  <div
                    key={index + 1}
                    className="grid gap-1 rounded-lg bg-white/80 p-2 shadow-sm"
                    role="listitem"
                  >
                    <span className="text-xs font-bold text-slate-500">
                      Page {index + 1}
                    </span>
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt={`Page ${index + 1}`}
                        loading="lazy"
                        className="h-auto w-full rounded bg-slate-50"
                      />
                    ) : (
                      <div className="min-h-[170px] rounded bg-slate-100 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a PDF file to preview pages on the left.
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="order-1 flex h-full min-h-[calc(100dvh-3.5rem)] flex-col rounded-none border-y-0 border-l border-r-0 border-slate-200 bg-white p-4 shadow-none md:sticky md:top-14 md:order-2 md:w-[360px] md:self-stretch md:justify-self-end">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h3
              id="splitPdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Split PDF
            </h3>
          </div>

          {!splitPdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadSplitPdf}
                  disabled={isSplitPdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {splitPdfName
                ? `${splitPdfName} • ${splitPdfPreviews.length} page(s)`
                : "No PDF uploaded"}
            </div>
          </div>

          {splitPdfPreviews.length > 0 && (
            <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">
                  How many PDFs?
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={splitNumOutputs}
                  onChange={(e) => onSplitNumOutputsChange(Number(e.target.value))}
                  disabled={isSplitPdfBusy || isBusy}
                  className="h-9 w-20 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                {splitRanges.map((range, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-sm font-bold text-slate-600">
                      PDF {i + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`e.g. ${i * 2 + 1}-${i * 2 + 2}`}
                      value={range}
                      onChange={(e) => onSplitRangeChange(i, e.target.value)}
                      disabled={isSplitPdfBusy || isBusy}
                      className="h-9 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400">Use format: 1-3, 5, 7-9</p>

              <button
                type="button"
                className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                  splitPdfPreviews.length > 0
                    ? "border-teal-700 bg-white text-teal-800"
                    : "border-slate-300 bg-slate-100 text-slate-400"
                }`}
                onClick={onGenerateSplit}
                disabled={isSplitPdfBusy || isBusy}
              >
                {isSplitPdfBusy && (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Generate PDF{splitNumOutputs > 1 ? "s" : ""}
              </button>
              <p className="text-xs text-slate-400">
                {splitNumOutputs === 1
                  ? "Downloads a single PDF"
                  : `Downloads a ZIP of ${splitNumOutputs} PDFs`}
              </p>
            </div>
          )}
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          splitPdfStatusType === "error"
            ? "text-red-700"
            : splitPdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {splitPdfStatus}
      </p>
    </section>
  );
}
