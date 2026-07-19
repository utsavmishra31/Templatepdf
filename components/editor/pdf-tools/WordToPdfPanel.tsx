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
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            Word Utilities
          </p>
          <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Convert Word to PDF
          </h3>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
          Word → PDF
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            onChange={onUploadWordToPdf}
            disabled={isWordToPdfBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload Word
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
          onClick={onClearWordToPdf}
          disabled={isWordToPdfBusy || isBusy || !wordToPdfBuffer}
        >
          Clear
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
          onClick={onConvertWordToPdf}
          disabled={isWordToPdfBusy || isBusy || !wordToPdfBuffer}
        >
          Convert to PDF
        </button>
        <div className="text-sm font-bold text-slate-500">
          {wordToPdfName ? wordToPdfName : "No file selected"}
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

      {wordToPdfPreviews.length > 0 && (
        <>
          <div
            className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
            role="list"
            aria-label="Converted PDF pages"
          >
            {wordToPdfPreviews.map((previewSrc, index) => (
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

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
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
        </>
      )}
    </div>
  );
}
