import { useState } from "react";
import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";
import type { ImageEntry, Orientation, PageSize } from "@/hooks/useJpgToPdfTool";

// ---------------------------------------------------------------------------
// Mini page-layout preview — JS pixel math avoids CSS aspect-ratio conflicts
// ---------------------------------------------------------------------------
const A4_W = 595.28;
const A4_H = 841.89;

// Max dimensions available inside a card (h-[220px], p-2, minus bottom text)
const MAX_PREV_W = 120;
const MAX_PREV_H = 148;

function PagePreview({
  image,
  orientation,
  pageSize,
}: {
  image: ImageEntry;
  orientation: Orientation;
  pageSize: PageSize;
}) {
  const pageW =
    pageSize === "original"
      ? image.width
      : orientation === "portrait"
        ? A4_W
        : A4_H;
  const pageH =
    pageSize === "original"
      ? image.height
      : orientation === "portrait"
        ? A4_H
        : A4_W;

  const scale = Math.min(MAX_PREV_W / pageW, MAX_PREV_H / pageH);
  const dispW = Math.round(pageW * scale);
  const dispH = Math.round(pageH * scale);

  return (
    <div className="flex h-full w-full flex-col items-center gap-1.5">
      {/* Centred page rect with exact A4 or original proportions */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className={`relative overflow-hidden shadow-sm ${
            pageSize === "original"
              ? "border-0"           /* no page border — page IS the image */
              : "border border-slate-300 bg-slate-50" /* A4 sheet outline */
          }`}
          style={{ width: dispW, height: dispH }}
        >
          <img
            src={image.src}
            alt="Preview"
            className="h-full w-full"
            style={{
              objectFit: pageSize === "a4-fit" ? "contain" : "fill",
            }}
          />
        </div>
      </div>
      <p className="text-xs text-slate-400">
        {pageSize === "original"
          ? `${image.width} × ${image.height} px`
          : orientation === "portrait"
            ? "A4 Portrait"
            : "A4 Landscape"}
      </p>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
type Props = {
  images: ImageEntry[];
  orientation: Orientation;
  pageSize: PageSize;
  resultBuffer: ArrayBuffer | null;
  status: string;
  statusType: StatusType;
  isBusy: boolean;
  onOrientationChange: (v: Orientation) => void;
  onPageSizeChange: (v: PageSize) => void;
  onAddImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onMoveImage: (fromIndex: number, toIndex: number) => void;
  onClearAll: () => void;
  onGeneratePdf: () => void;
  onDownload: () => void;
};

export function JpgToPdfPanel({
  images,
  orientation,
  pageSize,
  resultBuffer,
  status,
  statusType,
  isBusy,
  onOrientationChange,
  onPageSizeChange,
  onAddImages,
  onRemoveImage,
  onMoveImage,
  onClearAll,
  onGeneratePdf,
  onDownload,
}: Props) {
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <div>
      {/* ── Options ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        {/* Orientation */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            Orientation
          </p>
          <div className="flex items-center gap-4">
            {(["portrait", "landscape"] as const).map((o) => (
              <label
                key={o}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition select-none ${
                  orientation === o
                    ? "border-teal-600 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                } ${pageSize === "original" ? "opacity-40 pointer-events-none" : ""}`}
              >
                <input
                  type="radio"
                  name="orientation"
                  value={o}
                  checked={orientation === o}
                  onChange={() => onOrientationChange(o)}
                  disabled={isBusy || pageSize === "original"}
                  className="accent-teal-700"
                />
                {/* Mini page icon */}
                {o === "portrait" ? (
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="13" height="17" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ) : (
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="0.5" y="0.5" width="17" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </label>
            ))}
          </div>
          {pageSize === "original" && (
            <p className="mt-1.5 text-xs text-slate-400">
              Orientation is fixed when using original size
            </p>
          )}
        </div>

        {/* Page size */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            Page Size
          </p>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(e.target.value as PageSize)}
            disabled={isBusy}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
          >
            <option value="a4-fit">Fit to A4</option>
            <option value="original">Original Size</option>
          </select>
        </div>

      </div>

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
            multiple
            onChange={onAddImages}
            disabled={isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Add Images
        </label>

        <button
          type="button"
          className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
          onClick={onGeneratePdf}
          disabled={isBusy || images.length === 0}
        >
          Generate PDF
        </button>

        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600 disabled:opacity-50"
          onClick={onClearAll}
          disabled={isBusy || images.length === 0}
        >
          Clear All
        </button>

        {images.length > 0 && (
          <span className="text-sm font-bold text-slate-500">
            {images.length} image(s)
          </span>
        )}
      </div>

      {/* ── Image grid ───────────────────────────────────────────── */}
      {images.length > 0 && (
        <>
          <p className="mt-4 text-xs text-slate-400">
            Drag cards to reorder — each image becomes one PDF page.
          </p>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {images.map((img, index) => (
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
                  if (dragSrc !== null && dragSrc !== index)
                    onMoveImage(dragSrc, index);
                  setDragSrc(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragSrc(null);
                  setDragOver(null);
                }}
                onDragLeave={() => setDragOver(null)}
                className={`flex h-[220px] cursor-grab select-none flex-col rounded-lg border-2 bg-white p-2 active:cursor-grabbing ${
                  dragSrc === index
                    ? "border-slate-300 opacity-40"
                    : dragOver === index
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200"
                }`}
              >
                <div className="relative min-h-0 flex-1">
                  <PagePreview
                    image={img}
                    orientation={orientation}
                    pageSize={pageSize}
                  />
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-xs text-white hover:bg-red-500 disabled:opacity-40"
                    onClick={() => onRemoveImage(index)}
                    disabled={isBusy}
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-auto pt-1.5">
                  <div
                    className="truncate text-xs font-bold text-slate-700"
                    title={img.name}
                  >
                    {img.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {img.width} × {img.height}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Status ───────────────────────────────────────────────── */}
      <p
        className={`mt-4 min-h-6 font-bold ${
          statusType === "error"
            ? "text-red-700"
            : statusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {status}
      </p>

      {/* ── Download ─────────────────────────────────────────────── */}
      {resultBuffer && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
            onClick={onDownload}
            disabled={isBusy}
          >
            Download PDF
          </button>
          <span className="text-sm font-bold text-slate-500">images.pdf</span>
        </div>
      )}
    </div>
  );
}
