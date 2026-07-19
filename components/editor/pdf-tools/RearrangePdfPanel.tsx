import { useState } from "react";
import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";
import type { RearrangePage } from "@/hooks/useRearrangePdfTool";

type Props = {
  rearrangePdfName: string;
  rearrangePdfBuffer: ArrayBuffer | null;
  rearrangePages: RearrangePage[];
  rearrangePdfResultBuffer: ArrayBuffer | null;
  rearrangePdfResultName: string;
  rearrangePdfStatus: string;
  rearrangePdfStatusType: StatusType;
  isRearrangePdfBusy: boolean;
  isBusy: boolean;
  onUploadRearrangePdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearRearrangePdf: () => void;
  onMoveRearrangePage: (fromIndex: number, toIndex: number) => void;
  onDeleteRearrangePage: (index: number) => void;
  onRotateRearrangePage: (index: number, direction: "cw" | "ccw") => void;
  onSwapRearrangePages: (a: number, b: number) => void;
  onSortRearrangePages: (direction: "asc" | "desc") => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onApplyRearrange: () => void;
  onDownloadRearrangedPdf: () => void;
};

export function RearrangePdfPanel({
  rearrangePdfName,
  rearrangePdfBuffer,
  rearrangePages,
  rearrangePdfResultBuffer,
  rearrangePdfResultName: _rearrangePdfResultName,
  rearrangePdfStatus,
  rearrangePdfStatusType,
  isRearrangePdfBusy,
  isBusy,
  onUploadRearrangePdf,
  onClearRearrangePdf,
  onMoveRearrangePage,
  onDeleteRearrangePage,
  onRotateRearrangePage,
  onSwapRearrangePages,
  onSortRearrangePages,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onApplyRearrange,
  onDownloadRearrangedPdf,
}: Props) {
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [swapSrc, setSwapSrc] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  return (
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
          <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Rearrange PDF Pages
          </h3>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-fuchsia-100 bg-fuchsia-50 px-3 py-1 text-sm font-bold text-fuchsia-700">
          Rearrange
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onUploadRearrangePdf}
            disabled={isRearrangePdfBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload PDF
        </label>

        {rearrangePdfBuffer && (
          <>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
              onClick={onApplyRearrange}
              disabled={isRearrangePdfBusy || isBusy || rearrangePages.length === 0}
            >
              Apply &amp; Download
            </button>
            {/* Undo / Redo */}
            <button
              type="button"
              title="Undo"
              aria-label="Undo last action"
              onClick={onUndo}
              disabled={!canUndo || isRearrangePdfBusy || isBusy}
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
              Undo
            </button>
            <button
              type="button"
              title="Redo"
              aria-label="Redo last action"
              onClick={onRedo}
              disabled={!canRedo || isRearrangePdfBusy || isBusy}
              className="flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
              Redo
            </button>
            {rearrangePdfResultBuffer && (
              <button
                type="button"
                className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800 transition hover:bg-teal-50 disabled:opacity-50"
                onClick={onDownloadRearrangedPdf}
                disabled={isRearrangePdfBusy || isBusy}
              >
                Download PDF
              </button>
            )}
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
              onClick={onClearRearrangePdf}
              disabled={isRearrangePdfBusy || isBusy}
            >
              Clear
            </button>
            {/* Sort toggle button */}
            {rearrangePages.length > 1 && (
              <button
                type="button"
                title={sortAsc ? `Sort pages 1 to ${rearrangePages.length}` : `Sort pages ${rearrangePages.length} to 1`}
                onClick={() => {
                  onSortRearrangePages(sortAsc ? "desc" : "asc");
                  setSortAsc((v) => !v);
                }}
                disabled={isRearrangePdfBusy || isBusy}
                className="ml-auto min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-30"
              >
                {sortAsc ? `1 → ${rearrangePages.length}` : `${rearrangePages.length} → 1`}
              </button>
            )}
          </>
        )}

        {rearrangePdfName && (
          <div className="w-full text-sm font-bold text-slate-500">
            {rearrangePdfName}
          </div>
        )}
      </div>

      {rearrangePdfStatus && (
        <p
          className={`mt-3 text-sm font-bold ${
            rearrangePdfStatusType === "error"
              ? "text-red-700"
              : rearrangePdfStatusType === "success"
                ? "text-teal-800"
                : "text-slate-500"
          }`}
          role="status"
        >
          {rearrangePdfStatus}
        </p>
      )}

      {rearrangePages.length > 0 && (
        <>
          <div
            className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
            role="list"
            aria-label="PDF pages to rearrange"
          >
            {rearrangePages.map((page, index) => (
              <div
                key={`${page.originalIndex}-${index}`}
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
                    onMoveRearrangePage(dragSrc, index);
                  }
                  setDragSrc(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragSrc(null);
                  setDragOver(null);
                }}
                onDragLeave={() => setDragOver(null)}
                onClick={
                  swapSrc !== null && swapSrc !== index
                    ? () => {
                        onSwapRearrangePages(swapSrc, index);
                        setSwapSrc(null);
                      }
                    : undefined
                }
                role="listitem"
                className={`group/card relative flex h-full cursor-grab select-none flex-col rounded-lg border-2 bg-white p-2 active:cursor-grabbing ${
                  swapSrc === index
                    ? "border-amber-400 bg-amber-50"
                    : swapSrc !== null
                      ? "cursor-pointer border-amber-200 hover:border-amber-400"
                      : dragSrc === index
                        ? "border-slate-300 opacity-40"
                        : dragOver === index
                          ? "border-fuchsia-500 bg-fuchsia-50"
                          : "border-slate-200"
                }`}
              >
                {/* Delete button — top-right corner of card */}
                <button
                  type="button"
                  title="Delete page"
                  aria-label="Delete page"
                  disabled={isRearrangePdfBusy || isBusy}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRearrangePage(index);
                  }}
                  className="absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 group-hover/card:opacity-100 disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Thumbnail + overlay controls */}
                <div className="group relative flex-1 overflow-hidden rounded">
                  <div
                    className="flex items-center justify-center"
                    style={{ minHeight: "100px" }}
                  >
                    <img
                      src={page.previewSrc}
                      alt={`Page ${index + 1}`}
                      loading="lazy"
                      className="h-auto w-full rounded border border-slate-100 bg-slate-50 transition-transform duration-200"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                  </div>

                  {/* Page number badge */}
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                    {index + 1}
                  </span>

                  {/* Hover overlay: rotate only */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 rounded bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                    {/* Rotate CCW */}
                    <button
                      type="button"
                      title="Rotate counter-clockwise"
                      aria-label="Rotate page counter-clockwise"
                      disabled={isRearrangePdfBusy || isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotateRearrangePage(index, "ccw");
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white hover:text-fuchsia-700 disabled:opacity-40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 2v6h6" />
                        <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                      </svg>
                    </button>

                    {/* Rotate CW */}
                    <button
                      type="button"
                      title="Rotate clockwise"
                      aria-label="Rotate page clockwise"
                      disabled={isRearrangePdfBusy || isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotateRearrangePage(index, "cw");
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white hover:text-fuchsia-700 disabled:opacity-40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2v6h-6" />
                        <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
                      </svg>
                    </button>

                  </div>
                </div>

                {/* Bottom row: orig label + left/right arrows */}
                <div className="mt-auto pt-1.5 flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold text-slate-500">
                    orig&nbsp;{page.originalIndex + 1}
                    {page.rotation !== 0 && (
                      <span className="ml-1 text-fuchsia-600">{page.rotation}°</span>
                    )}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Move left"
                      aria-label="Move page left"
                      disabled={index === 0 || isRearrangePdfBusy || isBusy}
                      onClick={() => onMoveRearrangePage(index, index - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:border-fuchsia-400 hover:text-fuchsia-700 disabled:opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Move right"
                      aria-label="Move page right"
                      disabled={index === rearrangePages.length - 1 || isRearrangePdfBusy || isBusy}
                      onClick={() => onMoveRearrangePage(index, index + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:border-fuchsia-400 hover:text-fuchsia-700 disabled:opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    {/* Swap button */}
                    <button
                      type="button"
                      title={swapSrc === index ? "Cancel swap" : swapSrc !== null ? `Swap with page ${swapSrc + 1}` : "Swap with another page"}
                      aria-label="Swap page"
                      disabled={isRearrangePdfBusy || isBusy}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (swapSrc === index) {
                          setSwapSrc(null);
                        } else if (swapSrc !== null) {
                          onSwapRearrangePages(swapSrc, index);
                          setSwapSrc(null);
                        } else {
                          setSwapSrc(index);
                        }
                      }}
                      className={`flex h-7 items-center justify-center rounded border px-1.5 text-xs font-bold text-slate-500 transition disabled:opacity-30 ${
                        swapSrc === index
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-slate-200 hover:border-amber-400 hover:text-amber-600"
                      }`}
                    >
                      Swap
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

