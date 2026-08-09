import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  pdfToPptName: string;
  pdfToPptBuffer: ArrayBuffer | null;
  pdfToPptPreviews: string[];
  pdfToPptResultBuffer: ArrayBuffer | null;
  pdfToPptResultName: string;
  pdfToPptStatus: string;
  pdfToPptStatusType: StatusType;
  isPdfToPptBusy: boolean;
  isBusy: boolean;
  onUploadPdfToPpt: (event: ChangeEvent<HTMLInputElement>) => void;
  onConvertPdfToPpt: () => void;
  onDownloadPdfToPpt: () => void;
};

export function PdfToPptPanel({
  pdfToPptName,
  pdfToPptBuffer,
  pdfToPptPreviews,
  pdfToPptResultBuffer,
  pdfToPptResultName,
  pdfToPptStatus,
  pdfToPptStatusType,
  isPdfToPptBusy,
  isBusy,
  onUploadPdfToPpt,
  onConvertPdfToPpt,
  onDownloadPdfToPpt,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="pdfToPptTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="PDF pages to convert"
        >
          {pdfToPptPreviews.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {pdfToPptPreviews.map((previewSrc, index) => {
                const pageNumber = index + 1;
                return (
                  <div
                    key={pageNumber}
                    className="grid cursor-default gap-2 rounded-lg bg-white/80 p-2.5 shadow-sm transition"
                    role="listitem"
                  >
                    <span className="text-sm font-bold text-slate-800">
                      Page {pageNumber}
                    </span>
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt={`PDF page ${pageNumber}`}
                        loading="lazy"
                        className="h-auto w-full rounded-md bg-slate-50"
                      />
                    ) : (
                      <div className="min-h-[240px] rounded-md bg-slate-100 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a PDF file to preview pages on the left.
            </div>
          )}
        </div>

        <div className="order-1 flex h-full min-h-[calc(100dvh-3.5rem)] flex-col rounded-none border-y-0 border-l border-r-0 border-slate-200 bg-white p-4 shadow-none md:sticky md:top-14 md:order-2 md:w-[360px] md:self-stretch md:justify-self-end">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h3
              id="pdfToPptTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Convert to PPT
            </h3>
          </div>

          {!pdfToPptBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadPdfToPpt}
                  disabled={isPdfToPptBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {pdfToPptName
                ? `${pdfToPptName}${pdfToPptPreviews.length ? ` • ${pdfToPptPreviews.length} page(s)` : ""}`
                : "No PDF uploaded"}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                pdfToPptBuffer
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onConvertPdfToPpt}
              disabled={isPdfToPptBusy || isBusy || !pdfToPptBuffer}
            >
              Convert to PPT
              {isPdfToPptBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                pdfToPptResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadPdfToPpt}
              disabled={isPdfToPptBusy || isBusy || !pdfToPptResultBuffer}
            >
              Download PPT
            </button>
            {pdfToPptResultName && (
              <div className="text-sm font-bold text-slate-500">
                {pdfToPptResultName}
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          pdfToPptStatusType === "error"
            ? "text-red-700"
            : pdfToPptStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {pdfToPptStatus}
      </p>
    </section>
  );
}
