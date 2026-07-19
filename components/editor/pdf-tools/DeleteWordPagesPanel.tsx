import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  uploadedWordName: string;
  uploadedWordBuffer: ArrayBuffer | null;
  uploadedWordPreviews: string[];
  selectedWordPages: number[];
  wordStatus: string;
  wordStatusType: StatusType;
  isWordBusy: boolean;
  isBusy: boolean;
  onUploadWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWord: () => void;
  onDeleteSelectedWordPages: () => void;
  onToggleWordPageSelection: (pageNumber: number) => void;
  onDownloadWord: () => void;
};

export function DeleteWordPagesPanel({
  uploadedWordName,
  uploadedWordBuffer,
  uploadedWordPreviews,
  selectedWordPages,
  wordStatus,
  wordStatusType,
  isWordBusy,
  isBusy,
  onUploadWord,
  onClearWord,
  onDeleteSelectedWordPages,
  onToggleWordPageSelection,
  onDownloadWord,
}: Props) {
  return (
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            Word Utilities
          </p>
          <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Upload, Review, and Delete Word Pages
          </h3>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">
          Word backend
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
            onChange={onUploadWord}
            disabled={isWordBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload Word
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
          onClick={onClearWord}
          disabled={isWordBusy || isBusy || !uploadedWordBuffer}
        >
          Clear Word
        </button>
        <div className="text-sm font-bold text-slate-500">
          {uploadedWordName
            ? `${uploadedWordName} • ${uploadedWordPreviews.length} exact page(s)`
            : "No Word file uploaded"}
        </div>
      </div>

      {uploadedWordPreviews.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800"
              onClick={onDeleteSelectedWordPages}
              disabled={isWordBusy || isBusy}
            >
              Delete Selected Word Pages
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={onDownloadWord}
              disabled={isWordBusy || isBusy}
            >
              Download DOCX
            </button>
            <div className="text-sm font-bold text-slate-500">
              {selectedWordPages.length > 0
                ? `Selected pages: ${selectedWordPages.join(", ")}`
                : "Select Word page cards below to mark pages for deletion."}
            </div>
          </div>

          <div
            className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
            role="list"
            aria-label="Uploaded Word pages"
          >
            {uploadedWordPreviews.map((previewSrc, index) => {
              const pageNumber = index + 1;
              const checked = selectedWordPages.includes(pageNumber);
              return (
                <label
                  key={pageNumber}
                  className={`grid cursor-pointer gap-2 rounded-lg border bg-white p-2.5 ${
                    checked
                      ? "border-teal-700 shadow-[0_0_0_2px_rgba(15,118,110,0.15)]"
                      : "border-slate-200"
                  }`}
                  role="listitem"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleWordPageSelection(pageNumber)}
                    disabled={isWordBusy || isBusy}
                    className="justify-self-start"
                  />
                  <span className="text-sm font-bold text-slate-800">
                    Page {pageNumber}
                  </span>
                  <img
                    src={previewSrc}
                    alt={`Word page ${pageNumber}`}
                    loading="lazy"
                    className="h-auto w-full rounded-md border border-slate-200 bg-slate-50"
                  />
                </label>
              );
            })}
          </div>
        </>
      )}

      <p
        className={`mt-4 min-h-6 font-bold ${
          wordStatusType === "error"
            ? "text-red-700"
            : wordStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {wordStatus}
      </p>
    </div>
  );
}
