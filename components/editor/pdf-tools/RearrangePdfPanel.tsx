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
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [swapSrc, setSwapSrc] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  function getTouchDropIndex(touch: { clientX: number; clientY: number }) {
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = elementUnderTouch?.closest<HTMLElement>("[data-rearrange-card-index]");
    if (!card) return null;

    const indexValue = card.dataset.rearrangeCardIndex;
    if (indexValue === undefined) return null;

    const parsedIndex = Number(indexValue);
    return Number.isInteger(parsedIndex) ? parsedIndex : null;
  }

  function resetDragState() {
    setDragSrc(null);
    setDragOver(null);
    setIsTouchDragging(false);
  }

  return (
    <section className="md:-mt-8" aria-labelledby="rearrangePdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        {/* Left: page cards */}
        <div
          className="order-2 px-1 pt-2 md:order-1 md:max-h-[calc(100dvh-3.5rem)] md:overflow-y-auto md:pt-4 md:pl-4 md:pr-2"
          role="list"
          aria-label="PDF pages to rearrange"
        >
          {rearrangePages.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-slate-400">Drag cards to reorder. Hover for rotate. Use Swap for exact swaps.</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
                {rearrangePages.map((page, index) => (
                  <div
                    key={`${page.originalIndex}-${index}`}
                    data-rearrange-card-index={index}
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
                    onTouchStart={() => {
                      if (isRearrangePdfBusy || isBusy) return;
                      setSwapSrc(null);
                      setDragSrc(index);
                      setDragOver(index);
                      setIsTouchDragging(true);
                    }}
                    onTouchMove={(event) => {
                      if (!isTouchDragging || dragSrc === null) return;
                      event.preventDefault();
                      const touchPoint = {
                        clientX: event.touches[0].clientX,
                        clientY: event.touches[0].clientY,
                      };
                      const nextDropIndex = getTouchDropIndex(touchPoint);
                      if (nextDropIndex !== null && nextDropIndex !== dragOver) {
                        setDragOver(nextDropIndex);
                      }
                    }}
                    onTouchEnd={() => {
                      if (
                        isTouchDragging &&
                        dragSrc !== null &&
                        dragOver !== null &&
                        dragSrc !== dragOver
                      ) {
                        onMoveRearrangePage(dragSrc, dragOver);
                      }
                      resetDragState();
                    }}
                    onTouchCancel={resetDragState}
                    onClick={
                      swapSrc !== null && swapSrc !== index
                        ? () => {
                            onSwapRearrangePages(swapSrc, index);
                            setSwapSrc(null);
                          }
                        : undefined
                    }
                    role="listitem"
                    className={`group/card relative flex h-full touch-none cursor-grab select-none flex-col rounded-lg border-2 bg-white p-2 active:cursor-grabbing ${
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

                    <div className="group relative flex-1 overflow-hidden rounded">
                      <div className="flex items-center justify-center" style={{ minHeight: "100px" }}>
                        {page.previewSrc ? (
                          <img
                            src={page.previewSrc}
                            alt={`Page ${index + 1}`}
                            loading="lazy"
                            className="h-auto w-full rounded border border-slate-100 bg-slate-50 transition-transform duration-200"
                            style={{ transform: `rotate(${page.rotation}deg)` }}
                          />
                        ) : (
                          <div className="min-h-[180px] w-full rounded border border-slate-100 bg-slate-100 animate-pulse" />
                        )}
                      </div>
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 rounded bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                        <button
                          type="button"
                          title="Rotate counter-clockwise"
                          aria-label="Rotate page counter-clockwise"
                          disabled={isRearrangePdfBusy || isBusy}
                          onClick={(e) => { e.stopPropagation(); onRotateRearrangePage(index, "ccw"); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white hover:text-fuchsia-700 disabled:opacity-40"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 2v6h6" />
                            <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Rotate clockwise"
                          aria-label="Rotate page clockwise"
                          disabled={isRearrangePdfBusy || isBusy}
                          onClick={(e) => { e.stopPropagation(); onRotateRearrangePage(index, "cw"); }}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white hover:text-fuchsia-700 disabled:opacity-40"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2v6h-6" />
                            <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto pt-1.5 flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-semibold text-slate-500">
                        orig {page.originalIndex + 1}
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
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a PDF file to preview pages on the left.
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="order-1 flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-14 md:order-2 md:h-full md:min-h-[calc(100dvh-3.5rem)] md:w-[360px] md:self-stretch md:justify-self-end md:rounded-none md:border-y-0 md:border-l md:border-r-0 md:p-4 md:shadow-none">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h3
              id="rearrangePdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Rearrange Pages
            </h3>
          </div>

          {!rearrangePdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-10 md:min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadRearrangePdf}
                  disabled={isRearrangePdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {rearrangePdfName
                ? `${rearrangePdfName} • ${rearrangePages.length} page(s)`
                : "No PDF uploaded"}
            </div>
          </div>

          {rearrangePdfBuffer && (
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
              {/* Undo / Redo */}
              <div className="flex gap-2">
                <button
                  type="button"
                  title="Undo"
                  aria-label="Undo last action"
                  onClick={onUndo}
                  disabled={!canUndo || isRearrangePdfBusy || isBusy}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-30"
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
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                  </svg>
                  Redo
                </button>
              </div>
              {/* Sort */}
              {rearrangePages.length > 1 && (
                <button
                  type="button"
                  title={sortAsc ? `Sort pages 1 to ${rearrangePages.length}` : `Sort pages ${rearrangePages.length} to 1`}
                  onClick={() => {
                    onSortRearrangePages(sortAsc ? "desc" : "asc");
                    setSortAsc((v) => !v);
                  }}
                  disabled={isRearrangePdfBusy || isBusy}
                  className="rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:opacity-30"
                >
                  Sort: {sortAsc ? `1 → ${rearrangePages.length}` : `${rearrangePages.length} → 1`}
                </button>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-10 md:min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                rearrangePages.length > 0
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onApplyRearrange}
              disabled={isRearrangePdfBusy || isBusy || rearrangePages.length === 0}
            >
              {isRearrangePdfBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Apply &amp; Download
            </button>
            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                rearrangePdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadRearrangedPdf}
              disabled={isRearrangePdfBusy || isBusy || !rearrangePdfResultBuffer}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {rearrangePdfStatus && (
        <p
          className={`mt-4 min-h-6 font-bold ${
            rearrangePdfStatusType === "error"
              ? "text-red-700"
              : rearrangePdfStatusType === "success"
                ? "text-teal-800"
                : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {rearrangePdfStatus}
        </p>
      )}
    </section>
  );
}

