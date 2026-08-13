import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { StatusType } from "@/types/editor";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type DragMode =
  | { type: "draw"; start: { x: number; y: number } }
  | { type: "move"; start: { x: number; y: number }; startRect: CropRect }
  | {
      type: "resize";
      handle: ResizeHandle;
      start: { x: number; y: number };
      startRect: CropRect;
    };

const MIN_RECT_PERCENT = 2;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function normalizeRect(next: CropRect): CropRect {
  const x = clampPercent(next.x);
  const y = clampPercent(next.y);
  const width = clampPercent(next.width);
  const height = clampPercent(next.height);

  return {
    x,
    y,
    width: Math.max(MIN_RECT_PERCENT, Math.min(width, 100 - x)),
    height: Math.max(MIN_RECT_PERCENT, Math.min(height, 100 - y)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRectFromEdges(left: number, top: number, right: number, bottom: number): CropRect {
  let x = clamp(left, 0, 100 - MIN_RECT_PERCENT);
  let y = clamp(top, 0, 100 - MIN_RECT_PERCENT);
  let r = clamp(right, x + MIN_RECT_PERCENT, 100);
  let b = clamp(bottom, y + MIN_RECT_PERCENT, 100);

  // Re-clamp starts in case the end edges forced changes.
  x = clamp(x, 0, r - MIN_RECT_PERCENT);
  y = clamp(y, 0, b - MIN_RECT_PERCENT);

  return {
    x,
    y,
    width: r - x,
    height: b - y,
  };
}

type Props = {
  cropPdfName: string;
  cropPdfBuffer: ArrayBuffer | null;
  cropPdfPreviews: string[];
  cropPageSettings: CropRect[];
  selectedCropPage: number;
  selectedPageRect: CropRect;
  cropPdfResultBuffer: ArrayBuffer | null;
  cropPdfResultName: string;
  cropPdfStatus: string;
  cropPdfStatusType: StatusType;
  isCropPdfBusy: boolean;
  isBusy: boolean;
  onUploadCropPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectCropPage: (pageNumber: number) => void;
  onSetSelectedPageCropRect: (nextRect: CropRect) => void;
  onResetSelectedPageCrop: () => void;
  onCopySelectedCropToAllPages: () => void;
  onApplyCrops: () => void;
  onDownloadCroppedPdf: () => void;
};

export function CropPdfPanel({
  cropPdfName,
  cropPdfBuffer,
  cropPdfPreviews,
  cropPageSettings,
  selectedCropPage,
  selectedPageRect,
  cropPdfResultBuffer,
  cropPdfResultName,
  cropPdfStatus,
  cropPdfStatusType,
  isCropPdfBusy,
  isBusy,
  onUploadCropPdf,
  onSelectCropPage,
  onSetSelectedPageCropRect,
  onResetSelectedPageCrop,
  onCopySelectedCropToAllPages,
  onApplyCrops,
  onDownloadCroppedPdf,
}: Props) {
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [draftRect, setDraftRect] = useState<CropRect | null>(null);

  useEffect(() => {
    if (!dragMode) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [dragMode]);

  const hasAnyCrop = cropPageSettings.some(
    (settings) => settings.x > 0 || settings.y > 0 || settings.width < 100 || settings.height < 100,
  );
  const useHorizontalPagePickerOnMobile = cropPdfPreviews.length > 2;

  const selectedPreview = useMemo(() => {
    if (selectedCropPage < 1) return "";
    return cropPdfPreviews[selectedCropPage - 1] ?? "";
  }, [cropPdfPreviews, selectedCropPage]);

  const shownRect = draftRect ?? selectedPageRect;

  function getPercentPointFromClient(
    clientX: number,
    clientY: number,
    container: HTMLDivElement,
  ): { x: number; y: number } {
    const bounds = container.getBoundingClientRect();
    const x = ((clientX - bounds.left) / bounds.width) * 100;
    const y = ((clientY - bounds.top) / bounds.height) * 100;
    return {
      x: clampPercent(x),
      y: clampPercent(y),
    };
  }

  function getPercentPoint(event: ReactMouseEvent, container: HTMLDivElement): { x: number; y: number } {
    return getPercentPointFromClient(event.clientX, event.clientY, container);
  }

  function getTouchPoint(event: ReactTouchEvent<HTMLDivElement>): { x: number; y: number } | null {
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return null;
    return getPercentPointFromClient(touch.clientX, touch.clientY, event.currentTarget);
  }

  function handleCropMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (isCropPdfBusy || isBusy) return;
    if (event.button !== 0) return;
    const point = getPercentPoint(event, event.currentTarget);
    setDragMode({ type: "draw", start: point });
    setDraftRect({ x: point.x, y: point.y, width: MIN_RECT_PERCENT, height: MIN_RECT_PERCENT });
  }

  function handleCropTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (isCropPdfBusy || isBusy) return;
    const point = getTouchPoint(event);
    if (!point) return;
    event.preventDefault();
    setDragMode({ type: "draw", start: point });
    setDraftRect({ x: point.x, y: point.y, width: MIN_RECT_PERCENT, height: MIN_RECT_PERCENT });
  }

  function handleCropMouseMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragMode) return;
    const point = getPercentPoint(event, event.currentTarget);

    if (dragMode.type === "draw") {
      const next = normalizeRect({
        x: Math.min(dragMode.start.x, point.x),
        y: Math.min(dragMode.start.y, point.y),
        width: Math.abs(point.x - dragMode.start.x),
        height: Math.abs(point.y - dragMode.start.y),
      });
      setDraftRect(next);
      return;
    }

    if (dragMode.type === "move") {
      const dx = point.x - dragMode.start.x;
      const dy = point.y - dragMode.start.y;
      const nextX = clamp(dragMode.startRect.x + dx, 0, 100 - dragMode.startRect.width);
      const nextY = clamp(dragMode.startRect.y + dy, 0, 100 - dragMode.startRect.height);
      setDraftRect({
        x: nextX,
        y: nextY,
        width: dragMode.startRect.width,
        height: dragMode.startRect.height,
      });
      return;
    }

    const dx = point.x - dragMode.start.x;
    const dy = point.y - dragMode.start.y;
    let left = dragMode.startRect.x;
    let top = dragMode.startRect.y;
    let right = dragMode.startRect.x + dragMode.startRect.width;
    let bottom = dragMode.startRect.y + dragMode.startRect.height;

    if (dragMode.handle.includes("w")) left += dx;
    if (dragMode.handle.includes("e")) right += dx;
    if (dragMode.handle.includes("n")) top += dy;
    if (dragMode.handle.includes("s")) bottom += dy;

    setDraftRect(getRectFromEdges(left, top, right, bottom));
  }

  function handleCropTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (!dragMode) return;
    const point = getTouchPoint(event);
    if (!point) return;
    event.preventDefault();

    if (dragMode.type === "draw") {
      const next = normalizeRect({
        x: Math.min(dragMode.start.x, point.x),
        y: Math.min(dragMode.start.y, point.y),
        width: Math.abs(point.x - dragMode.start.x),
        height: Math.abs(point.y - dragMode.start.y),
      });
      setDraftRect(next);
      return;
    }

    if (dragMode.type === "move") {
      const dx = point.x - dragMode.start.x;
      const dy = point.y - dragMode.start.y;
      const nextX = clamp(dragMode.startRect.x + dx, 0, 100 - dragMode.startRect.width);
      const nextY = clamp(dragMode.startRect.y + dy, 0, 100 - dragMode.startRect.height);
      setDraftRect({
        x: nextX,
        y: nextY,
        width: dragMode.startRect.width,
        height: dragMode.startRect.height,
      });
      return;
    }

    const dx = point.x - dragMode.start.x;
    const dy = point.y - dragMode.start.y;
    let left = dragMode.startRect.x;
    let top = dragMode.startRect.y;
    let right = dragMode.startRect.x + dragMode.startRect.width;
    let bottom = dragMode.startRect.y + dragMode.startRect.height;

    if (dragMode.handle.includes("w")) left += dx;
    if (dragMode.handle.includes("e")) right += dx;
    if (dragMode.handle.includes("n")) top += dy;
    if (dragMode.handle.includes("s")) bottom += dy;

    setDraftRect(getRectFromEdges(left, top, right, bottom));
  }

  function handleCropMouseUp() {
    if (draftRect) {
      onSetSelectedPageCropRect(draftRect);
    }
    setDragMode(null);
    setDraftRect(null);
  }

  function handleCropTouchEnd() {
    handleCropMouseUp();
  }

  function handleMoveBoxMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (isCropPdfBusy || isBusy) return;
    event.preventDefault();
    event.stopPropagation();
    const container = event.currentTarget.parentElement?.parentElement as HTMLDivElement;
    const point = getPercentPoint(event, container);
    setDragMode({ type: "move", start: point, startRect: shownRect });
    setDraftRect(shownRect);
  }

  function handleMoveBoxTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (isCropPdfBusy || isBusy) return;
    event.preventDefault();
    event.stopPropagation();
    const container = event.currentTarget.parentElement?.parentElement as HTMLDivElement;
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return;
    const point = getPercentPointFromClient(touch.clientX, touch.clientY, container);
    setDragMode({ type: "move", start: point, startRect: shownRect });
    setDraftRect(shownRect);
  }

  function handleResizeMouseDown(handle: ResizeHandle, event: ReactMouseEvent<HTMLDivElement>) {
    if (isCropPdfBusy || isBusy) return;
    event.preventDefault();
    event.stopPropagation();
    const container = event.currentTarget.parentElement?.parentElement as HTMLDivElement;
    const point = getPercentPoint(event, container);
    setDragMode({ type: "resize", handle, start: point, startRect: shownRect });
    setDraftRect(shownRect);
  }

  function handleResizeTouchStart(handle: ResizeHandle, event: ReactTouchEvent<HTMLDivElement>) {
    if (isCropPdfBusy || isBusy) return;
    event.preventDefault();
    event.stopPropagation();
    const container = event.currentTarget.parentElement?.parentElement as HTMLDivElement;
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) return;
    const point = getPercentPointFromClient(touch.clientX, touch.clientY, container);
    setDragMode({ type: "resize", handle, start: point, startRect: shownRect });
    setDraftRect(shownRect);
  }

  return (
    <section className="md:-mt-8" aria-labelledby="cropPdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 px-1 pt-2 md:order-1 md:max-h-[calc(100dvh-3.5rem)] md:overflow-y-auto md:pt-4 md:pl-4 md:pr-2"
          role="list"
          aria-label="PDF pages to crop"
        >
          {cropPdfPreviews.length > 0 ? (
            <div className="grid gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  Drag on page {selectedCropPage} to create crop. Drag inside box to move. Drag handles to resize.
                </p>
                <div
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                  onTouchStart={handleCropTouchStart}
                  onTouchMove={handleCropTouchMove}
                  onTouchEnd={handleCropTouchEnd}
                  onTouchCancel={handleCropTouchEnd}
                  className="relative mx-auto w-full max-w-[760px] touch-none cursor-crosshair select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  {selectedPreview ? (
                    <img
                      src={selectedPreview}
                      alt={`Selected page ${selectedCropPage}`}
                      className="h-auto w-full"
                      draggable={false}
                    />
                  ) : (
                    <div className="min-h-[320px] w-full animate-pulse bg-slate-100" />
                  )}
                  <div
                    className="absolute border-2 border-teal-600 bg-teal-500/15"
                    style={{
                      left: `${shownRect.x}%`,
                      top: `${shownRect.y}%`,
                      width: `${shownRect.width}%`,
                      height: `${shownRect.height}%`,
                    }}
                  >
                    <div
                      onMouseDown={handleMoveBoxMouseDown}
                      onTouchStart={handleMoveBoxTouchStart}
                      className="h-full w-full touch-none cursor-move"
                    />

                    <div className="absolute -left-1.5 -top-1.5 h-3 w-3 touch-none cursor-nwse-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("nw", event)} onTouchStart={(event) => handleResizeTouchStart("nw", event)} />
                    <div className="absolute left-1/2 -top-1.5 h-3 w-3 -translate-x-1/2 touch-none cursor-ns-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("n", event)} onTouchStart={(event) => handleResizeTouchStart("n", event)} />
                    <div className="absolute -right-1.5 -top-1.5 h-3 w-3 touch-none cursor-nesw-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("ne", event)} onTouchStart={(event) => handleResizeTouchStart("ne", event)} />
                    <div className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 touch-none cursor-ew-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("e", event)} onTouchStart={(event) => handleResizeTouchStart("e", event)} />
                    <div className="absolute -right-1.5 -bottom-1.5 h-3 w-3 touch-none cursor-nwse-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("se", event)} onTouchStart={(event) => handleResizeTouchStart("se", event)} />
                    <div className="absolute left-1/2 -bottom-1.5 h-3 w-3 -translate-x-1/2 touch-none cursor-ns-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("s", event)} onTouchStart={(event) => handleResizeTouchStart("s", event)} />
                    <div className="absolute -left-1.5 -bottom-1.5 h-3 w-3 touch-none cursor-nesw-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("sw", event)} onTouchStart={(event) => handleResizeTouchStart("sw", event)} />
                    <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 touch-none cursor-ew-resize rounded-full border border-teal-700 bg-white" onMouseDown={(event) => handleResizeMouseDown("w", event)} onTouchStart={(event) => handleResizeTouchStart("w", event)} />
                  </div>
                </div>
              </div>

              <div
                className={
                  useHorizontalPagePickerOnMobile
                    ? "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 py-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:overflow-visible md:px-0 md:py-0"
                    : "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
                }
              >
                {cropPdfPreviews.map((previewSrc, index) => {
                  const pageNumber = index + 1;
                  const isSelected = selectedCropPage === pageNumber;
                  const pageSettings = cropPageSettings[index] ?? {
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                  };
                  const hasPageCrop =
                    pageSettings.x > 0 ||
                    pageSettings.y > 0 ||
                    pageSettings.width < 100 ||
                    pageSettings.height < 100;

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => onSelectCropPage(pageNumber)}
                      className={`grid gap-2 rounded-lg p-2.5 text-left transition ${
                        useHorizontalPagePickerOnMobile
                          ? "w-[180px] flex-none snap-start"
                          : "w-full"
                      } ${
                        isSelected
                          ? "bg-teal-50 ring-2 ring-teal-600"
                          : "bg-white/80 ring-1 ring-slate-200 hover:ring-teal-400"
                      }`}
                      role="listitem"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-800">Page {pageNumber}</span>
                        {hasPageCrop && (
                          <span className="rounded-full border border-teal-200 bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-teal-700">
                            Cropped
                          </span>
                        )}
                      </div>
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={`Page ${pageNumber}`}
                          loading="lazy"
                          className="h-auto w-full rounded-md bg-slate-50"
                        />
                      ) : (
                        <div className="min-h-[220px] rounded-md bg-slate-100 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
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
            <h3
              id="cropPdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Crop PDF
            </h3>
          </div>

          {!cropPdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-10 md:min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadCropPdf}
                  disabled={isCropPdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {cropPdfName
                ? `${cropPdfName} • ${cropPdfPreviews.length} page(s)`
                : "No PDF uploaded"}
            </div>
          </div>

          {cropPdfBuffer && cropPdfPreviews.length > 0 && (
            <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3">
              <div className="rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-600">
                Selected page: {selectedCropPage}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:opacity-40"
                  onClick={onResetSelectedPageCrop}
                  disabled={isCropPdfBusy || isBusy}
                >
                  Reset Page
                </button>
                <button
                  type="button"
                  className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800 disabled:opacity-40"
                  onClick={onCopySelectedCropToAllPages}
                  disabled={isCropPdfBusy || isBusy}
                >
                  Copy To All
                </button>
              </div>

              <button
                type="button"
                className={`inline-flex min-h-10 md:min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                  cropPdfPreviews.length > 0
                    ? "border-teal-700 bg-white text-teal-800"
                    : "border-slate-300 bg-slate-100 text-slate-400"
                }`}
                onClick={onApplyCrops}
                disabled={isCropPdfBusy || isBusy}
              >
                Apply Crop Changes
              </button>

              <p className="text-xs text-slate-400">
                Select a page and drag on the large preview to crop by mouse or touch.
              </p>
              <p className="text-xs text-slate-400">
                {hasAnyCrop ? "Crop settings are configured." : "No crop settings yet."}
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                cropPdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadCroppedPdf}
              disabled={isCropPdfBusy || isBusy || !cropPdfResultBuffer}
            >
              Download PDF
            </button>
            {cropPdfResultName && (
              <div className="text-sm font-bold text-slate-500">{cropPdfResultName}</div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          cropPdfStatusType === "error"
            ? "text-red-700"
            : cropPdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {cropPdfStatus}
      </p>
    </section>
  );
}
