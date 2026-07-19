import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type PdfToolsPanelProps = {
  uploadedPdfName: string;
  uploadedPdfBuffer: ArrayBuffer | null;
  uploadedPdfPreviews: string[];
  selectedPdfPages: number[];
  pdfStatus: string;
  pdfStatusType: StatusType;
  isPdfBusy: boolean;
  uploadedWordName: string;
  uploadedWordBuffer: ArrayBuffer | null;
  uploadedWordPreviews: string[];
  selectedWordPages: number[];
  wordStatus: string;
  wordStatusType: StatusType;
  isWordBusy: boolean;
  isBusy: boolean;
  onUploadPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdf: () => void;
  onDeleteSelectedPages: () => void;
  onTogglePageSelection: (pageNumber: number) => void;
  onUploadWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWord: () => void;
  onDeleteSelectedWordPages: () => void;
  onToggleWordPageSelection: (pageNumber: number) => void;
  wordToPdfName: string;
  wordToPdfBuffer: ArrayBuffer | null;
  wordToPdfStatus: string;
  wordToPdfStatusType: StatusType;
  isWordToPdfBusy: boolean;
  onUploadWordToPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWordToPdf: () => void;
  onConvertWordToPdf: () => void;
  wordToPdfPreviews: string[];
  wordToPdfResultName: string;
  wordToPdfResultBuffer: ArrayBuffer | null;
  onDownloadPdf: () => void;
  onDownloadWord: () => void;
  onDownloadWordToPdf: () => void;
  pdfToWordName: string;
  pdfToWordBuffer: ArrayBuffer | null;
  pdfToWordPreviews: string[];
  pdfToWordResultBuffer: ArrayBuffer | null;
  pdfToWordResultName: string;
  pdfToWordStatus: string;
  pdfToWordStatusType: StatusType;
  isPdfToWordBusy: boolean;
  onUploadPdfToWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdfToWord: () => void;
  onConvertPdfToWord: () => void;
  onDownloadPdfToWord: () => void;
  mergePdfFiles: Array<{ name: string; firstPageSrc: string; pageCount: number }>;
  mergePdfResultBuffer: ArrayBuffer | null;
  mergePdfResultName: string;
  mergePdfStatus: string;
  mergePdfStatusType: StatusType;
  isMergePdfBusy: boolean;
  onAddMergePdfFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveMergePdfFile: (index: number) => void;
  onMoveMergePdfFile: (index: number, direction: "up" | "down") => void;
  onMergePdfs: () => void;
  onClearMergePdf: () => void;
  onDownloadMergedPdf: () => void;
};

