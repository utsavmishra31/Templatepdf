import type { ChangeEvent } from "react";
import type { ImageConvertFormat } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";
import type { ImageConvertItem } from "@/hooks/useImageConvertTool";

type Props = {
  items: ImageConvertItem[];
  sourceFormats: ImageConvertFormat[];
  targetFormat: ImageConvertFormat;
  resultBuffer: ArrayBuffer | null;
  resultName: string;
  resultKind: "single" | "zip";
  status: string;
  statusType: StatusType;
  isBusy: boolean;
  onTargetFormatChange: (value: ImageConvertFormat) => void;
  onAddImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
  onConvertImages: () => void;
  onDownload: () => void;
};

const formatOptions: ImageConvertFormat[] = ["png", "jpg", "jpeg", "webp", "avif"];

export function ImageConvertPanel({
  items,
  sourceFormats,
  targetFormat,
  resultBuffer,
  resultName,
  resultKind,
  status,
  statusType,
  isBusy,
  onTargetFormatChange,
  onAddImages,
  onRemoveItem,
  onClearAll,
  onConvertImages,
  onDownload,
}: Props) {
  return (
    <section className="md:-mt-8" aria-labelledby="imageConvertTitle">
      <div className="mt-4 grid gap-4 md:mt-0 md:grid-cols-[minmax(0,1fr)_360px] md:items-stretch">
        <div
          className="order-2 px-1 pt-2 md:order-1 md:max-h-[calc(100dvh-3.5rem)] md:overflow-y-auto md:pt-4 md:pl-4 md:pr-2"
          role="list"
          aria-label="Images to convert"
        >
          {items.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2 md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:gap-3">
              {items.map((item, index) => (
                <div
                  key={`${item.file.name}-${index}`}
                  className="grid gap-2 rounded-lg bg-white/90 p-2.5 shadow-sm"
                  role="listitem"
                >
                  <div className="relative">
                    <img
                      src={item.previewSrc}
                      alt={item.file.name}
                      loading="lazy"
                      className="h-32 w-full rounded-md border border-slate-100 bg-slate-50 object-cover"
                    />
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      aria-label="Remove image"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-black/60 text-xs text-white hover:bg-red-500 disabled:opacity-40"
                      onClick={() => onRemoveItem(index)}
                      disabled={isBusy}
                    >
                      x
                    </button>
                  </div>
                  <div className="truncate text-xs font-bold text-slate-700" title={item.file.name}>
                    {item.file.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center px-4 text-center text-sm font-bold text-slate-500">
              Add images to preview and convert.
            </div>
          )}
        </div>

        <div className="order-1 flex min-h-0 min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:sticky md:top-14 md:order-2 md:h-full md:min-h-[calc(100dvh-3.5rem)] md:w-[360px] md:self-stretch md:justify-self-end md:rounded-none md:border-y-0 md:border-l md:border-r-0 md:p-4 md:shadow-none">
          <div className="border-b border-slate-200 pb-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-teal-800">
              Image Utilities
            </p>
            <h3
              id="imageConvertTitle"
              className="font-[var(--font-newsreader)] text-2xl font-semibold text-slate-900"
            >
              Convert Image Type
            </h3>
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            <label className="relative inline-flex min-h-10 md:min-h-9 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,.png,.jpg,.jpeg,.webp,.avif"
                multiple
                onChange={onAddImages}
                disabled={isBusy}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
              />
              Add Images
            </label>
            <div className="text-sm font-bold text-slate-500">
              {items.length > 0 ? `${items.length} image(s)` : "No images added"}
            </div>
            {sourceFormats.length > 0 && (
              <div className="text-xs text-slate-400">
                Source type(s): {sourceFormats.map((format) => format.toUpperCase()).join(", ")}
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Convert to</p>
            <select
              value={targetFormat}
              onChange={(event) => onTargetFormatChange(event.target.value as ImageConvertFormat)}
              disabled={isBusy}
              className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              {formatOptions.map((format) => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-200 pt-3">
            <button
              type="button"
              className={`inline-flex min-h-10 md:min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
                items.length > 0
                  ? "border-teal-700 bg-white text-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onConvertImages}
              disabled={isBusy || items.length === 0}
            >
              Convert Images
              {isBusy && (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className={`min-h-10 md:min-h-9 rounded-lg border px-3 text-sm font-semibold transition ${
                resultBuffer
                  ? "border-transparent bg-teal-700 text-white hover:bg-teal-800"
                  : "border-slate-300 bg-slate-100 text-slate-400"
              }`}
              onClick={onDownload}
              disabled={isBusy || !resultBuffer}
            >
              {resultKind === "zip" ? "Download ZIP" : "Download Image"}
            </button>

            <button
              type="button"
              className="min-h-10 md:min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              onClick={onClearAll}
              disabled={isBusy || items.length === 0}
            >
              Clear All
            </button>

            {resultName && (
              <div className="text-sm font-bold text-slate-500">{resultName}</div>
            )}
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
