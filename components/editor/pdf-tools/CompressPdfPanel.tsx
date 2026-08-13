import { type ChangeEvent, useEffect, useRef, useState } from "react";
import type { StatusType } from "@/types/editor";
import { formatBytes } from "@/lib/format-utils";

type Props = {
  compressPdfName: string;
  compressPdfBuffer: ArrayBuffer | null;
  compressPdfOriginalSize: number;
  compressPdfResultBuffer: ArrayBuffer | null;
  compressPdfResultName: string;
  compressPdfResultSize: number;
  compressPdfStatus: string;
  compressPdfStatusType: StatusType;
  compressPdfFirstPage: string | null;
  compressMode: "normal" | "extreme";
  isCompressPdfBusy: boolean;
  isBusy: boolean;
  onUploadCompressPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCompressPdf: () => void;
  onCompressModeChange: (mode: "normal" | "extreme") => void;
  onCompressPdf: () => void;
  onDownloadCompressedPdf: () => void;
};

function estimateSeconds(sizeBytes: number): number {
  const mb = sizeBytes / (1024 * 1024);
  return Math.max(15, Math.round(mb * 4));
}

export function CompressPdfPanel({
  compressPdfName,
  compressPdfBuffer,
  compressPdfOriginalSize,
  compressPdfResultBuffer,
  compressPdfResultName,
  compressPdfResultSize,
  compressPdfStatus,
  compressPdfStatusType,
  compressPdfFirstPage,
  compressMode,
  isCompressPdfBusy,
  isBusy,
  onUploadCompressPdf,
  onClearCompressPdf,
  onCompressModeChange,
  onCompressPdf,
  onDownloadCompressedPdf,
}: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isCompressPdfBusy) {
      const estimated = estimateSeconds(compressPdfOriginalSize);
      setCountdown(estimated);
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : prev));
      }, 1000);
    } else {
      setCountdown(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCompressPdfBusy, compressPdfOriginalSize]);
  return (
    <section className="md:-mt-8" aria-labelledby="compressPdfTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 px-1 pt-2 md:order-1 md:max-h-[calc(100dvh-3.5rem)] md:overflow-y-auto md:pt-4 md:pl-4 md:pr-2"
          aria-label="Compression info"
        >
          {compressPdfBuffer ? (
            <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-3">
              {compressPdfFirstPage && (
                <div className="relative w-52">
                  {/* Stacked cards behind for illusion of pages */}
                  <div className="absolute left-2 top-2 h-full w-full rounded-lg border border-slate-300 bg-white/60 shadow-sm" />
                  <div className="absolute left-1 top-1 h-full w-full rounded-lg border border-slate-300 bg-white/80 shadow-sm" />
                  <div className="relative rounded-lg border border-slate-400 bg-white p-2.5 shadow-sm">
                    <img
                      src={compressPdfFirstPage}
                      alt="Page 1 preview"
                      className="h-auto w-full rounded-md bg-slate-50"
                    />
                  </div>
                </div>
              )}
              <div className="rounded-lg bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-700">Original file</p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {compressPdfName}
                </p>
                {compressPdfOriginalSize > 0 && (
                  <p className="mt-0.5 text-sm font-bold text-slate-800">
                    {formatBytes(compressPdfOriginalSize)}
                  </p>
                )}
              </div>
              {compressPdfResultBuffer && (
                <div className="rounded-lg bg-teal-50 p-4 shadow-sm ring-1 ring-teal-200">
                  <p className="text-sm font-bold text-teal-700">Compressed file</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {compressPdfResultName}
                  </p>
                  {compressPdfResultSize > 0 && (
                    <p className="mt-0.5 text-sm font-bold text-teal-800">
                      {formatBytes(compressPdfResultSize)}{" "}
                      {compressPdfOriginalSize > 0 && (
                        <span className="font-medium text-teal-600">
                          ({Math.round((1 - compressPdfResultSize / compressPdfOriginalSize) * 100)}% smaller)
                        </span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Upload a PDF to see compression details here.
            </div>
          )}
        </div>

        <div className="order-1 flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-14 md:order-2 md:h-full md:min-h-[calc(100dvh-3.5rem)] md:w-[360px] md:self-stretch md:justify-self-end md:rounded-none md:border-y-0 md:border-l md:border-r-0 md:p-4 md:shadow-none">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PDF Utilities
            </p>
            <h3
              id="compressPdfTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Compress PDF
            </h3>
          </div>

          {!compressPdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-10 md:min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={onUploadCompressPdf}
                  disabled={isCompressPdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PDF
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {compressPdfName
                ? `${compressPdfName}${compressPdfOriginalSize > 0 ? ` • ${formatBytes(compressPdfOriginalSize)}` : ""}`
                : "No PDF uploaded"}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-600">Compression mode</p>
            <div className="grid grid-cols-2 gap-2">
              {(["normal", "extreme"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onCompressModeChange(m)}
                  disabled={isCompressPdfBusy || isBusy}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    compressMode === m
                      ? "border-teal-700 bg-teal-50 text-teal-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block">{m === "normal" ? "Normal" : "Extreme"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-10 md:min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                compressPdfBuffer
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onCompressPdf}
              disabled={isCompressPdfBusy || isBusy || !compressPdfBuffer}
            >
              Compress PDF
              {isCompressPdfBusy && (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {countdown !== null && (
                    <span className="tabular-nums">{countdown}s</span>
                  )}
                </>
              )}
            </button>
            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                compressPdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadCompressedPdf}
              disabled={isCompressPdfBusy || isBusy || !compressPdfResultBuffer}
            >
              Download PDF
            </button>
            {compressPdfResultName && (
              <div className="text-sm font-bold text-slate-500">
                {compressPdfResultName}
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          compressPdfStatusType === "error"
            ? "text-red-700"
            : compressPdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {compressPdfStatus}
      </p>
    </section>
  );
}
