import type { ChangeEvent, RefObject } from "react";
import type { ScanFilterMode, ScannedPage } from "@/hooks/useScanToPdfTool";
import type { StatusType } from "@/types/editor";

type Props = {
  pages: ScannedPage[];
  selectedPageIds: string[];
  filterMode: ScanFilterMode;
  facingMode: "user" | "environment";
  hasDualCameraOptions: boolean;
  isCameraOn: boolean;
  isBusy: boolean;
  hasCameraSupport: boolean;
  resultBuffer: ArrayBuffer | null;
  status: string;
  statusType: StatusType;
  videoRef: RefObject<HTMLVideoElement | null>;
  onFilterModeChange: (mode: ScanFilterMode) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSwitchCamera: () => void;
  onCapture: () => void;
  onUploadImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onTogglePageSelection: (pageId: string) => void;
  onRotateSelected: (direction: "cw" | "ccw") => void;
  onFlipSelected: (axis: "horizontal" | "vertical") => void;
  onRemovePage: (index: number) => void;
  onClearAll: () => void;
  onGeneratePdf: () => void;
  onDownloadPdf: () => void;
};

export function ScanToPdfPanel({
  pages,
  selectedPageIds,
  filterMode,
  facingMode,
  hasDualCameraOptions,
  isCameraOn,
  isBusy,
  hasCameraSupport,
  resultBuffer,
  status,
  statusType,
  videoRef,
  onFilterModeChange,
  onStartCamera,
  onStopCamera,
  onSwitchCamera,
  onCapture,
  onUploadImages,
  onTogglePageSelection,
  onRotateSelected,
  onFlipSelected,
  onRemovePage,
  onClearAll,
  onGeneratePdf,
  onDownloadPdf,
}: Props) {
  const selectedSet = new Set(selectedPageIds);
  const allPagesSelected = pages.length > 0 && selectedPageIds.length === pages.length;

  const handleToggleSelectAll = () => {
    if (isBusy || pages.length === 0) {
      return;
    }

    if (allPagesSelected) {
      for (const selectedId of selectedPageIds) {
        onTogglePageSelection(selectedId);
      }
      return;
    }

    for (const page of pages) {
      if (!selectedSet.has(page.id)) {
        onTogglePageSelection(page.id);
      }
    }
  };

  return (
    <section className="md:-mt-8" aria-labelledby="scanToPdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 px-1 pt-2 md:order-1 md:max-h-[calc(100dvh-3.5rem)] md:overflow-y-auto md:pt-4 md:pl-4 md:pr-2"
          aria-label="Captured scan pages"
        >
          {isCameraOn && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                Live Camera Preview
              </p>
              <div className="overflow-hidden rounded-md bg-black">
                <video
                  ref={videoRef}
                  className="max-h-[360px] w-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div className="mt-3 grid gap-2 md:hidden">
                <button
                  type="button"
                  className="min-h-10 rounded-lg border border-teal-700 bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={onCapture}
                  disabled={isBusy || !isCameraOn}
                >
                  Capture Page
                </button>

                {hasDualCameraOptions && (
                  <button
                    type="button"
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                    onClick={onSwitchCamera}
                    disabled={isBusy}
                  >
                    Switch Camera ({facingMode === "environment" ? "Back" : "Front"})
                  </button>
                )}

                <button
                  type="button"
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                  onClick={onStopCamera}
                  disabled={isBusy}
                >
                  Stop Camera
                </button>
              </div>
            </div>
          )}

          {pages.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {pages.map((page, index) => (
                <article
                  key={page.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedSet.has(page.id)}
                  aria-label={`Select scanned page ${index + 1}`}
                  className={`grid gap-2 rounded-lg p-2.5 shadow-sm transition ${
                    selectedSet.has(page.id)
                      ? "bg-teal-50 ring-2 ring-teal-500"
                      : "bg-white/90 hover:ring-1 hover:ring-slate-300"
                  }`}
                  onClick={() => !isBusy && onTogglePageSelection(page.id)}
                  onKeyDown={(event) => {
                    if (isBusy) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onTogglePageSelection(page.id);
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={page.src}
                      alt={`Scanned page ${index + 1}`}
                      loading="lazy"
                      className="h-40 w-full rounded-md border border-slate-100 bg-slate-50 object-contain"
                    />
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove scanned page ${index + 1}`}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-xs text-white hover:bg-red-500 disabled:opacity-40"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemovePage(index);
                      }}
                      disabled={isBusy}
                    >
                      x
                    </button>
                  </div>
                  <p className="truncate text-xs font-bold text-slate-700" title={page.name}>
                    {page.name}
                  </p>
                  <p className="text-xs text-slate-500">{page.width} x {page.height}px</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 text-center text-sm font-bold text-slate-500">
              Start camera or upload photos to build your scanned PDF.
            </div>
          )}
        </div>

        <div className="order-1 flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-14 md:order-2 md:h-full md:min-h-[calc(100dvh-3.5rem)] md:w-[360px] md:self-stretch md:justify-self-end md:rounded-none md:border-y-0 md:border-l md:border-r-0 md:p-4 md:shadow-none">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              Camera Scan
            </p>
            <h3
              id="scanToPdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Scan Photo to PDF
            </h3>
          </div>

          <div className="mt-3 text-sm font-bold text-slate-500">
            {pages.length} page(s)
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3">
            <button
              type="button"
              className="min-h-10 md:min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              onClick={handleToggleSelectAll}
              disabled={isBusy || pages.length === 0}
            >
              {allPagesSelected ? "Unselect All" : "Select All"}
            </button>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Scan Filter</p>
            <select
              value={filterMode}
              onChange={(event) => onFilterModeChange(event.target.value as ScanFilterMode)}
              disabled={isBusy}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              <option value="scan-gray">Scan Gray</option>
              <option value="scan-bw">Scan B&amp;W</option>
              <option value="original">Original</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3 sm:grid-cols-2">
            <button
              type="button"
              className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              onClick={() => onRotateSelected("ccw")}
              disabled={isBusy || selectedPageIds.length === 0}
            >
              Rotate Left
            </button>
            <button
              type="button"
              className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              onClick={() => onRotateSelected("cw")}
              disabled={isBusy || selectedPageIds.length === 0}
            >
              Rotate Right
            </button>
            <button
              type="button"
              className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              onClick={() => onFlipSelected("horizontal")}
              disabled={isBusy || selectedPageIds.length === 0}
            >
              Flip Horizontal
            </button>
            <button
              type="button"
              className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              onClick={() => onFlipSelected("vertical")}
              disabled={isBusy || selectedPageIds.length === 0}
            >
              Flip Vertical
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3">
            <label className="relative inline-flex min-h-10 md:min-h-9 w-full cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              <input
                type="file"
                accept="image/*"
                capture={facingMode}
                multiple
                onChange={onUploadImages}
                disabled={isBusy}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
              />
              Upload Photo
            </label>

            {hasCameraSupport ? (
              <>
                {!isCameraOn && (
                  <button
                    type="button"
                    className="min-h-10 md:min-h-9 w-full rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800"
                    onClick={onStartCamera}
                    disabled={isBusy}
                  >
                    Start Camera / Take Photo
                  </button>
                )}
                {hasDualCameraOptions && (
                  <button
                    type="button"
                    className="hidden min-h-10 md:inline-flex md:min-h-9 md:w-full md:items-center md:justify-center md:rounded-lg md:border md:border-slate-300 md:bg-white md:px-3 md:text-sm md:font-semibold md:text-slate-700"
                    onClick={onSwitchCamera}
                    disabled={isBusy}
                  >
                    Switch Camera ({facingMode === "environment" ? "Back" : "Front"})
                  </button>
                )}
                <button
                  type="button"
                  className="hidden min-h-10 md:inline-flex md:min-h-9 md:w-full md:items-center md:justify-center md:rounded-lg md:border md:border-teal-700 md:bg-teal-700 md:px-3 md:text-sm md:font-semibold md:text-white md:disabled:opacity-60"
                  onClick={onCapture}
                  disabled={isBusy || !isCameraOn}
                >
                  Capture Page
                </button>
                {isCameraOn && (
                  <button
                    type="button"
                    className="hidden min-h-10 md:inline-flex md:min-h-9 md:w-full md:items-center md:justify-center md:rounded-lg md:border md:border-slate-300 md:bg-white md:px-3 md:text-sm md:font-semibold md:text-slate-700"
                    onClick={onStopCamera}
                    disabled={isBusy}
                  >
                    Stop Camera
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs font-semibold text-amber-700">
                Camera not supported in this browser. You can still upload photos.
              </p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`min-h-10 md:min-h-9 w-full rounded-lg border px-3 text-sm font-semibold ${
                pages.length > 0
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onGeneratePdf}
              disabled={isBusy || pages.length === 0}
            >
              Generate Scanned PDF
            </button>

            <button
              type="button"
              className={`min-h-10 md:min-h-9 w-full rounded-lg border px-3 text-sm font-semibold transition ${
                resultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadPdf}
              disabled={isBusy || !resultBuffer}
            >
              Download PDF
            </button>

            <button
              type="button"
              className="min-h-10 md:min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              onClick={onClearAll}
              disabled={isBusy || pages.length === 0}
            >
              Clear All
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
