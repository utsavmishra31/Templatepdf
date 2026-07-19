import { useState } from "react";
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
  onMoveMergePdfFile: (fromIndex: number, toIndex: number) => void;
  onMergePdfs: () => void;
  onClearMergePdf: () => void;
  onDownloadMergedPdf: () => void;
  compressPdfName: string;
  compressPdfBuffer: ArrayBuffer | null;
  compressPdfOriginalSize: number;
  compressPdfQuality: "extreme" | "recommended" | "less";
  compressPdfResultBuffer: ArrayBuffer | null;
  compressPdfResultName: string;
  compressPdfResultSize: number;
  compressPdfStatus: string;
  compressPdfStatusType: StatusType;
  isCompressPdfBusy: boolean;
  onUploadCompressPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCompressPdf: () => void;
  onCompressPdfQualityChange: (quality: "extreme" | "recommended" | "less") => void;
  onCompressPdf: () => void;
  onDownloadCompressedPdf: () => void;
  rotatePdfName: string;
  rotatePdfBuffer: ArrayBuffer | null;
  rotatePdfPreviews: string[];
  rotatePdfResultBuffer: ArrayBuffer | null;
  rotatePdfResultName: string;
  rotatePdfStatus: string;
  rotatePdfStatusType: StatusType;
  isRotatePdfBusy: boolean;
  onUploadRotatePdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearRotatePdf: () => void;
  onRotatePage: (pageNumber: number, direction: "cw" | "ccw") => void;
  onRotateAllPages: (direction: "cw" | "ccw") => void;
  onDownloadRotatedPdf: () => void;
  splitPdfName: string;
  splitPdfBuffer: ArrayBuffer | null;
  splitPdfPreviews: string[];
  splitNumOutputs: number;
  splitRanges: string[];
  splitPdfStatus: string;
  splitPdfStatusType: StatusType;
  isSplitPdfBusy: boolean;
  onUploadSplitPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearSplitPdf: () => void;
  onSplitNumOutputsChange: (n: number) => void;
  onSplitRangeChange: (index: number, value: string) => void;
  onGenerateSplit: () => void;
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
  compressPdfName,
  compressPdfBuffer,
  compressPdfOriginalSize,
  compressPdfQuality,
  compressPdfResultBuffer,
  compressPdfResultName,
  compressPdfResultSize,
  compressPdfStatus,
  compressPdfStatusType,
  isCompressPdfBusy,
  onUploadCompressPdf,
  onClearCompressPdf,
  onCompressPdfQualityChange,
  onCompressPdf,
  onDownloadCompressedPdf,
  rotatePdfName,
  rotatePdfBuffer,
  rotatePdfPreviews,
  rotatePdfResultBuffer,
  rotatePdfResultName,
  rotatePdfStatus,
  rotatePdfStatusType,
  isRotatePdfBusy,
  onUploadRotatePdf,
  onClearRotatePdf,
  onRotatePage,
  onRotateAllPages,
  onDownloadRotatedPdf,
  splitPdfName,
  splitPdfBuffer,
  splitPdfPreviews,
  splitNumOutputs,
  splitRanges,
  splitPdfStatus,
  splitPdfStatusType,
  isSplitPdfBusy,
  onUploadSplitPdf,
  onClearSplitPdf,
  onSplitNumOutputsChange,
  onSplitRangeChange,
  onGenerateSplit,
}: PdfToolsPanelProps) {
  function fmt(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
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
          <>
            <p className="mt-3 text-xs text-slate-400">Drag cards to reorder</p>
            <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {mergePdfFiles.map((file, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragSrc(index); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(index); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragSrc !== null && dragSrc !== index) onMoveMergePdfFile(dragSrc, index);
                    setDragSrc(null);
                    setDragOver(null);
                  }}
                  onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                  onDragLeave={() => setDragOver(null)}
                  className={`cursor-grab select-none rounded-lg border-2 bg-white p-2 active:cursor-grabbing ${
                    dragSrc === index
                      ? "opacity-40 border-slate-300"
                      : dragOver === index
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="relative">
                    {file.firstPageSrc ? (
                      <img
                        src={file.firstPageSrc}
                        alt={`Page 1 of ${file.name}`}
                        className="h-auto w-full rounded border border-slate-100 bg-slate-50"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">No preview</div>
                    )}
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-xs text-white hover:bg-red-500 disabled:opacity-40"
                      onClick={() => onRemoveMergePdfFile(index)}
                      disabled={isMergePdfBusy || isBusy}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <div className="truncate text-xs font-bold text-slate-800" title={file.name}>{file.name}</div>
                    <div className="text-xs text-slate-400">{file.pageCount} page(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </>
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

      {/* ── Compress PDF ────────────────────────────────────────── */}
      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">PDF Utilities</p>
            <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
              Compress PDF
            </h3>
          </div>
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
            Compress PDF
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={onUploadCompressPdf}
              disabled={isCompressPdfBusy || isBusy}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
            />
            Upload PDF
          </label>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
            onClick={onClearCompressPdf}
            disabled={isCompressPdfBusy || isBusy || !compressPdfBuffer}
          >
            Clear
          </button>
          {compressPdfName && (
            <div className="text-sm font-bold text-slate-500">
              {compressPdfName}{compressPdfOriginalSize > 0 ? ` • ${fmt(compressPdfOriginalSize)}` : ""}
            </div>
          )}
        </div>

        {compressPdfBuffer && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
              onClick={onCompressPdf}
              disabled={isCompressPdfBusy || isBusy}
            >
              Compress PDF
            </button>
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            compressPdfStatusType === "error" ? "text-red-700" : compressPdfStatusType === "success" ? "text-teal-800" : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {compressPdfStatus}
        </p>

        {compressPdfResultBuffer && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={onDownloadCompressedPdf}
              disabled={isCompressPdfBusy || isBusy}
            >
              Download PDF
            </button>
            {compressPdfResultName && (
              <div className="text-sm font-bold text-slate-500">
                {compressPdfResultName}{compressPdfResultSize > 0 ? ` • ${fmt(compressPdfResultSize)}` : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Rotate PDF ──────────────────────────────────────────── */}
      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">PDF Utilities</p>
            <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
              Rotate PDF
            </h3>
          </div>
          <span className="inline-flex min-h-[34px] items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-700">
            Rotate PDF
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={onUploadRotatePdf}
              disabled={isRotatePdfBusy || isBusy}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
            />
            Upload PDF
          </label>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
            onClick={onClearRotatePdf}
            disabled={isRotatePdfBusy || isBusy || !rotatePdfBuffer}
          >
            Clear
          </button>
          {rotatePdfName && (
            <div className="text-sm font-bold text-slate-500">
              {rotatePdfName} • {rotatePdfPreviews.length} page(s)
            </div>
          )}
        </div>

        {rotatePdfBuffer && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Rotate all pages:</span>
            <button
              type="button"
              title="Rotate all counter-clockwise"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:opacity-40"
              onClick={() => onRotateAllPages("ccw")}
              disabled={isRotatePdfBusy || isBusy}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v6h6"/>
                <path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
              </svg>
            </button>
            <button
              type="button"
              title="Rotate all clockwise"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:opacity-40"
              onClick={() => onRotateAllPages("cw")}
              disabled={isRotatePdfBusy || isBusy}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"/>
                <path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>
              </svg>
            </button>
          </div>
        )}

        {rotatePdfPreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3" role="list" aria-label="PDF pages to rotate">
            {rotatePdfPreviews.map((previewSrc, index) => {
              const pageNumber = index + 1;
              return (
                <div key={pageNumber} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5" role="listitem">
                  <span className="text-sm font-bold text-slate-800">Page {pageNumber}</span>
                  <div className="group relative">
                    <img src={previewSrc} alt={`Page ${pageNumber}`} loading="lazy" className="h-auto w-full rounded-md border border-slate-200 bg-slate-50" />
                    <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-md bg-black/0 transition group-hover:bg-black/20">
                      <button
                        type="button"
                        title="Rotate counter-clockwise"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow transition hover:bg-white hover:text-teal-700 group-hover:opacity-100 disabled:opacity-30"
                        onClick={() => onRotatePage(pageNumber, "ccw")}
                        disabled={isRotatePdfBusy || isBusy}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 2v6h6"/>
                          <path d="M3 13a9 9 0 1 0 3-7.7L3 8"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Rotate clockwise"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow transition hover:bg-white hover:text-teal-700 group-hover:opacity-100 disabled:opacity-30"
                        onClick={() => onRotatePage(pageNumber, "cw")}
                        disabled={isRotatePdfBusy || isBusy}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 2v6h-6"/>
                          <path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            rotatePdfStatusType === "error" ? "text-red-700" : rotatePdfStatusType === "success" ? "text-teal-800" : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {rotatePdfStatus}
        </p>

        {rotatePdfResultBuffer && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={onDownloadRotatedPdf}
              disabled={isRotatePdfBusy || isBusy}
            >
              Download PDF
            </button>
            {rotatePdfResultName && (
              <div className="text-sm font-bold text-slate-500">{rotatePdfResultName}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Split PDF ───────────────────────────────────────────── */}
      <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">PDF Utilities</p>
            <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">Split PDF</h3>
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
                <label className="text-sm font-bold text-slate-700">How many PDFs to generate?</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={splitNumOutputs}
                  onChange={(e) => onSplitNumOutputsChange(Number(e.target.value))}
                  disabled={isSplitPdfBusy || isBusy}
                  className="h-9 w-20 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
                />
                <span className="text-xs text-slate-400">(max 20)</span>
              </div>

              {splitRanges.map((range, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm font-bold text-slate-600">PDF {i + 1}</span>
                  <input
                    type="text"
                    placeholder={`e.g. ${i * 2 + 1}-${i * 2 + 2}`}
                    value={range}
                    onChange={(e) => onSplitRangeChange(i, e.target.value)}
                    disabled={isSplitPdfBusy || isBusy}
                    className="h-9 w-48 rounded-lg border border-slate-300 px-3 text-sm text-slate-800 focus:border-teal-600 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">pages: 1-3, 5, 7-9</span>
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
                {splitNumOutputs === 1 ? "Downloads a single PDF" : `Downloads a ZIP of ${splitNumOutputs} PDFs`}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Page reference ({splitPdfPreviews.length} total):
            </p>
            <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
              {splitPdfPreviews.map((previewSrc, index) => (
                <div key={index + 1} className="grid gap-1 rounded-lg border border-slate-200 bg-white p-2">
                  <span className="text-xs font-bold text-slate-500">Page {index + 1}</span>
                  <img src={previewSrc} alt={`Page ${index + 1}`} loading="lazy" className="h-auto w-full rounded border border-slate-100 bg-slate-50" />
                </div>
              ))}
            </div>
          </>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            splitPdfStatusType === "error" ? "text-red-700" : splitPdfStatusType === "success" ? "text-teal-800" : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {splitPdfStatus}
        </p>
      </div>
    </section>
  );
}
