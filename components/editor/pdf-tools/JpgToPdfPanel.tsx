import { useEffect, useRef, useState } from "react";
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
  const [showAck, setShowAck] = useState(false);
  const prevResultBuffer = useRef<ArrayBuffer | null>(null);

  useEffect(() => {
    if (resultBuffer && resultBuffer !== prevResultBuffer.current) {
      setShowAck(true);
    }
    prevResultBuffer.current = resultBuffer;
  }, [resultBuffer]);

  useEffect(() => {
    setShowAck(false);
  }, [orientation, pageSize]);

  return (
    <section className="md:-mt-8" aria-labelledby="jpgToPdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        {/* Left: image cards */}
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="Images to convert"
        >
          {images.length > 0 ? (
            <>
              <p className="mb-3 text-xs text-slate-400">
                Drag cards to reorder — each image becomes one PDF page.
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      e.dataTransfer.setDragImage(
                        e.currentTarget as HTMLElement,
                        e.clientX - rect.left,
                        e.clientY - rect.top,
                      );
                      setDragSrc(index);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOver !== index) setDragOver(index);
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
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node))
                        setDragOver(null);
                    }}
                    className={`flex h-[220px] cursor-grab select-none flex-col rounded-lg border-2 bg-white p-2 transition-all duration-150 active:cursor-grabbing ${
                      dragSrc === index
                        ? "border-slate-300 opacity-30 scale-95"
                        : dragOver === index
                          ? "border-teal-500 bg-teal-50 scale-[1.02]"
                          : "border-slate-200"
                    }`}
                    role="listitem"
                  >
                    <div className="relative min-h-0 flex-1">
                      <PagePreview image={img} orientation={orientation} pageSize={pageSize} />
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
                      <div className="truncate text-xs font-bold text-slate-700" title={img.name}>
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
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Add images to preview them here.
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="order-1 flex h-full min-h-[calc(100dvh-3.5rem)] flex-col rounded-none border-y-0 border-l border-r-0 border-slate-200 bg-white p-4 shadow-none md:sticky md:top-14 md:order-2 md:w-[360px] md:self-stretch md:justify-self-end">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h3
              id="jpgToPdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Image to PDF
            </h3>
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
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
            <div className="text-sm font-bold text-slate-500">
              {images.length > 0 ? `${images.length} image(s)` : "No images added"}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
            {/* Orientation */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">Orientation</p>
              <div className="flex gap-2">
                {(["portrait", "landscape"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOrientationChange(o)}
                    disabled={isBusy || pageSize === "original"}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-sm font-semibold transition ${
                      orientation === o
                        ? "border-teal-600 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    } ${pageSize === "original" ? "opacity-40" : ""}`}
                  >
                    {o === "portrait" ? (
                      <svg width="12" height="15" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="13" height="17" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    ) : (
                      <svg width="15" height="12" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="17" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </button>
                ))}
              </div>
              {pageSize === "original" && (
                <p className="mt-1 text-xs text-slate-400">Fixed when using original size</p>
              )}
            </div>

            {/* Page size */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">Page Size</p>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(e.target.value as PageSize)}
                disabled={isBusy}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
              >
                <option value="a4-fit">Fit to A4</option>
                <option value="original">Original Size</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                images.length > 0
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onGeneratePdf}
              disabled={isBusy || images.length === 0}
            >
              {isBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Generate PDF
            </button>
            {showAck && (
              <p className="text-xs font-semibold text-teal-700">
                ✓ PDF generated successfully
              </p>
            )}
            <button
              type="button"
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                resultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownload}
              disabled={isBusy || !resultBuffer}
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

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
    </section>
  );
}
