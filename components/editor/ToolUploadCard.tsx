import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";

type Props = {
  accept: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  isBusy: boolean;
  status: string;
  statusType: StatusType;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ToolUploadCard({
  accept,
  label,
  hint,
  icon,
  isBusy,
  status,
  statusType,
  multiple,
  onChange,
}: Props) {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
      <div className="w-full max-w-lg animate-step-in">
        {/* Drop zone */}
        <label
          className={`group relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-10 py-16 text-center backdrop-blur-md transition
            ${isBusy
              ? "cursor-progress border-white/15 bg-slate-950/40 opacity-70"
              : "border-white/25 bg-slate-950/45 hover:border-amber-300/60 hover:bg-slate-950/55"
            }`}
        >
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={onChange}
            disabled={isBusy}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
          />

          {/* Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/70 transition group-hover:border-amber-200/50 group-hover:bg-white/15 group-hover:text-amber-200">
            {isBusy ? (
              <svg
                className="animate-spin text-amber-300"
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              icon
            )}
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-extrabold text-white">{label}</p>
            <p className="mt-1 text-sm text-white/60">
              {isBusy ? "Processing…" : "Click to browse or drop a file here"}
            </p>
            <p className="mt-2 text-xs font-semibold text-white/50">{hint}</p>
          </div>

          {/* Browse button */}
          {!isBusy && (
            <div className="inline-flex min-h-10 items-center rounded-lg border border-amber-300/70 bg-white/10 px-5 text-sm font-extrabold text-amber-100 transition group-hover:bg-amber-300 group-hover:text-slate-900">
              Browse Files
            </div>
          )}
        </label>

        {/* Status */}
        {status && (
          <p
            className={`mt-4 text-center text-sm font-bold ${
              statusType === "error"
                ? "text-red-300"
                : statusType === "success"
                  ? "text-emerald-300"
                  : "text-white/70"
            }`}
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
