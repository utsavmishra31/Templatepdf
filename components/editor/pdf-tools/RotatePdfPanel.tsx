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
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
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
          <span className="text-xs font-bold text-slate-500">
            Rotate all pages:
          </span>
          <button
            type="button"
            title="Rotate all counter-clockwise"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:opacity-40"
            onClick={() => onRotateAllPages("ccw")}
            disabled={isRotatePdfBusy || isBusy}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 2v6h6" />
              <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
            </svg>
          </button>
          <button
            type="button"
            title="Rotate all clockwise"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-teal-600 hover:text-teal-700 disabled:opacity-40"
            onClick={() => onRotateAllPages("cw")}
            disabled={isRotatePdfBusy || isBusy}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
            </svg>
          </button>
        </div>
      )}

      {rotatePdfPreviews.length > 0 && (
        <div
          className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3"
          role="list"
          aria-label="PDF pages to rotate"
        >
          {rotatePdfPreviews.map((previewSrc, index) => {
            const pageNumber = index + 1;
            return (
              <div
                key={pageNumber}
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                role="listitem"
              >
                <span className="text-sm font-bold text-slate-800">
                  Page {pageNumber}
                </span>
                <div className="group relative">
                  <img
                    src={previewSrc}
                    alt={`Page ${pageNumber}`}
                    loading="lazy"
                    className="h-auto w-full rounded-md border border-slate-200 bg-slate-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-md bg-black/0 transition group-hover:bg-black/20">
                    <button
                      type="button"
                      title="Rotate counter-clockwise"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow transition hover:bg-white hover:text-teal-700 group-hover:opacity-100 disabled:opacity-30"
                      onClick={() => onRotatePage(pageNumber, "ccw")}
                      disabled={isRotatePdfBusy || isBusy}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
      )}

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
            <div className="text-sm font-bold text-slate-500">
              {rotatePdfResultName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
