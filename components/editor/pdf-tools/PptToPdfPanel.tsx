import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  pptToPdfName: string;
  pptToPdfBuffer: ArrayBuffer | null;
  pptToPdfStatus: string;
  pptToPdfStatusType: StatusType;
  isPptToPdfBusy: boolean;
  isBusy: boolean;
  pptToPdfResultName: string;
  pptToPdfResultBuffer: ArrayBuffer | null;
  onUploadPptToPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPptToPdf: () => void;
  onConvertPptToPdf: () => void;
  onDownloadPptToPdf: () => void;
};

export function PptToPdfPanel({
  pptToPdfName,
  pptToPdfBuffer,
  pptToPdfStatus,
  pptToPdfStatusType,
  isPptToPdfBusy,
  isBusy,
  pptToPdfResultName,
  pptToPdfResultBuffer,
  onUploadPptToPdf,
  onClearPptToPdf,
  onConvertPptToPdf,
  onDownloadPptToPdf,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="pptToolsTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 flex h-[calc(100dvh-3.5rem)] items-center justify-center overflow-y-auto p-4 md:order-1"
          role="list"
          aria-label="PPT to PDF conversion flow"
        >
          {pptToPdfName ? (
            <div className="flex min-h-[360px] w-full items-center justify-center gap-4 p-2 max-sm:flex-col max-sm:items-center">
              <div
                className="w-[220px] aspect-[210/297] rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                role="listitem"
              >
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Source</p>
                <div className="mt-3 flex h-[calc(100%-1.5rem)] items-center justify-center rounded border border-slate-100 bg-slate-50 px-3 text-center">
                  <p className="break-all text-sm font-semibold text-slate-800">{pptToPdfName}</p>
                </div>
              </div>
              {pptToPdfResultName ? (
                <>
                  <div className="flex items-center justify-center text-teal-700" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div
                    className="w-[220px] aspect-[210/297] rounded-lg border border-teal-200 bg-teal-50 p-4 shadow-sm"
                    role="listitem"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-teal-700">Output</p>
                    <div className="mt-3 flex h-[calc(100%-1.5rem)] items-center justify-center rounded border border-teal-200 bg-white/70 px-3 text-center">
                      <p className="break-all text-sm font-semibold text-teal-900">{pptToPdfResultName}</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="min-h-[260px] w-full" />
          )}
        </div>

        <div className="order-1 flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-14 md:order-2 md:h-full md:min-h-[calc(100dvh-3.5rem)] md:w-[360px] md:self-stretch md:justify-self-end md:rounded-none md:border-y-0 md:border-l md:border-r-0 md:p-4 md:shadow-none">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              PPT Utilities
            </p>
            <h3
              id="pptToolsTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Convert to PDF
            </h3>
          </div>

          {!pptToPdfBuffer && (
            <div className="mt-3 flex flex-col gap-2.5">
              <label className="relative inline-flex min-h-10 md:min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
                <input
                  type="file"
                  accept="application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,.ppt,.pptx"
                  onChange={onUploadPptToPdf}
                  disabled={isPptToPdfBusy || isBusy}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
                />
                Upload PPT
              </label>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2.5">
            <div className="text-sm font-bold text-slate-500">
              {pptToPdfName ? `${pptToPdfName}` : "No PPT file uploaded"}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-10 md:min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                pptToPdfBuffer
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onConvertPptToPdf}
              disabled={isPptToPdfBusy || isBusy || !pptToPdfBuffer}
            >
              Convert to PDF
              {isPptToPdfBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                pptToPdfResultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownloadPptToPdf}
              disabled={isPptToPdfBusy || isBusy || !pptToPdfResultBuffer}
            >
              Download PDF
            </button>
            {pptToPdfResultName && (
              <div className="text-sm font-bold text-slate-500">
                {pptToPdfResultName}
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className={`mt-4 min-h-6 font-bold ${
          pptToPdfStatusType === "error"
            ? "text-red-700"
            : pptToPdfStatusType === "success"
              ? "text-teal-800"
              : "text-slate-500"
        }`}
        role="status"
        aria-live="polite"
      >
        {pptToPdfStatus}
      </p>
    </section>
  );
}
