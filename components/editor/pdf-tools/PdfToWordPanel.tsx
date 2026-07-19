import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  pdfToWordName: string;
  pdfToWordBuffer: ArrayBuffer | null;
  pdfToWordPreviews: string[];
  pdfToWordResultBuffer: ArrayBuffer | null;
  pdfToWordResultName: string;
  pdfToWordStatus: string;
  pdfToWordStatusType: StatusType;
  isPdfToWordBusy: boolean;
  isBusy: boolean;
  onUploadPdfToWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdfToWord: () => void;
  onConvertPdfToWord: () => void;
  onDownloadPdfToWord: () => void;
};

export function PdfToWordPanel({
  pdfToWordName,
  pdfToWordBuffer,
  pdfToWordPreviews,
  pdfToWordResultBuffer,
  pdfToWordResultName,
  pdfToWordStatus,
  pdfToWordStatusType,
  isPdfToWordBusy,
  isBusy,
  onUploadPdfToWord,
  onClearPdfToWord,
  onConvertPdfToWord,
  onDownloadPdfToWord,
}: Props) {
  return (
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
          <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Convert PDF to Word
          </h3>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-sm font-bold text-rose-700">
          PDF → Word
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onUploadPdfToWord}
            disabled={isPdfToWordBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload PDF
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
          onClick={onClearPdfToWord}
          disabled={isPdfToWordBusy || isBusy || !pdfToWordBuffer}
        >
          Clear
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
          onClick={onConvertPdfToWord}
          disabled={isPdfToWordBusy || isBusy || !pdfToWordBuffer}
        >
          Convert to Word
        </button>
        <div className="text-sm font-bold text-slate-500">
          {pdfToWordName
            ? `${pdfToWordName}${pdfToWordPreviews.length ? ` • ${pdfToWordPreviews.length} page(s)` : ""}`
            : "No file selected"}
        </div>
      </div>

      {pdfToWordPreviews.length > 0 && (
        <div
          className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
          role="list"
          aria-label="PDF pages to convert"
        >
          {pdfToWordPreviews.map((previewSrc, index) => (
            <div
              key={index + 1}
              className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
              role="listitem"
            >
              <span className="text-sm font-bold text-slate-800">
                Page {index + 1}
              </span>
              <img
                src={previewSrc}
                alt={`PDF page ${index + 1}`}
                loading="lazy"
                className="h-auto w-full rounded-md border border-slate-200 bg-slate-50"
              />
            </div>
          ))}
        </div>
      )}

      <p
        className={`mt-4 min-h-6 font-bold ${
          pdfToWordStatusType === "error"
            ? "text-red-700"
            : pdfToWordStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {pdfToWordStatus}
      </p>

      {pdfToWordResultBuffer && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
            onClick={onDownloadPdfToWord}
            disabled={isPdfToWordBusy || isBusy}
          >
            Download Word
          </button>
          {pdfToWordResultName && (
            <div className="text-sm font-bold text-slate-500">
              {pdfToWordResultName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
