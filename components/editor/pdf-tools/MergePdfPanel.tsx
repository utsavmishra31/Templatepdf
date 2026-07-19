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
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
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
            {mergePdfFiles.length} file(s) —{" "}
            {mergePdfFiles.reduce((s, f) => s + f.pageCount, 0)} pages total
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
                    disabled={isMergePdfBusy || isBusy}
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-1.5">
                  <div
                    className="truncate text-xs font-bold text-slate-800"
                    title={file.name}
                  >
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
      )}

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
            <div className="text-sm font-bold text-slate-500">
              {mergePdfResultName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
