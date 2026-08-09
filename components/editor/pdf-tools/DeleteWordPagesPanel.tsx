import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  uploadedWordName: string;
  uploadedWordBuffer: ArrayBuffer | null;
  uploadedWordPreviews: string[];
  selectedWordPages: number[];
  wordPageRangeInput: string;
  wordPageRangeError: string;
  wordStatus: string;
  wordStatusType: StatusType;
  isWordBusy: boolean;
  isBusy: boolean;
  onUploadWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWord: () => void;
  onWordPageRangeInputChange: (value: string) => void;
  onDeleteSelectedWordPages: () => void;
  onToggleWordPageSelection: (pageNumber: number) => void;
  onDownloadWord: () => void;
};

export function DeleteWordPagesPanel({
  uploadedWordName,
  uploadedWordBuffer,
  uploadedWordPreviews,
  selectedWordPages,
  wordPageRangeInput,
  wordPageRangeError,
  wordStatus,
  wordStatusType,
  isWordBusy,
  isBusy,
  onUploadWord,
  onClearWord,
  onWordPageRangeInputChange,
  onDeleteSelectedWordPages,
  onToggleWordPageSelection,
  onDownloadWord,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="wordToolsTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="Uploaded Word pages"
        >
          {uploadedWordPreviews.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {uploadedWordPreviews.map((previewSrc, index) => {
                const pageNumber = index + 1;
                const checked = selectedWordPages.includes(pageNumber);
                return (
                  <label
                    key={pageNumber}
                    className={`grid cursor-pointer gap-2 rounded-lg bg-white/80 p-2.5 shadow-sm transition ${
                      checked
                        ? "ring-1 ring-teal-600/30 bg-teal-50"
                        : ""
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
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt={`Word page ${pageNumber}`}
                        loading="lazy"
                        className="h-auto w-full rounded-md bg-slate-50"
                      />
                    ) : (
                      <div className="min-h-[240px] rounded-md bg-slate-100 animate-pulse" />
                    )}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a Word file to preview exact pages on the left.
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
              Delete pages
            </h3>
          </div>

          {!uploadedWordBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                  onChange={onUploadWord}
                  disabled={isWordBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload Word
              </label>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2.5">            <div className="text-sm font-bold text-slate-500">
              {uploadedWordName
                ? `${uploadedWordName} • ${uploadedWordPreviews.length} exact page(s)`
                : "No Word file uploaded"}
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="wordPageRangeInput" className="text-sm font-semibold text-slate-700">
                Pages to delete
              </label>
              <input
                id="wordPageRangeInput"
                type="text"
                inputMode="text"
                placeholder="1,2,3-10,12-15"
                value={wordPageRangeInput}
                onChange={(event) => onWordPageRangeInputChange(event.target.value)}
                disabled={isWordBusy || isBusy || uploadedWordPreviews.length === 0}
                aria-invalid={wordPageRangeError ? "true" : "false"}
                aria-describedby={wordPageRangeError ? "wordPageRangeError" : undefined}
                className={`min-h-10 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 ${
                  wordPageRangeError
                    ? "border-red-500 focus:border-red-600"
                    : "border-slate-300 focus:border-teal-600"
                }`}
              />
              {wordPageRangeError ? (
                <p id="wordPageRangeError" className="text-sm font-semibold text-red-600">
                  {wordPageRangeError}
                </p>
              ) : uploadedWordPreviews.length > 0 ? (
                <p className="text-xs font-medium text-slate-500">
                  Enter only pages between 1 and {uploadedWordPreviews.length}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold ${
                selectedWordPages.length > 0
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDeleteSelectedWordPages}
              disabled={isWordBusy || isBusy || selectedWordPages.length === 0}
            >
              Delete Selected Word Pages
            </button>
            <button
              type="button"
              className="min-h-9 rounded-lg border border-transparent bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
              onClick={onDownloadWord}
              disabled={isWordBusy || isBusy || uploadedWordPreviews.length === 0}
            >
              Download DOCX
            </button>
            <div className="text-sm font-bold text-slate-500">
              {selectedWordPages.length > 0
                ? `Selected pages: ${selectedWordPages.join(", ")}`
                : "Select Word page cards on the left to mark pages for deletion."}
            </div>
          </div>
        </div>
      </div>

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
    </section>
  );
}
