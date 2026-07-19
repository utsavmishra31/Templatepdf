import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";
import { formatBytes } from "@/lib/format-utils";

type Props = {
  compressPdfName: string;
  compressPdfBuffer: ArrayBuffer | null;
  compressPdfOriginalSize: number;
  compressPdfQuality: "extreme" | "recommended" | "less";
  compressPdfResultBuffer: ArrayBuffer | null;
  compressPdfResultName: string;
  compressPdfResultSize: number;
  compressPdfStatus: string;
  compressPdfStatusType: StatusType;
  isCompressPdfBusy: boolean;
  isBusy: boolean;
  onUploadCompressPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCompressPdf: () => void;
  onCompressPdfQualityChange: (
    quality: "extreme" | "recommended" | "less",
  ) => void;
  onCompressPdf: () => void;
  onDownloadCompressedPdf: () => void;
};

export function CompressPdfPanel({
  compressPdfName,
  compressPdfBuffer,
  compressPdfOriginalSize,
  compressPdfQuality,
  compressPdfResultBuffer,
  compressPdfResultName,
  compressPdfResultSize,
  compressPdfStatus,
  compressPdfStatusType,
  isCompressPdfBusy,
  isBusy,
  onUploadCompressPdf,
  onClearCompressPdf,
  onCompressPdfQualityChange,
  onCompressPdf,
  onDownloadCompressedPdf,
}: Props) {
  return (
    <div className="mt-8 border-t border-dashed border-slate-300 pt-5">
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
            PDF Utilities
          </p>
          <h3 className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900">
            Compress PDF
          </h3>
        </div>
        <span className="inline-flex min-h-[34px] items-center rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
          Compress PDF
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onUploadCompressPdf}
            disabled={isCompressPdfBusy || isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />
          Upload PDF
        </label>
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
          onClick={onClearCompressPdf}
          disabled={isCompressPdfBusy || isBusy || !compressPdfBuffer}
        >
          Clear
        </button>
        {compressPdfName && (
          <div className="text-sm font-bold text-slate-500">
            {compressPdfName}
            {compressPdfOriginalSize > 0
              ? ` • ${formatBytes(compressPdfOriginalSize)}`
              : ""}
          </div>
        )}
      </div>

      {compressPdfBuffer && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {(["extreme", "recommended", "less"] as const).map((level) => (
              <label
                key={level}
                className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-slate-700"
              >
                <input
                  type="radio"
                  name="compressQuality"
                  value={level}
                  checked={compressPdfQuality === level}
                  onChange={() => onCompressPdfQualityChange(level)}
                  disabled={isCompressPdfBusy || isBusy}
                  className="accent-teal-700"
                />
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800 disabled:opacity-50"
            onClick={onCompressPdf}
            disabled={isCompressPdfBusy || isBusy}
          >
            Compress PDF
          </button>
        </div>
      )}

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

      {compressPdfResultBuffer && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
            onClick={onDownloadCompressedPdf}
            disabled={isCompressPdfBusy || isBusy}
          >
            Download PDF
          </button>
          {compressPdfResultName && (
            <div className="text-sm font-bold text-slate-500">
              {compressPdfResultName}
              {compressPdfResultSize > 0
                ? ` • ${formatBytes(compressPdfResultSize)}`
                : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
