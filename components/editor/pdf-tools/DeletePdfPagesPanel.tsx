import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  uploadedPdfName: string;
  uploadedPdfBuffer: ArrayBuffer | null;
  uploadedPdfPreviews: string[];
  selectedPdfPages: number[];
  pdfPageRangeInput: string;
  pdfPageRangeError: string;
  pdfStatus: string;
  pdfStatusType: StatusType;
  isPdfBusy: boolean;
  isBusy: boolean;
  onUploadPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdf: () => void;
  onPdfPageRangeInputChange: (value: string) => void;
  onDeleteSelectedPages: () => void;
  onTogglePageSelection: (pageNumber: number) => void;
  canDownloadPdf: boolean;
  onDownloadPdf: () => void;
};

export function DeletePdfPagesPanel({
  uploadedPdfName,
  uploadedPdfBuffer,
  uploadedPdfPreviews,
  selectedPdfPages,
  pdfPageRangeInput,
  pdfPageRangeError,
  pdfStatus,
  pdfStatusType,
  isPdfBusy,
  isBusy,
  onUploadPdf,
  onClearPdf,
  onPdfPageRangeInputChange,
  onDeleteSelectedPages,
  onTogglePageSelection,
  canDownloadPdf,
  onDownloadPdf,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="pdfToolsTitle">

      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 px-1 pt-2 md:order-1 md:max-h-[calc(100dvh-3.5rem)] md:overflow-y-auto md:pt-4 md:pl-4 md:pr-2"
          role="list"
          aria-label="Uploaded PDF pages"
        >
          {uploadedPdfPreviews.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {uploadedPdfPreviews.map((previewSrc, index) => {
                const pageNumber = index + 1;
                const checked = selectedPdfPages.includes(pageNumber);
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
                      onChange={() => onTogglePageSelection(pageNumber)}
                      disabled={isPdfBusy || isBusy}
                      className="justify-self-start"
                    />
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
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a PDF file to preview pages on the left.
            </div>
          )}
        </div>

        <div className="order-1 flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-14 md:order-2 md:h-full md:min-h-[calc(100dvh-3.5rem)] md:w-[360px] md:self-stretch md:justify-self-end md:rounded-none md:border-y-0 md:border-l md:border-r-0 md:p-4 md:shadow-none">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h2
              id="pdfToolsTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Delete pages
            </h2>
          </div>

          {!uploadedPdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-10 md:min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadPdf}
                  disabled={isPdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2.5">            <div className="text-sm font-bold text-slate-500">
              {uploadedPdfName
                ? `${uploadedPdfName} • ${uploadedPdfPreviews.length} page(s)`
                : "No PDF uploaded"}
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="pdfPageRangeInput" className="text-sm font-semibold text-slate-700">
                Pages to delete
              </label>
              <input
                id="pdfPageRangeInput"
                type="text"
                inputMode="text"
                placeholder="1,2,3-10,12-15"
                value={pdfPageRangeInput}
                onChange={(event) => onPdfPageRangeInputChange(event.target.value)}
                disabled={isPdfBusy || isBusy || uploadedPdfPreviews.length === 0}
                aria-invalid={pdfPageRangeError ? "true" : "false"}
                aria-describedby={pdfPageRangeError ? "pdfPageRangeError" : undefined}
                className={`min-h-10 rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 ${
                  pdfPageRangeError
                    ? "border-red-500 focus:border-red-600"
                    : "border-slate-300 focus:border-teal-600"
                }`}
              />
              {pdfPageRangeError ? (
                <p id="pdfPageRangeError" className="text-sm font-semibold text-red-600">
                  {pdfPageRangeError}
                </p>
              ) : uploadedPdfPreviews.length > 0 ? (
                <p className="text-xs font-medium text-slate-500">
                  Enter only pages between 1 and {uploadedPdfPreviews.length}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold ${
                selectedPdfPages.length > 0
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDeleteSelectedPages}
              disabled={isPdfBusy || isBusy || selectedPdfPages.length === 0}
            >
              Delete Selected Pages
            </button>
            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                canDownloadPdf
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadPdf}
              disabled={isPdfBusy || isBusy || !canDownloadPdf}
            >
              Download PDF
            </button>
            <div className="text-sm font-bold text-slate-500">
              {selectedPdfPages.length > 0
                ? `Selected pages: ${selectedPdfPages.join(", ")}`
                : "Select page cards on the left to mark pages for deletion."}
            </div>
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          pdfStatusType === "error"
            ? "text-red-700"
            : pdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {pdfStatus}
      </p>
    </section>
  );
}
