import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  rotatePdfName: string;
  rotatePdfBuffer: ArrayBuffer | null;
  rotatePdfPreviews: string[];
  rotatePdfResultBuffer: ArrayBuffer | null;
  rotatePdfResultName: string;
  rotatePdfStatus: string;
  rotatePdfStatusType: StatusType;
  isRotatePdfBusy: boolean;
  isBusy: boolean;
  onUploadRotatePdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearRotatePdf: () => void;
  onRotatePage: (pageNumber: number, direction: "cw" | "ccw") => void;
  onRotateAllPages: (direction: "cw" | "ccw") => void;
  onDownloadRotatedPdf: () => void;
};

export function RotatePdfPanel({
  rotatePdfName,
  rotatePdfBuffer,
  rotatePdfPreviews,
  rotatePdfResultBuffer,
  rotatePdfResultName,
  rotatePdfStatus,
  rotatePdfStatusType,
  isRotatePdfBusy,
  isBusy,
  onUploadRotatePdf,
  onClearRotatePdf,
  onRotatePage,
  onRotateAllPages,
  onDownloadRotatedPdf,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="rotatePdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        {/* Left: page previews */}
        <div
          className="order-2 max-h-[calc(100dvh-3.5rem)] overflow-y-auto pt-4 pl-4 pr-2 md:order-1"
          role="list"
          aria-label="PDF pages to rotate"
        >
          {rotatePdfPreviews.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {rotatePdfPreviews.map((previewSrc, index) => {
                const pageNumber = index + 1;
                return (
                  <div
                    key={pageNumber}
                    className="grid gap-2 rounded-lg bg-white/80 p-2.5 shadow-sm"
                    role="listitem"
                  >
                    <span className="text-sm font-bold text-slate-800">
                      Page {pageNumber}
                    </span>
                    <div className="group relative">
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={`Page ${pageNumber}`}
                          loading="lazy"
                          className="h-auto w-full rounded-md bg-slate-50"
                        />
                      ) : (
                        <div className="min-h-[240px] rounded-md bg-slate-100 animate-pulse" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-md bg-black/0 transition group-hover:bg-black/20">
                        <button
                          type="button"
                          title="Rotate counter-clockwise"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow transition hover:bg-white hover:text-teal-700 group-hover:opacity-100 disabled:opacity-30"
                          onClick={() => onRotatePage(pageNumber, "ccw")}
                          disabled={isRotatePdfBusy || isBusy}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 2v6h6" />
                            <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
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
                            <path d="M21 2v6h-6" />
                            <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a PDF file to preview pages on the left.
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
              id="rotatePdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Rotate PDF
            </h3>
          </div>

          {!rotatePdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadRotatePdf}
                  disabled={isRotatePdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {rotatePdfName
                ? `${rotatePdfName} • ${rotatePdfPreviews.length} page(s)`
                : "No PDF uploaded"}
            </div>
          </div>

          {rotatePdfBuffer && (
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  title="Rotate all counter-clockwise"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:opacity-40"
                  onClick={() => onRotateAllPages("ccw")}
                  disabled={isRotatePdfBusy || isBusy}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 2v6h6" />
                    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Rotate all clockwise"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:opacity-40"
                  onClick={() => onRotateAllPages("cw")}
                  disabled={isRotatePdfBusy || isBusy}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6" />
                    <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                rotatePdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadRotatedPdf}
              disabled={isRotatePdfBusy || isBusy || !rotatePdfResultBuffer}
            >
              Download PDF
            </button>
            {rotatePdfResultName && (
              <div className="text-sm font-bold text-slate-500">
                {rotatePdfResultName}
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          rotatePdfStatusType === "error"
            ? "text-red-700"
            : rotatePdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {rotatePdfStatus}
      </p>
    </section>
  );
}
