import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  wordToPdfName: string;
  wordToPdfBuffer: ArrayBuffer | null;
  wordToPdfStatus: string;
  wordToPdfStatusType: StatusType;
  isWordToPdfBusy: boolean;
  isBusy: boolean;
  wordToPdfPreviews: string[];
  wordToPdfResultName: string;
  wordToPdfResultBuffer: ArrayBuffer | null;
  onUploadWordToPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWordToPdf: () => void;
  onConvertWordToPdf: () => void;
  onDownloadWordToPdf: () => void;
};

export function WordToPdfPanel({
  wordToPdfName,
  wordToPdfBuffer,
  wordToPdfStatus,
  wordToPdfStatusType,
  isWordToPdfBusy,
  isBusy,
  wordToPdfPreviews,
  wordToPdfResultName,
  wordToPdfResultBuffer,
  onUploadWordToPdf,
  onClearWordToPdf,
  onConvertWordToPdf,
  onDownloadWordToPdf,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="wordToolsTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="Converted Word to PDF pages"
        >
          {wordToPdfPreviews.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {wordToPdfPreviews.map((previewSrc, index) => {
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
                    <img
                      src={previewSrc}
                      alt={`Converted PDF page ${pageNumber}`}
                      loading="lazy"
                      className="h-auto w-full rounded-md bg-slate-50"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a Word file to preview pages on the left.
            </div>
          )}
        </div>

        <div className="order-1 flex h-full min-h-[calc(100dvh-3.5rem)] flex-col rounded-none border-y-0 border-l border-r-0 border-slate-200 bg-white p-4 shadow-none md:sticky md:top-14 md:order-2 md:w-[360px] md:self-stretch md:justify-self-end">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              Word Utilities
            </p>
            <h3
              id="wordToolsTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Convert to PDF
            </h3>
          </div>

          {!wordToPdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                  onChange={onUploadWordToPdf}
                  disabled={isWordToPdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload Word
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {wordToPdfName
                ? `${wordToPdfName}`
                : "No Word file uploaded"}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                wordToPdfBuffer
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onConvertWordToPdf}
              disabled={isWordToPdfBusy || isBusy || !wordToPdfBuffer}
            >
              Convert to PDF
              {isWordToPdfBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                wordToPdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadWordToPdf}
              disabled={isWordToPdfBusy || isBusy || !wordToPdfResultBuffer}
            >
              Download PDF
            </button>
            {wordToPdfResultName && (
              <div className="text-sm font-bold text-slate-500">
                {wordToPdfResultName}
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          wordToPdfStatusType === "error"
            ? "text-red-700"
            : wordToPdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {wordToPdfStatus}
      </p>
    </section>
  );
}