export function PdfToolsPanel({
  uploadedPdfName,
  uploadedPdfBuffer,
  uploadedPdfPreviews,
  selectedPdfPages,
  pdfStatus,
  pdfStatusType,
  isPdfBusy,
  uploadedWordName,
  uploadedWordBuffer,
  uploadedWordPreviews,
  selectedWordPages,
  wordStatus,
  wordStatusType,
  isWordBusy,
  isBusy,
  onUploadPdf,
  onClearPdf,
  onDeleteSelectedPages,
  onTogglePageSelection,
  onUploadWord,
  onClearWord,
  onDeleteSelectedWordPages,
  onToggleWordPageSelection,
  wordToPdfName,
  wordToPdfBuffer,
  wordToPdfStatus,
  wordToPdfStatusType,
  isWordToPdfBusy,
  onUploadWordToPdf,
  onClearWordToPdf,
  onConvertWordToPdf,
  wordToPdfPreviews,
  wordToPdfResultName,
  wordToPdfResultBuffer,
  onDownloadPdf,
  onDownloadWord,
  onDownloadWordToPdf,
  pdfToWordName,
  pdfToWordBuffer,
  pdfToWordPreviews,
  pdfToWordResultBuffer,
  pdfToWordResultName,
  pdfToWordStatus,
  pdfToWordStatusType,
  isPdfToWordBusy,
  onUploadPdfToWord,
  onClearPdfToWord,
  onConvertPdfToWord,
  onDownloadPdfToWord,
  mergePdfFiles,
  mergePdfResultBuffer,
  mergePdfResultName,
  mergePdfStatus,
  mergePdfStatusType,
  isMergePdfBusy,
  onAddMergePdfFiles,
  onRemoveMergePdfFile,
  onMoveMergePdfFile,
  onMergePdfs,
  onClearMergePdf,
  onDownloadMergedPdf,
}: PdfToolsPanelProps) {
  return (
    <section className="mt-6 border-t border-dashed border-slate-300 pt-5" aria-labelledby="pdfToolsTitle">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">PDF Utilities</p>
          <h2 id="pdfToolsTitle" className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Upload, Review, and Delete PDF Pages
          </h2>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">
          PDF backend
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input type="file" accept="application/pdf,.pdf" onChange={onUploadPdf} disabled={isPdfBusy || isBusy} className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress" />
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
          {uploadedPdfName ? `${uploadedPdfName} • ${uploadedPdfPreviews.length} page(s)` : "No PDF uploaded"}
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

          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3" role="list" aria-label="Uploaded PDF pages">
            {uploadedPdfPreviews.map((previewSrc, index) => {
              const pageNumber = index + 1;
              const checked = selectedPdfPages.includes(pageNumber);

              return (
                <label
                  key={pageNumber}
                  className={`grid cursor-pointer gap-2 rounded-lg border bg-white p-2.5 ${
                    checked ? "border-teal-700 shadow-[0_0_0_2px_rgba(15,118,110,0.15)]" : "border-slate-200"
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
                  <span className="text-sm font-bold text-slate-800">Page {pageNumber}</span>
                  <img src={previewSrc} alt={`PDF page ${pageNumber}`} loading="lazy" className="h-auto w-full rounded-md border border-slate-200 bg-slate-50" />
                </label>
              );
            })}
          </div>
        </>
      )}

      <p
        className={`mt-4 min-h-6 font-bold ${
          pdfStatusType === "error" ? "text-red-700" : pdfStatusType === "success" ? "text-teal-800" : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {pdfStatus}
      </p>

      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">Word Utilities</p>
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
            {uploadedWordName ? `${uploadedWordName} • ${uploadedWordPreviews.length} exact page(s)` : "No Word file uploaded"}
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

            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3" role="list" aria-label="Uploaded Word pages">
              {uploadedWordPreviews.map((previewSrc, index) => {
                const pageNumber = index + 1;
                const checked = selectedWordPages.includes(pageNumber);

                return (
                  <label
                    key={pageNumber}
                    className={`grid cursor-pointer gap-2 rounded-lg border bg-white p-2.5 ${
                      checked ? "border-teal-700 shadow-[0_0_0_2px_rgba(15,118,110,0.15)]" : "border-slate-200"
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
                    <span className="text-sm font-bold text-slate-800">Page {pageNumber}</span>
                    <img src={previewSrc} alt={`Word page ${pageNumber}`} loading="lazy" className="h-auto w-full rounded-md border border-slate-200 bg-slate-50" />
                  </label>
                );
              })}
            </div>
          </>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            wordStatusType === "error" ? "text-red-700" : wordStatusType === "success" ? "text-teal-800" : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {wordStatus}
        </p>
      </div>

      {/* ── Word to PDF ───────────────────────────────────────────── */}
      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">Word Utilities</p>
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
            wordToPdfStatusType === "error" ? "text-red-700" : wordToPdfStatusType === "success" ? "text-teal-800" : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {wordToPdfStatus}
        </p>

        {wordToPdfPreviews.length > 0 && (
          <>
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3" role="list" aria-label="Converted PDF pages">
              {wordToPdfPreviews.map((previewSrc, index) => (
                <div
                  key={index + 1}
                  className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                  role="listitem"
                >
                  <span className="text-sm font-bold text-slate-800">Page {index + 1}</span>
                  <img src={previewSrc} alt={`PDF page ${index + 1}`} loading="lazy" className="h-auto w-full rounded-md border border-slate-200 bg-slate-50" />
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
                <div className="text-sm font-bold text-slate-500">{wordToPdfResultName}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── PDF to Word ────────────────────────────────────────── */}
      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">PDF Utilities</p>
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
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3" role="list" aria-label="PDF pages to convert">
            {pdfToWordPreviews.map((previewSrc, index) => (
              <div
                key={index + 1}
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                role="listitem"
              >
                <span className="text-sm font-bold text-slate-800">Page {index + 1}</span>
                <img src={previewSrc} alt={`PDF page ${index + 1}`} loading="lazy" className="h-auto w-full rounded-md border border-slate-200 bg-slate-50" />
              </div>
            ))}
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            pdfToWordStatusType === "error" ? "text-red-700" : pdfToWordStatusType === "success" ? "text-teal-800" : "text-slate-500"
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
              <div className="text-sm font-bold text-slate-500">{pdfToWordResultName}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Merge PDF ───────────────────────────────────────────── */}
      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">PDF Utilities</p>
            <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
              Merge PDFs
            </h3>
          </div>
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">
            Merge PDF
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={onAddMergePdfFiles}
              disabled={isMergePdfBusy || isBusy}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
            />
            Add PDFs
          </label>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
            onClick={onMergePdfs}
            disabled={isMergePdfBusy || isBusy || mergePdfFiles.length < 2}
          >
            Merge PDFs
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
            onClick={onClearMergePdf}
            disabled={isMergePdfBusy || isBusy || mergePdfFiles.length === 0}
          >
            Clear All
          </button>
          {mergePdfFiles.length > 0 && (
            <div className="text-sm font-bold text-slate-500">
              {mergePdfFiles.length} file(s) — {mergePdfFiles.reduce((s, f) => s + f.pageCount, 0)} pages total
            </div>
          )}
        </div>

        {mergePdfFiles.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {mergePdfFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                {file.firstPageSrc && (
                  <img
                    src={file.firstPageSrc}
                    alt=""
                    className="h-16 w-12 shrink-0 rounded border border-slate-200 bg-slate-50 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-slate-800">{file.name}</div>
                  <div className="text-xs text-slate-500">{file.pageCount} page(s)</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                    onClick={() => onMoveMergePdfFile(index, "up")}
                    disabled={index === 0 || isMergePdfBusy || isBusy}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                    onClick={() => onMoveMergePdfFile(index, "down")}
                    disabled={index === mergePdfFiles.length - 1 || isMergePdfBusy || isBusy}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-red-600 hover:bg-red-50 disabled:opacity-30"
                    onClick={() => onRemoveMergePdfFile(index)}
                    disabled={isMergePdfBusy || isBusy}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            mergePdfStatusType === "error" ? "text-red-700" : mergePdfStatusType === "success" ? "text-teal-800" : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {mergePdfStatus}
        </p>

        {mergePdfResultBuffer && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={onDownloadMergedPdf}
              disabled={isMergePdfBusy || isBusy}
            >
              Download PDF
            </button>
            {mergePdfResultName && (
              <div className="text-sm font-bold text-slate-500">{mergePdfResultName}</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
