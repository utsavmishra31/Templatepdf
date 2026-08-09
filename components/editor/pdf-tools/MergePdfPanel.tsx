import { useState } from "react";
import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  mergePdfFiles: Array<{
    name: string;
    firstPageSrc: string;
    pageCount: number;
  }>;
  mergePdfResultBuffer: ArrayBuffer | null;
  mergePdfResultName: string;
  mergePdfStatus: string;
  mergePdfStatusType: StatusType;
  isMergePdfBusy: boolean;
  isAddingFiles: boolean;
  isBusy: boolean;
  onAddMergePdfFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveMergePdfFile: (index: number) => void;
  onMoveMergePdfFile: (fromIndex: number, toIndex: number) => void;
  onMergePdfs: () => void;
  onClearMergePdf: () => void;
  onDownloadMergedPdf: () => void;
};

export function MergePdfPanel({
  mergePdfFiles,
  mergePdfResultBuffer,
  mergePdfResultName,
  mergePdfStatus,
  mergePdfStatusType,
  isMergePdfBusy,
  isAddingFiles,
  isBusy,
  onAddMergePdfFiles,
  onRemoveMergePdfFile,
  onMoveMergePdfFile,
  onMergePdfs,
  onClearMergePdf,
  onDownloadMergedPdf,
}: Props) {
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <section className="md:-mt-8" aria-labelledby="mergePdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="PDF files to merge"
        >
          {mergePdfFiles.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-slate-400">Drag cards to reorder</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {mergePdfFiles.map((file, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDragSrc(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOver(index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragSrc !== null && dragSrc !== index) {
                        onMoveMergePdfFile(dragSrc, index);
                      }
                      setDragSrc(null);
                      setDragOver(null);
                    }}
                    onDragEnd={() => {
                      setDragSrc(null);
                      setDragOver(null);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    className={`cursor-grab select-none rounded-lg border-2 bg-white p-2 active:cursor-grabbing ${
                      dragSrc === index
                        ? "border-slate-300 opacity-40"
                        : dragOver === index
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200"
                    }`}
                    role="listitem"
                  >
                    <div className="relative">
                      {file.firstPageSrc ? (
                        <img
                          src={file.firstPageSrc}
                          alt={`Page 1 of ${file.name}`}
                          className="h-auto w-full rounded border border-slate-100 bg-slate-50"
                        />
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                          No preview
                        </div>
                      )}
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        aria-label="Remove"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-xs text-white hover:bg-red-500 disabled:opacity-40"
                        onClick={() => onRemoveMergePdfFile(index)}
                        disabled={isMergePdfBusy || isAddingFiles || isBusy}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1.5">
                      <div className="truncate text-xs font-bold text-slate-800" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {file.pageCount} page(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Add PDF files to preview them here.
            </div>
          )}
        </div>

        <div className="order-1 flex h-full min-h-[calc(100dvh-3.5rem)] flex-col rounded-none border-y-0 border-l border-r-0 border-slate-200 bg-white p-4 shadow-none md:sticky md:top-14 md:order-2 md:w-[360px] md:self-stretch md:justify-self-end">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h3
              id="mergePdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Merge PDFs
            </h3>
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
              <input
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={onAddMergePdfFiles}
                disabled={isMergePdfBusy || isAddingFiles || isBusy}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
              />
              Add PDFs
              {isAddingFiles && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </label>
            <div className="text-sm font-bold text-slate-500">
              {mergePdfFiles.length > 0
                ? `${mergePdfFiles.length} file(s) — ${mergePdfFiles.reduce((s, f) => s + f.pageCount, 0)} pages total`
                : "No files added"}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                mergePdfFiles.length >= 2
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onMergePdfs}
              disabled={isMergePdfBusy || isAddingFiles || isBusy || mergePdfFiles.length < 2}
            >
              Merge PDFs
              {isMergePdfBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                mergePdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadMergedPdf}
              disabled={isMergePdfBusy || isAddingFiles || isBusy || !mergePdfResultBuffer}
            >
              Download PDF
            </button>
            {mergePdfResultName && (
              <div className="text-sm font-bold text-slate-500">
                {mergePdfResultName}
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          mergePdfStatusType === "error"
            ? "text-red-700"
            : mergePdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {mergePdfStatus}
      </p>
    </section>
  );
}
