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
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
          <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Split PDF
          </h3>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-lime-100 bg-lime-50 px-3 py-1 text-sm font-bold text-lime-700">
          Split PDF
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onUploadSplitPdf}
            disabled={isSplitPdfBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload PDF
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
          onClick={onClearSplitPdf}
          disabled={isSplitPdfBusy || isBusy || !splitPdfBuffer}
        >
          Clear
        </button>
        {splitPdfName && (
          <div className="text-sm font-bold text-slate-500">
            {splitPdfName} • {splitPdfPreviews.length} page(s)
          </div>
        )}
      </div>

      {splitPdfPreviews.length > 0 && (
        <>
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-slate-700">
                How many PDFs to generate?
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={splitNumOutputs}
                onChange={(e) =>
                  onSplitNumOutputsChange(Number(e.target.value))
                }
                disabled={isSplitPdfBusy || isBusy}
                className="h-9 w-20 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
              />
              <span className="text-xs text-slate-400">(max 20)</span>
            </div>

            {splitRanges.map((range, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-sm font-bold text-slate-600">
                  PDF {i + 1}
                </span>
                <input
                  type="text"
                  placeholder={`e.g. ${i * 2 + 1}-${i * 2 + 2}`}
                  value={range}
                  onChange={(e) => onSplitRangeChange(i, e.target.value)}
                  disabled={isSplitPdfBusy || isBusy}
                  className="h-9 w-48 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 focus:border-teal-600 focus:outline-none"
                />
                <span className="text-xs text-slate-400">
                  pages: 1-3, 5, 7-9
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-5 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
              onClick={onGenerateSplit}
              disabled={isSplitPdfBusy || isBusy}
            >
              Generate PDF{splitNumOutputs > 1 ? "s" : ""}
            </button>
            <span className="text-xs text-slate-400">
              {splitNumOutputs === 1
                ? "Downloads a single PDF"
                : `Downloads a ZIP of ${splitNumOutputs} PDFs`}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Page reference ({splitPdfPreviews.length} total):
          </p>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
            {splitPdfPreviews.map((previewSrc, index) => (
              <div
                key={index + 1}
                className="grid gap-1 rounded-lg border border-slate-200 bg-white p-2"
              >
                <span className="text-xs font-bold text-slate-500">
                  Page {index + 1}
                </span>
                <img
                  src={previewSrc}
                  alt={`Page ${index + 1}`}
                  loading="lazy"
                  className="h-auto w-full rounded border border-slate-100 bg-slate-50"
                />
              </div>
            ))}
          </div>
        </>
      )}

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
    </div>
  );
}
