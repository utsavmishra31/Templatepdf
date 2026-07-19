import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  uploadedPdfName: string;
  uploadedPdfBuffer: ArrayBuffer | null;
  uploadedPdfPreviews: string[];
  selectedPdfPages: number[];
  pdfStatus: string;
  pdfStatusType: StatusType;
  isPdfBusy: boolean;
  isBusy: boolean;
  onUploadPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdf: () => void;
  onDeleteSelectedPages: () => void;
  onTogglePageSelection: (pageNumber: number) => void;
  onDownloadPdf: () => void;
};

export function DeletePdfPagesPanel({
  uploadedPdfName,
  uploadedPdfBuffer,
  uploadedPdfPreviews,
  selectedPdfPages,
  pdfStatus,
  pdfStatusType,
  isPdfBusy,
  isBusy,
  onUploadPdf,
  onClearPdf,
  onDeleteSelectedPages,
  onTogglePageSelection,
  onDownloadPdf,
}: Props) {
  return (
    <section
      className="mt-6 border-t border-dashed border-slate-300 pt-5"
      aria-labelledby="pdfToolsTitle"
    >
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
          <h2
            id="pdfToolsTitle"
            className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
          >
            Upload, Review, and Delete PDF Pages
          </h2>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">
          PDF backend
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onUploadPdf}
            disabled={isPdfBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload PDF
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
          onClick={onClearPdf}
          disabled={isPdfBusy || isBusy || !uploadedPdfBuffer}
        >
          Clear PDF
        </button>
        <div className="text-sm font-bold text-slate-500">
          {uploadedPdfName
            ? `${uploadedPdfName} • ${uploadedPdfPreviews.length} page(s)`
            : "No PDF uploaded"}
        </div>
      </div>

      {uploadedPdfPreviews.length > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800"
              onClick={onDeleteSelectedPages}
              disabled={isPdfBusy || isBusy}
            >
              Delete Selected Pages
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={onDownloadPdf}
              disabled={isPdfBusy || isBusy}
            >
              Download PDF
            </button>
            <div className="text-sm font-bold text-slate-500">
              {selectedPdfPages.length > 0
                ? `Selected pages: ${selectedPdfPages.join(", ")}`
                : "Select page cards below to mark pages for deletion."}
            </div>
          </div>

          <div
            className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
            role="list"
            aria-label="Uploaded PDF pages"
          >
            {uploadedPdfPreviews.map((previewSrc, index) => {
              const pageNumber = index + 1;
              const checked = selectedPdfPages.includes(pageNumber);
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
                    onChange={() => onTogglePageSelection(pageNumber)}
                    disabled={isPdfBusy || isBusy}
                    className="justify-self-start"
                  />
                  <span className="text-sm font-bold text-slate-800">
                    Page {pageNumber}
                  </span>
                  <img
                    src={previewSrc}
                    alt={`PDF page ${pageNumber}`}
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
